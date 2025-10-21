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
    <div className="w-full h-full bg-bg-light border-r border-border p-6 overflow-y-auto">
      <h3 className="text-lg font-bold text-text-primary mb-2">
        Creation Journey
      </h3>
      <div className="flex flex-col items-center py-2">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = stage.id === currentStage;
          const isCompleted = stage.id < currentStage;
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.id} className="flex flex-col items-center">
              <button
                onClick={() => onStageClick(stage.id)}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? "bg-primary"
                      : isCompleted
                      ? "bg-success bg-opacity-10 hover:bg-opacity-20"
                      : "bg-bg hover:bg-bg-dark"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive
                        ? "bg-text-inverted bg-opacity-20"
                        : isCompleted
                        ? "bg-text-inverted bg-opacity-20"
                        : "bg-bg-light"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Icon
                        className={`w-4 h-4 ${
                          isActive
                            ? "text-text-secondary"
                            : "text-text-tertiary"
                        }`}
                      />
                    )}
                  </div>
                </div>
                <span
                  className={`font-medium text-sm text-center max-w-[120px] ${
                    isActive
                      ? "text-text-primary"
                      : isCompleted
                      ? "text-success"
                      : "text-text-secondary"
                  }`}
                >
                  {stage.name}
                </span>
              </button>
              {!isLast && (
                <div className="flex flex-col items-center my-2">
                  <div
                    className={`w-0.5 h-4 ${
                      isCompleted ? "bg-success" : "bg-border"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressSidebar;
