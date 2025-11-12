import { useState } from "react";
import { useProfileCreation } from "../../context/ProfileCreationContext";
const ProfileInfoStage: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { data, updateData } = useProfileCreation();
  const [name, setName] = useState(data.profileName);
  const [description, setDescription] = useState(data.profileDescription);

  const handleNext = () => {
    if (!name.trim()) {
      alert("Please enter a profile name");
      return;
    }
    updateData({ profileName: name, profileDescription: description });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Basic Information
        </h2>
        <p className="text-text-secondary">
          Enter the basic details for your profile
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Profile Name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter profile name"
          className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Profile Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter profile description"
          rows={4}
          className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-bg-button text-text-inverted rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProfileInfoStage;
