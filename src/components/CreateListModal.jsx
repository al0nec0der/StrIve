import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createList } from '../util/listsSlice';

const CreateListModal = ({ isOpen, onClose, userId }) => {
  const [listName, setListName] = useState('');
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.lists.customLists);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!listName.trim()) return; // Don't submit if the name is empty

    try {
      await dispatch(createList({ userId, listData: { name: listName } })).unwrap();
      setListName(''); // Clear the input
      onClose(); // Close the modal on success
    } catch (err) {
      // Error is already handled by the Redux store
      console.error('Failed to create list:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Create New List</h2>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            Error: {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="listName" className="block text-sm font-medium text-gray-700 mb-1">
              List Name
            </label>
            <input
              type="text"
              id="listName"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter list name"
              disabled={status === 'loading'}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={status === 'loading'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'loading' || !listName.trim()}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                status === 'loading' || !listName.trim()
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {status === 'loading' ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListModal;