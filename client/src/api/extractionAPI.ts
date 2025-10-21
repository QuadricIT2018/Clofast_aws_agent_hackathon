// src/api/documentAPI.ts
import axios, { AxiosError } from "axios";
import type { ApiError } from "../types/authTypes";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5550/api";

export const extractDocumentData = async (documentId: string) => {
  try {
    const response = await axios.post(`${API_URL}/extraction/extract`, {
      documentId,
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      console.error("Error extracting data:", axiosError.response?.data);
      throw axiosError.response?.data || axiosError.message;
    } else {
      console.error("Unexpected error:", error);
      throw new Error("An unexpected error occurred");
    }
  }
};
