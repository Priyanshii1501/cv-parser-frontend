import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/LoginPage";
import Header from "./components/Header";
import FileUpload from "./components/FileUpload";
import StatsCard from "./components/StatsCard";
import { FileText, Users, Clock, CheckCircle } from "lucide-react";

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Upload Candidate Resumes
          </h2>
          <p className="text-gray-600 mt-2">
            Upload and manage candidate resume files. Supported formats include
            PDF and DOCX.
          </p>
        </div>

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Resumes"
            value="1,247"
            icon={FileText}
            description="All time uploads"
            color="blue"
          />
          <StatsCard
            title="Active Candidates"
            value="892"
            icon={Users}
            description="In review process"
            color="green"
          />
          <StatsCard
            title="Pending Review"
            value="156"
            icon={Clock}
            description="Awaiting screening"
            color="orange"
          />
          <StatsCard
            title="Processed Today"
            value="23"
            icon={CheckCircle}
            description="Completed reviews"
            color="purple"
          />
        </div> */}

        {/* Upload Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Upload New Resumes
            </h3>
            <p className="text-gray-600">
              Drag and drop multiple resume files or click to browse. Files will
              be automatically processed and candidates will be added to your
              database.
            </p>
          </div>

          <FileUpload />
        </div>

        {/* Recent Activity */}
        {/* <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {[
              {
                name: "Sarah Johnson - Frontend Developer.pdf",
                time: "2 minutes ago",
                status: "Processed",
              },
              {
                name: "Michael Chen - UX Designer.docx",
                time: "15 minutes ago",
                status: "Under Review",
              },
              {
                name: "Emily Rodriguez - Marketing Manager.pdf",
                time: "1 hour ago",
                status: "Processed",
              },
              {
                name: "David Kim - Data Scientist.pdf",
                time: "2 hours ago",
                status: "Processed",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.name}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    activity.status === "Processed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div> */}
      </main>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
