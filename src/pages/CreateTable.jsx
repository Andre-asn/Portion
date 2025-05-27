import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { FaUsers, FaPlus, FaMinus, FaCheck, FaEdit, FaTrash } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentBuddies } from '../lib/buddies';

export function CreateTable() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tableName, setTableName] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);
  const [buddies, setBuddies] = useState([]);
  const [selectedBuddies, setSelectedBuddies] = useState([]);
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  // Get items from location state (passed from Tables)
  useEffect(() => {
    if (location.state?.items) {
      console.log('Received items:', location.state.items);
      // Ensure each item has the correct structure and filter out $0 items
      const formattedItems = location.state.items
        .map(item => ({
          item: item.item || item.name || '',
          price: parseFloat(item.price) || 0,
          amount: parseInt(item.amount) || 1
        }))
        .filter(item => item.price > 0); // Remove items with $0 price
      console.log('Formatted items:', formattedItems);
      setItems(formattedItems);
    } else {
      // If no items were passed, redirect back to tables
      navigate('/tables');
    }
  }, [location.state, navigate]);

  // Fetch user's buddies using the shared logic
  useEffect(() => {
    async function fetchBuddies() {
      setLoading(true);
      try {
        const { data, error } = await getCurrentBuddies();
        if (error) throw error;
        setBuddies(data || []);
      } catch (error) {
        console.error('Error fetching buddies:', error);
        setError('Failed to load buddies');
      } finally {
        setLoading(false);
      }
    }
    fetchBuddies();
  }, []);

  // Recalculate subtotal whenever items change
  useEffect(() => {
    console.log('Recalculating subtotal for items:', items);
    const newSubtotal = items.reduce((sum, item) => {
      const price = parseFloat(item.price);
      const amount = parseFloat(item.amount);
      console.log('Item calculation:', { price, amount, sum });
      if (!isNaN(price) && !isNaN(amount)) {
        return sum + price * amount;
      }
      return sum;
    }, 0);
    console.log('New subtotal:', newSubtotal);
    setSubtotal(newSubtotal);
  }, [items]);

  const handleBuddyToggle = (buddyId) => {
    setSelectedBuddies(prev => {
      if (prev.includes(buddyId)) {
        return prev.filter(id => id !== buddyId);
      } else {
        return [...prev, buddyId];
      }
    });
  };

  const handleItemToggle = (index) => {
    setSelectedItems(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleCreateTable = async () => {
    if (!tableName.trim()) {
      setError('Please enter a table name');
      return;
    }

    if (selectedBuddies.length === 0) {
      setError('Please select at least one buddy');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log('Creating table with data:', {
        creator_id: user.id,
        name: tableName,
        total_amt: items.reduce((sum, item) => sum + (item.price * item.amount), 0),
        tax_amt: taxAmount,
        tip_amt: tipAmount,
        status: 'active'
      });

      // Create the table
      const { data: table, error: tableError } = await supabase
        .from('tables')
        .insert({
          creator_id: user.id,
          name: tableName,
          total_amt: items.reduce((sum, item) => sum + (item.price * item.amount), 0),
          tax_amt: taxAmount,
          tip_amt: tipAmount,
          status: 'active'
        })
        .select()
        .single();

      if (tableError) {
        console.error('Error creating table:', tableError);
        throw tableError;
      }

      console.log('Table created:', table);

      // Create table items
      const { error: itemsError } = await supabase
        .from('table_items')
        .insert(
          items.map((item, index) => ({
            table_id: table.table_id,
            name: item.item,
            price: item.price,
            amount: item.amount,
            status: selectedItems.includes(index) ? 'assigned' : 'unassigned',
            assigned_to: selectedItems.includes(index) ? user.id : null
          }))
        );

      if (itemsError) {
        console.error('Error creating table items:', itemsError);
        throw itemsError;
      }

      // Create table participants
      const { error: participantsError } = await supabase
        .from('table_participants')
        .insert([
          { table_id: table.table_id, user_id: user.id }, // Add creator
          ...selectedBuddies.map(buddyId => ({
            table_id: table.table_id,
            user_id: buddyId
          }))
        ]);

      if (participantsError) {
        console.error('Error creating table participants:', participantsError);
        throw participantsError;
      }

      // Navigate to the table details page
      navigate(`/table/${table.table_id}`);
    } catch (error) {
      console.error('Error creating table:', error);
      setError('Failed to create table: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Editable item handlers (copied/adapted from ScanReceipt)
  const handleEditItem = (index) => {
    setEditingItem(index);
  };

  const handleSaveEdit = (index, field, value) => {
    const newItems = [...items];
    if (field === 'price' || field === 'amount') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        newItems[index][field] = numValue;
      }
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };

  const handleFinishEdit = () => {
    setEditingItem(null);
  };

  const handleDeleteItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    return (
      tableName.trim() !== '' && // Table name is not empty
      selectedBuddies.length > 0 && // At least one buddy is selected
      items.length > 0 // There are items to split
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#F9F7F3] to-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10 overflow-y-auto ml-64">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#0FA3B1]"></div>
          </div>
        </main>
      </div>
    );
  }

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
          <FaUsers /> Create Table
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Table Details */}
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-[#0FA3B1] mb-6">Table Details</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="tableName" className="block text-sm font-medium text-gray-700 mb-1">
                  Table Name
                </label>
                <input
                  type="text"
                  id="tableName"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0FA3B1] text-black"
                  placeholder="e.g., Dinner at Joe's"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="taxAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Amount ($)
                  </label>
                  <input
                    type="number"
                    id="taxAmount"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0FA3B1] text-black"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="tipAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Tip Amount ($)
                  </label>
                  <input
                    type="number"
                    id="tipAmount"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0FA3B1] text-black"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Select Buddies */}
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-[#0FA3B1] mb-6">Select Buddies</h2>
            
            <div className="space-y-3">
              {buddies.map((buddy) => (
                <div
                  key={buddy.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    selectedBuddies.includes(buddy.id)
                      ? 'border-[#0FA3B1] bg-[#0FA3B1]/5'
                      : 'border-gray-200'
                  }`}
                >
                  <span className="text-gray-700">{buddy.username}</span>
                  <button
                    onClick={() => handleBuddyToggle(buddy.id)}
                    className={`p-2 rounded-full ${
                      selectedBuddies.includes(buddy.id)
                        ? 'bg-[#0FA3B1] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {selectedBuddies.includes(buddy.id) ? (
                      <FaCheck className="h-4 w-4" />
                    ) : (
                      <FaPlus className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Items Summary */}
        <motion.div
          className="bg-white rounded-lg shadow-lg p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-[#0FA3B1] mb-6">Items Summary</h2>
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={index} className="grid grid-cols-6 gap-4 items-center border-b border-gray-200 py-2">
                <div className="col-span-1">
                  {editingItem === index ? (
                    <input
                      type="text"
                      value={item.item}
                      onChange={(e) => handleSaveEdit(index, 'item', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0FA3B1] text-black"
                      autoFocus
                    />
                  ) : (
                    <span className="text-gray-700 truncate" title={item.item}>
                      {item.item || 'N/A'}
                    </span>
                  )}
                </div>
                <div className="col-span-1 text-center">
                  {editingItem === index ? (
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleSaveEdit(index, 'amount', e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0FA3B1] text-black"
                      min="1"
                      step="1"
                    />
                  ) : (
                    <span className="text-gray-600 text-sm">
                      Qty: {typeof item.amount === 'number' ? item.amount : (item.amount || 1)}
                    </span>
                  )}
                </div>
                <div className="col-span-1 text-right">
                  {editingItem === index ? (
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleSaveEdit(index, 'price', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0FA3B1] text-black"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      ${typeof item.price === 'number' && !isNaN(item.price) ? item.price.toFixed(2) : (parseFloat(item.price) ? parseFloat(item.price).toFixed(2) : '0.00')}
                    </span>
                  )}
                </div>
                <div className="col-span-1 text-center">
                  <button
                    onClick={() => handleItemToggle(index)}
                    className={`p-2 rounded-full ${
                      selectedItems.includes(index)
                        ? 'bg-[#0FA3B1] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={selectedItems.includes(index) ? "Remove from my items" : "Add to my items"}
                  >
                    {selectedItems.includes(index) ? (
                      <FaCheck className="h-4 w-4" />
                    ) : (
                      <FaPlus className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="col-span-1 text-right">
                  {editingItem === index ? (
                    <button
                      onClick={handleFinishEdit}
                      className="p-1 text-green-600 hover:text-green-700"
                      title="Save changes"
                    >
                      <FaCheck className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEditItem(index)}
                      className="p-1 text-[#0FA3B1] hover:text-[#0d8a96]"
                      title="Edit item"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => handleDeleteItem(index)}
                    className="p-1 text-red-500 hover:text-red-600"
                    title="Delete item"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center py-2 font-semibold mt-4">
            <span className="text-gray-700">Subtotal</span>
            <span className="text-gray-900">
              ${subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 text-[#0FA3B1]">
            <span>Tax</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 text-[#0FA3B1]">
            <span>Tip</span>
            <span>${tipAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 font-bold text-lg border-t border-gray-200 mt-2">
            <span>Total</span>
            <span>
              ${(subtotal + taxAmount + tipAmount).toFixed(2)}
            </span>
          </div>
        </motion.div>

        {/* Selected Items Summary */}
        {selectedItems.length > 0 && (
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-[#0FA3B1] mb-4">Your Selected Items</h2>
            <ul className="space-y-2">
              {selectedItems.map(index => (
                <li key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">{items[index].item}</span>
                  <span className="text-gray-900 font-medium">
                    ${(items[index].price * items[index].amount).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center py-2 font-bold text-lg border-t border-gray-200 mt-2">
              <span>Your Total</span>
              <span>
                ${selectedItems.reduce((sum, index) => sum + (items[index].price * items[index].amount), 0).toFixed(2)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Create Button */}
        <motion.div
          className="mt-8 flex justify-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <button
            onClick={handleCreateTable}
            disabled={isCreating || !isFormValid()}
            className={`flex items-center gap-2 px-6 py-3 rounded-md text-white font-medium transition-all duration-200 ease-in-out shadow-sm ${
              isCreating || !isFormValid()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#0FA3B1] hover:bg-[#0d8a96] hover:shadow-md transform hover:-translate-y-px'
            }`}
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <FaCheck className="h-4 w-4" />
                Create Table
              </>
            )}
          </button>
        </motion.div>
      </main>
    </div>
  );
} 