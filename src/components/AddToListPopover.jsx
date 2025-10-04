import React from 'react';
import { useSelector } from 'react-redux';

const AddToListPopover = ({ onSelectList, onCreateNew }) => {
  const { watchlist, customLists } = useSelector((state) => state.lists);

  return (
    <div className="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border border-gray-200">
      <div className="py-1">
        {/* Watchlist as first option */}
        <button
          onClick={() => onSelectList('watchlist', 'watchlist')}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Watchlist
        </button>
        
        {/* Separator */}
        <div className="border-t border-gray-200 my-1"></div>
        
        {/* Custom Lists */}
        {customLists.lists && customLists.lists.length > 0 ? (
          customLists.lists.map((list) => (
            <button
              key={list.id}
              onClick={() => onSelectList(list.id, 'custom')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {list.name}
            </button>
          ))
        ) : (
          <div className="px-4 py-2 text-sm text-gray-500">No custom lists yet</div>
        )}
        
        {/* Create New List Option */}
        <button
          onClick={onCreateNew}
          className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
        >
          + Create new list...
        </button>
      </div>
    </div>
  );
};

export default AddToListPopover;