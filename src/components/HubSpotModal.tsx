import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface HubSpotList {
  listId: string;
  name: string;
}

interface HubSpotModalProps {
  mode: 'create' | 'existing';
  selectedCount: number;
  hubspotLists: HubSpotList[];
  isLoadingLists: boolean;
  onSubmit: (data: { listName?: string; selectedListId?: string }) => void;
  onClose: () => void;
}

const HubSpotModal: React.FC<HubSpotModalProps> = ({
  mode,
  selectedCount,
  hubspotLists,
  isLoadingLists,
  onSubmit,
  onClose,
}) => {
  const [listName, setListName] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when mode changes
  useEffect(() => {
    setListName('');
    setSelectedListId('');
  }, [mode]);

  const isFormValid = () => {
    if (selectedCount === 0) return false;
    
    if (mode === 'create') {
      return listName.trim().length > 0;
    } else {
      return selectedListId.length > 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        listName: mode === 'create' ? listName.trim() : undefined,
        selectedListId: mode === 'existing' ? selectedListId : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Create New List' : 'Add to Existing List'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">{selectedCount}</span> contact{selectedCount !== 1 ? 's' : ''} selected
              </p>
            </div>

            {mode === 'create' ? (
              <div>
                <label htmlFor="listName" className="block text-sm font-medium text-gray-700 mb-2">
                  List Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="listName"
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="Enter list name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  disabled={isSubmitting}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a descriptive name for your new HubSpot list
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="existingList" className="block text-sm font-medium text-gray-700 mb-2">
                  Select List <span className="text-red-500">*</span>
                </label>
                {isLoadingLists ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-600">Loading lists...</span>
                  </div>
                ) : hubspotLists.length > 0 ? (
                  <select
                    id="existingList"
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    disabled={isSubmitting}
                    autoFocus
                  >
                    <option value="">Choose a list...</option>
                    {hubspotLists.map((list) => (
                      <option key={list.listId} value={list.listId}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-600 mb-2">No lists available</p>
                    <p className="text-xs text-gray-500">
                      Create your first list or check your HubSpot connection
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Contacts will be added to the selected list
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-lg transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Add to HubSpot</span>
              )}
            </button>
          </div>
        </form>

        {/* Footer Info */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <p className="text-xs text-gray-600">
            {mode === 'create' 
              ? 'A new list will be created in HubSpot with the selected contacts.'
              : 'Selected contacts will be added to the chosen existing list.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default HubSpotModal;