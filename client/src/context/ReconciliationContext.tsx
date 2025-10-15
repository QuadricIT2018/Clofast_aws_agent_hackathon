import { createContext } from "react";
import { type DocumentData, type MatchingRule } from "../types/profileTypes";

export interface ReconciliationContextType {
  selectedDocuments: DocumentData[];
  setSelectedDocuments: React.Dispatch<React.SetStateAction<DocumentData[]>>;
  selectedMatchingRules: MatchingRule[];
  setSelectedMatchingRules: React.Dispatch<
    React.SetStateAction<MatchingRule[]>
  >;
}

const ReconciliationContext = createContext<
  ReconciliationContextType | undefined
>(undefined);

export default ReconciliationContext;
