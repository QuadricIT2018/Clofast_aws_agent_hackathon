import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  CheckSquare,
  Square,
  AlertCircle,
  Layers,
  ArrowRight,
  GitCompare,
  FileText,
} from "lucide-react";
import { type Profile } from "../../types/profileTypes";
import { type MatchingRule } from "../../types/profileTypes";
import { fetchMatchingRules } from "../../api/matchingAPI";
import { useReconciliation } from "../../hooks/useReconciliation";
interface MatchingTermPair {
  term1: string;
  term2: string;
}
interface MatchingRulesProps {
  profile: Profile;
  // onProceedToReconciliation?: () => void;
}

const MatchingRules = ({
  profile,
}: // onProceedToReconciliation,
MatchingRulesProps) => {
  const { selectedMatchingRules, setSelectedMatchingRules } =
    useReconciliation();
  const [matchingRules, setMatchingRules] = useState<MatchingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadMatchingRules = async () => {
      try {
        setLoading(true);
        setError(null);

        const rules = await fetchMatchingRules(profile._id);
        setMatchingRules(rules);
      } catch (err) {
        console.error("Error fetching matching rules:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch matching rules"
        );
      } finally {
        setLoading(false);
      }
    };

    if (profile?._id) {
      loadMatchingRules();
    }
  }, [profile]);

  const toggleRuleSelection = (ruleId: string) => {
    setSelectedRules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId);
      } else {
        newSet.add(ruleId);
      }
      const selectedRuleSets = matchingRules.filter((rule) =>
        newSet.has(rule._id)
      );
      setSelectedMatchingRules(selectedRuleSets);
      return newSet;
    });
  };

  // const handleProceedToReconciliation = () => {
  //   if (selectedRules.size > 0) {
  //     // Store selected rules for reconciliation
  //     console.log("Selected rules:", Array.from(selectedRules));
  //     // onProceedToReconciliation?.();
  //   }
  // };

  const getRuleStatus = (rule: MatchingRule) => {
    // Consider a rule "active" if it has document pairs and matching criteria
    return rule.documentPairs.length > 0 && rule.rules.length > 0;
  };

  const formatRuleCriteria = (rules: MatchingTermPair[]) => {
    if (rules.length === 0) return "No criteria defined";
    if (rules.length === 1) {
      return `Match by ${rules[0].term1} ↔ ${rules[0].term2}`;
    }
    return `${rules.length} matching criteria`;
  };

  useEffect(() => {
    // When matchingRules are loaded or context changes, sync the local state
    if (matchingRules.length > 0 && selectedMatchingRules.length > 0) {
      const syncedSet = new Set(selectedMatchingRules.map((rule) => rule._id));
      setSelectedRules(syncedSet);
    }
  }, [matchingRules, selectedMatchingRules]);

  // Loading State
  if (loading) {
    return (
      <div className="w-full">
        <div className="bg-bg-light border border-border rounded-xl p-6">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-text-secondary text-sm">
              Fetching matching rules...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="w-full">
        <div className="bg-bg-light border border-border rounded-xl p-6">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-danger/10 rounded-full mb-4">
              <XCircle className="w-12 h-12 text-danger" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Error Loading Matching Rules
            </h3>
            <p className="text-text-secondary max-w-md mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (matchingRules.length === 0) {
    return (
      <div className="w-full">
        <div className="bg-bg-light border border-border rounded-xl p-6">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-bg rounded-full mb-4">
              <Layers className="w-12 h-12 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No Matching Rules Found
            </h3>
            <p className="text-text-secondary max-w-md">
              No matching rules found for this profile. Create one to start
              reconciling your data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Info Banner */}
      <div className="bg-info/10 border border-info rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-info mb-1">
              Select Matching Rules
            </p>
            <p className="text-sm text-text-secondary">
              Choose at least one matching rule to proceed with reconciliation.
              You can select multiple rules to apply different matching
              criteria.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matchingRules.map((rule) => {
          const isSelected = selectedRules.has(rule._id);
          const isActive = getRuleStatus(rule);

          return (
            <div
              key={rule._id}
              className={`group relative bg-bg-light border rounded-xl p-5 transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-text-tertiary"
              }`}
            >
              {/* Selection Checkbox */}
              <button
                onClick={() => toggleRuleSelection(rule._id)}
                className="absolute top-4 right-4 transition-opacity"
              >
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5 text-text-tertiary hover:text-primary" />
                )}
              </button>

              {/* Header */}
              <div className="flex items-start gap-3 mb-4 pr-8">
                <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                  <GitCompare className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-text-primary truncate mb-1">
                    {rule.matchingRuleName}
                  </h4>
                  {rule.matchingRuleDescription && (
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {rule.matchingRuleDescription}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-3">
                {isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/30">
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/30">
                    <AlertCircle className="w-3 h-3" />
                    Inactive
                  </span>
                )}
              </div>

              {/* Matching Criteria */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <FileText className="w-4 h-4 text-text-tertiary" />
                  <span>{formatRuleCriteria(rule.rules)}</span>
                </div>
                {rule.rules.length > 0 && (
                  <div className="ml-6 space-y-1">
                    {rule.rules.slice(0, 2).map((pair, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-text-tertiary flex items-center gap-1"
                      >
                        <span className="px-1.5 py-0.5 bg-bg rounded font-mono">
                          {pair.term1}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="px-1.5 py-0.5 bg-bg rounded font-mono">
                          {pair.term2}
                        </span>
                      </div>
                    ))}
                    {rule.rules.length > 2 && (
                      <div className="text-xs text-text-tertiary">
                        +{rule.rules.length - 2} more criteria
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Document Pairs Info */}
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-text-secondary">
                  {rule.documentPairs.length} document pair
                  {rule.documentPairs.length !== 1 ? "s" : ""} configured
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with Selection Summary and Proceed Button */}
      {/* <div className="bg-bg-light border border-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                selectedRules.size > 0
                  ? "bg-success/10 text-success"
                  : "bg-bg text-text-tertiary"
              }`}
            >
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-text-primary">
                {selectedRules.size} rule{selectedRules.size !== 1 ? "s" : ""}{" "}
                selected
              </p>
              <p className="text-sm text-text-secondary">
                {selectedRules.size === 0
                  ? "Select at least one matching rule to proceed"
                  : "Ready to proceed with reconciliation"}
              </p>
            </div>
          </div>

          <button
            onClick={handleProceedToReconciliation}
            disabled={selectedRules.size === 0}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              selectedRules.size > 0
                ? "bg-bg-button text-text-inverted hover:opacity-90 shadow-sm"
                : "bg-bg-dark text-text-tertiary cursor-not-allowed"
            }`}
          >
            Proceed to Reconciliation
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div> */}
    </div>
  );
};

export default MatchingRules;
