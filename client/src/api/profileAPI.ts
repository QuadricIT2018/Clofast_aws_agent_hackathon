import axios from "axios";
import { type Profile } from "../types/profileTypes";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5550";

export const fetchProfiles = async (): Promise<Profile[]> => {
  const response = await axios.get(`${API_BASE_URL}/profiles`);
  return response.data;
};

export const fetchProfileById = async (id: string): Promise<Profile> => {
  const response = await axios.get(`${API_BASE_URL}/profiles/${id}`);
  return response.data;
};

export const deleteProfileCascade = async (profileId: string) => {
  const response = await axios.delete(
    `${API_BASE_URL}/profiles/${profileId}/cascade`
  );
  return response.data;
};

import { type ReconciliationResult } from "../types/profileTypes";

// Perform reconciliation using backend API
export const reconcileDocuments = async (
  documentIds: string[],
  matchingRuleIds: string[]
): Promise<ReconciliationResult[]> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/profiles/reconcile`, {
      documentIds,
      matchingRuleIds,
    });

    return response.data.data as ReconciliationResult[];
  } catch (error) {
    console.error("Error performing reconciliation:", error);
    throw error;
  }
};
