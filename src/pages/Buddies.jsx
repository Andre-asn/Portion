import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { getMyBuddies, sendBuddyRequest, getPendingBuddies, acceptBuddyRequest, rejectBuddyRequest } from '../lib/buddies';

export function Buddies() {
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendUsername, setFriendUsername] = useState('');
  const [addFriendStatus, setAddFriendStatus] = useState(null);

  async function loadBuddies() {
    try {
      setLoading(true);
      // Get accepted connections
      const { data: buddiesData, error: buddiesError } = await getMyBuddies();
      if (buddiesError) throw buddiesError;
      setConnections(buddiesData || []);

      // Get pending requests
      const { data: requestsData, error: requestsError } = await getPendingBuddies();
      if (requestsError) throw requestsError;
      setPendingRequests(requestsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBuddies();
  }, []);

  async function handleAddFriend() {
    console.log("Add friend button clicked", friendUsername);
    
    try {
      // Show loading state
      console.log("Sending buddy request...");
      const result = await sendBuddyRequest(friendUsername);
      console.log("Request result:", result);
      
      if (result.error) {
        alert(result.error.message);
      } else {
        alert("Friend request sent successfully!");
        setFriendUsername('');
      }
    } catch (err) {
      console.error("Error sending buddy request:", err);
      alert("Error: " + err.message);
    }
  }

  async function handleAcceptRequest(connectionId) {
    try {
      const { error } = await acceptBuddyRequest(connectionId);
      if (error) throw error;
      // Reload connections to update the UI
      await loadConnections();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRejectRequest(connectionId) {
    try {
      const { error } = await rejectBuddyRequest(connectionId);
      if (error) throw error;
      // Reload connections to update the UI
      await loadConnections();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3]">
      <Sidebar />
      
      <div className="ml-64 p-8">
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold text-[#0FA3B1]">Your Buddies</h2>
        </motion.div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-[#0FA3B1] mb-4">Add a Friend</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
                type="text" 
                className="bg-gray-100 p-2 rounded-lg flex-grow text-black"
                value={friendUsername} 
                onChange={(e) => setFriendUsername(e.target.value)}
                placeholder="Enter friend's display name"
            />
            <button 
                className="bg-[#0FA3B1] text-white p-2 rounded-lg hover:bg-opacity-80 transition-colors"
                onClick={handleAddFriend}
                disabled={addFriendStatus?.type === 'loading'}
            >
                {addFriendStatus?.type === 'loading' ? 'Sending...' : 'Add Friend'}
            </button>
          </div>
          
          {addFriendStatus && (
            <div className={`mt-2 p-2 rounded ${
              addFriendStatus.type === 'error' ? 'bg-red-100 text-red-700' : 
              addFriendStatus.type === 'success' ? 'bg-green-100 text-green-700' : ''
            }`}>
              {addFriendStatus.message}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0FA3B1]"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center bg-white p-4 rounded-xl shadow-md">{error}</div>
        ) : (
          <div className="space-y-6">
            {/* Pending Requests Section */}
            {pendingRequests && pendingRequests.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold text-[#0FA3B1] mb-4">Pending Requests</h3>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-[#F9F7F3] rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {request.users.provider_type === 'discord' ? (
                          <img 
                            src={`https://cdn.discordapp.com/avatars/${request.users.providers}/${request.users.avatar}.png`}
                            alt="Profile" 
                            className="w-10 h-10 rounded-full border-2 border-[#0FA3B1]"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${request.users.display_name}&background=0FA3B1&color=fff`;
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#0FA3B1] flex items-center justify-center text-white">
                            {request.users.display_name?.[0] || '?'}
                          </div>
                        )}
                        <span className="font-medium text-[#0FA3B1]">{request.users.display_name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleAcceptRequest(request.id)}
                          className="px-3 py-1 bg-[#EDDEA4] text-[#0FA3B1] rounded hover:bg-opacity-80 transition-colors"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(request.id)}
                          className="px-3 py-1 bg-[#F7A072] text-white rounded hover:bg-opacity-80 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connected Buddies Section */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-[#0FA3B1] mb-4">Connected Buddies</h3>
              {connections.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No connections yet. Start adding friends above!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connections.map((connection) => (
                    <div 
                      key={connection.id}
                      className="flex items-center space-x-3 p-3 bg-[#F9F7F3] rounded-lg"
                    >
                      {connection.users.provider_type === 'discord' ? (
                        <img 
                          src={`https://cdn.discordapp.com/avatars/${connection.users.providers}/${connection.users.avatar}.png`}
                          alt="Profile" 
                          className="w-10 h-10 rounded-full border-2 border-[#0FA3B1]"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${connection.users.display_name}&background=0FA3B1&color=fff`;
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#0FA3B1] flex items-center justify-center text-white">
                          {connection.users.display_name?.[0] || '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[#0FA3B1]">{connection.users.display_name}</p>
                        <p className="text-sm text-gray-500">{connection.users.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}