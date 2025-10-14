import { Request, Response } from "express";
import Document from "../models/Document";
import ExtractionRule from "../models/ExtractionRule";
import MatchingRule from "../models/MatchingRule";
import Profile from "../models/profiles";
import { uploadToS3 } from "../utils/s3Uploader";

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
