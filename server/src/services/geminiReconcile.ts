import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { IMatchingRule } from "../models/MatchingRule.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ReconciliationResult {
  leftTransaction: Record<string, any>;
  rightTransaction: Record<string, any> | null;
  isReconciled: boolean;
  matchedFields: string[];
}

export const reconcileWithGemini = async (
  leftData: Record<string, any>[],
  rightData: Record<string, any>[],
  matchingRules: IMatchingRule[]
): Promise<ReconciliationResult[]> => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    console.log(leftData, rightData);

    // Extract matching rule pairs
    const rulePairs = matchingRules.flatMap((rule) => rule.rules || []);

    // Prepare prompt for Gemini
    const prompt = `
        You are an AI system that performs POS data reconciliation.
        Compare two data sources (leftData and rightData) using provided matchingRules.

        **LeftData:**
        ${JSON.stringify(leftData, null, 2)}

        **RightData:**
        ${JSON.stringify(rightData, null, 2)}

        **MatchingRules:**
        ${JSON.stringify(rulePairs, null, 2)}

        **Instructions:**
        1. For each item in leftData, find the best matching item in rightData based on the matchingRules.
        2. A match occurs when the values of term1 (from leftData) equal term2 (from rightData) according to the rules.
        3. Use fuzzy matching if exact matches aren't found (consider case-insensitive, trimmed values).
        4. Mark isReconciled as true if a match is found, false otherwise.
        5. List all matched field pairs in the format "term1↔term2".
        6. Each leftTransaction should appear exactly once.
        7. If no match is found for a leftTransaction, set rightTransaction to "-" and mark isReconciled as false.
        8. Additionally, identify any rightTransactions that do not match any leftTransaction and include them in the output as unreconciled, with leftTransaction set to "-" and isReconciled set to false.

        **Output Format:**
        Return ONLY a valid JSON array with no additional text, no explanations, no markdown fences, in this exact structure:
        [
        {
            "leftTransaction": { original left data object } or null,
            "rightTransaction": { original right data object } or null,
            "isReconciled": true or false,
            "matchedFields": ["term1↔term2", ...]
        }
        ]

        Ensure that:
        - Every leftTransaction appears exactly once.
        - Every rightTransaction that does not match any leftTransaction is also included as an unreconciled entry.
        `.trim();

    // Use the Gemini SDK
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent([{ text: prompt }]);

    // Get the response text
    const textResponse = result.response.text();
    if (!textResponse) {
      throw new Error("No response text from Gemini API");
    }

    // Parse JSON with robust extraction
    let reconciliationResults: ReconciliationResult[];

    try {
      // Clean possible markdown fences (```json ... ```)
      const cleanText = textResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      // Match JSON array
      const jsonMatch = cleanText.match(/\[([\s\S]*)\]/);
      if (!jsonMatch) {
        throw new Error("No valid JSON array detected in Gemini output");
      }

      // Parse safely
      reconciliationResults = JSON.parse(jsonMatch[0]);
    } catch (err: any) {
      console.error("JSON parsing failed:", err.message);
      console.error("Raw Gemini text:", textResponse);
      throw new Error("Gemini reconciliation failed: Invalid JSON format");
    }

    // Validate structure
    if (!Array.isArray(reconciliationResults)) {
      throw new Error("Gemini response is not an array");
    }

    return reconciliationResults;
  } catch (error: any) {
    console.error("Gemini reconciliation error:", error);
    throw new Error(`Gemini reconciliation failed: ${error.message}`);
  }
};
