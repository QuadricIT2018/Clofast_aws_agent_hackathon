import React from "react";
import {
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  Activity,
} from "lucide-react";

const Dashboard: React.FC = () => {
  // Sample data - replace with actual data from your backend
  const stats = {
    totalProfiles: 1247,
    reconciledProfiles: 1089,
    unreconciledProfiles: 158,
    reconciliationRate: 87.3,
    avgProcessingTime: "2.4 min",
    activeProcessing: 12,
  };

  const recentActivity = [
    {
      id: 1,
      name: "Invoice_2024_Q1.pdf",
      status: "completed",
      time: "2 min ago",
    },
    {
      id: 2,
      name: "Payment_Records_March.xlsx",
      status: "completed",
      time: "5 min ago",
    },
    {
      id: 3,
      name: "POS_Transaction_Log.csv",
      status: "processing",
      time: "8 min ago",
    },
    {
      id: 4,
      name: "Monthly_Statement_Apr.pdf",
      status: "failed",
      time: "12 min ago",
    },
    {
      id: 5,
      name: "Sales_Report_Q2.xlsx",
      status: "completed",
      time: "15 min ago",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success";
      case "processing":
        return "bg-info";
      case "failed":
        return "bg-danger";
      default:
        return "bg-text-tertiary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Reconciled";
      case "processing":
        return "Processing";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-1 text-text-primary">
          Clofast Dashboard
        </h1>
        <p className="text-text-tertiary opacity-80">
          AI-Powered POS Reconciliation System
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Profiles Card */}
          <div className="bg-bg-light rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-primary bg-opacity-10 rounded-xl">
                <FileText className="w-6 h-6 text-text-inverted" />
              </div>
              <span className="text-sm text-text-tertiary">Total</span>
            </div>
            <h3 className="text-4xl font-bold text-text-primary mb-2">
              {stats.totalProfiles.toLocaleString()}
            </h3>
            <p className="text-text-secondary text-sm">Total Profiles</p>
          </div>

          {/* Reconciled Profiles Card */}
          <div className="bg-bg-light rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-success bg-opacity-10 rounded-xl">
                <CheckCircle className="w-6 h-6 text-text-inverted" />
              </div>
              <span className="text-sm text-text-tertiary">Completed</span>
            </div>
            <h3 className="text-4xl font-bold text-success mb-2">
              {stats.reconciledProfiles.toLocaleString()}
            </h3>
            <p className="text-text-secondary text-sm">Reconciled Profiles</p>
          </div>

          {/* Unreconciled Profiles Card */}
          <div className="bg-bg-light rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-warning bg-opacity-10 rounded-xl">
                <AlertCircle className="w-6 h-6 text-text-inverted" />
              </div>
              <span className="text-sm text-text-tertiary">Pending</span>
            </div>
            <h3 className="text-4xl font-bold text-warning mb-2">
              {stats.unreconciledProfiles.toLocaleString()}
            </h3>
            <p className="text-text-secondary text-sm">Unreconciled Profiles</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Reconciliation Rate */}
          <div className="bg-bg-light rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-progress-green" />
              <span className="text-text-secondary text-sm font-medium">
                Reconciliation Rate
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-text-primary">
                {stats.reconciliationRate}%
              </span>
            </div>
            <div className="mt-4 w-full bg-bg-dark rounded-full h-2">
              <div
                className="bg-progress-green h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.reconciliationRate}%` }}
              />
            </div>
          </div>

          {/* Average Processing Time */}
          <div className="bg-bg-light rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-info" />
              <span className="text-text-secondary text-sm font-medium">
                Avg Processing Time
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-text-primary">
                {stats.avgProcessingTime}
              </span>
            </div>
            <p className="text-text-tertiary text-xs mt-2">
              Per profile reconciliation
            </p>
          </div>

          {/* Active Processing */}
          <div className="bg-bg-light rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-5 h-5 text-bg-special-blue" />
              <span className="text-text-secondary text-sm font-medium">
                Active Processing
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-text-primary">
                {stats.activeProcessing}
              </span>
              <span className="text-text-tertiary text-sm mb-1">profiles</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-info rounded-full animate-pulse" />
              <span className="text-text-tertiary text-xs">
                Processing in real-time
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-bg-light rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-text-primary mb-6">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-bg rounded-xl hover:bg-bg-dark transition-colors duration-200"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-bg-light rounded-lg">
                    <FileText className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-primary font-medium">
                      {activity.name}
                    </p>
                    <p className="text-text-tertiary text-sm">
                      {activity.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium text-text-inverted ${getStatusColor(
                      activity.status
                    )}`}
                  >
                    {getStatusText(activity.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <button className="px-8 py-4 bg-bg-button text-text-inverted rounded-xl font-semibold hover:opacity-90 transition-opacity duration-200 shadow-lg">
            Start New Reconciliation
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
