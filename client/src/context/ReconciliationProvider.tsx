import React, { useState } from "react";
import ReconciliationContext from "./ReconciliationContext";
import { type DocumentData, type MatchingRule } from "../types/profileTypes";

const ReconciliationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentData[]>(
    []
  );
  const [selectedMatchingRules, setSelectedMatchingRules] = useState<
    MatchingRule[]
  >([]);

  return (
    <ReconciliationContext.Provider
      value={{
        selectedDocuments,
        setSelectedDocuments,
        selectedMatchingRules,
        setSelectedMatchingRules,
      }}
    >
      {children}
    </ReconciliationContext.Provider>
  );
};

export default ReconciliationProvider;
