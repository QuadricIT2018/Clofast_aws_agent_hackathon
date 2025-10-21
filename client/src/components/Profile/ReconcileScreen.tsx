import { useState, useEffect, useMemo, useCallback } from "react";
import { CheckCircle, XCircle, Circle } from "lucide-react";
import { type Profile } from "../../types/profileTypes";
import { useReconciliation } from "../../hooks/useReconciliation";
import { type ReconciliationResult } from "../../types/profileTypes";
import { reconcileDocuments } from "../../api/profileAPI";
interface ReconcileScreenProps {
  profile: Profile;
}

type TabType = "all" | "reconciled" | "unreconciled";

const ReconcileScreen = ({ profile }: ReconcileScreenProps) => {
  console.log(profile);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [reconciliationResults, setReconciliationResults] = useState<
    ReconciliationResult[]
  >([]);
  const [selectedUnreconciled, setSelectedUnreconciled] =
    useState<ReconciliationResult | null>(null);
  const [detailTab, setDetailTab] = useState<"problem" | "suggestion">(
    "problem"
  );

  const [isReconciling, setIsReconciling] = useState(false);
  const { selectedDocuments, selectedMatchingRules } = useReconciliation();
  // Extract transactions from documents
  const leftDocumentTransactions = useMemo(() => {
    if (!selectedDocuments[0]?.dataSource) return [];

    // Handle array of objects format (your actual data structure)
    if (Array.isArray(selectedDocuments[0].dataSource)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return selectedDocuments[0].dataSource.map((item: any, idx) => ({
        id: `left-${idx}`,
        ...item,
      }));
    }

    return [];
  }, [selectedDocuments]);

  const rightDocumentTransactions = useMemo(() => {
    if (!selectedDocuments[1]?.dataSource) return [];

    // Handle array of objects format
    if (Array.isArray(selectedDocuments[1].dataSource)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return selectedDocuments[1].dataSource.map((item: any, idx) => ({
        id: `right-${idx}`,
        ...item,
      }));
    }

    return [];
  }, [selectedDocuments]);

  // Get column headers from the first transaction
  const leftHeaders = useMemo(() => {
    if (leftDocumentTransactions.length === 0) return [];
    return Object.keys(leftDocumentTransactions[0]).filter(
      (key) => key !== "id"
    );
  }, [leftDocumentTransactions]);

  const rightHeaders = useMemo(() => {
    if (rightDocumentTransactions.length === 0) return [];
    return Object.keys(rightDocumentTransactions[0]).filter(
      (key) => key !== "id"
    );
  }, [rightDocumentTransactions]);

  const performReconciliation = useCallback(async () => {
    try {
      setIsReconciling(true);

      const documentIds = selectedDocuments.map((doc) => doc._id);
      const matchingRuleIds = selectedMatchingRules.map((rule) => rule._id);

      const results = await reconcileDocuments(documentIds, matchingRuleIds);

      setReconciliationResults(results);
      console.log(results);
    } catch (err) {
      console.error("Reconciliation failed:", err);
    } finally {
      setIsReconciling(false);
    }
  }, [selectedDocuments, selectedMatchingRules]);

  // Run reconciliation when component mounts or data changes
  useEffect(() => {
    if (
      selectedDocuments.length >= 2 &&
      leftDocumentTransactions.length > 0 &&
      rightDocumentTransactions.length > 0
    ) {
      performReconciliation();
    }
  }, [
    selectedDocuments,
    leftDocumentTransactions.length,
    rightDocumentTransactions.length,
    performReconciliation,
  ]);

  // Filter results based on active tab
  const filteredResults = useMemo(() => {
    switch (activeTab) {
      case "reconciled":
        return reconciliationResults.filter((r) => r.isReconciled);
      case "unreconciled":
        return reconciliationResults.filter((r) => !r.isReconciled);
      default:
        return reconciliationResults;
    }
  }, [activeTab, reconciliationResults]);

  // Calculate counts
  const allCount = reconciliationResults.length;
  const reconciledCount = reconciliationResults.filter(
    (r) => r.isReconciled
  ).length;
  const unreconciledCount = reconciliationResults.filter(
    (r) => !r.isReconciled
  ).length;

  // Check if we have valid data
  if (selectedDocuments.length < 2) {
    return (
      <div className="bg-bg-light dark:bg-d-bg-light border border-border dark:border-d-border rounded-xl p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Circle className="w-16 h-16 text-text-tertiary dark:text-d-text-tertiary mb-4" />
          <h3 className="text-lg font-semibold text-text-primary dark:text-d-text-primary mb-2">
            Select Two Data Sources
          </h3>
          <p className="text-text-secondary dark:text-d-text-secondary max-w-md">
            Please select exactly two data sources from the Data Sources tab to
            begin reconciliation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Floating Tab Switcher - Sticky */}
      <div className="sticky top-0 z-10 bg-bg dark:bg-d-bg pb-4">
        <div className="flex justify-start">
          <div className="inline-flex bg-bg-light dark:bg-d-bg-light rounded-xl p-1 border border-border dark:border-d-border shadow-sm">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === "all"
                  ? "bg-bg-button dark:bg-d-bg-button text-text-inverted dark:text-d-text-inverted shadow-sm"
                  : "text-text-secondary dark:text-d-text-secondary hover:text-text-primary dark:hover:text-d-text-primary"
              }`}
            >
              <Circle className="w-4 h-4" />
              All Transactions
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === "all"
                    ? "bg-bg-light/20 dark:bg-d-bg-light/20"
                    : "bg-bg dark:bg-d-bg"
                }`}
              >
                {allCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("reconciled")}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === "reconciled"
                  ? "bg-bg-button dark:bg-d-bg-button text-text-inverted dark:text-d-text-inverted shadow-sm"
                  : "text-text-secondary dark:text-d-text-secondary hover:text-text-primary dark:hover:text-d-text-primary"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Reconciled
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === "reconciled"
                    ? "bg-bg-light/20 dark:bg-d-bg-light/20"
                    : "bg-success/10 text-success"
                }`}
              >
                {reconciledCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("unreconciled")}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === "unreconciled"
                  ? "bg-bg-button dark:bg-d-bg-button text-text-inverted dark:text-d-text-inverted shadow-sm"
                  : "text-text-secondary dark:text-d-text-secondary hover:text-text-primary dark:hover:text-d-text-primary"
              }`}
            >
              <XCircle className="w-4 h-4" />
              Unreconciled
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === "unreconciled"
                    ? "bg-bg-light/20 dark:bg-d-bg-light/20"
                    : "bg-danger/10 text-danger"
                }`}
              >
                {unreconciledCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-light dark:bg-d-bg-light border border-border dark:border-d-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary dark:text-d-text-secondary">
                Total
              </p>
              <p className="text-2xl font-bold text-text-primary dark:text-d-text-primary">
                {allCount}
              </p>
            </div>
            <Circle className="w-8 h-8 text-text-tertiary dark:text-d-text-tertiary" />
          </div>
        </div>

        <div className="bg-success/10 border border-success/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-success">Reconciled</p>
              <p className="text-2xl font-bold text-success">
                {reconciledCount}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
        </div>

        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-danger">Unreconciled</p>
              <p className="text-2xl font-bold text-danger">
                {unreconciledCount}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-danger" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isReconciling && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-d-primary"></div>
          <p className="ml-3 text-text-secondary dark:text-d-text-secondary">
            Reconciling transactions...
          </p>
        </div>
      )}

      {/* Split Table Layout */}
      {!isReconciling && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Document Table */}
          <div className="bg-bg-light dark:bg-d-bg-light border border-border dark:border-d-border rounded-xl overflow-hidden">
            <div className="bg-bg dark:bg-d-bg px-4 py-3 border-b border-border dark:border-d-border">
              <h3 className="font-semibold text-text-primary dark:text-d-text-primary">
                {selectedDocuments[0]?.documentName || "Document 1"}
              </h3>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] w-full">
              <table className="min-w-[800px] border-collapse">
                <thead className="sticky top-0 bg-bg dark:bg-d-bg">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-primary dark:text-d-text-primary border-b border-border dark:border-d-border">
                      Status
                    </th>
                    {leftHeaders.map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-3 text-left text-xs font-semibold text-text-primary dark:text-d-text-primary border-b border-border dark:border-d-border whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result, idx) => {
                    if (
                      !result.leftTransaction ||
                      Object.keys(result.leftTransaction).length <= 1
                    )
                      return null;

                    return (
                      <tr
                        key={idx}
                        onClick={() => {
                          if (!result.isReconciled)
                            setSelectedUnreconciled(result);
                        }}
                        className={`cursor-pointer transition-colors ${
                          result.isReconciled
                            ? "bg-success/5 hover:bg-success/10"
                            : "bg-danger/5 hover:bg-danger/10"
                        }`}
                      >
                        <td className="px-4 py-3 border-b border-border dark:border-d-border">
                          {result.isReconciled ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-danger" />
                          )}
                        </td>
                        {leftHeaders.map((header, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-4 py-3 text-sm text-text-secondary dark:text-d-text-secondary border-b border-border dark:border-d-border whitespace-nowrap"
                          >
                            {result.leftTransaction[header] !== null &&
                            result.leftTransaction[header] !== undefined
                              ? String(result.leftTransaction[header])
                              : "-"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Document Table */}
          <div className="bg-bg-light dark:bg-d-bg-light border border-border dark:border-d-border rounded-xl overflow-hidden">
            <div className="bg-bg dark:bg-d-bg px-4 py-3 border-b border-border dark:border-d-border">
              <h3 className="font-semibold text-text-primary dark:text-d-text-primary">
                {selectedDocuments[1]?.documentName || "Document 2"}
              </h3>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] w-full">
              <table className="min-w-[800px] border-collapse">
                <thead className="sticky top-0 bg-bg dark:bg-d-bg">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-primary dark:text-d-text-primary border-b border-border dark:border-d-border">
                      Status
                    </th>
                    {rightHeaders.map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-3 text-left text-xs font-semibold text-text-primary dark:text-d-text-primary border-b border-border dark:border-d-border whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result, idx) => {
                    if (
                      !result.rightTransaction ||
                      Object.keys(result.rightTransaction).length <= 1
                    )
                      return null;

                    return (
                      <tr
                        key={idx}
                        onClick={() => {
                          if (!result.isReconciled)
                            setSelectedUnreconciled(result);
                        }}
                        className={`cursor-pointer transition-colors ${
                          result.isReconciled
                            ? "bg-success/5 hover:bg-success/10"
                            : "bg-danger/5 hover:bg-danger/10"
                        }`}
                      >
                        <td className="px-4 py-3 border-b border-border dark:border-d-border">
                          {result.isReconciled ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-danger" />
                          )}
                        </td>
                        {rightHeaders.map((header, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-4 py-3 text-sm text-text-secondary dark:text-d-text-secondary border-b border-border dark:border-d-border whitespace-nowrap"
                          >
                            {String(result.rightTransaction?.[header] ?? "-")}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State for filtered results */}
      {!isReconciling && filteredResults.length === 0 && (
        <div className="bg-bg-light dark:bg-d-bg-light border border-border dark:border-d-border rounded-xl p-12 text-center">
          <p className="text-text-secondary dark:text-d-text-secondary">
            No {activeTab} transactions to display.
          </p>
        </div>
      )}
      {/* Slide-in Unreconciled Detail Panel */}
      {selectedUnreconciled && (
        <div
          className="fixed inset-0 bg-bg-navbar/60 dark:bg-d-bg-navbar/60 backdrop-blur-sm z-50 flex justify-end"
          onClick={() => setSelectedUnreconciled(null)}
        >
          <div
            className="w-full sm:w-[900px] h-full bg-bg-light dark:bg-d-bg-light shadow-2xl border-l border-border dark:border-d-border transform transition-transform duration-300 ease-in-out flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border dark:border-d-border bg-bg dark:bg-d-bg">
              <div>
                <h3 className="text-xl font-semibold text-text-primary dark:text-d-text-primary">
                  Unreconciled Entry Details
                </h3>
                <p className="text-sm text-text-secondary dark:text-d-text-secondary mt-1">
                  Review and resolve this unmatched transaction
                </p>
              </div>
              <button
                onClick={() => setSelectedUnreconciled(null)}
                className="p-2 hover:bg-bg-dark dark:hover:bg-d-bg-dark rounded-lg transition-colors text-text-secondary dark:text-d-text-secondary hover:text-text-primary dark:hover:text-d-text-primary"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Entry Summary Card */}
            <div className="p-6 bg-danger/5 border-b border-border dark:border-d-border">
              <div className="bg-bg-light dark:bg-d-bg-light rounded-xl border border-border dark:border-d-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-danger/10 rounded-lg">
                    <svg
                      className="w-5 h-5 text-danger"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-text-primary dark:text-d-text-primary">
                    Transaction Summary
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(selectedUnreconciled.leftTransaction || {})
                    .filter(([key]) => key !== "id")
                    .map(([key, value], idx) => (
                      <div
                        key={idx}
                        className="flex flex-col p-3 bg-bg dark:bg-d-bg rounded-lg"
                      >
                        <span className="text-xs font-medium text-text-tertiary dark:text-d-text-tertiary uppercase tracking-wide mb-1">
                          {key}
                        </span>
                        <span className="text-sm font-medium text-text-primary dark:text-d-text-primary truncate">
                          {String(value ?? "-")}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border dark:border-d-border bg-bg-light dark:bg-d-bg-light">
              <button
                onClick={() => setDetailTab("problem")}
                className={`flex-1 py-4 px-6 font-medium transition-all duration-200 relative ${
                  detailTab === "problem"
                    ? "text-primary dark:text-d-primary"
                    : "text-text-secondary dark:text-d-text-secondary hover:text-text-primary dark:hover:text-d-text-primary"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Problem
                </div>
                {detailTab === "problem" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-d-primary"></div>
                )}
              </button>
              <button
                onClick={() => setDetailTab("suggestion")}
                className={`flex-1 py-4 px-6 font-medium transition-all duration-200 relative ${
                  detailTab === "suggestion"
                    ? "text-primary dark:text-d-primary"
                    : "text-text-secondary dark:text-d-text-secondary hover:text-text-primary dark:hover:text-d-text-primary"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  Suggestions
                </div>
                {detailTab === "suggestion" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-d-primary"></div>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailTab === "problem" && (
                <div className="space-y-4">
                  <div className="bg-danger/5 border border-danger/20 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-danger/10 rounded-lg flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-danger"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-text-primary dark:text-d-text-primary mb-2">
                          Why This Transaction Failed to Match
                        </h4>
                        <p className="text-sm text-text-secondary dark:text-d-text-secondary leading-relaxed">
                          This transaction didn't match due to missing or
                          mismatched field values such as{" "}
                          <strong className="text-text-primary dark:text-d-text-primary">
                            amount
                          </strong>
                          ,{" "}
                          <strong className="text-text-primary dark:text-d-text-primary">
                            date
                          </strong>
                          , or{" "}
                          <strong className="text-text-primary dark:text-d-text-primary">
                            reference ID
                          </strong>
                          .
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-warning/5 border border-warning/20 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-warning/10 rounded-lg flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-warning"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-text-primary dark:text-d-text-primary mb-2">
                          Next Steps
                        </h4>
                        <p className="text-sm text-text-secondary dark:text-d-text-secondary leading-relaxed">
                          Try verifying both documents for consistency or
                          incomplete data. Check for formatting differences or
                          missing entries.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-info/5 border border-info/20 rounded-xl p-5">
                    <h4 className="font-semibold text-text-primary dark:text-d-text-primary mb-3">
                      Common Causes
                    </h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-text-secondary dark:text-d-text-secondary">
                        <span className="text-info mt-0.5">•</span>
                        <span>
                          Field values don't match exactly (case sensitivity,
                          spacing)
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-text-secondary dark:text-d-text-secondary">
                        <span className="text-info mt-0.5">•</span>
                        <span>
                          Date format inconsistencies between documents
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-text-secondary dark:text-d-text-secondary">
                        <span className="text-info mt-0.5">•</span>
                        <span>
                          Missing reference IDs or transaction identifiers
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-text-secondary dark:text-d-text-secondary">
                        <span className="text-info mt-0.5">•</span>
                        <span>Rounding differences in amount values</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {detailTab === "suggestion" && (
                <div className="space-y-4">
                  <div className="bg-success/5 border border-success/20 rounded-xl p-5">
                    <h4 className="font-semibold text-text-primary dark:text-d-text-primary mb-4 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-success"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Recommended Actions
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3 p-4 bg-bg-light dark:bg-d-bg-light rounded-lg border border-border dark:border-d-border">
                        <div className="p-2 bg-success/10 rounded-lg flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-success"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-text-primary dark:text-d-text-primary mb-1">
                            Check Similar Amounts
                          </h5>
                          <p className="text-sm text-text-secondary dark:text-d-text-secondary">
                            Look for transactions with slightly different
                            amounts due to rounding or currency conversion.
                          </p>
                        </div>
                      </li>

                      <li className="flex items-start gap-3 p-4 bg-bg-light dark:bg-d-bg-light rounded-lg border border-border dark:border-d-border">
                        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-text-primary dark:text-d-text-primary mb-1">
                            Review Date Formats
                          </h5>
                          <p className="text-sm text-text-secondary dark:text-d-text-secondary">
                            Verify date consistency. Mismatches may occur due to
                            different date format standards.
                          </p>
                        </div>
                      </li>

                      <li className="flex items-start gap-3 p-4 bg-bg-light dark:bg-d-bg-light rounded-lg border border-border dark:border-d-border">
                        <div className="p-2 bg-warning/10 rounded-lg flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-warning"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-text-primary dark:text-d-text-primary mb-1">
                            Verify Alternative Accounts
                          </h5>
                          <p className="text-sm text-text-secondary dark:text-d-text-secondary">
                            This entry might have been posted to a different
                            account or ledger.
                          </p>
                        </div>
                      </li>

                      <li className="flex items-start gap-3 p-4 bg-bg-light dark:bg-d-bg-light rounded-lg border border-border dark:border-d-border">
                        <div className="p-2 bg-info/10 rounded-lg flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-info"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-text-primary dark:text-d-text-primary mb-1">
                            Update Matching Rules
                          </h5>
                          <p className="text-sm text-text-secondary dark:text-d-text-secondary">
                            Retry reconciliation after adjusting your mapping
                            rules or field criteria.
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-bg dark:bg-d-bg border border-border dark:border-d-border rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-text-primary dark:text-d-text-primary mb-1">
                          Need More Help?
                        </h5>
                        <p className="text-sm text-text-secondary dark:text-d-text-secondary">
                          Contact support for advanced reconciliation assistance
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-primary dark:bg-d-primary text-text-inverted dark:text-d-text-inverted rounded-lg hover:opacity-90 transition-opacity text-sm font-medium">
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-bg dark:bg-d-bg border-t border-border dark:border-d-border">
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedUnreconciled(null)}
                  className="flex-1 px-4 py-2.5 bg-bg-light dark:bg-d-bg-light border border-border dark:border-d-border text-text-primary dark:text-d-text-primary rounded-lg hover:bg-bg-dark dark:hover:bg-d-bg-dark transition-colors font-medium"
                >
                  Close
                </button>
                <button className="flex-1 px-4 py-2.5 bg-bg-button dark:bg-d-bg-button text-text-inverted dark:text-d-text-inverted rounded-lg hover:opacity-90 transition-opacity font-medium">
                  Mark as Reviewed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReconcileScreen;
