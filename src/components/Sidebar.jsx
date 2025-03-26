import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

export function Sidebar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/buddies', label: 'Buddies' },
    { path: '/history', label: 'History' },
    { path: '/settings', label: 'Settings' }
  ];

  return (
    <motion.div 
      className="fixed left-0 top-0 h-full w-64 bg-[#B5E2FA] shadow-lg flex flex-col"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6 flex-grow">
        <h1 className="text-3xl font-bold text-[#0FA3B1] mb-8">Portion</h1>
        <nav className="space-y-4">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
              className={`block text-[#0FA3B1] hover:bg-[#EDDEA4] p-2 rounded-lg transition-colors ${
                location.pathname === item.path ? 'bg-[#EDDEA4]' : ''
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Profile Section at Bottom */}
      <div className="p-4 border-t border-[#0FA3B1]/20">
        <div className="flex items-center space-x-3">
          {user && user.user_metadata?.avatar_url && (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border-2 border-[#0FA3B1]"
            />
          )}
          <div className="flex-grow">
            <p className="text-sm font-medium text-[#0FA3B1]">
            {user?.user_metadata?.full_name.replace(/\s/g, '')}
            </p>
            <button
              onClick={handleSignOut}
              className="text-xs text-[#F7A072] hover:text-[#0FA3B1] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}