import axios from "axios";
import {
  type DocumentData,
  type MatchingRule,
  type Profile,
  type ProfileCreationData,
} from "../types/profileTypes";
import { type ReconciliationResult } from "../types/profileTypes";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5550/api";

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

export const createProfile = async (
  profileData: ProfileCreationData,
  rules: MatchingRule[]
) => {
  try {
    const formData = new FormData();

    // Merge rules into profile data
    const finalProfileData = {
      ...profileData,
      matchingRules: rules,
    };

    formData.append("data", JSON.stringify(finalProfileData));

    // Append document files
    profileData.documents.forEach((doc: DocumentData) => {
      if (doc.file instanceof File) {
        formData.append("documents", doc.file);
      }
    });

    const response = await axios.post(`${API_BASE_URL}/profiles`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error creating profile:", error);
    throw error;
  }
};

// Perform reconciliation using backend API with AI
export const reconcileDocuments = async (
  documentIds: string[],
  matchingRuleIds: string[],
  profileId?: string
): Promise<ReconciliationResult[]> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/profiles/reconcile`, {
      documentIds,
      matchingRuleIds,
      profileId,
    });

    return response.data.data as ReconciliationResult[];
  } catch (error) {
    console.error("Error performing AI reconciliation:", error);
    throw error;
  }
};
