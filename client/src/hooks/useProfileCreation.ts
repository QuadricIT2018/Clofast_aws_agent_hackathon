import { useContext } from "react";
import { ProfileCreationContext } from "../context/ProfileCreationContext";

export const useProfileCreation = () => {
  const context = useContext(ProfileCreationContext);
  if (!context)
    throw new Error(
      "useProfileCreation must be used within a ProfileCreationProvider"
    );
  return context;
};
