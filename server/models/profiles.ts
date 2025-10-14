import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IProfile extends MongooseDocument {
  profileName: string;
  profileDescription?: string;
  numberOfDocuments: number;
  numberOfUnReconciledDocuments: number;
  numberOfReconciledDocuments: number;
  numberOfDiscrepancyDocuments: number;
  matchingRules: mongoose.Types.ObjectId[];
  documents: mongoose.Types.ObjectId[];
}

const ProfileSchema = new Schema<IProfile>(
  {
    profileName: {
      type: String,
      required: true,
      trim: true,
    },
    profileDescription: {
      type: String,
      trim: true,
    },

    numberOfDocuments: {
      type: Number,
      default: 0,
    },
    numberOfUnReconciledDocuments: {
      type: Number,
      default: 0,
    },
    numberOfReconciledDocuments: {
      type: Number,
      default: 0,
    },
    numberOfDiscrepancyDocuments: {
      type: Number,
      default: 0,
    },

    matchingRules: [
      {
        type: Schema.Types.ObjectId,
        ref: "MatchingRule",
      },
    ],
    documents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
  },
  {
    timestamps: true,
  }
);

ProfileSchema.pre("save", function (next) {
  this.numberOfDocuments = this.documents.length;
  next();
});

export default mongoose.model<IProfile>("Profile", ProfileSchema);
