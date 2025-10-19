import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IExtractionRule extends MongooseDocument {
  extractionRuleName: string;
  extractionRuleDescription?: string;
  terms: string[];
  documentIds: mongoose.Types.ObjectId[];
}

const ExtractionRuleSchema = new Schema<IExtractionRule>(
  {
    extractionRuleName: {
      type: String,
      required: true,
      trim: true,
    },
    extractionRuleDescription: {
      type: String,
      trim: true,
    },
    terms: {
      type: [String],
      required: true,
      default: [],
    },
    documentIds: [
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

export default mongoose.model<IExtractionRule>(
  "ExtractionRule",
  ExtractionRuleSchema
);
