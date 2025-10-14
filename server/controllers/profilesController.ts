import { Request, Response } from "express";
import Document from "../models/Document";
import ExtractionRule from "../models/ExtractionRule";
import MatchingRule from "../models/MatchingRule";
import Profile from "../models/profiles";
import { uploadToS3 } from "../utils/s3Uploader";

/**
 * Controller: Create Profile with all dependencies (Documents, ExtractionRules, MatchingRules)
 */
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

    // 1️⃣ Upload each file to S3 and combine with the document data from frontend
    const documentPromises = files.map(async (file, index) => {
      const s3Url = await uploadToS3(file);

      // Merge uploaded S3 URL with corresponding frontend document data
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
    // 🧩 2️⃣ Create Extraction Rules (ignore any _id from frontend)
    const extractionRulePromises = extractionRules.map(async (rule: any) => {
      const newRule = await ExtractionRule.create({
        extractionRuleName: rule.extractionRuleName,
        extractionRuleDescription: rule.extractionRuleDescription,
        terms: rule.terms,
        documentIds, // associate with all uploaded docs
      });
      return newRule._id;
    });

    const extractionRuleIds = await Promise.all(extractionRulePromises);

    // 🔗 3️⃣ Update Documents to reference created extraction rules
    await Document.updateMany(
      { _id: { $in: documentIds } },
      { $set: { extractionRule: extractionRuleIds } }
    );

    // ⚖️ 4️⃣ Create Matching Rules (ignore any _id from frontend)
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

    // 🧠 5️⃣ Finally, create Profile
    const profile = await Profile.create({
      profileName,
      profileDescription,
      documents: documentIds,
      matchingRules: matchingRuleIds,
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
