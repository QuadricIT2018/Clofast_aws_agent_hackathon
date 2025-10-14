import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { type Profile } from "../types/profileTypes";
import { fetchProfileById } from "../api/profileAPI";
import Dashboard from "../components/Profile/Dashboard";
import DataSources from "../components/Profile/DataSources";
import MatchingRules from "../components/Profile/MatchingRules";
import ReconcileScreen from "../components/Profile/ReconcileScreen";

type TabType =
  | "dashboard"
  | "dataSources"
  | "matchingRules"
  | "reconcileScreen";

const ProfileDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        if (id) {
          const data = await fetchProfileById(id);
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Failed to load profile details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [id]);

  const handleRunReconciliation = () => {
    // TODO: Implement reconciliation trigger logic
    console.log("Run reconciliation for profile:", profile?._id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg dark:bg-d-bg">
        <div className="text-text-secondary dark:text-d-text-secondary">
          Loading profile...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg dark:bg-d-bg">
        <div className="text-danger">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg dark:bg-d-bg">
        <div className="text-text-secondary dark:text-d-text-secondary">
          No profile found.
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "dataSources", label: "Data Sources" },
    { id: "matchingRules", label: "Matching Rules" },
    { id: "reconcileScreen", label: "Reconcile Screen" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard profile={profile} />;
      case "dataSources":
        return <DataSources profile={profile} />;
      case "matchingRules":
        return <MatchingRules profile={profile} />;
      case "reconcileScreen":
        return <ReconcileScreen profile={profile} />;
      default:
        return <Dashboard profile={profile} />;
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header Section */}
      <div className="bg-bg-light  border-b border-border ">
        <div className="px-6 py-6">
          <div className="flex items-start justify-between">
            {/* Left Side - Profile Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-text-primary  mb-2">
                {profile.profileName}
              </h1>
              <p className="text-text-secondary text-base max-w-3xl">
                {profile.profileDescription}
              </p>
            </div>

            {/* Right Side - Run Button */}
            <div className="ml-6">
              <button
                onClick={handleRunReconciliation}
                className="px-6 py-2.5 bg-bg-button  text-text-inverted  rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Run
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-1 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                  activeTab === tab.id
                    ? "text-primary "
                    : "text-text-secondary  hover:text-text-primary"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">{renderTabContent()}</div>
    </div>
  );
};

export default ProfileDetailsPage;
