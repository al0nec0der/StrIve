import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchLists, fetchWatchlist, deleteList } from '../util/listsSlice';
import useRequireAuth from '../hooks/useRequireAuth';
import ListShelf from './ListShelf';
import Header from './Header';
import Footer from './Footer';
import CreateListModal from './CreateListModal';
import ConfirmationModal from './ConfirmationModal';

const MyListsPage = () => {
  const dispatch = useDispatch();
  const user = useRequireAuth();
  const { watchlist, customLists } = useSelector((state) => state.lists);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchWatchlist(user.uid));
      dispatch(fetchLists(user.uid));
    }
  }, [dispatch, user]);

  const handleConfirmDelete = async () => {
    if (user && listToDelete) {
      try {
        await dispatch(deleteList({ 
          userId: user.uid, 
          listId: listToDelete.id 
        })).unwrap();
        setListToDelete(null);
      } catch (err) {
        console.error('Failed to delete list:', err);
      }
    }
  };

  const loading = watchlist.status === 'loading' || customLists.status === 'loading';
  const error = watchlist.error || customLists.error;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pt-16">
        <h1 className="text-3xl font-bold mb-6">My Lists</h1>

        {loading && <div className="text-center">Loading your lists...</div>}
        
        {error && <div className="text-center text-red-500">Error: {error}</div>}

        {!loading && !error && (
          <div>
            {/* Watchlist Shelf */}
            <ListShelf 
              title="Watchlist" 
              items={watchlist.items} 
              mapsTo="/my-list" 
            />

            {/* Custom Lists Shelves */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Custom Lists</h2>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Create New List
              </button>
            </div>

            {customLists.lists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">You don't have any custom lists yet.</p>
              </div>
            ) : (
              customLists.lists.map((list) => (
                <ListShelf 
                  key={list.id} 
                  title={list.name} 
                  items={list.items || []} 
                  mapsTo={`/my-lists/${list.id}`} 
                  onDelete={() => setListToDelete(list)}
                />
              ))
            )}
          </div>
        )}
        <ConfirmationModal
          isOpen={!!listToDelete}
          onClose={() => setListToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete List"
          message={`Are you sure you want to permanently delete the list '${listToDelete?.name}'?`}
        />
        <CreateListModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          userId={user?.uid} 
        />
      </main>
    </div>
  );
};

export default MyListsPage;