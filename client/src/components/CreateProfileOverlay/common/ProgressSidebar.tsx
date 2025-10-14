import { FileText, Upload, CheckCircle, Check, File } from "lucide-react";
const ProgressSidebar: React.FC<{
  currentStage: number;
  onStageClick: (stage: number) => void;
}> = ({ currentStage, onStageClick }) => {
  const stages = [
    { id: 1, name: "Basic Info", icon: FileText },
    { id: 2, name: "Upload Documents", icon: Upload },
    { id: 3, name: "Extraction Rules", icon: File },
    { id: 4, name: "Matching Rules", icon: CheckCircle },
  ];

  return (
    <div className="w-full h-full bg-bg-light border-r border-border p-6">
      <h3 className="text-lg font-bold text-text-primary mb-6">
        Creation Journey
      </h3>
      <div className="space-y-2">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isActive = stage.id === currentStage;
          const isCompleted = stage.id < currentStage;

          return (
            <button
              key={stage.id}
              onClick={() => onStageClick(stage.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-text-inverted ${
                isActive
                  ? "bg-primary"
                  : isCompleted
                  ? "bg-success bg-opacity-10 hover:bg-opacity-20"
                  : "text-text-secondary hover:bg-bg"
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive
                    ? "bg-text-inverted bg-opacity-20"
                    : isCompleted
                    ? "bg-text-inverted bg-opacity-20"
                    : "bg-bg"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-text-primary" />
                ) : (
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-text-primary" : "text-text-tertiary"
                    }`}
                  />
                )}
              </div>
              <span className="font-medium text-sm">{stage.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressSidebar;
