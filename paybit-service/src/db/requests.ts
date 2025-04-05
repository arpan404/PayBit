import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRequest extends Document {
  requesterId: mongoose.Types.ObjectId;
  amount: number;
  senderId: mongoose.Types.ObjectId;
  isResolved: boolean;
}

const RequestSchema: Schema = new Schema(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isResolved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Request: Model<IRequest> = mongoose.model<IRequest>(
  "Request",
  RequestSchema,
);

export default Request;
