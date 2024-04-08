import { Hono } from 'hono'
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import dbConnect from './db/connect';
import UserModel from './db/user';
import { isValidObjectId } from 'mongoose';
import { streamText } from 'hono/streaming'

const app = new Hono();

app.use(poweredBy());
app.use(logger());  

dbConnect()
  .then(() => {

    //? GET
    app.get('/', async (c) => {
      const documents = await UserModel.find()

      return c.json(
        documents.map(d => d.toObject()),
        200
      )
    })

    // ? POST - create
    app.post('/', async (c) => {
      const fromData = await c.req.json();
      if(!fromData.profileUrl) delete fromData.profileUrl;

      const createdUser = new  UserModel(fromData);

      try {
        const document = createdUser.save();
        return c.json((await document).toObject(), 201);
      } catch (error) {
        return c.json(
          (error as any)?.message || "Internal Server Error",
          500
        )
      }
    })

    // ? view by id
    app.get('/:documentId', async (c) => {
      const id = c.req.param('documentId');
      if(!isValidObjectId(id)) return c.json("Invalid Id", 400);

      const document = await UserModel.findById(id);
      if(!document) return c.json("Document not found.", 400);
      
      return c.json(document, 200)
    })

    app.get('/:documentId', async (c) => {
      const id = c.req.param('documentId');
      if(!isValidObjectId(id)) return c.json("Invalid Id", 400);

      const document = await UserModel.findById(id);
      if(!document) return c.json("Document not found.", 400);
      
      return streamText(c, async (stream) => {
        stream.onAbort(() => {
          console.log("Aborted!")
        })

        for (let i = 0; i < document.email.length; i++) {
          await stream.write(document.email[i])

          await stream.sleep(1000)
        }
      })
    })

    app.patch('/:documentId', async (c) => {
      const id = c.req.param('documentId');
      if(!isValidObjectId(id)) return c.json("Invalid Id", 400);

      const document = await UserModel.findById(id);
      if(!document) return c.json("Document not found.", 404);

      const fromData = await c.req.json();
      if(!fromData.profileUrl) delete fromData.profileUrl;

      try {
        const updatedDocument = await UserModel.findByIdAndUpdate(
          id,
          fromData,
          {
            new: true
          }
        );

        return c.json(updatedDocument, 200);
      } catch (error) {
        return c.json(
          (error as any)?.message || "Internal Server Error",
          500
        )
      }

    })

    app.delete('/:documentId', async (c) => {
      const id = c.req.param('documentId');
      if(!isValidObjectId(id)) return c.json("Invalid Id", 400);

      try {
        const deletedDocument = await UserModel.findByIdAndDelete(id);

        return c.json(deletedDocument?.toObject(), 200);

      } catch (error) {
        return c.json(
          (error as any)?.message || "Internal Server Error",
          500
        )
      }

    })

  })
  .catch(err => {
    app.get('/*', (c) => {
      return c.text(`Failed to connect mongoDb: ${err?.message}`)
    })
  })

app.onError((err, c) => {
  return c.text(`App Error : ${err.message}`)
})

export default app
