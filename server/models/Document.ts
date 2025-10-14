import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IDocument extends MongooseDocument {
  documentName: string;
  file?: {
    name: string;
    size: number;
    mimetype: string;
    encoding: string;
  };
  documentUrl: string;
  extractionRule?: mongoose.Types.ObjectId[];
  dataSource?: Record<string, any>;
}

const DocumentSchema = new Schema<IDocument>(
  {
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    file: {
      type: Object,
      default: {},
    },
    documentUrl: {
      type: String,
      required: true,
    },
    extractionRule: [
      {
        type: Schema.Types.ObjectId,
        ref: "ExtractionRule",
      },
    ],
    dataSource: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model<IDocument>("Document", DocumentSchema);
