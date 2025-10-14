import { createContext, useContext } from "react";
import { type ProfileCreationData } from "../types/profileTypes";

export const ProfileCreationContext = createContext<{
  data: ProfileCreationData;
  updateData: (updates: Partial<ProfileCreationData>) => void;
} | null>(null);

export const useProfileCreation = () => {
  const context = useContext(ProfileCreationContext);
  if (!context) {
    throw new Error(
      "useProfileCreation must be used within a ProfileCreationProvider"
    );
  }
  return context;
};
