import { Request, Response } from "express";
import Document from "../models/Document.js";
import ExtractionRule from "../models/ExtractionRule.js";
// import { callGeminiAPI } from "../services/geminiService";
import * as XLSX from "xlsx";
import axios from "axios";
export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

export const extractDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ message: "Document ID is required" });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      const error: ApiError = { message: "Document not found", status: 404 };
      return res.status(error.status ?? 500).json(error);
    }

    if (!document.documentUrl) {
      const error: ApiError = { message: "Document URL missing", status: 400 };
      return res.status(error.status ?? 500).json(error);
    }

    // Gemini API calling --------------------------

    // const extractionPayload = {
    //   documentUrl: document.documentUrl,
    //   extractionRules: document.extractionRule?.map((rule: any) => ({
    //     name: rule.extractionRuleName,
    //     description: rule.extractionRuleDescription,
    //     terms: rule.terms,
    //   })),
    //   prompt: ` You are an intelligent data extraction agent. Your task is to analyze the uploaded document and extract only the data fields (columns) listed in the "terms" of the associated extraction rules. Return the extracted data strictly in valid JSON format, with each key matching a term name, and each value representing the corresponding extracted data from the document. If a term is not found in the document, still include the key with an empty string or null value. Do not include explanations or additional text — only return the JSON object.,`,
    // }; // 3️⃣ Send to Gemini API (your service function)
    // const extractedData = await callGeminiAPI(extractionPayload);
    // // 4️⃣ Save extracted data back to DB (create dataSource if missing)
    // document.dataSource = extractedData as Record<string, unknown>; await document.save();

    // 2️⃣ Fetch associated extraction rules
    // 2️⃣ Fetch associated extraction rules
    let extractionTerms: string[] = [];
    if (document.extractionRule && document.extractionRule.length > 0) {
      const rules = await ExtractionRule.find({
        _id: { $in: document.extractionRule },
      });

      extractionTerms = [...new Set(rules.flatMap((rule) => rule.terms || []))];
    }

    if (extractionTerms.length === 0) {
      const error: ApiError = {
        message: "No extraction terms found for this document.",
        status: 400,
      };
      return res.status(error.status ?? 500).json(error);
    }

    // 3️⃣ Download Excel file from documentUrl (remote or local)
    const response = await axios.get(document.documentUrl, {
      responseType: "arraybuffer",
    });

    const workbook = XLSX.read(response.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // 4️⃣ Convert Excel sheet to JSON
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: "",
    });

    // 5️⃣ Extract only the required columns based on rule terms
    const extractedData = jsonData.map((row) => {
      const filtered: Record<string, any> = {};
      for (const term of extractionTerms) {
        filtered[term] = row[term] || "";
      }
      return filtered;
    });

    // 6️⃣ Save extracted JSON data into document.dataSource
    document.dataSource = extractedData;
    await document.save();

    return res.status(200).json({
      success: true,
      message: "Data extracted successfully from document URL",
      extractionTerms,
      data: extractedData,
    });
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error("Error extracting document:", err.message);

    return res.status(err.status || 500).json({
      success: false,
      message: "Server error during extraction",
      error: err.message || error,
    });
  }
};
