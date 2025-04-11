import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { // Import icon components
  FaUserPlus, FaCheck, FaTimes, FaTrash, FaPaperPlane, FaHourglassHalf, FaUsers, FaUserClock, FaExclamationCircle
} from 'react-icons/fa';
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
  const [actionLoading, setActionLoading] = useState({}); // Track loading state for specific actions { [id]: boolean }

  const loadData = useCallback(async () => {
    // Don't reset loading to true here, only on mount/refresh
    setError(null);
    try {
      const [buddiesRes, incomingRes, outgoingRes] = await Promise.all([
        getCurrentBuddies(),
        getIncomingRequests(),
        getOutgoingRequests()
      ]);

      if (buddiesRes.error) throw new Error(`Fetching buddies failed: ${buddiesRes.error.message}`);
      if (incomingRes.error) throw new Error(`Fetching incoming requests failed: ${incomingRes.error.message}`);
      if (outgoingRes.error) throw new Error(`Fetching outgoing requests failed: ${outgoingRes.error.message}`);

      setCurrentBuddies(buddiesRes.data || []);
      setIncomingRequests(incomingRes.data || []);
      setOutgoingRequests(outgoingRes.data || []);

    } catch (err) {
      console.error("Error loading buddy data:", err);
      setError(err.message || "Failed to load buddy information.");
    } finally {
      setLoading(false); // Set loading false after data fetch attempt
    }
  }, []);

  useEffect(() => {
    setLoading(true); // Set loading true when component mounts/refresh needed
    loadData();
  }, [loadData]);

  const handleAddFriend = async () => {
    if (!friendUsername.trim()) return;
    setAddFriendStatus({ loading: true, message: null, type: null });
    setError(null);
    try {
      const { success, error: sendError } = await sendBuddyRequest(friendUsername);
      if (!success || sendError) {
          throw new Error(sendError?.message || "Failed to send request.");
      }
      setAddFriendStatus({ loading: false, message: `Buddy request sent to ${friendUsername}!`, type: "success" });
      setFriendUsername('');
      loadData(); // Reload data
      setTimeout(() => setAddFriendStatus({ loading: false, message: null, type: null }), 3000); // Shorter timeout
    } catch (err) {
      console.error("Error sending buddy request:", err);
      setAddFriendStatus({ loading: false, message: err.message || "Failed to send request.", type: "error" });
       setTimeout(() => setAddFriendStatus({ loading: false, message: null, type: null }), 5000);
    }
  }

  const handleAction = useCallback(async (actionFunc, id, actionType) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    setError(null); // Clear global error on new action
    try {
      const { error } = await actionFunc(id);
      if (error) {
        throw new Error(`Failed to ${actionType}: ${error.message}`);
      }
      await loadData(); // Reload data on success - this will cause re-render and clear implicit loading
    } catch (err) {
      console.error(`Error performing action ${actionType}:`, err);
      setError(`Could not complete action: ${err.message}`); // Show global error
      // Ensure loading state for this specific button is cleared even on error
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
    // No finally needed if we clear state explicitly on error above
  }, [loadData]);

  // Updated renderProfileItem - now uses divider in parent for separation
  const renderProfileItem = (profile, buttons = null) => {
    const username = profile?.username || 'Unknown User';
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=0FA3B1&color=fff&size=128`; // Larger avatar size

    return (
      <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors duration-150">
        <div className="flex items-center space-x-4">
          <img
            src={avatarUrl}
            alt={`${username}'s Avatar`}
            className="w-11 h-11 rounded-full border-2 border-[#0FA3B1]/50 shadow-sm" // Softer border
          />
          <div>
            <span className="font-semibold text-gray-700">{username}</span>
          </div>
        </div>
        {buttons && <div className="flex items-center space-x-2">{buttons}</div>}
      </div>
    );
  };

  // Main return JSX with redesign
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#F9F7F3] to-gray-100"> {/* Subtle gradient background */}
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto ml-64"> {/* Responsive padding & ADDED ml-64 */}
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-[#0FA3B1] mb-8 flex items-center gap-3" // Larger title, add icon
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FaUsers /> Buddies
        </motion.h1>

        {/* Add Friend Section - Redesigned */}
        <motion.div
          className="bg-white rounded-lg shadow-lg p-6 mb-8" // Enhanced shadow
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold text-[#0FA3B1] mb-4 flex items-center gap-2"><FaUserPlus />Add a Buddy</h3>
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <input
              type="text"
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0FA3B1]/50 focus:border-[#0FA3B1] transition-shadow text-gray-700 placeholder-gray-400" // Improved input style
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              placeholder="Enter buddy's username"
              disabled={addFriendStatus.loading}
              aria-label="Buddy's username"
            />
            <button
              onClick={handleAddFriend}
              className={`flex items-center justify-center gap-2 px-5 py-2 rounded-md text-white font-medium transition-all duration-200 ease-in-out shadow-sm ${addFriendStatus.loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0FA3B1] hover:bg-[#0c8a96] hover:shadow-md transform hover:-translate-y-px'}`} // Improved button style & hover
              disabled={addFriendStatus.loading || !friendUsername.trim()}
            >
              {addFriendStatus.loading ? (
                <FaHourglassHalf className="animate-spin h-4 w-4" /> // Use spinner icon
              ) : (
                <FaPaperPlane className="h-4 w-4" />
              )}
              <span>{addFriendStatus.loading ? 'Sending...' : 'Send Request'}</span>
            </button>
          </div>
          {addFriendStatus.message && (
             <div className={`mt-3 p-3 rounded-md text-sm flex items-center gap-2 ${ // Improved status message
                addFriendStatus.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
                addFriendStatus.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : ''
              }`}>
                {addFriendStatus.type === 'error' ? <FaExclamationCircle /> : <FaCheck />}
               {addFriendStatus.message}
            </div>
          )}
        </motion.div>

        {/* Global Loading/Error Display */}
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#0FA3B1]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert"> {/* Improved error display */}
            <strong className="font-bold mr-2">Error:</strong>
            <span>{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> {/* Use grid layout for sections */}

            {/* Incoming Requests Section - Redesigned */}
            <motion.div
              className="bg-white rounded-lg shadow-lg p-0 overflow-hidden flex flex-col" // Card container, flex col for height
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h3 className="text-lg font-semibold text-[#0FA3B1] p-4 border-b border-gray-200 flex items-center gap-2 bg-gray-50/50 shrink-0"> {/* Section Header */}
                <FaUserClock className="text-[#F7A072]" /> Incoming Requests ({incomingRequests.length})
              </h3>
              <div className="divide-y divide-gray-200 overflow-y-auto"> {/* Scrollable content */}
                {incomingRequests.length === 0 ? (
                  <p className="text-center text-gray-500 p-6">No incoming requests.</p>
                ) : (
                  incomingRequests.map(({ requestId, sender }) => (
                    <div key={requestId}>
                      {renderProfileItem(sender,
                        <>
                           {/* Accept Button - Icon Only */}
                          <button
                            onClick={() => handleAction(acceptRequest, requestId, 'accept')}
                            className={`p-2 rounded-full transition-colors duration-150 ${actionLoading[requestId] ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                            disabled={actionLoading[requestId]}
                            title="Accept Request"
                            aria-label="Accept Request"
                          >
                            {actionLoading[requestId] === true && actionType === 'accept' ? <FaHourglassHalf className="animate-spin h-4 w-4" /> : <FaCheck className="h-4 w-4"/>}
                          </button>
                           {/* Reject Button - Icon Only */}
                          <button
                            onClick={() => handleAction(rejectRequest, requestId, 'reject')}
                            className={`p-2 rounded-full transition-colors duration-150 ${actionLoading[requestId] ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                            disabled={actionLoading[requestId]}
                            title="Reject Request"
                            aria-label="Reject Request"
                          >
                             {actionLoading[requestId] === true && actionType === 'reject' ? <FaHourglassHalf className="animate-spin h-4 w-4" /> : <FaTimes className="h-4 w-4"/>}
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Outgoing Requests Section - Redesigned */}
            <motion.div
              className="bg-white rounded-lg shadow-lg p-0 overflow-hidden flex flex-col"
               initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
           >
              <h3 className="text-lg font-semibold text-[#0FA3B1] p-4 border-b border-gray-200 flex items-center gap-2 bg-gray-50/50 shrink-0">
                <FaPaperPlane className="text-[#0FA3B1]" /> Outgoing Requests ({outgoingRequests.length})
              </h3>
              <div className="divide-y divide-gray-200 overflow-y-auto">
                {outgoingRequests.length === 0 ? (
                  <p className="text-center text-gray-500 p-6">No outgoing requests sent.</p>
                ) : (
                  outgoingRequests.map(({ requestId, recipient }) => (
                    <div key={requestId}>
                      {renderProfileItem(recipient,
                        // Cancel Button - Icon Only
                        <button
                          onClick={() => handleAction(cancelRequest, requestId, 'cancel')}
                          // Use actionType to show loading state only for the correct action
                          className={`p-2 rounded-full transition-colors duration-150 ${actionLoading[requestId] ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          disabled={actionLoading[requestId]}
                          title="Cancel Request"
                          aria-label="Cancel Request"
                        >
                          {actionLoading[requestId] ? <FaHourglassHalf className="animate-spin h-4 w-4" /> : <FaTimes className="h-4 w-4"/>}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Current Buddies Section - Redesigned */}
             <motion.div
              className="bg-white rounded-lg shadow-lg p-0 overflow-hidden flex flex-col" // Added flex flex-col
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
           >
              <h3 className="text-lg font-semibold text-[#0FA3B1] p-4 border-b border-gray-200 flex items-center gap-2 bg-gray-50/50 shrink-0"> {/* Section Header */}
                 <FaUsers className="text-green-600" /> Your Buddies ({currentBuddies.length})
              </h3>
               <div className="divide-y divide-gray-200 overflow-y-auto"> {/* Scrollable Content */}
                {currentBuddies.length === 0 ? (
                  <p className="text-center text-gray-500 p-6">No buddies yet. Send some requests!</p>
                ) : (
                  currentBuddies.map((buddy) => (
                    // Added unique key using buddy.id
                    <div key={buddy.id}>
                      {renderProfileItem(buddy,
                        // Remove Button - Icon Only
                        <button
                          onClick={() => handleAction(removeBuddy, buddy.connection_id, 'remove')}
                          // Use actionType to show loading state only for the correct action
                          className={`p-2 rounded-full transition-colors duration-150 ${actionLoading[buddy.connection_id] ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                          disabled={actionLoading[buddy.connection_id]}
                          title="Remove Buddy"
                          aria-label="Remove Buddy"
                        >
                          {actionLoading[buddy.connection_id] ? <FaHourglassHalf className="animate-spin h-4 w-4" /> : <FaTrash className="h-4 w-4"/>}
                        </button>
                      )}
                    </div>
                  ))
                )}
               </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}