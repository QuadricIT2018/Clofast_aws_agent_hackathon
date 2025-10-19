import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const callGeminiAPI = async ({
  documentUrl,
  extractionRule,
  prompt,
}: {
  documentUrl: string;
  extractionRule?: string[];
  prompt: string;
}) => {
  const GEMINI_API_URL =
    process.env.GEMINI_API_URL! ||
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

  const response = await axios.post(
    GEMINI_API_URL,
    {
      documentUrl,
      extractionRule,
      prompt,
    },
    {
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};
