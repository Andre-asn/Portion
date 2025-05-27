import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { FaReceipt, FaUtensils, FaUpload, FaSpinner, FaTable, FaUsers, FaDollarSign } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function Tables() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTables, setCurrentTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);

  // Fetch current tables
  useEffect(() => {
    async function fetchCurrentTables() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        // Get tables where user is creator
        const { data: creatorTables, error: creatorError } = await supabase
          .from('tables')
          .select(`
            *,
            table_participants!inner (
              user_id
            )
          `)
          .eq('creator_id', user.id)
          .eq('status', 'active');

        if (creatorError) throw creatorError;

        // Get tables where user is participant
        const { data: participantTables, error: participantError } = await supabase
          .from('tables')
          .select(`
            *,
            table_participants!inner (
              user_id
            )
          `)
          .eq('table_participants.user_id', user.id)
          .eq('status', 'active');

        if (participantError) throw participantError;

        // Combine and deduplicate tables
        const allTables = [...(creatorTables || []), ...(participantTables || [])];
        const uniqueTables = Array.from(new Map(allTables.map(table => [table.table_id, table])).values());
        
        // Sort by creation date
        const sortedTables = uniqueTables.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );

        setCurrentTables(sortedTables);

      } catch (error) {
        console.error('Error fetching tables:', error);
        setError('Failed to load tables');
      } finally {
        setLoadingTables(false);
      }
    }

    fetchCurrentTables();
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Here you would typically upload the file to your backend
      // and process it to extract the items
      // For now, we'll simulate this with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulated extracted items
      const extractedItems = [
        { item: 'Burger', price: 12.99, amount: 1 },
        { item: 'Fries', price: 4.99, amount: 2 },
        { item: 'Soda', price: 2.99, amount: 1 }
      ];

      // Navigate to create table page with the extracted items
      navigate('/create-table', { state: { items: extractedItems } });
    } catch (error) {
      console.error('Error uploading receipt:', error);
      setError('Failed to upload receipt');
    } finally {
      setLoading(false);
    }
  };

  const calculateTableTotal = (table) => {
    return table.items.reduce((sum, item) => sum + (item.price * item.amount), 0);
  };

  const calculateUserTotal = (table, userId) => {
    return table.items
      .filter(item => item.assigned_to === userId)
      .reduce((sum, item) => sum + (item.price * item.amount), 0);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#F9F7F3] to-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto ml-64">
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-[#0FA3B1] mb-8 flex items-center gap-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FaUtensils /> Tables
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Receipt Upload */}
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-[#0FA3B1] mb-6 flex items-center gap-2"> <FaReceipt /> Create a new table</h2>
            
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="receipt-upload"
                />
                <label
                  htmlFor="receipt-upload"
                  className="cursor-pointer block"
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Receipt preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                  ) : (
                    <div className="space-y-2">
                      <FaUpload className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md text-white font-medium transition-all duration-200 ease-in-out shadow-sm ${
                  !file || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#0FA3B1] hover:bg-[#0d8a96] hover:shadow-md transform hover:-translate-y-px'
                }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin h-5 w-5" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaUpload className="h-5 w-5" />
                    Upload Receipt
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Right Column - Current Tables */}
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-[#0FA3B1] mb-6">Current Tables</h2>
            
            {loadingTables ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#0FA3B1]"></div>
              </div>
            ) : currentTables.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No active tables found
              </div>
            ) : (
              <div className="space-y-4">
                {currentTables.map((table) => (
                  <div
                    key={table.table_id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-[#0FA3B1] transition-colors cursor-pointer"
                    onClick={() => navigate(`/table/${table.table_id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{table.name}</h3>
                      <span className="text-sm text-gray-500">
                        {new Date(table.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <FaUsers className="h-4 w-4" />
                        <span>{table.table_participants?.length || 0} participants</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaTable className="h-4 w-4" />
                        <span>{table.items?.length || 0} items</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-[#0FA3B1]">
                        <FaDollarSign className="h-4 w-4" />
                        <span className="font-medium">
                          {table.total_amt?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Your share: ${table.total_amt?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
