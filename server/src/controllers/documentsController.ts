import { Request, Response } from "express";
import Document from "../models/Document.js";
import Profile from "../models/profiles.js";

export const getDocumentsByProfile = async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;

    // Step 1: Find the profile
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Step 2: Get documents by their IDs from the Document collection
    const documents = await Document.find({
      _id: { $in: profile.documents },
    });

    // Step 3: Return them
    return res.status(200).json({
      success: true,
      documents,
    });
  } catch (error: any) {
    console.error("Error fetching documents by profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
