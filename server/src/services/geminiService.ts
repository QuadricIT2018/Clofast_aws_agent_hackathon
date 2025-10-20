import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

interface ExtractionResult {
  [key: string]: any;
}

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Download a file from a URL and return it as a Buffer
 */
async function downloadFileAsBuffer(url: string): Promise<Buffer> {
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: "arraybuffer",
  });
  return Buffer.from(response.data);
}

/**
 * Extract data from a document using Gemini SDK (no URL)
 */
export const extractDataFromDocument = async (
  documentUrl: string,
  terms: string[],
  mimeType: string
): Promise<ExtractionResult> => {
  try {
    // 1️⃣ Download the file and convert to base64
    const fileBuffer = await downloadFileAsBuffer(documentUrl);
    const base64Data = fileBuffer.toString("base64");

    // 2️⃣ Prepare prompt
    const prompt = `
You are a data extraction assistant. Extract all rows of structured data from the document.

For each record, extract the following fields:
${terms.map((term, idx) => `${idx + 1}. ${term}`).join("\n")}

Instructions:
- There may be multiple entries or transactions in the document.
- Return ALL entries as an array of JSON objects.
- Each object must contain the exact keys provided above.
- If a value is missing, set it to null.
- Do not include any extra text or explanation.

Return ONLY a valid JSON array:
[
  { "Store ID": "...", "Store Name": "...", ... },
  { "Store ID": "...", "Store Name": "...", ... }
]
`.trim();

    // 3️⃣ Use the Gemini SDK instead of REST call
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
      { text: prompt },
    ]);

    // 4️⃣ Get the response text
    const textResponse = result.response.text();
    if (!textResponse) {
      throw new Error("No response text from Gemini API");
    }

    // 5️⃣ Parse JSON
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from Gemini response");
    }

    // ✅ new robust JSON array extraction
    let extractedData: ExtractionResult;

    try {
      // 1️⃣ Clean possible markdown fences (```json ... ```)
      const cleanText = textResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      // 2️⃣ Match JSON array OR object
      const jsonMatch = cleanText.match(/\[([\s\S]*)\]|\{([\s\S]*)\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON detected in Gemini output");
      }

      // 3️⃣ Parse safely
      extractedData = JSON.parse(jsonMatch[0]);
    } catch (err: any) {
      console.error("JSON parsing failed:", err.message);
      console.error("Raw Gemini text:", textResponse);
      throw new Error("Gemini extraction failed: Invalid JSON format");
    }

    return extractedData;
  } catch (error: any) {
    console.error("Gemini extraction failed:", error.message);
    throw new Error(`Gemini extraction failed: ${error.message}`);
  }
};
