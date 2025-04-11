import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import {
  getCurrentBuddies,
  getIncomingRequests,
  getOutgoingRequests,
  sendBuddyRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  removeBuddy
} from '../lib/buddies';

export function Buddies() {
  const [currentBuddies, setCurrentBuddies] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendUsername, setFriendUsername] = useState('');
  const [addFriendStatus, setAddFriendStatus] = useState({ loading: false, message: null, type: null });
  const [actionLoading, setActionLoading] = useState({}); // Track loading state for accept/reject/cancel actions { [requestId]: boolean }

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionLoading({}); // Clear action loading states on full reload
    try {
      const [buddiesResult, incomingResult, outgoingResult] = await Promise.all([
        getCurrentBuddies(),
        getIncomingRequests(),
        getOutgoingRequests()
      ]);

      if (buddiesResult.error) throw buddiesResult.error;
      setCurrentBuddies(buddiesResult.data || []);

      if (incomingResult.error) throw incomingResult.error;
      setIncomingRequests(incomingResult.data || []);

      if (outgoingResult.error) throw outgoingResult.error;
      setOutgoingRequests(outgoingResult.data || []);

    } catch (err) {
      console.error("Error loading buddies data:", err);
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddFriend() {
    if (!friendUsername.trim()) {
      setAddFriendStatus({ loading: false, message: "Please enter a username.", type: "error" });
      return;
    }
    setAddFriendStatus({ loading: true, message: null, type: null });
    try {
      const result = await sendBuddyRequest(friendUsername.trim());
      if (result.error) {
        throw new Error(result.error.message);
      }
      setAddFriendStatus({ loading: false, message: "Friend request sent!", type: "success" });
      setFriendUsername('');
      // Reload outgoing requests specifically or all data
      await loadData(); // Reload all data to be safe
      setTimeout(() => setAddFriendStatus({ loading: false, message: null, type: null }), 3000); // Clear status
    } catch (err) {
      console.error("Error sending buddy request:", err);
      setAddFriendStatus({ loading: false, message: err.message || "Failed to send request.", type: "error" });
      setTimeout(() => setAddFriendStatus({ loading: false, message: null, type: null }), 5000); // Keep error longer
    }
  }

  const handleAction = useCallback(async (actionFunc, id, actionType) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const { error } = await actionFunc(id);
      if (error) {
        throw new Error(`Failed to ${actionType} request: ${error.message}`);
      }
      await loadData(); // Reload all data after successful action
    } catch (err) {
      setError(`Could not complete action: ${err.message}`); // Set global error for feedback
    }
    // Let loadData handle the overall loading state reset.
    // Individual button loading state will implicitly clear on re-render after loadData.
  }, [loadData]);

  const renderProfileItem = (profile, buttons = null) => {
    const username = profile?.username || 'Unknown User';
    // Use ui-avatars.com based on username as the only avatar source
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=0FA3B1&color=fff`;

    return (
      <div className="flex items-center justify-between p-3 bg-[#F9F7F3] rounded-lg hover:shadow-sm transition-shadow">
        <div className="flex items-center space-x-3">
          <img
            src={avatarUrl}
            alt={`${username}'s Avatar`}
            className="w-10 h-10 rounded-full border-2 border-[#0FA3B1]"
          />
          <div>
            <span className="font-medium text-[#0FA3B1]">{username}</span>
            {/* Removed email display */}
          </div>
        </div>
        {buttons && <div className="flex space-x-2">{buttons}</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F7F3] flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto ml-64"> {/* Added ml-64 for sidebar width */}
        <motion.h1
          className="text-3xl font-semibold text-[#0FA3B1] mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Manage Buddies
        </motion.h1>

        {/* Add Friend Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-[#0FA3B1] mb-4">Add a Buddy</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              className="bg-gray-100 p-2 rounded-lg flex-grow text-gray-800 border border-gray-300 focus:ring-2 focus:ring-[#0FA3B1] focus:outline-none"
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              placeholder="Enter buddy's username"
              disabled={addFriendStatus.loading}
            />
            <button
              className={`bg-[#0FA3B1] text-white p-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors ${addFriendStatus.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleAddFriend}
              disabled={addFriendStatus.loading}
            >
              {addFriendStatus.loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
          {addFriendStatus.message && (
            <div className={`mt-3 p-2 rounded-md text-sm ${
              addFriendStatus.type === 'error' ? 'bg-red-100 text-red-700' :
              addFriendStatus.type === 'success' ? 'bg-green-100 text-green-700' : ''
            }`}>
              {addFriendStatus.message}
            </div>
          )}
        </div>

        {/* Global Loading/Error */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0FA3B1]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Incoming Requests Section */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-[#0FA3B1] mb-4">Incoming Requests ({incomingRequests.length})</h3>
              {incomingRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No incoming requests.</p>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map(({ requestId, sender }) => (
                    <motion.div
                      key={requestId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderProfileItem(sender,
                        <>
                          <button
                            onClick={() => handleAction(acceptRequest, requestId, 'accept')}
                            className={`px-3 py-1 text-sm rounded transition-colors ${actionLoading[requestId] ? 'bg-gray-300 text-gray-500' : 'bg-[#EDDEA4] text-[#0FA3B1] hover:bg-opacity-80'}`}
                            disabled={actionLoading[requestId]}
                          >
                            {actionLoading[requestId] ? '...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleAction(rejectRequest, requestId, 'reject')}
                            className={`px-3 py-1 text-sm rounded transition-colors ${actionLoading[requestId] ? 'bg-gray-300 text-gray-500' : 'bg-[#F7A072] text-white hover:bg-opacity-80'}`}
                            disabled={actionLoading[requestId]}
                          >
                            {actionLoading[requestId] ? '...' : 'Reject'}
                          </button>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests Section */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-[#0FA3B1] mb-4">Outgoing Requests ({outgoingRequests.length})</h3>
              {outgoingRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No outgoing requests.</p>
              ) : (
                <div className="space-y-3">
                  {outgoingRequests.map(({ requestId, recipient }) => (
                    <motion.div
                      key={requestId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderProfileItem(recipient,
                        <button
                          onClick={() => handleAction(cancelRequest, requestId, 'cancel')}
                          className={`px-3 py-1 text-sm rounded transition-colors ${actionLoading[requestId] ? 'bg-gray-300 text-gray-500' : 'bg-gray-400 text-white hover:bg-gray-500'}`}
                          disabled={actionLoading[requestId]}
                        >
                          {actionLoading[requestId] ? '...' : 'Cancel'}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Buddies Section */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-[#0FA3B1] mb-4">Your Buddies ({currentBuddies.length})</h3>
              {currentBuddies.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No buddies yet. Send some requests!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentBuddies.map((buddy) => (
                    <motion.div
                      key={buddy.id} // Use buddy profile ID as key
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderProfileItem(buddy,
                        // Add Remove button for current buddies
                        <button
                          onClick={() => handleAction(removeBuddy, buddy.connection_id, 'remove')}
                          className={`px-3 py-1 text-sm rounded transition-colors ${actionLoading[buddy.connection_id] ? 'bg-gray-300 text-gray-500' : 'bg-red-500 text-white hover:bg-red-600'}`}
                          disabled={actionLoading[buddy.connection_id]}
                        >
                          {actionLoading[buddy.connection_id] ? '...' : 'Remove'}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}