export interface Profile {
  _id: string;
  profileName: string;
  profileDescription: string;
  numberOfDocuments: number;
  numberOfUnReconciledDocuments: number;
  numberOfReconciledDocuments: number;
  numberOfDiscrepancyDocuments: number;
}

export interface DocumentData {
  _id: string;
  documentName: string;
  documentUrl: string;
  file?: File;
}

export interface ExtractionRule {
  _id: string;
  extractionRuleName: string;
  extractionRuleDescription: string;
  terms: string[];
  documentIds: string[];
}

export interface MatchingRule {
  _id: string;
  matchingRuleName: string;
  matchingRuleDescription: string;
  documentPairs: [string, string][];
  rules: { term1: string; term2: string }[];
}

export interface ProfileCreationData {
  profileName: string;
  profileDescription: string;
  documents: DocumentData[];
  extractionRules: ExtractionRule[];
  matchingRules: MatchingRule[];
}
