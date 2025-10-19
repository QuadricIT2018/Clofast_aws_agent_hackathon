import axios from "axios";
import type { DocumentData } from "../types/profileTypes";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5550/api";

export const getDocumentsByProfile = async (
  profileId: string
): Promise<DocumentData[]> => {
  try {
    const response = await axios.get(
      `${API_URL}/documents/profile/${profileId}`
    );
    return response.data.documents;
  } catch (error: unknown) {
    console.error("Error fetching documents by profile:", error);
    throw error;
  }
};
