import { supabase } from "../lib/supabase";

// Get all buddies (Accepted & Pending)
export async function getMyBuddies() {

}

// Get pending requests
export async function getPendingBuddies() {

}

// Send a buddy request
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

// Accept requests
export async function acceptBuddyRequest() {

}

// Reject requests
export async function rejectBuddyRequest() {

}