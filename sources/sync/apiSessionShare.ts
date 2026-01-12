/**
 * @file apiSessionShare.ts
 * @input AuthCredentials, session/share IDs, access levels
 * @output Session sharing API operations
 * @pos API client for Phase 7 session sharing feature
 */

import { AuthCredentials } from '@/auth/tokenStorage';
import { backoff } from '@/utils/time';
import { getServerUrl } from './serverConfig';
import {
    AccessLevel,
    SessionShareRecord,
    SharedSession,
    SessionShareResponseSchema,
    SessionShareListResponseSchema,
    SharedSessionsResponseSchema
} from './sessionShareTypes';

/**
 * Create a session share with a friend
 * @param credentials - Auth credentials
 * @param sessionId - ID of session to share
 * @param friendId - ID of friend to share with
 * @param accessLevel - Access level: 'view' or 'collaborate'
 * @returns Share record or null on error
 */
export async function createSessionShare(
    credentials: AuthCredentials,
    sessionId: string,
    friendId: string,
    accessLevel: AccessLevel
): Promise<SessionShareRecord | null> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        const response = await fetch(`${API_ENDPOINT}/v1/sessions/${sessionId}/shares`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ friendId, accessLevel })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error(`Failed to create session share: ${response.status}`, error);
            return null;
        }

        const data = await response.json();
        const parsed = SessionShareResponseSchema.safeParse(data);
        if (!parsed.success) {
            console.error('Failed to parse session share response:', parsed.error);
            return null;
        }

        return parsed.data.share;
    });
}

/**
 * Update session share access level
 * @param credentials - Auth credentials
 * @param sessionId - ID of the session
 * @param shareId - ID of the share record
 * @param accessLevel - New access level: 'view' or 'collaborate'
 * @returns Updated share record or null on error
 */
export async function updateSessionShare(
    credentials: AuthCredentials,
    sessionId: string,
    shareId: string,
    accessLevel: AccessLevel
): Promise<SessionShareRecord | null> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        const response = await fetch(`${API_ENDPOINT}/v1/sessions/${sessionId}/shares/${shareId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${credentials.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accessLevel })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error(`Failed to update session share: ${response.status}`, error);
            return null;
        }

        const data = await response.json();
        const parsed = SessionShareResponseSchema.safeParse(data);
        if (!parsed.success) {
            console.error('Failed to parse session share update response:', parsed.error);
            return null;
        }

        return parsed.data.share;
    });
}

/**
 * Revoke a session share
 * @param credentials - Auth credentials
 * @param sessionId - ID of the session
 * @param shareId - ID of the share record to revoke
 * @returns true if successful, false otherwise
 */
export async function revokeSessionShare(
    credentials: AuthCredentials,
    sessionId: string,
    shareId: string
): Promise<boolean> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        const response = await fetch(`${API_ENDPOINT}/v1/sessions/${sessionId}/shares/${shareId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${credentials.token}`
            }
        });

        if (!response.ok) {
            console.error(`Failed to revoke session share: ${response.status}`);
            return false;
        }

        return true;
    });
}

/**
 * Get all shares for a session (owner only)
 * @param credentials - Auth credentials
 * @param sessionId - ID of the session
 * @returns Array of share records
 */
export async function getSessionShares(
    credentials: AuthCredentials,
    sessionId: string
): Promise<SessionShareRecord[]> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        const response = await fetch(`${API_ENDPOINT}/v1/sessions/${sessionId}/shares`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${credentials.token}`
            }
        });

        if (!response.ok) {
            console.error(`Failed to get session shares: ${response.status}`);
            return [];
        }

        const data = await response.json();
        const parsed = SessionShareListResponseSchema.safeParse(data);
        if (!parsed.success) {
            console.error('Failed to parse session shares response:', parsed.error);
            return [];
        }

        return parsed.data.shares || [];
    });
}

/**
 * Get sessions shared with me (paginated)
 * @param credentials - Auth credentials
 * @param cursor - Pagination cursor (optional)
 * @param limit - Number of results per page (default 50)
 * @returns Paginated list of shared sessions
 */
export async function getSharedSessions(
    credentials: AuthCredentials,
    cursor?: string,
    limit: number = 50
): Promise<{ sessions: SharedSession[]; nextCursor: string | null; hasNext: boolean }> {
    const API_ENDPOINT = getServerUrl();

    return await backoff(async () => {
        const params = new URLSearchParams();
        params.set('limit', limit.toString());
        if (cursor) {
            params.set('cursor', cursor);
        }

        const response = await fetch(`${API_ENDPOINT}/v1/sessions/shared?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${credentials.token}`
            }
        });

        if (!response.ok) {
            console.error(`Failed to get shared sessions: ${response.status}`);
            return { sessions: [], nextCursor: null, hasNext: false };
        }

        const data = await response.json();
        const parsed = SharedSessionsResponseSchema.safeParse(data);
        if (!parsed.success) {
            console.error('Failed to parse shared sessions response:', parsed.error);
            return { sessions: [], nextCursor: null, hasNext: false };
        }

        return {
            sessions: parsed.data.sessions,
            nextCursor: parsed.data.nextCursor,
            hasNext: parsed.data.hasNext
        };
    });
}
