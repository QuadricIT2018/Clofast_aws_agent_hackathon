import { Request, Response } from "express";
import { extractDataFromDocument } from "../services/geminiService.js";
import Document from "../models/Document.js";
import ExtractionRule from "../models/ExtractionRule.js";

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}
export const extractDocumentData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { documentId } = req.body;
    if (!documentId) {
      res.status(400).json({
        success: false,
        message: "Document ID is required",
      });
      return;
    }
    // Step 1: Fetch document by ID
    const document = await Document.findById(documentId);
    if (!document) {
      res.status(404).json({
        success: false,
        message: "Document not found",
      });
      return;
    }

    if (!document.documentUrl) {
      res.status(400).json({
        success: false,
        message: "Document URL not found",
      });
      return;
    }

    // Step 2: Fetch attached extraction rules
    if (!document.extractionRule || document.extractionRule.length === 0) {
      res.status(400).json({
        success: false,
        message: "No extraction rules attached to this document",
      });
      return;
    }

    const extractionRules = await ExtractionRule.find({
      _id: { $in: document.extractionRule },
    });

    if (extractionRules.length === 0) {
      res.status(404).json({
        success: false,
        message: "Extraction rules not found",
      });
      return;
    }

    // Collect all terms from extraction rules
    const allTerms: string[] = [];
    extractionRules.forEach((rule) => {
      if (rule.terms && Array.isArray(rule.terms)) {
        allTerms.push(...rule.terms);
      }
    });

    if (allTerms.length === 0) {
      res.status(400).json({
        success: false,
        message: "No extraction terms found in the rules",
      });
      return;
    }

    // Get mimetype from document file
    const mimeType = document.file?.mimetype || "application/octet-stream";

    // Step 3: Send document + terms + prompt to Gemini API
    const extractedData = await extractDataFromDocument(
      document.documentUrl,
      allTerms,
      mimeType
    );

    // Step 4: Store returned JSON in dataSource of document
    document.dataSource = extractedData;
    await document.save();

    // Step 5: Return success response with extracted JSON
    res.status(200).json({
      success: true,
      message: "Data extracted successfully",
      data: extractedData,
    });
  } catch (error: any) {
    console.error("Extraction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to extract document data",
      error: error.message,
    });
  }
};
