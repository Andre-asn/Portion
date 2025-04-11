import { supabase } from "../lib/supabase";

// Fetch profiles of accepted buddies
export async function getCurrentBuddies() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not authenticated");

    // Fetch connections where status is 'accepted' and user is involved
    const { data, error } = await supabase
      .from('buddies')
      .select(`
        connection_id,
        sender_id,
        recipient_id,
        status,
        sender:users!buddies_sender_id_fkey(id, username),
        recipient:users!buddies_recipient_id_fkey(id, username)
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

    if (error) throw error;

    // Return the profile of the *other* user in the connection
    const buddies = data.map(conn => {
      const buddyProfile = conn.sender_id === user.id ? conn.recipient : conn.sender;
      return { ...buddyProfile, connection_id: conn.connection_id };
    }).filter(buddy => buddy && buddy.id); // Ensure buddy profile and id exist

    console.log('Current buddies:', buddies);
    return { data: buddies };
  } catch (error) {
    console.error("Error fetching current buddies:", error);
    return { error };
  }
}

// Fetch incoming pending requests (user is recipient)
export async function getIncomingRequests() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('buddies')
      .select(`
        connection_id,
        status,
        sender:users!buddies_sender_id_fkey(id, username)
      `)
      .eq('status', 'pending')
      .eq('recipient_id', user.id);

    if (error) throw error;

    // Structure data to include request ID and sender profile
    const requests = data.map(req => ({
        requestId: req.connection_id,
        sender: req.sender
    })).filter(req => req.sender); // Ensure sender profile exists

    return { data: requests };
  } catch (error) {
    console.error("Error fetching incoming requests:", error);
    return { error };
  }
}

// Fetch outgoing pending requests (user is sender)
export async function getOutgoingRequests() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('buddies')
      .select(`
        connection_id,
        status,
        recipient:users!buddies_recipient_id_fkey(id, username)
      `)
      .eq('status', 'pending')
      .eq('sender_id', user.id);

    if (error) throw error;

     // Structure data to include request ID and recipient profile
    const requests = data.map(req => ({
        requestId: req.connection_id,
        recipient: req.recipient
    })).filter(req => req.recipient); // Ensure recipient profile exists

    return { data: requests };
  } catch (error) {
    console.error("Error fetching outgoing requests:", error);
    return { error };
  }
}

// Send a buddy request (using username)
export async function sendBuddyRequest(friendUsername) {
    try {
        const { data: {user} } = await supabase.auth.getUser()
        if (!user) {
            return { error: { message: "Not authenticated" } };
        }

        // Check if username exists in our user table
        let { data: friend, error: usererror } = await supabase
            .from('users')
            .select('id, username')
            .eq('username', friendUsername)
            .maybeSingle()

        if (usererror) {
            return { error: { message: "Error while trying to add friend" }}
        }
        if (!friend) {
            return { error: { message: "User does not exist" }}
        }
        if (friend.id === user.id) {
            return { error: { message: "Cannot add yourself as a friend" }}
        }

        // Check if the request already exists
        let { data: existingRequest, error: requestError } = await supabase
            .from('buddies')
            .select('*')
            .or(`and(sender_id.eq.${user.id},recipient_id.eq.${friend.id}),and(sender_id.eq.${friend.id},recipient_id.eq.${user.id})`)
            .maybeSingle()

        if (requestError) {
            return { error: { message: "Error checking existing requests" }}
        }

        if (existingRequest) {
            return { error: { message: "Already have an incoming/outgoing request with this user" }}
        }

        console.log("Current user ID:", user.id)

        // Create the buddy request
        // Modify this part of your function to get more information
const { data, error } = await supabase
.from('buddies')
.insert({
    sender_id: user.id,
    recipient_id: friend.id,
    status: "pending"
})
.select()

console.log("Insert result:", data, "Insert error:", error);

if (error) {
return { error: { message: "Failed to send buddy request: " + error.message }}
}

        return { data, success: true }
    } catch (err) {
        console.error("Error in sendBuddyRequest:", err);
        return { error: { message: err.message || "An unexpected error occurred" } }
    }
}

// Accept an incoming request
export async function acceptRequest(requestId) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not authenticated");

    // Update status to 'accepted', ensuring the user is the recipient
    const { error: updateError } = await supabase
      .from('buddies')
      .update({ status: 'accepted' })
      .eq('connection_id', requestId)
      .eq('recipient_id', user.id) // Security check
      .eq('status', 'pending');

    if (updateError) throw updateError;
    return { success: true };
  } catch (error) {
    console.error("Error accepting request:", error);
    return { error };
  }
}

// Reject an incoming request (delete it)
export async function rejectRequest(requestId) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not authenticated");

    // Delete the request, ensuring the user is the recipient
    const { error: deleteError } = await supabase
      .from('buddies')
      .delete()
      .eq('connection_id', requestId)
      .eq('recipient_id', user.id) // Security check
      .eq('status', 'pending');

    if (deleteError) throw deleteError;
    return { success: true };
  } catch (error) {
    console.error("Error rejecting request:", error);
    return { error };
  }
}

// Cancel an outgoing request (delete it)
export async function cancelRequest(requestId) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not authenticated");

    // Delete the request, ensuring the user is the sender
    const { error: deleteError } = await supabase
      .from('buddies')
      .delete()
      .eq('connection_id', requestId)
      .eq('sender_id', user.id) // Security check
      .eq('status', 'pending');

    if (deleteError) throw deleteError;
    return { success: true };
  } catch (error) {
    console.error("Error cancelling request:", error);
    return { error };
  }
}

// Remove an existing buddy connection (must be 'accepted')
export async function removeBuddy(connectionId) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        console.error('Error getting user:', userError);
        throw new Error('You must be logged in to remove buddies.');
    }

    // Delete the connection where the user is either the sender or recipient
    // and the status is 'accepted'.
    const { error: deleteError } = await supabase
      .from('buddies')
      .delete()
      .eq('connection_id', connectionId)
      .eq('status', 'accepted') // Only remove accepted buddies
      // Security: Ensure the current user is part of this connection
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

    if (deleteError) {
        console.error('Error removing buddy:', deleteError);
        throw new Error('Failed to remove buddy. ' + deleteError.message);
    }

    console.log(`Buddy connection ${connectionId} removed successfully.`);
    // No data to return on successful delete
}