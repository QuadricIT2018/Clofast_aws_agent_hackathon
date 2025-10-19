import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IMatchingTermPair {
  term1: string;
  term2: string;
}

export interface IMatchingRule extends MongooseDocument {
  matchingRuleName: string;
  matchingRuleDescription?: string;
  documentPairs: [mongoose.Types.ObjectId, mongoose.Types.ObjectId][];
  rules: IMatchingTermPair[];
}

const MatchingRuleSchema = new Schema<IMatchingRule>(
  {
    matchingRuleName: {
      type: String,
      required: true,
      trim: true,
    },
    matchingRuleDescription: {
      type: String,
      trim: true,
    },
    documentPairs: {
      type: [[{ type: Schema.Types.ObjectId, ref: "Document" }]],
      required: true,
      default: [],
    },
    rules: [
      {
        term1: { type: String, required: true },
        term2: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMatchingRule>(
  "MatchingRule",
  MatchingRuleSchema
);
