import React, { useState } from "react";
import {
  Search,
  Users,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";

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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const BACKEND_URL = "https://cv-parser-backend-q0mn.onrender.com/parse_resume/";

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError("Please enter a search keyword");
      return;
    }

    setIsLoading(true);
    setError("");
    setHasSearched(true);
    setLastQuery(query);

    try {
      const response = await fetch(
        `${BACKEND_URL}/search/?q=${encodeURIComponent(query.trim())}`
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

  const generateHubSpotLink = (contactId: string): string => {
    // Generate HubSpot contact link using contact_id
    return `https://app.hubspot.com/contacts/146170484/contact/${contactId}`;
  };

  const highlightText = (
    text: string,
    searchQuery: string
  ): React.ReactNode => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(
      `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const normalizedResults =
    results.length > 0
      ? (() => {
          const rawScores = results.map((r) => r.score || 0);
          const maxScore = Math.max(...rawScores, 0);
          return results.map((r) => ({
            ...r,
            percent: maxScore > 0 ? Math.round((r.score / maxScore) * 100) : 0,
          }));
        })()
      : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            {/* <div className="bg-purple-600 p-2 rounded-lg">
              <Search className="w-6 h-6 text-white" />
            </div> */}
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
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Search Keywords
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Enter skills, job titles, or keywords (e.g., 'React developer', 'Python', 'marketing manager')"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-3 px-6 rounded-lg transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Search Candidates</span>
                </>
              )}
            </button>
          </form>
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
                      : `Found ${results.length} candidates for "${lastQuery}"`}
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
              ) : normalizedResults.length > 0 ? (
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
                    {normalizedResults.map((candidate, index) => (
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
                                  lastQuery
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
                              lastQuery
                            )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-purple-600 h-2 rounded-full"
                                  style={{ width: `${candidate.percent}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600">{candidate.percent}%</span>
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
                  <p className="text-gray-600 mb-4">
                    No candidates match your search for "{lastQuery}". Try
                    different keywords or check your spelling.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p className="mb-2">Search tips:</p>
                    <ul className="space-y-1">
                      <li>
                        • Try broader terms like "developer" instead of "senior
                        react developer"
                      </li>
                      <li>
                        • Use skill names like "Python", "JavaScript",
                        "Marketing"
                      </li>
                      <li>
                        • Search for job titles like "manager", "engineer",
                        "designer"
                      </li>
                    </ul>
                  </div>
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
