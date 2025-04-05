import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
    fromUserId: mongoose.Types.ObjectId;
    toUserId: mongoose.Types.ObjectId;
    senderName: string;
    receiverName: string;
    amount: number;
    status: string;
    type: string;
    description: string;
    reference: string;
    campaignId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
    {
        fromUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        toUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        senderName: {
            type: String,
            required: true
        },
        receiverName: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'reversed'],
            default: 'completed',
            index: true
        },
        type: {
            type: String,
            enum: ['payment', 'donation', 'refund', 'transfer', 'withdrawal', 'deposit'],
            required: true,
            index: true
        },
        description: {
            type: String,
            default: ''
        },
        reference: {
            type: String,
            default: ''
        },
        campaignId: {
            type: Schema.Types.ObjectId,
            ref: 'DonationCampaign',
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Create additional indexes for common queries
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ fromUserId: 1, createdAt: -1 });
TransactionSchema.index({ toUserId: 1, createdAt: -1 });

// Virtual for total including fees (if needed later)
TransactionSchema.virtual('totalWithFees').get(function () {
    // Placeholder for fee calculation logic
    return this.amount;
});

// Method to generate reference if not provided
TransactionSchema.pre('save', function (next) {
    if (!this.reference) {
        // Generate a reference like TX-YYYYMMDD-XXXX where XXXX is random
        const date = new Date();
        const dateStr = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');
        const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.reference = `TX-${dateStr}-${randomStr}`;
    }
    next();
});

const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;