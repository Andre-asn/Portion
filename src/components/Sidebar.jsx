import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaUserFriends, 
  FaHistory, 
  FaCog, 
  FaSignOutAlt,
  FaReceipt
} from 'react-icons/fa';

export function Sidebar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState('https://ui-avatars.com/api/?name=?&background=0FA3B1&color=fff&size=128'); // Default avatar

  useEffect(() => {
    async function getUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Use Supabase avatar if available, otherwise generate one
        const supabaseAvatar = user.user_metadata?.avatar_url;
        const name = user.user_metadata?.full_name || user.email || '?';
        const finalAvatarUrl = supabaseAvatar 
          ? supabaseAvatar 
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(name.split(' ')[0])}&background=0FA3B1&color=fff&size=128`;
        setAvatarUrl(finalAvatarUrl);
      }
    }
    getUser();
  }, []);

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null); // Clear user state
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  }

  // Define navigation items with icons
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { path: '/buddies', label: 'Buddies', icon: FaUserFriends },
    { path: '/scan-receipt', label: 'Scan Receipt', icon: FaReceipt },
    { path: '/history', label: 'History', icon: FaHistory },
    // { path: '/settings', label: 'Settings', icon: FaCog } // Example: Add settings later if needed
  ];

  const getDisplayName = () => {
    if (!user) return '...';
    // Prefer full name, fallback to email username part
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  };

  return (
    <motion.div 
      className="fixed left-0 top-0 h-full w-64 bg-[#B5E2FA] shadow-xl flex flex-col z-10" // Increased shadow, added z-index
      initial={{ x: -256 }} // Start fully off-screen
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }} // Faster, smoother animation
    >
      {/* Logo/Header */}
      <div className="p-5 border-b border-[#0FA3B1]/20">
        <h1 className="text-3xl font-bold text-[#0FA3B1] text-center">Portion</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-grow mt-6 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium ${ 
                isActive 
                  ? 'bg-[#EDDEA4] text-[#0c8a96] shadow-sm' // Active state: Accent background, darker primary text
                  : 'text-[#0FA3B1] hover:bg-[#0FA3B1]/10 hover:text-[#0c8a96]' // Inactive state: Primary text, subtle hover
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-[#0c8a96]' : 'text-[#0FA3B1]/80'}`} /> 
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Profile Section at Bottom */}
      <div className="p-4 border-t border-[#0FA3B1]/20 mt-4">
        <div className="flex items-center space-x-3">
          <img 
            src={avatarUrl} 
            alt="Profile" 
            className="w-10 h-10 rounded-full border-2 border-[#0FA3B1]/50 shadow-md"
          />
          <div className="flex-grow overflow-hidden">
            <p className="text-sm font-semibold text-[#0c8a96] truncate" title={getDisplayName()}> 
              {getDisplayName()} 
            </p>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1.5 text-xs text-[#F7A072] hover:text-[#d9825f] transition-colors duration-150 font-medium mt-0.5"
            >
              <FaSignOutAlt className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}