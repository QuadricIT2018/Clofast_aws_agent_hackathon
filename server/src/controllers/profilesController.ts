import { Request, Response } from "express";
import Document from "../models/Document.js";
import ExtractionRule from "../models/ExtractionRule.js";
import MatchingRule from "../models/MatchingRule.js";
import Profile from "../models/profiles.js";
import { uploadToS3 } from "../utils/s3Uploader.js";
import { agentCoreService } from "../services/agentCoreService.js";

interface Transaction {
  [key: string]: any;
  id?: string;
  Amount?: number;
}

interface ReconciliationResult {
  leftTransaction: Transaction;
  rightTransaction: Transaction | null;
  isReconciled: boolean;
  matchedFields?: string[];
  confidence?: number;
  aiReasoning?: string;
  discrepancies?: string[];
}

export const createProfile = async (req: Request, res: Response) => {
  try {
    const {
      profileName,
      profileDescription,
      extractionRules,
      matchingRules,
      documents,
    } = JSON.parse(req.body.data);

    const files = req.files as Express.Multer.File[];

    const documentPromises = files.map(async (file, index) => {
      const s3Url = await uploadToS3(file);

      const frontendDoc = documents[index];
      // Automatically load Excel data into dataSource for immediate display
      let dataSource = frontendDoc.dataSource || {};
      
      // If it's an Excel file, automatically load the data
      const fileExtension = file.originalname.toLowerCase().split('.').pop();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        try {
          console.log(`📊 Auto-loading Excel data for: ${file.originalname}`);
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(file.buffer, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
          
          dataSource = jsonData; // Store original Excel data
          console.log(`✅ Auto-loaded ${jsonData.length} records from Excel file`);
        } catch (error) {
          console.log(`⚠️ Failed to auto-load Excel data: ${error}`);
          // Continue with empty dataSource if Excel loading fails
        }
      }

      const documentData = {
        documentName: frontendDoc.documentName || file.originalname,
        documentUrl: s3Url,
        file: {
          name: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          encoding: file.encoding,
        },
        dataSource: dataSource,
      };

      const newDoc = await Document.create(documentData);
      return newDoc._id;
    });

    const documentIds = await Promise.all(documentPromises);

    const extractionRulePromises = extractionRules.map(async (rule: any) => {
      const newRule = await ExtractionRule.create({
        extractionRuleName: rule.extractionRuleName,
        extractionRuleDescription: rule.extractionRuleDescription,
        terms: rule.terms,
        documentIds,
      });
      return newRule._id;
    });

    const extractionRuleIds = await Promise.all(extractionRulePromises);

    await Document.updateMany(
      { _id: { $in: documentIds } },
      { $set: { extractionRule: extractionRuleIds } }
    );

    const matchingRulePromises = matchingRules.map(async (rule: any) => {
      const newRule = await MatchingRule.create({
        matchingRuleName: rule.matchingRuleName,
        matchingRuleDescription: rule.matchingRuleDescription,
        documentPairs: rule.documentPairs || [],
        rules: rule.rules || [],
      });
      return newRule._id;
    });

    const matchingRuleIds = await Promise.all(matchingRulePromises);

    const profile = await Profile.create({
      profileName,
      profileDescription,
      documents: documentIds,
      matchingRules: matchingRuleIds,
      extractionRules: extractionRuleIds,
    });

    res.status(201).json({
      message: "Profile created successfully ✅",
      profile,
    });
  } catch (error: any) {
    console.error("❌ Error creating profile:", error);
    res.status(500).json({
      message: "Failed to create profile",
      error: error.message || error,
    });
  }
};

export const getProfiles = async (req: Request, res: Response) => {
  try {
    const profiles = await Profile.find()
      .populate("matchingRules")
      .populate("documents")
      .sort({ createdAt: -1 });

    res.status(200).json(profiles);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ message: "Failed to fetch profiles" });
  }
};

export const getProfileById = async (req: Request, res: Response) => {
  try {
    const profile = await Profile.findById(req.params.id)
      .populate("matchingRules")
      .populate("documents");

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const deleteProfileCascade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const profile = await Profile.findById(id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // --- Step 1: Delete all documents referenced in this profile ---
    if (profile.documents && profile.documents.length > 0) {
      await Document.deleteMany({ _id: { $in: profile.documents } });
    }

    // --- Step 2: Delete all extraction rules referenced in this profile ---
    if (profile.extractionRules && profile.extractionRules.length > 0) {
      await ExtractionRule.deleteMany({
        _id: { $in: profile.extractionRules },
      });
    }

    // --- Step 3: Delete all matching rules referenced in this profile ---
    if (profile.matchingRules && profile.matchingRules.length > 0) {
      await MatchingRule.deleteMany({ _id: { $in: profile.matchingRules } });
    }

    // --- Step 4: Finally delete the profile itself ---
    await Profile.findByIdAndDelete(id);

    res.status(200).json({
      message:
        "Profile and all associated documents, extraction rules, and matching rules deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting profile cascade:", error);
    res.status(500).json({
      message: "Failed to delete profile and related data.",
      error: (error as Error).message,
    });
  }
};

export const reconcileDocuments = async (req: Request, res: Response) => {
  try {
    const { documentIds, matchingRuleIds, profileId } = req.body;

    if (!documentIds || documentIds.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Exactly two document IDs are required",
      });
    }

    console.log("🚀 Starting AI-powered reconciliation...");

    // 1️⃣ Fetch documents, matching rules, and profile
    const [leftDoc, rightDoc, profile] = await Promise.all([
      Document.findById(documentIds[0]),
      Document.findById(documentIds[1]),
      profileId ? Profile.findById(profileId) : null,
    ]);

    if (!leftDoc || !rightDoc) {
      return res.status(404).json({
        success: false,
        message: "One or both documents not found",
      });
    }

    const matchingRules = matchingRuleIds.length
      ? await MatchingRule.find({ _id: { $in: matchingRuleIds } })
      : [];

    // Get extraction rules for context
    const extractionRules = profile?.extractionRules?.length
      ? await ExtractionRule.find({ _id: { $in: profile.extractionRules } })
      : [];

    // SEND RAW EXCEL FILES DIRECTLY TO LLM - NO DATA PROCESSING
    console.log("📊 DIRECT EXCEL FILE RECONCILIATION:");
    console.log(`📄 Left Document: ${leftDoc.documentName} (URL: ${leftDoc.documentUrl})`);
    console.log(`📄 Right Document: ${rightDoc.documentName} (URL: ${rightDoc.documentUrl})`);
    console.log("🚫 NO DATA PROCESSING - Sending raw Excel URLs to LLM");

    // 2️⃣ Send actual Excel data directly to agent (not URLs)
    console.log(`📊 Left document dataSource: ${Array.isArray(leftDoc.dataSource) ? leftDoc.dataSource.length : 'not array'} records`);
    console.log(`📊 Right document dataSource: ${Array.isArray(rightDoc.dataSource) ? rightDoc.dataSource.length : 'not array'} records`);
    
    const agentCoreResponse = await agentCoreService.performReconciliation({
      leftDocument: Array.isArray(leftDoc.dataSource) ? leftDoc.dataSource : [],
      rightDocument: Array.isArray(rightDoc.dataSource) ? rightDoc.dataSource : [],
      extractionRules: extractionRules,
      matchingRules: matchingRules,
      profileContext: {
        profileName: profile?.profileName || "Unknown Profile",
        profileDescription: profile?.profileDescription || "No description available",
      },
    });

    console.log("✅ AI reconciliation completed successfully");

    // 3️⃣ Transform AgentCore response to match existing frontend format
    const results: ReconciliationResult[] = agentCoreResponse.reconciliationResults.map(result => ({
      leftTransaction: result.leftTransaction,
      rightTransaction: result.rightTransaction,
      isReconciled: result.isReconciled,
      matchedFields: result.matchedFields || [],
      // Add AI-specific fields for enhanced UI
      confidence: result.confidence,
      aiReasoning: result.aiReasoning,
      discrepancies: result.discrepancies,
    }));

    return res.status(200).json({
      success: true,
      message: "AI-powered reconciliation completed successfully",
      data: results,
      aiSummary: agentCoreResponse.summary,
      metadata: {
        processedBy: "AgentCore AI",
        timestamp: new Date().toISOString(),
        documentsProcessed: [leftDoc.documentName, rightDoc.documentName],
        rulesApplied: matchingRules.length,
      },
    });
  } catch (error: any) {
    console.error("❌ Reconciliation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during reconciliation",
      error: error.message,
    });
  }
};
