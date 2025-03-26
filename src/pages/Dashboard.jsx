import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F7F3]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold text-[#0FA3B1]">Welcome to Your Dashboard</h2>
        </motion.div>

        {/* Dashboard Content */}
          {/* Recent Activity Card */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-[#0FA3B1] mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-2 bg-[#F9F7F3] rounded-lg">
                <span className="text-[#0FA3B1]">Dinner with friends</span>
                <span className="text-[#F7A072] font-semibold">$45.00</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-[#F9F7F3] rounded-lg">
                <span className="text-[#0FA3B1]">Movie night</span>
                <span className="text-[#F7A072] font-semibold">$15.00</span>
              </div>
            </div>
          </motion.div>

          {/* Balance Card */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-xl font-semibold text-[#0FA3B1] mb-4">Current Balance</h3>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#F7A072]">$125.50</p>
              <p className="text-sm text-[#0FA3B1] mt-2">You're owed</p>
            </div>
          </motion.div>

          {/* Quick Actions Card */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-xl font-semibold text-[#0FA3B1] mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full py-2 bg-[#EDDEA4] text-[#0FA3B1] rounded-lg hover:bg-opacity-80 transition-colors">
                Add Expense
              </button>
              <button className="w-full py-2 bg-[#B5E2FA] text-[#0FA3B1] rounded-lg hover:bg-opacity-80 transition-colors">
                Create Group
              </button>
            </div>
          </motion.div>
        </div>
      </div>
  );
}