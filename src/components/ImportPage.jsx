import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import useRequireAuth from '../hooks/useRequireAuth';
import { fetchLists } from '../util/listsSlice';
import Header from './Header';
import Footer from './Footer';

const ImportPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useRequireAuth();
  
  const [selectedListId, setSelectedListId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { lists, status, error: listsError } = useSelector((state) => state.lists.userLists);

  // Fetch user's lists on component mount
  useEffect(() => {
    if (user) {
      dispatch(fetchLists(user.uid));
    }
  }, [dispatch, user]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Please select a valid CSV file.');
        setSelectedFile(null);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedListId) {
      setError('Please select a list to import to.');
      return;
    }
    
    if (!selectedFile) {
      setError('Please select a CSV file to upload.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get the user's ID token for authentication
      const token = await user.getIdToken();

      // Create FormData to send the file
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      // Make the API call to analyze the CSV
      const response = await fetch(`/api/lists/${selectedListId}/import/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const analysisData = await response.json();
      
      // Navigate to the review page with the analysis data
      navigate('/import/review', { state: { analysisData, listId: selectedListId } });
    } catch (err) {
      setError(err.message || 'An error occurred while analyzing the CSV file.');
      console.error('Import error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-gray-900 rounded-xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Import CSV to Your Movie List</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* List selection dropdown */}
            <div>
              <label htmlFor="listSelect" className="block text-sm font-medium text-gray-300 mb-2">
                Select a List to Import To
              </label>
              <select
                id="listSelect"
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600"
                disabled={status === 'loading'}
              >
                <option value="">Choose a list...</option>
                {lists && lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              
              {listsError && (
                <p className="text-red-500 text-sm mt-2">Error loading lists: {listsError}</p>
              )}
            </div>

            {/* File upload */}
            <div>
              <label htmlFor="csvFile" className="block text-sm font-medium text-gray-300 mb-2">
                Upload CSV File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <div className="flex text-sm text-gray-400 justify-center">
                    <label
                      htmlFor="csvFile"
                      className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none"
                    >
                      <span>Upload a CSV file</span>
                      <input
                        id="csvFile"
                        name="csvFile"
                        type="file"
                        className="sr-only"
                        accept=".csv,text/csv"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">CSV files only</p>
                  {selectedFile && (
                    <p className="text-sm text-green-500">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-300 text-center">
                {error}
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading || !selectedListId || !selectedFile}
                className={`px-6 py-3 rounded-lg text-white font-semibold ${
                  loading || !selectedListId || !selectedFile
                    ? 'bg-gray-700 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </div>
                ) : (
                  'Analyze & Import'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ImportPage;