import { useProfileCreation } from "../../context/ProfileCreationContext";
import { useState } from "react";
import ProgressSidebar from "./common/ProgressSidebar";
import ProfileInfoStage from "./ProfileInfoStage";
import UploadDocumentsStage from "./UploadDocumentsStage";
import ExtractionRulesStage from "./ExtractionRulesStage";
import MatchingRulesStage from "./MatchingRulesStage";
import { X } from "lucide-react";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import { type MatchingRule } from "../../types/profileTypes";
import { createProfile } from "../../api/profileAPI";

const CreateProfileOverlay: React.FC<{
  onClose: () => void;
  onProfileCreated?: () => void;
}> = ({ onClose, onProfileCreated }) => {
  const [currentStage, setCurrentStage] = useState(1);
  const { data: profileData } = useProfileCreation();
  const handleFinish = async (rules: MatchingRule[]) => {
    try {
      const result = await createProfile(profileData, rules);
      console.log("✅ Profile saved:", result);
      showSuccessToast("Profile created successfully!");
      onProfileCreated?.();
      onClose();
    } catch (err) {
      console.error("❌ Error:", err);
      showErrorToast("Failed to create profile. Please try again.");
    }
  };

  const handleStageClick = (stage: number) => {
    if (stage <= currentStage) {
      setCurrentStage(stage);
    }
  };

  return (
    <div className="fixed inset-0 bg-text-primary/50 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-bg rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden">
        {/* Left Sidebar - 20% */}
        <div className="w-1/5 flex-shrink-0">
          <ProgressSidebar
            currentStage={currentStage}
            onStageClick={handleStageClick}
          />
        </div>

        {/* Right Content - 80% */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-bg-light">
            <h2 className="text-2xl font-bold text-text-primary">
              Create New Profile
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-text-secondary" />
            </button>
          </div>

          {/* Stage Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {currentStage === 1 && (
              <ProfileInfoStage onNext={() => setCurrentStage(2)} />
            )}
            {currentStage === 2 && (
              <UploadDocumentsStage
                onNext={() => setCurrentStage(3)}
                onBack={() => setCurrentStage(1)}
              />
            )}
            {currentStage === 3 && (
              <ExtractionRulesStage
                onNext={() => setCurrentStage(4)}
                onBack={() => setCurrentStage(2)}
              />
            )}
            {currentStage === 4 && (
              <MatchingRulesStage
                onFinish={handleFinish}
                onBack={() => setCurrentStage(3)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProfileOverlay;
