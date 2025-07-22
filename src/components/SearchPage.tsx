import React, { useState } from "react";
import {
  Search,
  Users,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import MultiSelectSearch from "./MultiSelectSearch";

interface SearchResult {
  contact_id: string;
  name: string;
  email: string;
  job_title: string;
  extracted_text: string;
  score: number;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
}

const SearchPage: React.FC = () => {
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState<"or" | "and">("or");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchTerms, setLastSearchTerms] = useState<string[]>([]);

  const BACKEND_URL = "http://localhost:8000"; // FastAPI server URL

  const handleSearch = async (
    terms: string[],
    mode: "or" | "and" = searchMode
  ) => {
    if (terms.length === 0) {
      setError("Please add at least one search keyword");
      return;
    }

    setIsLoading(true);
    setError("");
    setHasSearched(true);
    setLastSearchTerms(terms);
    setSearchTerms(terms);

    try {
      const queryParams = new URLSearchParams();
      terms.forEach((term) => queryParams.append("keywords", term));
      queryParams.append("mode", mode);

      const response = await fetch(
        `${BACKEND_URL}/search/?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: SearchResponse = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Search failed. Please try again."
      );
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermsChange = (terms: string[]) => {
    setSearchTerms(terms);
    // Clear error when terms change
    if (error && terms.length > 0) {
      setError("");
    }
  };

  const handleSearchModeChange = (mode: "or" | "and") => {
    setSearchMode(mode);
  };
  const generateHubSpotLink = (contactId: string): string => {
    // Generate HubSpot contact link using contact_id
    return `https://app.hubspot.com/contacts/your-hub-id/contact/${contactId}`;
  };

  const highlightText = (
    text: string,
    searchTerms: string[]
  ): React.ReactNode => {
    if (searchTerms.length === 0) return text;

    // Create regex pattern for all search terms
    const escapedTerms = searchTerms.map((term) =>
      term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      escapedTerms.some((term) => new RegExp(term, "gi").test(part)) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Search Candidates
              </h2>
              <p className="text-gray-600 mt-1">
                Find candidates by skills, experience, job titles, or any
                keyword from their resumes
              </p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <MultiSelectSearch
            onSearch={handleSearch}
            onTermsChange={handleTermsChange}
            isLoading={isLoading}
            placeholder="Type keywords like 'React', 'Python', 'Manager' and press Enter..."
          />

          {/* Search Mode Radio Buttons */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Search Mode
            </label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="searchMode"
                  value="or"
                  checked={searchMode === "or"}
                  onChange={() => handleSearchModeChange("or")}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 focus:ring-2"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">
                  <span className="font-medium">Any Match</span>
                  <span className="text-gray-500 ml-1">(OR)</span>
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="searchMode"
                  value="and"
                  checked={searchMode === "and"}
                  onChange={() => handleSearchModeChange("and")}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 focus:ring-2"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">
                  <span className="font-medium">All Match</span>
                  <span className="text-gray-500 ml-1">(AND)</span>
                </span>
              </label>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <p>
                <span className="font-medium">Any Match:</span> Find candidates
                with at least one of the keywords
              </p>
              <p>
                <span className="font-medium">All Match:</span> Find candidates
                with all keywords present
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 mt-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Search Results
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isLoading
                      ? "Searching..."
                      : lastSearchTerms.length > 0
                      ? `Found ${
                          results.length
                        } candidates for "${lastSearchTerms.join(", ")}"`
                      : "Enter keywords and click Search to find candidates"}
                  </p>
                </div>
                {results.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{results.length} results</span>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Searching candidates...</p>
                  </div>
                </div>
              ) : results.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Match Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((candidate, index) => (
                      <tr
                        key={candidate.contact_id || index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-medium text-sm">
                                {candidate.name
                                  ? candidate.name.charAt(0).toUpperCase()
                                  : "N"}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {highlightText(
                                  candidate.name || "N/A",
                                  lastSearchTerms
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {candidate.contact_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {candidate.email || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {highlightText(
                              candidate.job_title || "N/A",
                              lastSearchTerms
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (candidate.score || 0) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {((candidate.score || 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <a
                            href={generateHubSpotLink(candidate.contact_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-purple-600 hover:text-purple-900 transition-colors"
                          >
                            <span>View in HubSpot</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : hasSearched && !isLoading ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No candidates found
                  </h3>
                 
                    
                  
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchPage;
