import dotenv from "dotenv";
import axios from "axios";
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
      You are an intelligent data extraction assistant designed to extract structured tabular data from semi-structured business documents such as payout reports or invoices.

      Your task:
      Extract **all rows (records)** of structured data from the provided document.

      Fields to extract for each record:
      ${terms.map((term, idx) => `${idx + 1}. ${term}`).join("\n")}

      Important Instructions:
      1. The document may contain **multiple entries or transactions**. Extract *all* of them.
      2. Column headers in the document may not be perfectly aligned vertically — use contextual and semantic understanding to correctly map values to their corresponding fields.
      3. Maintain **the exact field names** as listed above — no renaming, no additional fields.
      4. Handle missing or inconsistent data as follows:
        - If a field represents a **categorical/text value** (e.g., IDs, Names, Dates, Status), and the value is missing, set it to **null**.
        - If a field represents a **numerical value** (e.g., amounts, totals, fees, charges, percentages), and the value is missing or appears as an empty cell, invalid number, or "—", set it to **0**.
      5. Ensure all numeric values are parsed as valid numbers (no currency symbols, commas, or text — only numeric form).
      6. Dates should be kept as they appear (do not reformat them).
      7. Return **only** a clean, valid JSON array — no explanations, comments, or Markdown.
      8. The final output must strictly be:
      [
        { "Store ID": "...", "Store Name": "...", ... },
        { "Store ID": "...", "Store Name": "...", ... }
      ]

      Be extremely careful with alignment, field matching, and consistent key naming.
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
