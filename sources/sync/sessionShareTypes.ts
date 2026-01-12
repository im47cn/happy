/**
 * @file sessionShareTypes.ts
 * @input N/A (type definitions)
 * @output Session sharing type definitions for Phase 7
 * @pos Type definitions for session sharing feature
 */

import * as z from 'zod';

//
// Access Level
//

export const AccessLevelSchema = z.enum(['view', 'collaborate']);
export type AccessLevel = z.infer<typeof AccessLevelSchema>;

//
// Session Share Record
//

export const SessionShareRecordSchema = z.object({
    id: z.string(),
    sessionId: z.string(),
    ownerId: z.string(),
    sharedWithId: z.string(),
    sharedWithUser: z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string().nullable(),
        username: z.string(),
        avatar: z.object({
            path: z.string(),
            url: z.string(),
            width: z.number().optional(),
            height: z.number().optional(),
            thumbhash: z.string().optional()
        }).nullable()
    }).optional(),
    accessLevel: AccessLevelSchema,
    sharedAt: z.number(),
    updatedAt: z.number()
});

export type SessionShareRecord = z.infer<typeof SessionShareRecordSchema>;

//
// Shared Session (session shared with me)
//

export const SharedSessionSchema = z.object({
    id: z.string(),
    seq: z.number(),
    createdAt: z.number(),
    updatedAt: z.number(),
    active: z.boolean(),
    activeAt: z.number(),
    metadata: z.string(),
    metadataVersion: z.number(),
    dataEncryptionKey: z.string().nullable(),
    // Sharing info
    shareId: z.string(),
    accessLevel: AccessLevelSchema,
    sharedAt: z.number(),
    owner: z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string().nullable(),
        username: z.string(),
        avatar: z.object({
            path: z.string(),
            url: z.string(),
            width: z.number().optional(),
            height: z.number().optional(),
            thumbhash: z.string().optional()
        }).nullable()
    })
});

export type SharedSession = z.infer<typeof SharedSessionSchema>;

//
// API Response Types
//

export const SessionShareResponseSchema = z.object({
    share: SessionShareRecordSchema
});

export type SessionShareResponse = z.infer<typeof SessionShareResponseSchema>;

export const SessionShareListResponseSchema = z.object({
    success: z.boolean(),
    shares: z.array(SessionShareRecordSchema).optional()
});

export type SessionShareListResponse = z.infer<typeof SessionShareListResponseSchema>;

export const SharedSessionsResponseSchema = z.object({
    sessions: z.array(SharedSessionSchema),
    nextCursor: z.string().nullable(),
    hasNext: z.boolean()
});

export type SharedSessionsResponse = z.infer<typeof SharedSessionsResponseSchema>;

//
// Utility functions
//

export function isCollaborator(accessLevel: AccessLevel): boolean {
    return accessLevel === 'collaborate';
}

export function isViewer(accessLevel: AccessLevel): boolean {
    return accessLevel === 'view';
}

export function canEdit(accessLevel: AccessLevel): boolean {
    return accessLevel === 'collaborate';
}
