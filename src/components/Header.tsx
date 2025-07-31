import React from "react";
import { Users, FileText, LogOut, Search } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Header: React.FC = () => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-3">
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = "upload";
              }} 
              className="flex items-center space-x-3 cursor-pointer">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CV-Parser</h1>
                <p className="text-sm text-gray-600">
                  Candidate Management System
                </p>
              </div>
            </a>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = "search";
              }}
              className={`font-medium flex items-center space-x-1 transition-colors ${
                window.location.hash === "#search"
                  ? "text-blue-800"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search Candidates</span>
            </a>
            {/* <a
              href="#"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="text-blue-600 font-medium flex items-center space-x-1"
            >
              <FileText className="w-4 h-4" />
              <span>Upload Resumes</span>
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Candidates
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Reports
            </a> */}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <span className="text-sm text-gray-600">Welcome, </span>
              <span className="text-sm font-medium text-gray-900">
                {user?.username}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
