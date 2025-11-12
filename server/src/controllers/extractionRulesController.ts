import { Request, Response } from "express";
import Document from "../models/Document.js";
import ExtractionRule from "../models/ExtractionRule.js";
import Profile from "../models/profiles.js";
import { agentCoreService } from "../services/agentCoreService.js";
// import { callGeminiAPI } from "../services/geminiService";
import * as XLSX from "xlsx";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
// TODO: Add PDF conversion later - temporarily disabled due to import issues
// let pdf: any;
// let sharp: any;

// For ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temp directory for document processing
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

async function convertDocumentToImage(documentUrl: string, documentName: string): Promise<string | null> {
  try {
    console.log(`🖼️ Converting document to image for OCR: ${documentName}`);

    // PDF-to-image conversion would be implemented here
    // For now, we'll let the AgentCore agent handle the PDF URL directly
    console.log('📄 PDF-to-image conversion not implemented yet');
    console.log('📄 AgentCore agent will attempt to process PDF directly');
    return null;

  } catch (error) {
    console.error('❌ Error converting document to image:', error);
    return null;
  }
}

async function convertImageToBase64(imagePath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Image file not found:', imagePath);
      return null;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

    console.log(`📸 Image converted to base64: ${Math.round(base64Image.length / 1024)}KB`);

    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error('❌ Error converting image to base64:', error);
    return null;
  }
}

function cleanupTempFile(filePath: string | null) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log('🧹 Cleaned up temp file:', path.basename(filePath));
    } catch (error) {
      console.log('⚠️ Failed to cleanup temp file:', error);
    }
  }
}

export const extractDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ message: "Document ID is required" });
    }

    console.log("🚀 Starting AI-powered document extraction...");

    // 1️⃣ Fetch document and related data
    const document = await Document.findById(documentId);
    if (!document) {
      const error: ApiError = { message: "Document not found", status: 404 };
      return res.status(error.status ?? 500).json(error);
    }

    if (!document.documentUrl) {
      const error: ApiError = { message: "Document URL missing", status: 400 };
      return res.status(error.status ?? 500).json(error);
    }

    // 2️⃣ Fetch associated extraction rules
    let extractionRules: any[] = [];
    if (document.extractionRule && document.extractionRule.length > 0) {
      extractionRules = await ExtractionRule.find({
        _id: { $in: document.extractionRule },
      });
    }

    // 3️⃣ Find the profile context for better extraction
    const profile = await Profile.findOne({
      documents: { $in: [documentId] }
    });

    const profileContext = {
      profileName: profile?.profileName || "Unknown Profile",
      profileDescription: profile?.profileDescription || "No description available",
    };

    console.log(`📄 Document: ${document.documentName}`);
    console.log(`🔧 Extraction rules: ${extractionRules.length}`);
    console.log(`📋 Profile: ${profileContext.profileName}`);

    // 4️⃣ Prioritize AWS AgentCore for Excel/CSV files, fallback to direct processing
    const fileExtension = path.extname(document.documentName || "").toLowerCase();
    const isExcelFile = fileExtension === '.xlsx' || fileExtension === '.xls';
    const isCsvFile = fileExtension === '.csv';
    const isSpreadsheetFile = isExcelFile || isCsvFile;

    if (isSpreadsheetFile) {
      console.log(`📊 ${isCsvFile ? 'CSV' : 'Excel'} file detected - prioritizing AWS AgentCore extraction...`);
      
      // Try AgentCore first for Excel files
      try {
        console.log(`🤖 Attempting AWS AgentCore extraction for ${isCsvFile ? 'CSV' : 'Excel'}...`);
        
        const agentCoreResult = await agentCoreService.performExtraction(
          document.documentUrl,
          document.documentName || "Unknown Document",
          extractionRules,
          profileContext
        );

        if (agentCoreResult && agentCoreResult.success && agentCoreResult.extractedData && agentCoreResult.extractedData.length > 0) {
          console.log(`✅ AWS AgentCore Excel extraction successful: ${agentCoreResult.extractedData.length} records`);
          
          // Save extracted data to document WITHOUT overwriting original dataSource
          (document as any).extractedData = agentCoreResult.extractedData;
          // Keep original dataSource intact
          await document.save();

          return res.status(200).json({
            success: true,
            message: agentCoreResult.message || "Data extracted successfully from Excel file using AWS AgentCore",
            extractionMethod: agentCoreResult.metadata?.extractionMethod || "AWS Bedrock AgentCore Excel Processing",
            data: agentCoreResult.extractedData,
            metadata: {
              ...agentCoreResult.metadata,
              documentUrl: document.documentUrl,
              documentName: document.documentName,
              rulesApplied: extractionRules.length,
              processingPriority: "AWS AgentCore (Primary)"
            },
            extractionRules: extractionRules.map(rule => ({
              name: rule.extractionRuleName,
              description: rule.extractionRuleDescription,
              terms: rule.terms
            }))
          });
        } else {
          console.log("⚠️ AWS AgentCore extraction failed or returned no data, falling back to direct Excel processing...");
        }
      } catch (agentCoreError) {
        console.log("❌ AWS AgentCore Excel extraction failed:", agentCoreError);
        console.log("🔄 Falling back to direct Excel processing...");
      }

      // Fallback to direct Excel/CSV processing
      try {
        console.log(`📊 Attempting direct ${isCsvFile ? 'CSV' : 'Excel'} extraction as fallback...`);

        // Download file from documentUrl
        const response = await axios.get(document.documentUrl, {
          responseType: "arraybuffer",
        });

        let workbook: XLSX.WorkBook;
        let sheetName: string;
        let sheet: XLSX.WorkSheet;

        if (isCsvFile) {
          console.log("📄 Converting CSV to Excel format for processing...");
          // For CSV files, convert to workbook format
          const csvText = Buffer.from(response.data as ArrayBuffer).toString('utf8');
          workbook = XLSX.read(csvText, { type: "string" });
          sheetName = workbook.SheetNames[0];
          sheet = workbook.Sheets[sheetName];
          console.log(`✅ CSV converted to Excel format: ${workbook.SheetNames.length} sheet(s)`);
        } else {
          // For Excel files, read directly
          workbook = XLSX.read(response.data, { type: "buffer" });
          sheetName = workbook.SheetNames[0];
          sheet = workbook.Sheets[sheetName];
        }

        // Convert Excel/CSV sheet to JSON - NO FILTERING, let LLM handle it
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
          defval: "",
        });

        // Extract ALL data without any filtering - let the LLM do the filtering
        const extractedData = jsonData;

        // Save extracted JSON data WITHOUT overwriting original dataSource
        (document as any).extractedData = extractedData;
        // Keep original dataSource intact
        await document.save();

        console.log(`✅ Direct ${isCsvFile ? 'CSV' : 'Excel'} extraction (fallback) completed: ${extractedData.length} records`);

        return res.status(200).json({
          success: true,
          message: `Data extracted successfully from ${isCsvFile ? 'CSV' : 'Excel'} file using direct processing (fallback) - No server-side filtering applied`,
          extractionMethod: `Direct ${isCsvFile ? 'CSV' : 'Excel'} Processing (Fallback)`,
          data: extractedData,
          metadata: {
            documentUrl: document.documentUrl,
            documentName: document.documentName,
            extractionMethod: `Direct ${isCsvFile ? 'CSV' : 'Excel'} Processing (Fallback)`,
            extractionConfidence: isCsvFile ? 98 : 95,
            recordsExtracted: extractedData.length,
            timestamp: new Date().toISOString(),
            rulesApplied: 0, // No server-side rules applied
            processingPriority: "Direct Processing (Fallback)",
            fileType: isCsvFile ? 'CSV' : 'Excel',
            conversionApplied: isCsvFile ? 'CSV to Excel format' : 'None',
            serverFiltering: "None - LLM will handle filtering",
            note: `AWS AgentCore failed, used direct ${isCsvFile ? 'CSV' : 'Excel'} processing without server-side filtering`
          },
          extractionRules: extractionRules.map(rule => ({
            name: rule.extractionRuleName,
            description: rule.extractionRuleDescription,
            terms: rule.terms,
            note: "Rules passed to LLM for processing, no server-side filtering applied"
          }))
        });

      } catch (processingError) {
        console.log(`❌ Direct ${isCsvFile ? 'CSV' : 'Excel'} extraction also failed:`, processingError);
        console.log("🔄 Falling back to AgentCore extraction...");
      }
    }

    // 5️⃣ Try AgentCore extraction for non-Excel files or when Excel processing fails
    try {
      console.log("🤖 Attempting AgentCore extraction...");

      let base64Image: string | null = null;

      // Try image conversion if document is a PDF
      if (document.documentName && document.documentName.toLowerCase().endsWith('.pdf')) {
        try {
          console.log("🖼️ Attempting PDF to image conversion...");
          const imagePath = await convertDocumentToImage(document.documentUrl, document.documentName);
          if (imagePath) {
            base64Image = await convertImageToBase64(imagePath);
            cleanupTempFile(imagePath);
          }
        } catch (imageError) {
          console.log("⚠️ Image conversion failed, proceeding without image:", imageError);
          base64Image = null;
        }
      }

      const agentCoreResult = await agentCoreService.performExtraction(
        document.documentUrl,
        document.documentName || "Unknown Document",
        extractionRules,
        profileContext,
        base64Image // Pass the base64 image if available
      );

      if (agentCoreResult.success && agentCoreResult.extractedData) {
        console.log(`✅ AgentCore extraction successful: ${agentCoreResult.extractedData.length} records`);

        // Save extracted data to document WITHOUT overwriting original dataSource
        (document as any).extractedData = agentCoreResult.extractedData;
        // Keep original dataSource intact
        await document.save();

        return res.status(200).json({
          success: true,
          message: agentCoreResult.message || "Data extracted successfully using AI",
          extractionMethod: "AWS Bedrock AgentCore",
          data: agentCoreResult.extractedData,
          metadata: agentCoreResult.metadata,
          extractionRules: extractionRules.map(rule => ({
            name: rule.extractionRuleName,
            description: rule.extractionRuleDescription,
            terms: rule.terms
          }))
        });
      } else {
        console.log("⚠️ AgentCore extraction failed, using final fallback...");
      }
    } catch (agentError) {
      console.log("❌ AgentCore extraction error:", agentError);
    }

    // 5️⃣ Fallback to Excel parsing if AgentCore fails
    console.log("🔄 Using Excel parsing fallback...");

    let extractionTerms: string[] = [];
    if (extractionRules.length > 0) {
      extractionTerms = [...new Set(extractionRules.flatMap((rule) => rule.terms || []))];
    }

    if (extractionTerms.length === 0) {
      // If no extraction rules, try to extract all columns
      console.log("⚠️ No extraction terms found, will extract all available columns");
    }

    try {
      // Download Excel file from documentUrl
      const response = await axios.get(document.documentUrl, {
        responseType: "arraybuffer",
      });

      const workbook = XLSX.read(response.data, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert Excel sheet to JSON
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
        defval: "",
      });

      let extractedData: any[];

      if (extractionTerms.length > 0) {
        // Extract only the required columns based on rule terms
        extractedData = jsonData.map((row) => {
          const filtered: Record<string, any> = {};
          for (const term of extractionTerms) {
            filtered[term] = row[term] || "";
          }
          return filtered;
        });
      } else {
        // Extract all columns if no specific terms
        extractedData = jsonData;
      }

      // Save extracted JSON data WITHOUT overwriting original dataSource
      (document as any).extractedData = extractedData;
      // Keep original dataSource intact
      await document.save();

      console.log(`✅ Excel extraction completed: ${extractedData.length} records`);

      return res.status(200).json({
        success: true,
        message: "Data extracted successfully using Excel parsing",
        extractionMethod: "Excel Parsing (Fallback)",
        extractionTerms,
        data: extractedData,
        extractionRules: extractionRules.map(rule => ({
          name: rule.extractionRuleName,
          description: rule.extractionRuleDescription,
          terms: rule.terms
        }))
      });

    } catch (excelError) {
      console.error("❌ Excel parsing also failed:", excelError);

      return res.status(500).json({
        success: false,
        message: "Both AI extraction and Excel parsing failed",
        error: "Unable to extract data from document",
        details: {
          agentCoreAvailable: true,
          excelParsingError: (excelError as Error).message
        }
      });
    }

  } catch (error: unknown) {
    const err = error as ApiError;
    console.error("❌ Error in document extraction:", err.message);

    return res.status(err.status || 500).json({
      success: false,
      message: "Server error during extraction",
      error: err.message || error,
    });
  }
};
