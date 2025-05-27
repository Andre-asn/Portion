import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { FaUsers, FaCheck, FaPlus, FaMinus, FaEdit, FaTrash } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';

export function TableDetails() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [items, setItems] = useState([]);
  const [buddies, setBuddies] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Fetch table details and items
  useEffect(() => {
    async function fetchTableDetails() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        setCurrentUser(user);

        // Get table details
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select(`
            *,
            creator:creator_id (
              id,
              email,
              user_metadata
            )
          `)
          .eq('table_id', tableId)
          .single();

        if (tableError) throw tableError;
        setTable(tableData);

        // Get items
        const { data: itemsData, error: itemsError } = await supabase
          .from('table_items')
          .select(`
            *,
            assigned_to:assigned_to (
              id,
              email,
              user_metadata
            )
          `)
          .eq('table_id', tableId)
          .order('created_at', { ascending: true });

        if (itemsError) throw itemsError;
        setItems(itemsData);

        // Get buddies
        const { data: buddiesData, error: buddiesError } = await supabase
          .from('buddies')
          .select('buddy_id, buddy:buddy_id (id, email, user_metadata)')
          .eq('user_id', user.id);

        if (buddiesError) throw buddiesError;
        setBuddies(buddiesData.map(b => b.buddy));

      } catch (error) {
        console.error('Error fetching table details:', error);
        setError('Failed to load table details');
      } finally {
        setLoading(false);
      }
    }

    fetchTableDetails();
  }, [tableId]);

  const handleItemToggle = async (itemId) => {
    if (!currentUser) return;

    try {
      const item = items.find(i => i.item_id === itemId);
      const isAssigned = item.assigned_to?.id === currentUser.id;

      const { error } = await supabase
        .from('table_items')
        .update({
          assigned_to: isAssigned ? null : currentUser.id,
          status: isAssigned ? 'unassigned' : 'assigned'
        })
        .eq('item_id', itemId);

      if (error) throw error;

      // Update local state
      setItems(items.map(i => 
        i.item_id === itemId 
          ? { 
              ...i, 
              assigned_to: isAssigned ? null : currentUser,
              status: isAssigned ? 'unassigned' : 'assigned'
            }
          : i
      ));

    } catch (error) {
      console.error('Error updating item assignment:', error);
      setError('Failed to update item assignment');
    }
  };

  const handleEditItem = (index) => {
    setEditingItem(index);
  };

  const handleSaveEdit = async (itemId, field, value) => {
    try {
      const { error } = await supabase
        .from('table_items')
        .update({ [field]: value })
        .eq('item_id', itemId);

      if (error) throw error;

      // Update local state
      setItems(items.map(item => 
        item.item_id === itemId 
          ? { ...item, [field]: value }
          : item
      ));

    } catch (error) {
      console.error('Error updating item:', error);
      setError('Failed to update item');
    }
  };

  const handleFinishEdit = () => {
    setEditingItem(null);
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('table_items')
        .delete()
        .eq('item_id', itemId);

      if (error) throw error;

      // Update local state
      setItems(items.filter(item => item.item_id !== itemId));

    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item');
    }
  };

  // Calculate totals
  const calculateUserTotal = (userId) => {
    return items
      .filter(item => item.assigned_to?.id === userId)
      .reduce((sum, item) => sum + (item.price * item.amount), 0);
  };

  const calculateUnassignedTotal = () => {
    return items
      .filter(item => !item.assigned_to)
      .reduce((sum, item) => sum + (item.price * item.amount), 0);
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
          <FaUsers /> Table Details
        </motion.h1>

        {/* Table Info */}
        <motion.div
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-[#0FA3B1] mb-4">Table Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Created by</p>
              <p className="font-medium">{table.creator.user_metadata?.full_name || table.creator.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-medium">${table.total_amt.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tax</p>
              <p className="font-medium">${table.tax_amt.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tip</p>
              <p className="font-medium">${table.tip_amt.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>

        {/* Items List */}
        <motion.div
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-[#0FA3B1] mb-6">Items</h2>
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={item.item_id} className="grid grid-cols-6 gap-4 items-center border-b border-gray-200 py-2">
                <div className="col-span-1">
                  {editingItem === index ? (
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleSaveEdit(item.item_id, 'name', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0FA3B1] text-black"
                      autoFocus
                    />
                  ) : (
                    <span className="text-gray-700 truncate" title={item.name}>
                      {item.name}
                    </span>
                  )}
                </div>
                <div className="col-span-1 text-center">
                  {editingItem === index ? (
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleSaveEdit(item.item_id, 'amount', e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0FA3B1] text-black"
                      min="1"
                      step="1"
                    />
                  ) : (
                    <span className="text-gray-600 text-sm">
                      Qty: {item.amount}
                    </span>
                  )}
                </div>
                <div className="col-span-1 text-right">
                  {editingItem === index ? (
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleSaveEdit(item.item_id, 'price', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0FA3B1] text-black"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      ${item.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="col-span-1 text-center">
                  <button
                    onClick={() => handleItemToggle(item.item_id)}
                    className={`p-2 rounded-full ${
                      item.assigned_to?.id === currentUser?.id
                        ? 'bg-[#0FA3B1] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={item.assigned_to?.id === currentUser?.id ? "Remove from my items" : "Add to my items"}
                  >
                    {item.assigned_to?.id === currentUser?.id ? (
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
                    onClick={() => handleDeleteItem(item.item_id)}
                    className="p-1 text-red-500 hover:text-red-600"
                    title="Delete item"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Split Summary */}
        <motion.div
          className="bg-white rounded-lg shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-[#0FA3B1] mb-6">Split Summary</h2>
          
          {/* Your Items */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Your Items</h3>
            <div className="flex justify-between items-center py-2 font-bold text-lg">
              <span>Your Total</span>
              <span>${calculateUserTotal(currentUser?.id).toFixed(2)}</span>
            </div>
          </div>

          {/* Other Users */}
          {buddies.map(buddy => {
            const buddyTotal = calculateUserTotal(buddy.id);
            if (buddyTotal > 0) {
              return (
                <div key={buddy.id} className="mb-6">
                  <h3 className="text-lg font-medium text-gray-700 mb-3">
                    {buddy.user_metadata?.full_name || buddy.email}'s Items
                  </h3>
                  <div className="flex justify-between items-center py-2 font-bold text-lg">
                    <span>Total</span>
                    <span>${buddyTotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            }
            return null;
          })}

          {/* Unassigned Items */}
          {calculateUnassignedTotal() > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Unassigned Items</h3>
              <div className="flex justify-between items-center py-2 font-bold text-lg">
                <span>Total</span>
                <span>${calculateUnassignedTotal().toFixed(2)}</span>
              </div>
            </div>
          )}
        </motion.div>

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