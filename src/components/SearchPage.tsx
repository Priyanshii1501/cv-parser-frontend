import React, { useState, useEffect } from 'react';
import { Search, Users, ExternalLink, AlertCircle, Loader2, Plus, Check, ChevronDown, X } from 'lucide-react';
import MultiSelectSearch from './MultiSelectSearch';

interface SearchResult {
  contact_id: string;
  name: string;
  email: string;
  job_title: string;
  full_text: string;
  skills: string;
  matched_keywords: string[];
}

interface SearchResponse {
  keywords: string[];
  mode: string;
  results: SearchResult[];
}

interface HubSpotList {
  listId: string;
  name: string;
}

interface HubSpotListsResponse {
  results: HubSpotList[];
  paging?: {
    next?: {
      after: string;
    };
  };
}

const SearchPage: React.FC = () => {
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState<'or' | 'and'>('or');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchTerms, setLastSearchTerms] = useState<string[]>([]);
  
  // HubSpot Lists state
  const [hubspotLists, setHubspotLists] = useState<HubSpotList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [listsError, setListsError] = useState('');
  
  // Add to list modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'create' | 'existing'>('create');
  const [newListName, setNewListName] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');

  const BACKEND_URL = 'http://127.0.0.1:8000'; // FastAPI server URL

  // Load HubSpot lists on component mount
  useEffect(() => {
    loadHubSpotLists();
  }, []);

  const loadHubSpotLists = async () => {
    setIsLoadingLists(true);
    setListsError('');
    
    try {
      const response = await fetch(`${BACKEND_URL}/hubspot/lists/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processingTypes: ['MANUAL', 'DYNAMIC'],
          limit: 100
        }),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to load lists: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data.lists)
      setHubspotLists(data.lists || []);
    } catch (err) {
      let errorMessage = 'Failed to load HubSpot lists';
      
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = `Cannot connect to backend server at ${BACKEND_URL}. Please ensure the backend server is running.`;
        } else if (err.name === 'TimeoutError') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setListsError(errorMessage);
      console.error('Error loading HubSpot lists:', err);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const handleSearch = async (terms: string[], mode: 'or' | 'and' = searchMode) => {
    if (terms.length === 0) {
      setError('Please add at least one search keyword');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setHasSearched(true);
    setLastSearchTerms(terms);
    setSearchTerms(terms);
    setSelectedResults(new Set()); // Clear selections on new search

    try {
      const queryParams = new URLSearchParams();
      terms.forEach((term) => queryParams.append('keywords', term));
      queryParams.append('mode', mode);

      const response = await fetch(`${BACKEND_URL}/search/?${queryParams.toString()}`, {
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(15000) // 15 second timeout for search
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: SearchResponse = await response.json();
      setResults(data.results || []);
    } catch (err) {
      let errorMessage = 'Search failed. Please try again.';
      
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = `Cannot connect to backend server at ${BACKEND_URL}. Please ensure the backend server is running.`;
        } else if (err.name === 'TimeoutError') {
          errorMessage = 'Search request timed out. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermsChange = (terms: string[]) => {
    setSearchTerms(terms);
    if (error && terms.length > 0) {
      setError('');
    }
  };

  const handleSearchModeChange = (mode: 'or' | 'and') => {
    setSearchMode(mode);
  };

  const handleSelectResult = (contactId: string) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedResults(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedResults.size === results.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(results.map(r => r.contact_id)));
    }
  };

  const createNewList = async () => {
    debugger
    const trimmedName = newListName.trim();

    if (!trimmedName) {
      setError('Please enter a list name');
      return;
    }

    const nameExists = hubspotLists?.some(
      (list) => list.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameExists) {
      setError('A list with this name already exists. Please choose a unique name.');
      return;
    }

    setIsAddingToList(true);
    setError('');

    try {
      // Create the list
      const createResponse = await fetch(`${BACKEND_URL}/hubspot/lists/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newListName.trim()
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to create list: ${createResponse.statusText}`);
      }

      const listData = await createResponse.json();
      console.log('List created:', listData);
      const listId = listData.listId;

      if (!listId) {
        throw new Error('Failed to get list ID from created list');
      }

      // Add contacts to the new list
      const contactIds = Array.from(selectedResults);
      const addResponse = await fetch(`${BACKEND_URL}/hubspot/lists/${listId}/add_contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_ids: contactIds
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!addResponse.ok) {
        const errorData = await addResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to add contacts to list: ${addResponse.statusText}`);
      }

      const addResult = await addResponse.json();
      
      setAddSuccess(`Successfully created list "${newListName}" and added ${addResult.num_added} contacts`);
      setShowAddModal(false);
      setNewListName('');
      setSelectedResults(new Set());
      
      // Refresh the lists
      await loadHubSpotLists();

    } catch (err) {
      let errorMessage = 'Failed to create list and add contacts';
      
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = `Cannot connect to backend server. Please ensure the backend server is running at ${BACKEND_URL}.`;
        } else if (err.name === 'TimeoutError') {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsAddingToList(false);
    }
  };

  const addToExistingList = async () => {
    if (!selectedListId) {
      setError('Please select a list');
      return;
    }

    setIsAddingToList(true);
    setError('');

    try {
      const contactIds = Array.from(selectedResults);
      const response = await fetch(`${BACKEND_URL}/hubspot/lists/${selectedListId}/add_contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_ids: contactIds
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to add contacts to list: ${response.statusText}`);
      }

      const result = await response.json();
      const selectedList = hubspotLists.find(list => list.listId === selectedListId);

      setAddSuccess(`Successfully added ${result.num_added} contacts to "${selectedList?.name || 'selected list'}"`);
      setShowAddModal(false);
      setSelectedListId('');
      setSelectedResults(new Set());

    } catch (err) {
      let errorMessage = 'Failed to add contacts to list';
      
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = `Cannot connect to backend server. Please ensure the backend server is running at ${BACKEND_URL}.`;
        } else if (err.name === 'TimeoutError') {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsAddingToList(false);
    }
  };

  const generateHubSpotLink = (contactId: string): string => {
    return `https://app.hubspot.com/contacts/your-hub-id/contact/${contactId}`;
  };

  const highlightText = (text: string, searchTerms: string[]): React.ReactNode => {
    if (searchTerms.length === 0) return text;
    
    const escapedTerms = searchTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      escapedTerms.some(term => new RegExp(term, 'gi').test(part)) ? (
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
              <h2 className="text-3xl font-bold text-gray-900">Search Candidates</h2>
              <p className="text-gray-600 mt-1">
                Find candidates by skills, experience, job titles, or any keyword from their resumes
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {addSuccess && (
          <div className="mb-6 flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
            <Check className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{addSuccess}</span>
            <button
              onClick={() => setAddSuccess('')}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
                  checked={searchMode === 'or'}
                  onChange={() => handleSearchModeChange('or')}
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
                  checked={searchMode === 'and'}
                  onChange={() => handleSearchModeChange('and')}
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
                <span className="font-medium">Any Match:</span> Find candidates with at least one of the keywords
              </p>
              <p>
                <span className="font-medium">All Match:</span> Find candidates with all keywords present
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
                  <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isLoading ? 'Searching...' : 
                     lastSearchTerms.length > 0 ? `Found ${results.length} candidates for "${lastSearchTerms.join(', ')}"` :
                     'Enter keywords and click Search to find candidates'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {results.length > 0 && (
                    <>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{results.length} results</span>
                      </div>
                      {selectedResults.size > 0 && (
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add to HubSpot ({selectedResults.size})</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
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
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedResults.size === results.length && results.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </th>
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
                        Matched Keywords
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((candidate, index) => (
                      <tr key={candidate.contact_id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedResults.has(candidate.contact_id)}
                            onChange={() => handleSelectResult(candidate.contact_id)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-medium text-sm">
                                {candidate.name ? candidate.name.charAt(0).toUpperCase() : 'N'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {highlightText(candidate.name || 'N/A', lastSearchTerms)}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {candidate.contact_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {candidate.email || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {highlightText(candidate.job_title || 'N/A', lastSearchTerms)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {candidate.matched_keywords && candidate.matched_keywords.length > 0 ? (
                              candidate.matched_keywords.map((keyword, keywordIndex) => (
                                <span
                                  key={keywordIndex}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                >
                                  {keyword}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">No matches</span>
                            )}
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                  <p className="text-gray-600 mb-4">
                    No candidates match your search for "{lastSearchTerms.join(', ')}". Try different keywords or check your spelling.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p className="mb-2">Search tips:</p>
                    <ul className="space-y-1">
                      <li>• Add multiple keywords like "React" + "Developer"</li>
                      <li>• Use broader terms like "developer" instead of specific titles</li>
                      <li>• Try skill names like "Python", "JavaScript", "Marketing"</li>
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Add to HubSpot Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Add {selectedResults.size} Candidates to HubSpot
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setError('');
                    setNewListName('');
                    setSelectedListId('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Selection */}
              <div className="mb-6">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setAddMode('create')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      addMode === 'create'
                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    Create New List
                  </button>
                  <button
                    onClick={() => setAddMode('existing')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      addMode === 'existing'
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    Add to Existing List
                  </button>
                </div>
              </div>

              {/* Create New List Form */}
              {addMode === 'create' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    List Name
                  </label>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter list name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    disabled={isAddingToList}
                  />
                </div>
              )}

              {/* Existing Lists Selection */}
              {addMode === 'existing' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select List
                  </label>
                  {isLoadingLists ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="ml-2 text-sm text-gray-600">Loading lists...</span>
                    </div>
                  ) : listsError ? (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                      {listsError}
                      <div className="mt-2">
                        <button
                          onClick={loadHubSpotLists}
                          className="text-red-700 hover:text-red-900 underline text-sm font-medium"
                        >
                          Retry Loading Lists
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                      {hubspotLists.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No lists found
                        </div>
                      ) : (
                        hubspotLists.map((list) => (
                          <button
                            key={list.listId}
                            onClick={() => setSelectedListId(list.listId)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                              selectedListId === list.listId
                                ? 'bg-blue-50 text-blue-800 font-medium'
                                : 'text-gray-700'
                            }`}
                            disabled={isAddingToList}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{list.name}</span>
                              {selectedListId === list.listId && (
                                <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 mb-4">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setError('');
                    setNewListName('');
                    setSelectedListId('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  disabled={isAddingToList}
                >
                  Cancel
                </button>
                <button
                  onClick={addMode === 'create' ? createNewList : addToExistingList}
                  disabled={
                    isAddingToList ||
                    (addMode === 'create' && !newListName.trim()) ||
                    (addMode === 'existing' && !selectedListId)
                  }
                  className={`flex-1 px-4 py-2 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                    addMode === 'create'
                      ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400 focus:ring-green-500'
                      : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 focus:ring-blue-500'
                  }`}
                >
                  {isAddingToList ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>
                      {addMode === 'create' ? 'Create & Add to HubSpot' : 'Add to HubSpot'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchPage;