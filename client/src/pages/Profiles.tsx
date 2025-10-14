import React from "react";
import { Search, Grid, List, Plus } from "lucide-react";
import ProfileCard from "../components/ProfileCard";
import { type Profile } from "../types/profileTypes";
import { useState } from "react";
import CreateProfileOverlay from "../components/CreateProfileOverlay/CreateProfileOverlay";
import { ProfileCreationProvider } from "../context/ProfileCreationProvider";
const Profiles: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Sample profile data - replace with API call
  const [profiles] = useState<Profile[]>([
    {
      _id: "1",
      profileName: "Q1 2024 Sales Reconciliation",
      profileDescription:
        "Reconciliation of sales data for Q1 2024 including all POS transactions and invoices",
      numberOfDocuments: 245,
      numberOfUnReconciledDocuments: 28,
      numberOfReconciledDocuments: 205,
      numberOfDiscrepancyDocuments: 12,
    },
    {
      _id: "2",
      profileName: "Monthly Payment Processing",
      profileDescription:
        "Monthly reconciliation of payment records with bank statements",
      numberOfDocuments: 156,
      numberOfUnReconciledDocuments: 15,
      numberOfReconciledDocuments: 138,
      numberOfDiscrepancyDocuments: 3,
    },
    {
      _id: "3",
      profileName: "Vendor Invoice Matching",
      profileDescription:
        "Automated matching of vendor invoices with purchase orders",
      numberOfDocuments: 89,
      numberOfUnReconciledDocuments: 12,
      numberOfReconciledDocuments: 74,
      numberOfDiscrepancyDocuments: 3,
    },
    {
      _id: "4",
      profileName: "Annual Tax Documents",
      profileDescription:
        "Year-end tax document reconciliation and verification process",
      numberOfDocuments: 412,
      numberOfUnReconciledDocuments: 45,
      numberOfReconciledDocuments: 350,
      numberOfDiscrepancyDocuments: 17,
    },
    {
      _id: "5",
      profileName: "Expense Report Validation",
      profileDescription:
        "Employee expense report validation against receipts and policies",
      numberOfDocuments: 178,
      numberOfUnReconciledDocuments: 22,
      numberOfReconciledDocuments: 149,
      numberOfDiscrepancyDocuments: 7,
    },
    {
      _id: "6",
      profileName: "Inventory Reconciliation",
      profileDescription:
        "Monthly inventory count reconciliation with system records",
      numberOfDocuments: 203,
      numberOfUnReconciledDocuments: 31,
      numberOfReconciledDocuments: 165,
      numberOfDiscrepancyDocuments: 7,
    },
  ]);

  // Filter profiles based on search query
  const filteredProfiles = profiles.filter(
    (profile) =>
      profile.profileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.profileDescription
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Action handlers
  const handleRun = (id: string) => {
    console.log("Running profile:", id);
    alert(`Starting reconciliation for profile: ${id}`);
  };

  const handleEdit = (id: string) => {
    console.log("Editing profile:", id);
    alert(`Edit profile: ${id}`);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this profile?")) {
      console.log("Deleting profile:", id);
      alert(`Profile deleted: ${id}`);
    }
  };

  const handleCreateProfile = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-1 text-text-primary">Profiles</h1>
        <p className="text-text-secondary  opacity-80">
          Manage your reconciliation profiles
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search profiles by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-bg-light border border-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* View Toggle & Create Button */}
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-bg-light border border-border rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-primary text-text-inverted"
                    : "text-text-secondary hover:text-text-primary"
                }`}
                title="Grid View"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-primary text-text-inverted"
                    : "text-text-secondary hover:text-text-primary"
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Create Profile Button */}
            <button
              onClick={handleCreateProfile}
              className="flex items-center gap-2 px-6 py-3 bg-bg-button text-text-inverted rounded-xl font-semibold hover:opacity-90 transition-opacity duration-200 shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Create Profile</span>
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-text-secondary text-sm">
            Showing{" "}
            <span className="font-semibold text-text-primary">
              {filteredProfiles.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-text-primary">
              {profiles.length}
            </span>{" "}
            profiles
          </p>
        </div>

        {/* Profiles Grid/List */}
        {filteredProfiles.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredProfiles.map((profile) => (
              <ProfileCard
                key={profile._id}
                profile={profile}
                viewMode={viewMode}
                onRun={handleRun}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-bg-light rounded-full border border-border mb-4">
              <Search className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No profiles found
            </h3>
            <p className="text-text-secondary">
              Try adjusting your search criteria or create a new profile
            </p>
          </div>
        )}
      </div>
      {showCreateModal && (
        <ProfileCreationProvider>
          <CreateProfileOverlay onClose={() => setShowCreateModal(false)} />
        </ProfileCreationProvider>
      )}
    </div>
  );
};

export default Profiles;
