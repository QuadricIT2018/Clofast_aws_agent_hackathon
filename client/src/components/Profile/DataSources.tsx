import { type Profile } from "../../types/profileTypes";

interface DataSourcesProps {
  profile: Profile;
}

const DataSources = ({ profile }: DataSourcesProps) => {
  return (
    <div className="bg-bg-light dark:bg-d-bg-light border border-border dark:border-d-border rounded-lg p-6">
      <h2 className="text-xl font-semibold text-text-primary dark:text-d-text-primary mb-4">
        Data Sources
      </h2>
      <p className="text-text-secondary dark:text-d-text-secondary">
        Data sources for {profile.profileName} will be displayed here.
      </p>
    </div>
  );
};

export default DataSources;
