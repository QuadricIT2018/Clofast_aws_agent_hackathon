import { Request, Response } from "express";
import Document from "../models/Document";
import ExtractionRule from "../models/ExtractionRule";
// import { callGeminiAPI } from "../services/geminiService";
import * as XLSX from "xlsx";
import path from "path";

export const extractDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ message: "Document ID is required" });
    }

    // 1️⃣ Fetch document from MongoDB
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
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
    let extractionTerms: string[] = [];

    if (document.extractionRule && document.extractionRule.length > 0) {
      const rules = await ExtractionRule.find({
        _id: { $in: document.extractionRule },
      });

      // Merge all unique terms from the rules
      extractionTerms = [...new Set(rules.flatMap((rule) => rule.terms || []))];
    } else {
      console.warn("No extraction rules linked to this document.");
    }

    if (extractionTerms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No extraction terms found for this document.",
      });
    }

    // 3️⃣ Load dummy Excel file (instead of Gemini API)
    const dummyFilePath = path.join(
      __dirname,
      "../assets/Bankstatement_pos.xlsx"
    );

    const workbook = XLSX.readFile(dummyFilePath);
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
      message:
        "Data extracted successfully using extraction rules (Gemini skipped)",
      extractionTerms,
      data: extractedData,
    });
  } catch (error: any) {
    console.error("Error extracting document:", error);
    res.status(500).json({
      success: false,
      message: "Server error during extraction",
      error: error.message,
    });
  }
};
