import { Request, Response } from "express";
import Profile from "../models/profiles.js";

export const getMatchingRulesByProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const { profileId } = req.params;

    if (!profileId) {
      return res.status(400).json({ message: "Profile ID is required." });
    }

    // ✅ Step 1: Find profile and populate its matchingRules
    const profile = await Profile.findById(profileId).populate("matchingRules");

    if (!profile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    // ✅ Step 2: Extract populated matching rules
    const rules = profile.matchingRules;

    if (!rules || rules.length === 0) {
      return res
        .status(404)
        .json({ message: "No matching rules found for this profile." });
    }

    // ✅ Step 3: Respond with data
    return res.status(200).json({
      success: true,
      count: rules.length,
      data: rules,
    });
  } catch (error: any) {
    console.error("❌ Error fetching matching rules:", error.message);
    return res.status(500).json({
      message: "Server error while fetching matching rules.",
      error: error.message,
    });
  }
};
