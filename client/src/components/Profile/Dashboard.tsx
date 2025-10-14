import { type Profile } from "../../types/profileTypes";
import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  //   Legend,
  //   LineChart,
  //   Line,
  Area,
  AreaChart,
} from "recharts";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
} from "lucide-react";

interface DashboardProps {
  profile: Profile;
}

const Dashboard = ({ profile }: DashboardProps) => {
  const [animatedValues, setAnimatedValues] = useState({
    total: 0,
    reconciled: 0,
    pending: 0,
    discrepancy: 0,
  });

  const totalDocuments = profile.numberOfDocuments;
  const reconciledPercentage =
    totalDocuments > 0
      ? Math.round((profile.numberOfReconciledDocuments / totalDocuments) * 100)
      : 0;
  const pendingPercentage =
    totalDocuments > 0
      ? Math.round(
          (profile.numberOfUnReconciledDocuments / totalDocuments) * 100
        )
      : 0;
  const discrepancyPercentage =
    totalDocuments > 0
      ? Math.round(
          (profile.numberOfDiscrepancyDocuments / totalDocuments) * 100
        )
      : 0;

  // Animate numbers on mount
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedValues({
        total: Math.floor(profile.numberOfDocuments * progress),
        reconciled: Math.floor(profile.numberOfReconciledDocuments * progress),
        pending: Math.floor(profile.numberOfUnReconciledDocuments * progress),
        discrepancy: Math.floor(
          profile.numberOfDiscrepancyDocuments * progress
        ),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedValues({
          total: profile.numberOfDocuments,
          reconciled: profile.numberOfReconciledDocuments,
          pending: profile.numberOfUnReconciledDocuments,
          discrepancy: profile.numberOfDiscrepancyDocuments,
        });
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [profile]);

  const pieChartData = [
    {
      name: "Reconciled",
      value: profile.numberOfReconciledDocuments,
      color: "#33ae74",
      percentage: reconciledPercentage,
    },
    {
      name: "Pending",
      value: profile.numberOfUnReconciledDocuments,
      color: "#efbf45",
      percentage: pendingPercentage,
    },
    {
      name: "Discrepancy",
      value: profile.numberOfDiscrepancyDocuments,
      color: "#ff5b5b",
      percentage: discrepancyPercentage,
    },
  ];

  const barChartData = [
    {
      name: "Reconciled",
      count: profile.numberOfReconciledDocuments,
      fill: "#33ae74",
    },
    {
      name: "Pending",
      count: profile.numberOfUnReconciledDocuments,
      fill: "#efbf45",
    },
    {
      name: "Discrepancy",
      count: profile.numberOfDiscrepancyDocuments,
      fill: "#ff5b5b",
    },
  ];

  // Mock trend data for area chart
  const trendData = [
    { month: "Jan", reconciled: 45, pending: 30, discrepancy: 10 },
    { month: "Feb", reconciled: 52, pending: 28, discrepancy: 8 },
    { month: "Mar", reconciled: 61, pending: 25, discrepancy: 7 },
    { month: "Apr", reconciled: 70, pending: 20, discrepancy: 5 },
    { month: "May", reconciled: 75, pending: 18, discrepancy: 4 },
    {
      month: "Jun",
      reconciled: profile.numberOfReconciledDocuments,
      pending: profile.numberOfUnReconciledDocuments,
      discrepancy: profile.numberOfDiscrepancyDocuments,
    },
  ];

  const statCards = [
    {
      icon: FileText,
      label: "Total Documents",
      value: animatedValues.total,
      color: "bg-primary/10",
      iconColor: "text-primary dark:text-d-primary",
      trend: "+12%",
      trendUp: true,
    },
    {
      icon: CheckCircle,
      label: "Reconciled",
      value: animatedValues.reconciled,
      percentage: reconciledPercentage,
      color: "bg-success/10",
      iconColor: "text-success",
      trend: "+8%",
      trendUp: true,
    },
    {
      icon: Clock,
      label: "Pending",
      value: animatedValues.pending,
      percentage: pendingPercentage,
      color: "bg-warning/10",
      iconColor: "text-warning",
      trend: "-5%",
      trendUp: false,
    },
    {
      icon: AlertTriangle,
      label: "Discrepancy",
      value: animatedValues.discrepancy,
      percentage: discrepancyPercentage,
      color: "bg-danger/10",
      iconColor: "text-danger",
      trend: "-3%",
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="group bg-bg-light dark:bg-d-bg-light border border-border dark:border-d-border rounded-xl p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              style={{
                animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp
                    className={`w-4 h-4 ${
                      stat.trendUp ? "text-success" : "text-danger rotate-180"
                    }`}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      stat.trendUp ? "text-success" : "text-danger"
                    }`}
                  >
                    {stat.trend}
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-medium text-text-tertiary dark:text-d-text-tertiary mb-2">
                {stat.label}
              </h3>

              <div className="flex items-end justify-between">
                <p className="text-4xl font-bold text-text-primary dark:text-d-text-primary">
                  {stat.value.toLocaleString()}
                </p>
                {stat.percentage !== undefined && (
                  <span className="text-lg font-semibold text-text-secondary dark:text-d-text-secondary mb-1">
                    {stat.percentage}%
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {stat.percentage !== undefined && (
                <div className="mt-4 h-2 bg-bg-dark dark:bg-d-bg-dark rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${stat.percentage}%`,
                      backgroundColor:
                        stat.iconColor === "text-success"
                          ? "#33ae74"
                          : stat.iconColor === "text-warning"
                          ? "#efbf45"
                          : "#ff5b5b",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Circular Progress - Larger */}
        <div className="xl:col-span-1 bg-bg-light dark:bg-d-bg-light border border-border dark:border-d-border rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-text-primary dark:text-d-text-primary">
              Overall Progress
            </h3>
            <Activity className="w-5 h-5 text-text-tertiary dark:text-d-text-tertiary" />
          </div>

          <div className="flex items-center justify-center py-4">
            <div className="relative w-52 h-52">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="104"
                  cy="104"
                  r="95"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="none"
                  className="text-bg-dark dark:text-d-bg-dark"
                />
                {/* Progress circle */}
                <circle
                  cx="104"
                  cy="104"
                  r="95"
                  stroke="#57e4a1"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${reconciledPercentage * 5.97} 597`}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(87, 228, 161, 0.5))",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-text-primary dark:text-d-text-primary">
                  {reconciledPercentage}%
                </span>
                <span className="text-sm text-text-tertiary dark:text-d-text-tertiary mt-2">
                  Reconciled
                </span>
                <span className="text-xs text-text-tertiary dark:text-d-text-tertiary mt-1">
                  {profile.numberOfReconciledDocuments} of {totalDocuments} docs
                </span>
              </div>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-bg dark:bg-d-bg rounded-lg p-3 text-center">
              <p className="text-xs text-text-tertiary dark:text-d-text-tertiary mb-1">
                Pending
              </p>
              <p className="text-lg font-bold text-warning">
                {pendingPercentage}%
              </p>
            </div>
            <div className="bg-bg dark:bg-d-bg rounded-lg p-3 text-center">
              <p className="text-xs text-text-tertiary dark:text-d-text-tertiary mb-1">
                Issues
              </p>
              <p className="text-lg font-bold text-danger">
                {discrepancyPercentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="xl:col-span-2 bg-bg-light dark:bg-d-bg-light border border-border dark:border-d-border rounded-xl p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-text-primary dark:text-d-text-primary mb-6">
            Document Distribution
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="flex items-center justify-center w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      pieChartData.every((item) => item.value === 0)
                        ? [{ name: "No Data", value: 1, color: "#ffffff" }]
                        : pieChartData.filter((item) => item.value > 0)
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percentage }) =>
                      name === "No Data" ? "" : `${name}: ${percentage}%`
                    }
                  >
                    {(pieChartData.every((item) => item.value === 0)
                      ? [{ color: "#e0e0e0" }]
                      : pieChartData.filter((item) => item.value > 0)
                    ).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "none",
                      borderRadius: "8px",
                    }}
                    itemStyle={{
                      color: "#fff",
                    }}
                    labelStyle={{
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with detailed info */}
            <div className="flex flex-col justify-center space-y-4">
              {pieChartData.map((item, index) => (
                <div
                  key={index}
                  className="bg-bg dark:bg-d-bg rounded-lg p-4 hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: item.color,
                          boxShadow: `0 0 8px ${item.color}60`,
                        }}
                      />
                      <span className="font-semibold text-text-primary dark:text-d-text-primary">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-text-primary dark:text-d-text-primary">
                      {item.value}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 h-2 bg-bg-dark dark:bg-d-bg-dark rounded-full overflow-hidden mr-3">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-text-secondary dark:text-d-text-secondary">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trend Analysis and Bar Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Area Chart - Trends */}
        <div className="bg-bg-light dark:bg-d-bg-light border border-border dark:border-d-border rounded-xl p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-text-primary dark:text-d-text-primary mb-6">
            6-Month Reconciliation Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient
                  id="colorReconciled"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#33ae74" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#33ae74" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#efbf45" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#efbf45" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                stroke="#9b9b9b"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#9b9b9b" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="reconciled"
                stroke="#33ae74"
                fillOpacity={1}
                fill="url(#colorReconciled)"
                strokeWidth={3}
              />
              <Area
                type="monotone"
                dataKey="pending"
                stroke="#efbf45"
                fillOpacity={1}
                fill="url(#colorPending)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Comparison */}
        <div className="bg-bg-light dark:bg-d-bg-light border border-border dark:border-d-border rounded-xl p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-text-primary dark:text-d-text-primary mb-6">
            Status Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <XAxis
                dataKey="name"
                stroke="#9b9b9b"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#9b9b9b" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar
                dataKey="count"
                radius={[8, 8, 0, 0]}
                animationBegin={200}
                animationDuration={800}
              >
                {barChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    style={{
                      filter: `drop-shadow(0 4px 8px ${entry.fill}40)`,
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-gradient-to-r from-primary/10 via-bg-special-blue/10 to-bg-special-green/10 dark:from-d-primary/10 dark:via-d-bg-special-blue/10 dark:to-d-bg-special-green/10 border border-border dark:border-d-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary dark:text-d-text-primary mb-4">
          Quick Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-success/20 rounded-full mb-3">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <p className="text-2xl font-bold text-text-primary dark:text-d-text-primary mb-1">
              {reconciledPercentage}%
            </p>
            <p className="text-sm text-text-secondary dark:text-d-text-secondary">
              Successfully Reconciled
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-warning/20 rounded-full mb-3">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <p className="text-2xl font-bold text-text-primary dark:text-d-text-primary mb-1">
              {profile.numberOfUnReconciledDocuments}
            </p>
            <p className="text-sm text-text-secondary dark:text-d-text-secondary">
              Documents Awaiting Review
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-danger/20 rounded-full mb-3">
              <AlertTriangle className="w-6 h-6 text-danger" />
            </div>
            <p className="text-2xl font-bold text-text-primary dark:text-d-text-primary mb-1">
              {profile.numberOfDiscrepancyDocuments}
            </p>
            <p className="text-sm text-text-secondary dark:text-d-text-secondary">
              Discrepancies Detected
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
