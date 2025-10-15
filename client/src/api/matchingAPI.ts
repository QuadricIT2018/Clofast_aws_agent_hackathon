import axios, { AxiosError } from "axios";
import { type MatchingRule } from "../types/profileTypes";
import { type ApiError } from "../types/authTypes";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5550/api";

export const fetchMatchingRules = async (
  profileId: string
): Promise<MatchingRule[]> => {
  try {
    const response = await axios.get<{
      success: boolean;
      count: number;
      data: MatchingRule[];
    }>(`${API_URL}/matching-rules/${profileId}`);

    return response.data.data;
  } catch (error) {
    let apiError: ApiError = { message: "Failed to fetch matching rules" };

    if (axios.isAxiosError(error)) {
      const err = error as AxiosError<{ message?: string; details?: unknown }>;
      apiError = {
        message: err.response?.data?.message || err.message,
        status: err.response?.status,
        details: err.response?.data?.details,
      };
    }

    throw apiError;
  }
};
