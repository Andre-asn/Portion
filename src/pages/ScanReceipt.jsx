import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { FaUpload, FaReceipt, FaSpinner, FaTimes } from 'react-icons/fa';
import { supabase } from '../lib/supabase';

export function ScanReceipt() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [parsedItems, setParsedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setParsedItems([]);
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  const handleRemoveImage = () => {
      setSelectedFile(null);
      setImagePreview(null);
      setParsedItems([]);
      setError(null);
  };

  const processImage = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select an image file first.');
      return;
    }
  
    setIsProcessing(true);
    setError(null);
    setParsedItems([]);
  
    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-receipt`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ 
              image: reader.result 
            }),
          }
        );
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to process receipt');
        }
  
        setParsedItems(data.items || []);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setIsProcessing(false);
      }
    };
  }, [selectedFile]);

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
          <FaReceipt /> Scan Receipt
        </motion.h1>

        <motion.div
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold text-[#0FA3B1] mb-4 flex items-center gap-2">
            Upload Receipt Image
          </h3>
          
          <div className="mb-4">
            <label 
              htmlFor="receipt-upload" 
              className={`flex justify-center w-full h-32 px-4 transition bg-white border-2 ${error ? 'border-red-400' : 'border-gray-300'} border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none`}
            >
              <span className="flex items-center space-x-2">
                <FaUpload className="text-gray-600" />
                <span className="font-medium text-gray-600">
                  Drop file, or <span className="text-[#0FA3B1]">browse</span>
                </span>
              </span>
              <input 
                type="file" 
                id="receipt-upload" 
                name="receipt-upload"
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
                disabled={isProcessing}
              />
            </label>
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </div>

          {imagePreview && (
            <div className="mb-4 relative group">
                <p className='text-sm font-medium text-gray-600 mb-1'>Preview:</p>
              <img src={imagePreview} alt="Receipt Preview" className="max-w-full md:max-w-md max-h-80 object-contain rounded-md shadow-md border border-gray-200" />
              <button 
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-white"
                title="Remove Image"
                disabled={isProcessing}
              >
                  <FaTimes className='w-4 h-4'/>
              </button>
            </div>
          )}

          <button
            onClick={processImage}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-md text-white font-medium transition-all duration-200 ease-in-out shadow-sm ${!selectedFile || isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#F7A072] hover:bg-[#e68a5b] hover:shadow-md transform hover:-translate-y-px'}`}
            disabled={!selectedFile || isProcessing}
          >
            {isProcessing ? (
              <><FaSpinner className="animate-spin h-4 w-4" /> Processing</>
            ) : (
              <><FaReceipt className="h-4 w-4" /> Process Receipt</>
            )}
          </button>
        </motion.div>

        {isProcessing && (
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h3 className="text-xl font-semibold text-[#0FA3B1] mb-4">Processing Receipt</h3>
            <div className="flex items-center justify-center flex-col text-center">
                <FaSpinner className="animate-spin h-8 w-8 text-[#0FA3B1] mb-3" />
                <p className='text-gray-600'>Processing receipt...</p>
            </div>
          </motion.div>
        )}

        {parsedItems.length > 0 && (
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6 mt-8" 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }} 
          >
            <h3 className="text-xl font-semibold text-[#0FA3B1] mb-4">Parsed Items</h3>
            <ul className="space-y-2">
              {parsedItems.map((item, index) => (
                <li key={index} className="flex justify-between items-center border-b border-gray-200 py-2">
                  <span className="text-gray-700">{item.item}</span>
                  <span className="text-gray-900 font-medium">${item.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </main>
    </div>
  );
}
