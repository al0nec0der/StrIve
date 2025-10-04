import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useRequireAuth from '../hooks/useRequireAuth';
import Header from './Header';
import Footer from './Footer';
import ImportMovieItem from './ImportMovieItem';
import ManualSearchModal from './ManualSearchModal';

const ImportReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useRequireAuth();
  
  // Get analysis data from location state
  const { analysisData, listId } = location.state || {};
  
  // Local state to manage unmatched items
  const [localAnalysisData, setLocalAnalysisData] = useState(analysisData || {
    matched: [],
    unmatched: [],
    duplicates: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchModal, setSearchModal] = useState({
    isOpen: false,
    item: null,
    index: null
  });

  // Update local state when analysisData changes
  useEffect(() => {
    if (analysisData) {
      setLocalAnalysisData(analysisData);
    }
  }, [analysisData]);

  // Function to handle ignoring unmatched items
  const handleIgnoreUnmatched = (index) => {
    setLocalAnalysisData(prev => {
      const newUnmatched = [...prev.unmatched];
      newUnmatched.splice(index, 1);
      return { ...prev, unmatched: newUnmatched };
    });
  };

  // Function to handle opening search modal for unmatched items
  const handleOpenSearchModal = (item, index) => {
    setSearchModal({
      isOpen: true,
      item: item,
      index: index
    });
  };

  // Function to handle when a movie is selected from search results
  const handleSelectMovie = (selectedMovie) => {
    setLocalAnalysisData(prev => {
      // Remove the unmatched item
      const newUnmatched = [...prev.unmatched];
      newUnmatched.splice(searchModal.index, 1);
      
      // Add the selected movie to matched array
      const newMatched = [
        ...prev.matched, 
        { 
          movie: selectedMovie, 
          originalRow: searchModal.item.row 
        }
      ];
      
      return { 
        ...prev, 
        matched: newMatched,
        unmatched: newUnmatched 
      };
    });
    
    // Close the modal
    setSearchModal({
      isOpen: false,
      item: null,
      index: null
    });
  };

  // Function to handle confirming the import
  const handleConfirmImport = async () => {
    if (!user || !listId) {
      setError('User or list ID not found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get the user's ID token for authentication
      const token = await user.getIdToken();

      // Collect all movie IDs to import (from matched items and resolved unmatched items)
      // For matched items: use the tmdbId
      const matchedMovieIds = localAnalysisData.matched.map(item => item.movie.tmdbId.toString());
      
      // Combine all movie IDs to import
      const moviesToImport = [...matchedMovieIds];

      // Make the API call to confirm import
      const response = await fetch(`/api/lists/${listId}/import/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ moviesToImport }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Navigate to success page or back to the list
      navigate(`/my-lists/${listId}`, { state: { importSuccess: result.moviesAdded } });
    } catch (err) {
      setError(err.message || 'An error occurred while confirming the import.');
      console.error('Import confirmation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if all unmatched items are resolved
  const allUnmatchedResolved = localAnalysisData.unmatched.length === 0;

  if (!analysisData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">No analysis data found</h1>
            <p className="text-gray-400 mt-2">Please go back and re-import your CSV file.</p>
            <button 
              onClick={() => navigate('/import')}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Go to Import Page
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Review Import</h1>
          
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-300 text-center mb-6">
              {error}
            </div>
          )}
          
          {/* Matched Items Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                Matched Items ({localAnalysisData.matched.length})
              </h2>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              {localAnalysisData.matched.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No matched items to display</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {localAnalysisData.matched.map((item, index) => (
                    <ImportMovieItem 
                      key={`matched-${index}`} 
                      movie={item.movie} 
                      type="matched" 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Unmatched Items Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                Unmatched Items ({localAnalysisData.unmatched.length})
              </h2>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              {localAnalysisData.unmatched.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No unmatched items to display</p>
              ) : (
                <div className="space-y-3">
                  {localAnalysisData.unmatched.map((item, index) => (
                    <div key={`unmatched-${index}`} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{item.row.Name}</p>
                        <p className="text-gray-400 text-sm">{item.row.Year}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="p-2 text-blue-500 hover:text-blue-400"
                          title="Search for matching movie"
                          onClick={() => handleOpenSearchModal(item, index)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button 
                          className="p-2 text-red-500 hover:text-red-400"
                          title="Ignore this item"
                          onClick={() => handleIgnoreUnmatched(index)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Duplicates Items Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                Duplicates ({localAnalysisData.duplicates.length})
              </h2>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              {localAnalysisData.duplicates.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No duplicate items to display</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {localAnalysisData.duplicates.map((item, index) => (
                    <ImportMovieItem 
                      key={`duplicate-${index}`} 
                      movie={item.movie} 
                      type="duplicate" 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Confirm Import Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleConfirmImport}
              disabled={loading || !allUnmatchedResolved}
              className={`px-8 py-3 rounded-lg text-white font-semibold ${
                loading || !allUnmatchedResolved
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Confirming Import...
                </div>
              ) : (
                `Confirm Import ${localAnalysisData.matched.length} Movies`
              )}
            </button>
          </div>
          
          {!allUnmatchedResolved && (
            <p className="text-red-500 text-center mt-4">
              Please resolve all unmatched items before confirming import
            </p>
          )}
        </div>
        
        {/* Manual Search Modal */}
        <ManualSearchModal
          isOpen={searchModal.isOpen}
          onClose={() => setSearchModal({ isOpen: false, item: null, index: null })}
          initialQuery={searchModal.item?.row?.Name || ''}
          year={searchModal.item?.row?.Year}
          onSelectMovie={handleSelectMovie}
          onCancel={() => setSearchModal({ isOpen: false, item: null, index: null })}
        />
      </main>
      <Footer />
    </div>
  );
};

export default ImportReview;