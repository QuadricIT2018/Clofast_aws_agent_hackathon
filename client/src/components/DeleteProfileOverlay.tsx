import { X } from "lucide-react";

interface DeleteProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  profileName?: string;
}

const DeleteProfileOverlay: React.FC<DeleteProfileOverlayProps> = ({
  isOpen,
  onClose,
  onConfirm,
  profileName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-bg-light rounded-xl shadow-lg p-6 w-[90%] max-w-md relative">
        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-text-tertiary hover:text-text-primary"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Delete Profile?
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          This will permanently delete{" "}
          <span className="font-semibold text-text-primary">
            {profileName || "this profile"}
          </span>{" "}
          and all related:
        </p>

        <ul className="list-disc list-inside text-sm text-text-tertiary mb-4 space-y-1">
          <li>Documents linked to this profile</li>
          <li>Extraction rules</li>
          <li>Matching rules</li>
        </ul>

        <p className="text-danger text-sm font-medium mb-4">
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-bg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium bg-danger text-white rounded-lg hover:bg-danger/80 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProfileOverlay;
