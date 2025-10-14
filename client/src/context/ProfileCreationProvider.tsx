import React, { useState, type ReactNode } from "react";
import { ProfileCreationContext } from "./ProfileCreationContext";
import { type ProfileCreationData } from "../types/profileTypes";

export const ProfileCreationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<ProfileCreationData>({
    profileName: "",
    profileDescription: "",
    documents: [],
    extractionRules: [],
    matchingRules: [],
  });

  const updateData = (updates: Partial<ProfileCreationData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <ProfileCreationContext.Provider value={{ data, updateData }}>
      {children}
    </ProfileCreationContext.Provider>
  );
};
