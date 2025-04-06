import mongoose, { Document, Schema } from 'mongoose';

// Interface for the document
export interface ILndWallet extends Document {
    userID: string;
    userUID: string;
    walletName: string;
    createdAt: Date;
    updatedAt: Date;
}

// Schema definition
const LndWalletSchema: Schema = new Schema(
    {
        userID: {
            type: String,
            required: true,
            index: true
        },
        userUID: {
            type: String,
            required: true,
            index: true
        },
        walletName: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Create a compound index for faster queries
LndWalletSchema.index({ userID: 1, userUID: 1 });

// Create and export the model
export const LndWallet = mongoose.model<ILndWallet>('LndWallet', LndWalletSchema);