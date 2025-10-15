export interface Profile {
  _id: string;
  profileName: string;
  profileDescription: string;
  numberOfDocuments: number;
  numberOfUnReconciledDocuments: number;
  numberOfReconciledDocuments: number;
  numberOfDiscrepancyDocuments: number;
}

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export interface DocumentFile {
  name: string;
  size: number;
  mimetype: string;
  encoding?: string;
}
export interface DocumentData {
  _id: string;
  documentName: string;
  documentUrl: string;
  file?: File | DocumentFile;
  dataSource?: Record<string, JSONValue>;
  extractionRules?: ExtractionRule[];
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

export interface Transaction {
  id: string;
  date?: string;
  description?: string;
  amount?: number;
  referenceId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ReconciliationResult {
  leftTransaction: Transaction;
  rightTransaction: Transaction | null;
  isReconciled: boolean;
  matchedFields?: string[];
}
