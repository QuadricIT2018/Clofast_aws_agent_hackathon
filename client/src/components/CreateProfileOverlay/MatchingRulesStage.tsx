import { useProfileCreation } from "../../context/ProfileCreationContext";
import { useState } from "react";
import { type MatchingRule } from "../../types/profileTypes";
import { ChevronRight, Trash } from "lucide-react";
const MatchingRulesStage: React.FC<{
  onFinish: () => void;
  onBack: () => void;
}> = ({ onFinish, onBack }) => {
  const { data, updateData } = useProfileCreation();
  const [rules, setRules] = useState<MatchingRule[]>(data.matchingRules);
  const [showForm, setShowForm] = useState(false);
  const [currentRule, setCurrentRule] = useState<Partial<MatchingRule>>({
    matchingRuleName: "",
    matchingRuleDescription: "",
    documentPairs: [],
    rules: [],
  });

  const availableTerms = data.extractionRules.flatMap((rule) => rule.terms);

  const handleAddTermPair = () => {
    setCurrentRule({
      ...currentRule,
      rules: [...(currentRule.rules || []), { term1: "", term2: "" }],
    });
  };

  const handleUpdateTermPair = (
    index: number,
    field: "term1" | "term2",
    value: string
  ) => {
    const newRules = [...(currentRule.rules || [])];
    newRules[index] = { ...newRules[index], [field]: value };
    setCurrentRule({ ...currentRule, rules: newRules });
  };

  const handleRemoveTermPair = (index: number) => {
    setCurrentRule({
      ...currentRule,
      rules: (currentRule.rules || []).filter((_, i) => i !== index),
    });
  };

  const handleSaveRule = () => {
    if (!currentRule.matchingRuleName?.trim()) {
      alert("Please provide rule name");
      return;
    }
    if ((currentRule.rules?.length || 0) === 0) {
      alert("Please add at least one term pair");
      return;
    }

    const newRule: MatchingRule = {
      _id: `match_${Date.now()}`,
      matchingRuleName: currentRule.matchingRuleName,
      matchingRuleDescription: currentRule.matchingRuleDescription || "",
      documentPairs: [],
      rules: currentRule.rules || [],
    };

    setRules([...rules, newRule]);
    setCurrentRule({
      matchingRuleName: "",
      matchingRuleDescription: "",
      documentPairs: [],
      rules: [],
    });

    setShowForm(false);
  };

  const handleFinish = async () => {
    if (rules.length === 0) {
      alert("Please create at least one matching rule");
      return;
    }

    updateData({ matchingRules: rules });

    // Simulate API call to create profile
    const profileData = {
      profileName: data.profileName,
      profileDescription: data.profileDescription,
      documents: data.documents.map((d) => d._id),
      extractionRules: data.extractionRules.map((r) => r._id),
      matchingRules: rules.map((r) => r._id),
    };

    console.log("Creating profile:", profileData);
    alert("Profile created successfully!");
    onFinish();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Matching Rules
          </h2>
          <p className="text-text-secondary">
            Define how terms from different documents match
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:opacity-90"
          >
            + Add Matching Rule
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-bg-light border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-text-primary">New Matching Rule</h3>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Rule Name *
            </label>
            <input
              type="text"
              value={currentRule.matchingRuleName}
              onChange={(e) =>
                setCurrentRule({
                  ...currentRule,
                  matchingRuleName: e.target.value,
                })
              }
              placeholder="e.g., Invoice to Payment Match"
              className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <input
              type="text"
              value={currentRule.matchingRuleDescription}
              onChange={(e) =>
                setCurrentRule({
                  ...currentRule,
                  matchingRuleDescription: e.target.value,
                })
              }
              placeholder="Describe this matching rule"
              className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text-primary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-text-primary">
                Term Pairs *
              </label>
              <button
                onClick={handleAddTermPair}
                className="text-sm text-primary hover:underline"
              >
                + Add Pair
              </button>
            </div>
            <div className="space-y-3">
              {(currentRule.rules || []).map((pair, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={pair.term1}
                    onChange={(e) =>
                      handleUpdateTermPair(idx, "term1", e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-bg border border-border rounded-lg text-text-primary text-sm"
                  >
                    <option value="">Select term 1</option>
                    {availableTerms.map((term, i) => (
                      <option key={i} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-4 h-4 text-text-tertiary" />
                  <select
                    value={pair.term2}
                    onChange={(e) =>
                      handleUpdateTermPair(idx, "term2", e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-bg border border-border rounded-lg text-text-primary text-sm"
                  >
                    <option value="">Select term 2</option>
                    {availableTerms.map((term, i) => (
                      <option key={i} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemoveTermPair(idx)}
                    className="p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded-lg"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveRule}
              className="px-4 py-2 bg-success text-text-inverted rounded-lg hover:opacity-90"
            >
              Save Rule
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-bg border border-border text-text-primary rounded-lg hover:bg-bg-dark"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {rules.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-text-primary">
            Created Matching Rules ({rules.length})
          </h3>
          {rules.map((rule) => (
            <div
              key={rule._id}
              className="bg-bg-light border border-border rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-text-primary">
                    {rule.matchingRuleName}
                  </h4>
                  {rule.matchingRuleDescription && (
                    <p className="text-sm text-text-secondary mt-1">
                      {rule.matchingRuleDescription}
                    </p>
                  )}
                </div>
                <button
                  onClick={() =>
                    setRules(rules.filter((r) => r._id !== rule._id))
                  }
                  className="p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded-lg"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {rule.rules.map((pair, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-bg text-text-secondary rounded">
                      {pair.term1}
                    </span>
                    <ChevronRight className="w-4 h-4 text-text-tertiary" />
                    <span className="px-2 py-1 bg-bg text-text-secondary rounded">
                      {pair.term2}
                    </span>
                  </div>
                ))}
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
          onClick={handleFinish}
          className="px-6 py-3 bg-success text-text-inverted rounded-xl font-semibold hover:opacity-90"
        >
          Create Profile
        </button>
      </div>
    </div>
  );
};

export default MatchingRulesStage;
