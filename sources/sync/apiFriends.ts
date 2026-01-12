import { AuthCredentials } from '@/auth/tokenStorage';
import { backoff } from '@/utils/time';
import { getServerUrl } from './serverConfig';
import {
    UserProfile,
    UserResponse,
    FriendsResponse,
    UsersSearchResponse,
    UserResponseSchema,
    FriendsResponseSchema,
    UsersSearchResponseSchema
} from './friendTypes';

/**
 * Search for users by username (returns multiple results)
 */
export async function searchUsersByUsername(
    credentials: AuthCredentials,
    username: string
): Promise<UserProfile[]> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        const response = await fetch(
            `${API_ENDPOINT}/v1/user/search?${new URLSearchParams({ query: username })}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${credentials.token}`
                }
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                return [];
            }
            throw new Error(`Failed to search users: ${response.status}`);
        }

        const data = await response.json();
        const parsed = UsersSearchResponseSchema.safeParse(data);
        if (!parsed.success) {
            console.error('Failed to parse search response:', parsed.error);
            return [];
        }
        
        return parsed.data.users;
    });
}

/**
 * Get a single user profile by ID
 */
export async function getUserProfile(
    credentials: AuthCredentials,
    userId: string
): Promise<UserProfile | null> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        const response = await fetch(
            `${API_ENDPOINT}/v1/user/${userId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${credentials.token}`
                }
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to get user profile: ${response.status}`);
        }

        const data = await response.json();
        const parsed = UserResponseSchema.safeParse(data);
        if (!parsed.success) {
            console.error('Failed to parse user response:', parsed.error);
            return null;
        }

        return parsed.data.user;
    });
}

/**
 * Get multiple user profiles by IDs (fetches individually)
 */
export async function getUserProfiles(
    credentials: AuthCredentials,
    userIds: string[]
): Promise<UserProfile[]> {
    if (userIds.length === 0) return [];

    // Fetch profiles individually and filter out nulls
    const profiles = await Promise.all(
        userIds.map(id => getUserProfile(credentials, id))
    );
    
    return profiles.filter((profile): profile is UserProfile => profile !== null);
}

/**
 * Add a friend (send request or accept existing request)
 */
export async function sendFriendRequest(
    credentials: AuthCredentials,
    recipientId: string
): Promise<UserProfile | null> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        const response = await fetch(`${API_ENDPOINT}/v1/friends/add`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid: recipientId })
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to add friend: ${response.status}`);
        }

        const data = await response.json();
        const parsed = UserResponseSchema.safeParse(data);
        if (!parsed.success) {
            console.error('Failed to parse add friend response:', parsed.error);
            return null;
        }

        return parsed.data.user;
    });
}

// Note: respondToFriendRequest and getPendingFriendRequests have been removed
// The new API handles friend requests differently:
// - Use sendFriendRequest (which calls /v1/friends/add) to both send and accept requests
// - Use removeFriend to reject or cancel requests
// - Use getFriendsList to get all friends including pending requests

/**
 * Get friends list (includes all statuses: friend, pending, requested)
 */
export async function getFriendsList(
    credentials: AuthCredentials
): Promise<UserProfile[]> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        const response = await fetch(`${API_ENDPOINT}/v1/friends`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${credentials.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get friends list: ${response.status}`);
        }

        const data = await response.json();
        const parsed = FriendsResponseSchema.safeParse(data);
        if (!parsed.success) {
            console.error('Failed to parse friends list:', parsed.error);
            return [];
        }

        return parsed.data.friends;
    });
}

/**
 * Remove a friend (or reject/cancel friend request)
 */
export async function removeFriend(
    credentials: AuthCredentials,
    friendId: string
): Promise<UserProfile | null> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        const response = await fetch(`${API_ENDPOINT}/v1/friends/remove`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid: friendId })
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to remove friend: ${response.status}`);
        }

        const data = await response.json();
        const parsed = UserResponseSchema.safeParse(data);
        if (!parsed.success) {
            console.error('Failed to parse remove friend response:', parsed.error);
            return null;
        }

        return parsed.data.user;
    });
}

// === PHASE 7: FRIEND MANAGEMENT EXTENSIONS ===

/**
 * Reject a friend request (Phase 7)
 * @param credentials - Auth credentials
 * @param userId - User ID whose request to reject
 * @returns true if successful, false otherwise
 */
export async function rejectFriendRequest(
    credentials: AuthCredentials,
    userId: string
): Promise<boolean> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        const response = await fetch(`${API_ENDPOINT}/v1/friends/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid: userId })
        });

        if (!response.ok) {
            console.error(`Failed to reject friend request: ${response.status}`);
            return false;
        }

        return true;
    });
}

/**
 * Block a user (Phase 7)
 * Removes friendship if exists and prevents future interactions
 * @param credentials - Auth credentials
 * @param userId - User ID to block
 * @returns true if successful, false otherwise
 */
export async function blockUser(
    credentials: AuthCredentials,
    userId: string
): Promise<boolean> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        const response = await fetch(`${API_ENDPOINT}/v1/friends/block`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid: userId })
        });

        if (!response.ok) {
            console.error(`Failed to block user: ${response.status}`);
            return false;
        }

        return true;
    });
}

/**
 * Unblock a user (Phase 7)
 * @param credentials - Auth credentials
 * @param userId - User ID to unblock
 * @returns true if successful, false otherwise
 */
export async function unblockUser(
    credentials: AuthCredentials,
    userId: string
): Promise<boolean> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        const response = await fetch(`${API_ENDPOINT}/v1/friends/unblock`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid: userId })
        });

        if (!response.ok) {
            console.error(`Failed to unblock user: ${response.status}`);
            return false;
        }

        return true;
    });
}

/**
 * Get list of blocked users (Phase 7)
 * @param credentials - Auth credentials
 * @returns Array of blocked user profiles
 */
export async function getBlockedList(
    credentials: AuthCredentials
): Promise<UserProfile[]> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        const response = await fetch(`${API_ENDPOINT}/v1/friends/blocked`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${credentials.token}`
            }
        });

        if (!response.ok) {
            console.error(`Failed to get blocked list: ${response.status}`);
            return [];
        }

        const data = await response.json();
        const parsed = FriendsResponseSchema.safeParse({ friends: data.users });
        if (!parsed.success) {
            console.error('Failed to parse blocked list:', parsed.error);
            return [];
        }

        return parsed.data.friends;
    });
}