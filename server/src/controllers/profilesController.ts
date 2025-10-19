import { Request, Response } from "express";
import Document from "../models/Document.js";
import ExtractionRule from "../models/ExtractionRule.js";
import MatchingRule from "../models/MatchingRule.js";
import Profile from "../models/profiles.js";
import { uploadToS3 } from "../utils/s3Uploader.js";

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
      const documentData = {
        documentName: frontendDoc.documentName || file.originalname,
        documentUrl: s3Url,
        file: {
          name: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          encoding: file.encoding,
        },
        dataSource: frontendDoc.dataSource || {},
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
    const { documentIds, matchingRuleIds } = req.body;

    if (!documentIds || documentIds.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Exactly two document IDs are required",
      });
    }

    // 1️⃣ Fetch documents and matching rules
    const [leftDoc, rightDoc] = await Promise.all([
      Document.findById(documentIds[0]),
      Document.findById(documentIds[1]),
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

    const leftData = Array.isArray(leftDoc.dataSource)
      ? leftDoc.dataSource
      : [];
    const rightData = Array.isArray(rightDoc.dataSource)
      ? rightDoc.dataSource
      : [];

    // 2️⃣ Perform reconciliation logic (same as frontend)
    const results: ReconciliationResult[] = [];
    const matchedRightIndices = new Set<number>();

    for (const leftTx of leftData) {
      let matched = false;
      let matchedRightTx: Transaction | null = null;
      let matchedFields: string[] = [];

      for (let i = 0; i < rightData.length; i++) {
        if (matchedRightIndices.has(i)) continue;

        const rightTx = rightData[i];
        let allRulesMatch = true;
        const currentMatchedFields: string[] = [];

        if (matchingRules.length > 0) {
          for (const rule of matchingRules) {
            for (const pair of rule.rules) {
              const leftValue = leftTx[pair.term1];
              const rightValue = rightTx[pair.term2];

              const normalizedLeft = String(leftValue).trim().toLowerCase();
              const normalizedRight = String(rightValue).trim().toLowerCase();

              if (
                normalizedLeft === normalizedRight &&
                leftValue !== undefined &&
                rightValue !== undefined
              ) {
                currentMatchedFields.push(`${pair.term1}↔${pair.term2}`);
              } else {
                allRulesMatch = false;
                break;
              }
            }
            if (!allRulesMatch) break;
          }
        } else {
          // Default rule: match by Amount
          if (leftTx.Amount !== undefined && rightTx.Amount !== undefined) {
            const leftAmount = Number(leftTx.Amount);
            const rightAmount = Number(rightTx.Amount);
            if (Math.abs(leftAmount - rightAmount) < 0.01) {
              currentMatchedFields.push("Amount");
            } else {
              allRulesMatch = false;
            }
          }
        }

        if (allRulesMatch && currentMatchedFields.length > 0) {
          matched = true;
          matchedRightTx = rightTx;
          matchedFields = currentMatchedFields;
          matchedRightIndices.add(i);
          break;
        }
      }

      results.push({
        leftTransaction: leftTx,
        rightTransaction: matchedRightTx,
        isReconciled: matched,
        matchedFields,
      });
    }

    // Add unmatched right transactions
    rightData.forEach((rightTx, idx) => {
      if (!matchedRightIndices.has(idx)) {
        results.push({
          leftTransaction: {} as Transaction,
          rightTransaction: rightTx,
          isReconciled: false,
          matchedFields: [],
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: "Reconciliation completed successfully",
      data: results,
    });
  } catch (error: any) {
    console.error("Reconciliation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during reconciliation",
      error: error.message,
    });
  }
};
