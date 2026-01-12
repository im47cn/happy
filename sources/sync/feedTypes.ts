import { z } from 'zod';

// Access level schema for session sharing
export const AccessLevelSchema = z.enum(['view', 'collaborate']);

// Feed body schema matching backend exactly
// Phase 7: Extended with social features notification types
export const FeedBodySchema = z.discriminatedUnion('kind', [
    // Existing types
    z.object({ kind: z.literal('friend_request'), uid: z.string() }),
    z.object({ kind: z.literal('friend_accepted'), uid: z.string() }),
    z.object({ kind: z.literal('text'), text: z.string() }),
    // Phase 7: Friend management notifications
    z.object({ kind: z.literal('friend_rejected'), uid: z.string() }),
    // Phase 7: Session sharing notifications
    z.object({
        kind: z.literal('session_shared'),
        uid: z.string(), // User who shared the session
        sessionId: z.string(),
        sessionTitle: z.string().optional(), // Encrypted, may not be available
        accessLevel: AccessLevelSchema
    }),
    z.object({
        kind: z.literal('share_permission_changed'),
        sessionId: z.string(),
        sessionTitle: z.string().optional(),
        accessLevel: AccessLevelSchema
    }),
    z.object({
        kind: z.literal('share_revoked'),
        uid: z.string(), // User who revoked the share
        sessionId: z.string(),
        sessionTitle: z.string().optional()
    }),
    z.object({
        kind: z.literal('session_activity'),
        uid: z.string(), // User who sent the message
        sessionId: z.string(),
        sessionTitle: z.string().optional()
    })
]);

export type FeedBody = z.infer<typeof FeedBodySchema>;

// Feed item schema
export const FeedItemSchema = z.object({
    id: z.string(),
    repeatKey: z.string().nullable(),
    body: FeedBodySchema,
    createdAt: z.number(),
    cursor: z.string(),
    counter: z.number()
});

export type FeedItem = z.infer<typeof FeedItemSchema>;

// Feed response schema
export const FeedResponseSchema = z.object({
    items: z.array(z.object({
        id: z.string(),
        body: FeedBodySchema,
        repeatKey: z.string().nullable(),
        cursor: z.string(),
        createdAt: z.number()
    })),
    hasMore: z.boolean()
});

export type FeedResponse = z.infer<typeof FeedResponseSchema>;

// Feed options for API calls
export interface FeedOptions {
    limit?: number;
    before?: string;
    after?: string;
}