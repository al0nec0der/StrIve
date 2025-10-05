import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Check, Plus, Download } from 'lucide-react';
import { fetchItemStatus, addItemToList, removeItemFromList } from '../util/listsSlice';
import useRequireAuth from '../hooks/useRequireAuth';
import { getAuth } from 'firebase/auth';

const ListActionsButton = ({ mediaItem, listId, listDetails }) => {
  const dispatch = useDispatch();
  const user = useRequireAuth();
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const memberships = useSelector((state) => state.lists.itemStatus.memberships);

  useEffect(() => {
    if (user && mediaItem?.id) {
      dispatch(fetchItemStatus({ userId: user.uid, mediaId: mediaItem.id }));
    }
  }, [dispatch, user, mediaItem?.id]);

  const handleToggleToList = (listName) => {
    if (!user) return;

    const isMember = memberships[listName];
    const action = isMember ? removeItemFromList : addItemToList;

    dispatch(
      action({
        userId: user.uid,
        listName,
        mediaId: mediaItem.id, // for remove
        mediaItem, // for add
      })
    ).then(() => {
      // Re-fetch status after the action is completed
      dispatch(fetchItemStatus({ userId: user.uid, mediaId: mediaItem.id }));
    });
  };

  // Export functionality for list (when listId is provided)
  const handleExport = useCallback(async () => {
    if (!user || !listId) {
      console.error('User not authenticated or list ID missing');
      return;
    }

    try {
      // Get the current user's ID token for authentication
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();

      // Make request to export endpoint
      const response = await fetch(`/api/lists/${listId}/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.status}`);
      }

      // Get the response as blob
      const blob = await response.blob();

      // Create a temporary link to trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Construct filename using list name
      const fileName = listDetails?.name 
        ? `${listDetails.name.replace(/\s+/g, '_')}-letswatchu-export.csv`
        : `list-${listId}-letswatchu-export.csv`;
      
      link.setAttribute('download', fileName);
      
      // Append to document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(url);

      console.log('List exported successfully');
    } catch (error) {
      console.error('Failed to export list:', error);
      alert(`Failed to export list: ${error.message}`);
    }
  }, [user, listId, listDetails]);

  const isInAnyList = Object.values(memberships).some((status) => status);

  // If listId is provided, show export option in the dropdown
  const hasListContext = !!listId;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsMenuVisible(true)}
      onMouseLeave={() => setIsMenuVisible(false)}
    >
      <button className="flex items-center gap-2 px-8 py-4 bg-gray-600/80 text-white text-xl font-semibold rounded hover:bg-gray-500/80 transition-all duration-300 transform hover:scale-105">
        {isInAnyList ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        My List
      </button>

      {isMenuVisible && (
        <div className="absolute bottom-full mb-2 w-48 bg-gray-800 rounded-lg shadow-lg z-20">
          <ul>
            {["watchlist", "favorites", "completed"].map((listName) => (
              <li key={listName}>
                <button
                  onClick={() => handleToggleToList(listName)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center justify-between"
                >
                  <span>{listName.charAt(0).toUpperCase() + listName.slice(1)}</span>
                  {memberships[listName] && <Check className="w-5 h-5 text-green-500" />}
                </button>
              </li>
            ))}
            {hasListContext && (
              <li>
                <button
                  onClick={handleExport}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center justify-between"
                >
                  <span>Export as CSV</span>
                  <Download className="w-5 h-5" />
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ListActionsButton;
