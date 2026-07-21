import mongoose from "mongoose";

export interface IContact {
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: Date;
  aiMetadata?: {
    category?: string;
    summary?: string;
    suggestedReply?: string;
    processedAt?: Date;
  };
}

const ContactSchema = new mongoose.Schema<IContact>({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
  },
  message: {
    type: String,
    required: [true, "Message content is required"],
    trim: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  aiMetadata: {
    category: { type: String },
    summary: { type: String },
    suggestedReply: { type: String },
    processedAt: { type: Date },
  },
});

// Avoid re-compiling the model if it already exists (useful in HMR/dev environments)
export const Contact = mongoose.models.Contact || mongoose.model<IContact>("Contact", ContactSchema);
