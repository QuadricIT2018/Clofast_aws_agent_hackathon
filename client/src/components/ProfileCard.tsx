import { type Profile } from "../types/profileTypes";
import {
  Play,
  Edit2,
  Trash2,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";

const ProfileCard: React.FC<{
  profile: Profile;
  viewMode: "grid" | "list";
  onRun: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ profile, viewMode, onRun, onEdit, onDelete }) => {
  const isListView = viewMode === "list";

  return (
    <div
      className={`bg-bg-light border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${
        isListView ? "p-6" : "p-5"
      }`}
    >
      {/* Header */}
      <div
        className={`flex ${
          isListView ? "items-center" : "flex-col"
        } justify-between`}
      >
        <div className={isListView ? "flex-1" : "w-full mb-3"}>
          <h3 className="text-lg font-bold text-text-primary mb-1">
            {profile.profileName}
          </h3>
          <p className="text-sm text-text-secondary line-clamp-2">
            {profile.profileDescription}
          </p>
        </div>

        {/* Stats Grid */}
        <div
          className={`grid ${isListView ? "grid-cols-4" : "grid-cols-2"} gap-3`}
        >
          {/* Total Documents */}
          <div className="bg-bg rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs text-text-tertiary font-medium">
                Total Docs
              </span>
            </div>
            <p className="text-xl font-bold text-text-primary">
              {profile.numberOfDocuments}
            </p>
          </div>

          {/* Reconciled Documents */}
          <div className="bg-bg rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-xs text-text-tertiary font-medium">
                Reconciled
              </span>
            </div>
            <p className="text-xl font-bold text-success">
              {profile.numberOfReconciledDocuments}
            </p>
          </div>

          {/* Unreconciled Documents */}
          <div className="bg-bg rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-warning" />
              <span className="text-xs text-text-tertiary font-medium">
                Pending
              </span>
            </div>
            <p className="text-xl font-bold text-warning">
              {profile.numberOfUnReconciledDocuments}
            </p>
          </div>

          {/* Discrepancy Documents */}
          <div className="bg-bg rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-danger" />
              <span className="text-xs text-text-tertiary font-medium">
                Discrepancy
              </span>
            </div>
            <p className="text-xl font-bold text-danger">
              {profile.numberOfDiscrepancyDocuments}
            </p>
          </div>
        </div>
      </div>
      {/* Action Row */}
      <div className="flex items-center justify-between mt-4">
        {/* Left - Edit & Delete */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(profile._id)}
            className="p-1 hover:text-primary/70 text-primary transition-all duration-200 "
            title="Edit Profile"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(profile._id)}
            className="p-1 hover:text-danger/70 text-danger transition-all duration-200"
            title="Delete Profile"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Right - Run Button */}
        <button
          onClick={() => onRun(profile._id)}
          className="flex items-center gap-2 px-4 py-2 bg-bg-button hover:bg-bg-button/80 text-text-inverted font-medium rounded-lg transition-all duration-200 shadow-sm"
          title="Run Profile"
        >
          <Play className="w-4 h-4" fill="currentColor" />
          Run
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;
