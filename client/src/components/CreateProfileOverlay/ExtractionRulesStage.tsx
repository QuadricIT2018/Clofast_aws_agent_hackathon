import { useProfileCreation } from "../../context/ProfileCreationContext";
import { useState } from "react";
import { type ExtractionRule } from "../../types/profileTypes";
import { X, Trash, FileText } from "lucide-react";
import {
  showSuccessToast,
  showInfoToast,
  showErrorToast,
} from "../../utils/toast";

const ExtractionRulesStage: React.FC<{
  onNext: () => void;
  onBack: () => void;
}> = ({ onNext, onBack }) => {
  const { data, updateData } = useProfileCreation();
  const [rules, setRules] = useState<ExtractionRule[]>(data.extractionRules);
  const [showForm, setShowForm] = useState(false);
  const [termInput, setTermInput] = useState("");
  const [currentRule, setCurrentRule] = useState<Partial<ExtractionRule>>({
    extractionRuleName: "",
    extractionRuleDescription: "",
    terms: [],
    documentIds: [],
  });

  // Stage control: 1 = Rule creation, 2 = Document assignment
  const [stage, setStage] = useState(1);

  const handleAddTerm = () => {
    if (termInput.trim()) {
      // Split by commas, trim spaces, and remove duplicates or empty entries
      const newTerms = termInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Merge with existing terms, remove duplicates
      const updatedTerms = Array.from(
        new Set([...(currentRule.terms || []), ...newTerms])
      );

      setCurrentRule({
        ...currentRule,
        terms: updatedTerms,
      });

      setTermInput("");
    }
  };

  const handleRemoveTerm = (term: string) => {
    setCurrentRule({
      ...currentRule,
      terms: (currentRule.terms || []).filter((t) => t !== term),
    });
  };

  const handleSaveRule = () => {
    if (
      !currentRule.extractionRuleName?.trim() ||
      (currentRule.terms?.length || 0) === 0
    ) {
      showErrorToast("Please provide a rule name and at least one term");

      return;
    }

    const newRule: ExtractionRule = {
      _id: `rule_${Date.now()}`,
      extractionRuleName: currentRule.extractionRuleName,
      extractionRuleDescription: currentRule.extractionRuleDescription || "",
      terms: currentRule.terms || [],
      documentIds: currentRule.documentIds || [],
    };

    setRules([...rules, newRule]);
    setCurrentRule({
      extractionRuleName: "",
      extractionRuleDescription: "",
      terms: [],
      documentIds: [],
    });
    setShowForm(false);
    showSuccessToast("Rule created successfully");
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r._id !== id));
    showInfoToast("Rule deleted");
  };

  const handleNextStage = () => {
    if (rules.length === 0) {
      showErrorToast("Please create at least one extraction rule");

      return;
    }
    setStage(2);
  };

  const handleDocumentAssignmentChange = (
    ruleId: string,
    docId: string,
    checked: boolean
  ) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule._id === ruleId
          ? {
              ...rule,
              documentIds: checked
                ? [...rule.documentIds, docId]
                : rule.documentIds.filter((d) => d !== docId),
            }
          : rule
      )
    );
  };

  const handleNext = () => {
    updateData({ extractionRules: rules });
    showSuccessToast("Extraction setup completed");
    onNext();
  };

  // --------------------------------------------------------------------
  // STAGE 1: RULE CREATION
  // --------------------------------------------------------------------
  if (stage === 1)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Extraction Rules
            </h2>
            <p className="text-text-secondary">
              Define rules to extract data from documents
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:opacity-90 transition-opacity"
            >
              + Add Rule
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-bg-light border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-text-primary">
              New Extraction Rule
            </h3>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Rule Name <span className="text-danger text-lg">*</span>
              </label>
              <input
                type="text"
                value={currentRule.extractionRuleName}
                onChange={(e) =>
                  setCurrentRule({
                    ...currentRule,
                    extractionRuleName: e.target.value,
                  })
                }
                placeholder="e.g., Invoice Number"
                className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Description
              </label>
              <input
                type="text"
                value={currentRule.extractionRuleDescription}
                onChange={(e) =>
                  setCurrentRule({
                    ...currentRule,
                    extractionRuleDescription: e.target.value,
                  })
                }
                placeholder="Describe this rule"
                className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary">
                Terms <span className="text-danger text-lg">*</span>
              </label>
              <p className="text-xs text-text-secondary mb-2">
                You can add multiple terms by separating them with commas (,)
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTerm()}
                  placeholder="Add a term"
                  className="flex-1 px-4 py-2 bg-bg border border-border rounded-lg text-text-primary"
                />
                <button
                  onClick={handleAddTerm}
                  className="px-4 py-2 bg-bg-button text-text-inverted rounded-lg hover:opacity-90"
                >
                  Add
                </button>
              </div>
              {(currentRule.terms?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentRule.terms?.map((term, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1  bg-opacity-10 text-text-primary border border-border-dark rounded-full text-sm"
                    >
                      {term}
                      <button
                        onClick={() => handleRemoveTerm(term)}
                        className="hover:text-danger"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-bg border border-border text-text-primary rounded-lg hover:bg-bg-dark"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                className="px-4 py-2 bg-bg-button text-text-inverted rounded-lg hover:opacity-90"
              >
                Save Rule
              </button>
            </div>
          </div>
        )}

        {rules.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">
              Created Rules ({rules.length})
            </h3>
            {rules.map((rule) => (
              <div
                key={rule._id}
                className="bg-bg-light border border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-text-primary">
                      {rule.extractionRuleName}
                    </h4>
                    {rule.extractionRuleDescription && (
                      <p className="text-sm text-text-secondary mt-1">
                        {rule.extractionRuleDescription}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {rule.terms.map((term, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-bg text-text-secondary rounded text-xs"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule._id)}
                    className="p-2 text-danger  hover:text-danger/70 rounded-lg"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-bg border border-border text-text-primary rounded-xl font-semibold hover:bg-bg-dark"
          >
            Back
          </button>
          <button
            onClick={handleNextStage}
            className="px-6 py-3 bg-bg-button text-text-inverted rounded-xl font-semibold hover:opacity-90"
          >
            Next
          </button>
        </div>
      </div>
    );

  // --------------------------------------------------------------------
  // STAGE 2: DOCUMENT ASSIGNMENT
  // --------------------------------------------------------------------
  // --------------------------------------------------------------------
  // STAGE 2: DOCUMENT ASSIGNMENT
  // --------------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Document Assignment
        </h2>
        <p className="text-text-secondary">
          Assign one or more extraction rules to each uploaded document.
        </p>
      </div>

      {/* Document List */}
      {data.documents.length === 0 ? (
        <p className="text-text-secondary italic">
          No documents uploaded yet. Please upload documents before assignment.
        </p>
      ) : (
        <div className="space-y-5">
          {data.documents.map((doc) => (
            <div
              key={doc._id}
              className="bg-bg-light border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Document Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-semibold text-text-primary text-lg">
                      {doc.documentName}
                    </h4>
                    <p className="text-xs text-text-tertiary">
                      Select which rules should apply to this document
                    </p>
                  </div>
                </div>
                <span className="text-sm text-text-tertiary">
                  {rules.filter((r) => r.documentIds.includes(doc._id)).length}{" "}
                  / {rules.length} rules assigned
                </span>
              </div>

              {/* Rules Multi-select Grid */}
              {rules.length === 0 ? (
                <p className="text-text-secondary text-sm italic">
                  No extraction rules created yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {rules.map((rule) => {
                    const isChecked = rule.documentIds.includes(doc._id);
                    return (
                      <label
                        key={rule._id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          isChecked
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            handleDocumentAssignmentChange(
                              rule._id,
                              doc._id,
                              e.target.checked
                            )
                          }
                          className="accent-primary w-4 h-4"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-text-primary block">
                            {rule.extractionRuleName}
                          </span>
                          {rule.extractionRuleDescription && (
                            <span className="text-xs text-text-secondary">
                              {rule.extractionRuleDescription}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-border">
        <button
          onClick={() => setStage(1)}
          className="px-6 py-3 bg-bg border border-border text-text-primary rounded-xl font-semibold hover:bg-bg-dark"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-bg-button text-text-inverted rounded-xl font-semibold hover:opacity-90"
        >
          Finish
        </button>
      </div>
    </div>
  );
};

export default ExtractionRulesStage;
