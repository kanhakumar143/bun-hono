import { Schema, model } from "mongoose";

export interface UserData {
    name: string;
    email: string;
    profileUrl ?: string;
    emailVerified: boolean;
    country : string;
}

const UserSchema = new Schema<UserData> ({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    profileUrl: {
        type: String,
        default:"https://picsum.photos/200",
        required: false
    },
    emailVerified: {
        type: Boolean,
        default: false,
        required: true
    },
    country: {
        type: String,
        required: false
    }
})

const UserModel = model('user', UserSchema)
export default UserModel