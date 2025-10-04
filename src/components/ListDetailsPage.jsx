import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import useRequireAuth from '../hooks/useRequireAuth';
import { fetchActiveList, removeItem } from '../util/listsSlice';
import MovieCard from './MovieCard';
import FilterControls from './FilterControls';
import Header from './Header';
import Footer from './Footer';

const ListDetailsPage = () => {
  const dispatch = useDispatch();
  const user = useRequireAuth();
  const { listId } = useParams();
  const { details, items, status, error } = useSelector((state) => state.lists.activeList);

  useEffect(() => {
    if (user && listId) {
      dispatch(fetchActiveList({ userId: user.uid, listId }));
    }
  }, [dispatch, user, listId]);

  const handleRemoveItem = async (item) => {
    if (user && listId) {
      try {
        await dispatch(removeItem({ userId: user.uid, listId, mediaId: item.id })).unwrap();
      } catch (err) {
        console.error('Failed to remove item:', err);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {status === 'loading' && <div className="text-center">Loading list details...</div>}
        
        {error && <div className="text-center text-red-500">Error: {error}</div>}
        
        {status !== 'loading' && !error && details && (
          <div>
            <h1 className="text-3xl font-bold mb-6">{details.name}</h1>
            
            {items && items.length > 0 ? (
              <FilterControls items={items}>
                {(filteredAndSortedItems) => (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredAndSortedItems.map((item) => (
                      <MovieCard
                        key={item.id}
                        movie={item}
                        onRemove={() => handleRemoveItem(item)}
                      />
                    ))}
                  </div>
                )}
              </FilterControls>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">This list is empty. Add some titles to get started!</p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ListDetailsPage;