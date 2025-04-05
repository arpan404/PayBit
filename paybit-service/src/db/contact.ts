import mongoose, { Schema, Document } from "mongoose";

// Define the interface for a Contact document
export interface IContact extends Document {
  userUid: string; // The UID of the user who owns this contact
  contactUid: string; // The UID of the user who is the contact
  createdAt: Date;
  updatedAt: Date;
}

// Create the Contact schema
const ContactSchema: Schema = new Schema(
  {
    userUid: {
      type: String,
      required: true,
      index: true,
    },
    contactUid: {
      type: String,
      required: true,
    },
    
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  },
);

// Create a compound index for quick lookups of unique contacts
ContactSchema.index({ userUid: 1, contactUid: 1 }, { unique: true });

// Create and export the Contact model
const Contact = mongoose.model<IContact>("Contact", ContactSchema);

export default Contact;
