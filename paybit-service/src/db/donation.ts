import { Schema, model, Document } from "mongoose";

export interface IDonationCampaign extends Document {
  name: string;
  description: string;
  creatorUid: string;
  goalAmount: number;
  collectedAmount: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DonationCampaignSchema = new Schema<IDonationCampaign>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    creatorUid: {
      type: String,
      required: true,
    },
    goalAmount: {
      type: Number,
      required: true,
    },
    collectedAmount: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

const DonationCampaign = model<IDonationCampaign>(
  "DonationCampaign",
  DonationCampaignSchema,
);

export default DonationCampaign;
