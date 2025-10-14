import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organizationName: string;
  profiles: Types.ObjectId[];
  numberOfReconciledProfiles: number;
  numberOfUnReconciledProfiles: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    profiles: [
      {
        type: Schema.Types.ObjectId,
        ref: "Profile",
      },
    ],
    numberOfReconciledProfiles: {
      type: Number,
      default: 0,
    },
    numberOfUnReconciledProfiles: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>("User", userSchema);
