import React, { useState, KeyboardEvent, useRef } from 'react';
import { X, Search } from 'lucide-react';

interface MultiSelectSearchProps {
  onSearch: (terms: string[]) => void;
  onTermsChange: (terms: string[]) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const MultiSelectSearch: React.FC<MultiSelectSearchProps> = ({
  onSearch,
  onTermsChange,
  isLoading = false,
  placeholder = "Type keywords and press Enter to add..."
}) => {
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSearchTerm();
    } else if (e.key === 'Backspace' && currentInput === '' && searchTerms.length > 0) {
      // Remove last term if input is empty and backspace is pressed
      removeSearchTerm(searchTerms.length - 1);
    }
  };

  const addSearchTerm = () => {
    const trimmedInput = currentInput.trim();
    if (trimmedInput && !searchTerms.includes(trimmedInput)) {
      const newTerms = [...searchTerms, trimmedInput];
      setSearchTerms(newTerms);
      setCurrentInput('');
      
      // Notify parent of terms change but don't trigger search
      onTermsChange(newTerms);
    }
  };

  const removeSearchTerm = (index: number) => {
    const newTerms = searchTerms.filter((_, i) => i !== index);
    setSearchTerms(newTerms);
    
    // Notify parent of terms change but don't trigger search
    onTermsChange(newTerms);
  };

  const clearAllTerms = () => {
    setSearchTerms([]);
    setCurrentInput('');
    onTermsChange([]);
  };

  const handleSearch = () => {
    onSearch(searchTerms);
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Search Keywords
      </label>
      
      <div
        onClick={handleContainerClick}
        className={`min-h-[48px] w-full border border-gray-300 rounded-lg px-3 py-2 bg-white cursor-text transition-colors ${
          isLoading ? 'opacity-50' : 'hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Terms Tags */}
          {searchTerms.map((term, index) => (
            <div
              key={index}
              className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
            >
              <span>{term}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSearchTerm(index);
                }}
                className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                disabled={isLoading}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchTerms.length === 0 ? placeholder : "Add more keywords..."}
            className="flex-1 min-w-[200px] outline-none bg-transparent text-gray-900 placeholder-gray-500"
            disabled={isLoading}
          />
          
          {/* Clear All Button */}
          {searchTerms.length > 0 && (
            <button
              type="button"
              onClick={clearAllTerms}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              disabled={isLoading}
              title="Clear all search terms"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Search Info */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">Press Enter to add keywords</span>
          {searchTerms.length > 0 && (
            <span className="text-sm text-blue-600 font-medium">
              {searchTerms.length} keyword{searchTerms.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        
        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={searchTerms.length === 0 || isLoading}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-4 py-2 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Search</span>
            </>
          )}
        </button>
      </div>
      
      {/* Search Tips */}
      {searchTerms.length === 0 && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2 font-medium">Search Tips:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Type keywords like "React", "Python", "Manager" and press Enter</li>
            <li>• Add multiple terms to refine your search</li>
            <li>• Click the Search button to find candidates</li>
            <li>• Use job titles, skills, or any relevant keywords</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelectSearch;