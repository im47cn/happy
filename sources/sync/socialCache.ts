/**
 * @file socialCache.ts
 * @input MMKV storage, friends data, shared sessions data
 * @output Offline cache for social features (friends list, shared sessions)
 * @pos Phase 7 offline capability for social features
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的CLAUDE.md。
 */

import { MMKV } from 'react-native-mmkv';
import { UserProfile } from './friendTypes';
import { SharedSession } from './sessionShareTypes';

// Constants
const CACHE_PREFIX = 'social:';
const FRIENDS_KEY = `${CACHE_PREFIX}friends`;
const FRIENDS_TIMESTAMP_KEY = `${CACHE_PREFIX}friends:timestamp`;
const SHARED_SESSIONS_KEY = `${CACHE_PREFIX}shared_sessions`;
const SHARED_SESSIONS_TIMESTAMP_KEY = `${CACHE_PREFIX}shared_sessions:timestamp`;

// Cache expiry (24 hours in milliseconds)
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Create dedicated MMKV instance for social cache
const socialStorage = new MMKV({ id: 'social-cache' });

/**
 * Social Cache Manager
 * Provides persistent storage for social features with automatic expiry
 */
class SocialCacheManager {
    /**
     * Save friends list to cache
     */
    saveFriends(friends: UserProfile[]): void {
        try {
            const data = JSON.stringify(friends);
            socialStorage.set(FRIENDS_KEY, data);
            socialStorage.set(FRIENDS_TIMESTAMP_KEY, Date.now().toString());
        } catch (error) {
            console.error('❌ SocialCache: Failed to save friends:', error);
        }
    }

    /**
     * Load friends list from cache
     * @returns Friends list or null if cache is expired/missing
     */
    loadFriends(): UserProfile[] | null {
        try {
            const timestamp = socialStorage.getString(FRIENDS_TIMESTAMP_KEY);
            if (!timestamp) {
                return null;
            }

            const cachedAt = parseInt(timestamp, 10);
            if (Date.now() - cachedAt > CACHE_EXPIRY_MS) {
                // Cache expired
                this.clearFriends();
                return null;
            }

            const data = socialStorage.getString(FRIENDS_KEY);
            if (!data) {
                return null;
            }

            const friends: UserProfile[] = JSON.parse(data);
            return friends;
        } catch (error) {
            console.error('❌ SocialCache: Failed to load friends:', error);
            return null;
        }
    }

    /**
     * Clear friends cache
     */
    clearFriends(): void {
        try {
            socialStorage.delete(FRIENDS_KEY);
            socialStorage.delete(FRIENDS_TIMESTAMP_KEY);
        } catch (error) {
            console.error('❌ SocialCache: Failed to clear friends:', error);
        }
    }

    /**
     * Check if friends cache is valid (exists and not expired)
     */
    isFriendsCacheValid(): boolean {
        try {
            const timestamp = socialStorage.getString(FRIENDS_TIMESTAMP_KEY);
            if (!timestamp) {
                return false;
            }

            const cachedAt = parseInt(timestamp, 10);
            return Date.now() - cachedAt <= CACHE_EXPIRY_MS;
        } catch {
            return false;
        }
    }

    /**
     * Get friends cache age in milliseconds
     * @returns Age in ms or -1 if no cache exists
     */
    getFriendsCacheAge(): number {
        try {
            const timestamp = socialStorage.getString(FRIENDS_TIMESTAMP_KEY);
            if (!timestamp) {
                return -1;
            }
            return Date.now() - parseInt(timestamp, 10);
        } catch {
            return -1;
        }
    }

    /**
     * Save shared sessions to cache
     */
    saveSharedSessions(sessions: SharedSession[]): void {
        try {
            const data = JSON.stringify(sessions);
            socialStorage.set(SHARED_SESSIONS_KEY, data);
            socialStorage.set(SHARED_SESSIONS_TIMESTAMP_KEY, Date.now().toString());
        } catch (error) {
            console.error('❌ SocialCache: Failed to save shared sessions:', error);
        }
    }

    /**
     * Load shared sessions from cache
     * @returns Shared sessions list or null if cache is expired/missing
     */
    loadSharedSessions(): SharedSession[] | null {
        try {
            const timestamp = socialStorage.getString(SHARED_SESSIONS_TIMESTAMP_KEY);
            if (!timestamp) {
                return null;
            }

            const cachedAt = parseInt(timestamp, 10);
            if (Date.now() - cachedAt > CACHE_EXPIRY_MS) {
                // Cache expired
                this.clearSharedSessions();
                return null;
            }

            const data = socialStorage.getString(SHARED_SESSIONS_KEY);
            if (!data) {
                return null;
            }

            const sessions: SharedSession[] = JSON.parse(data);
            return sessions;
        } catch (error) {
            console.error('❌ SocialCache: Failed to load shared sessions:', error);
            return null;
        }
    }

    /**
     * Clear shared sessions cache
     */
    clearSharedSessions(): void {
        try {
            socialStorage.delete(SHARED_SESSIONS_KEY);
            socialStorage.delete(SHARED_SESSIONS_TIMESTAMP_KEY);
        } catch (error) {
            console.error('❌ SocialCache: Failed to clear shared sessions:', error);
        }
    }

    /**
     * Check if shared sessions cache is valid
     */
    isSharedSessionsCacheValid(): boolean {
        try {
            const timestamp = socialStorage.getString(SHARED_SESSIONS_TIMESTAMP_KEY);
            if (!timestamp) {
                return false;
            }

            const cachedAt = parseInt(timestamp, 10);
            return Date.now() - cachedAt <= CACHE_EXPIRY_MS;
        } catch {
            return false;
        }
    }

    /**
     * Get shared sessions cache age in milliseconds
     * @returns Age in ms or -1 if no cache exists
     */
    getSharedSessionsCacheAge(): number {
        try {
            const timestamp = socialStorage.getString(SHARED_SESSIONS_TIMESTAMP_KEY);
            if (!timestamp) {
                return -1;
            }
            return Date.now() - parseInt(timestamp, 10);
        } catch {
            return -1;
        }
    }

    /**
     * Clear all social caches
     */
    clearAll(): void {
        this.clearFriends();
        this.clearSharedSessions();
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        friendsCount: number;
        friendsCacheAge: number;
        sharedSessionsCount: number;
        sharedSessionsCacheAge: number;
    } {
        const friends = this.loadFriends();
        const sharedSessions = this.loadSharedSessions();

        return {
            friendsCount: friends?.length ?? 0,
            friendsCacheAge: this.getFriendsCacheAge(),
            sharedSessionsCount: sharedSessions?.length ?? 0,
            sharedSessionsCacheAge: this.getSharedSessionsCacheAge()
        };
    }
}

// Export singleton instance
export const socialCache = new SocialCacheManager();

// Export for testing
export { SocialCacheManager };
