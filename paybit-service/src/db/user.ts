import { Schema, Document, model } from "mongoose";

export interface IUser extends Document {
  fullname: string;
  email: string;
  password: string;
  profileImage: string;
  uid: string;
  tapRootAddress?: string;
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: "" },
    uid: { type: String, required: true, unique: true },
    tapRootAddress: { type: String, default: "" },
    walletAddress: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

const User = model<IUser>("User", UserSchema);

export default User;
