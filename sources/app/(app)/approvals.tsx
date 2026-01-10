/**
 * @file approvals.tsx
 * @input Session data from storage, permission request state from agentState
 * @output Pending approvals list page with permission request cards
 * @pos Phase 2 Remote Control - Central page for viewing and managing all pending permission requests
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的CLAUDE.md。
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnistyles } from 'react-native-unistyles';

import { sessionAllow, sessionDeny } from '@/sync/ops';
import { useAllSessions, useIsDataReady } from '@/sync/storage';
import { Session } from '@/sync/storageTypes';
import { t } from '@/text';
import { getSessionName } from '@/utils/sessionUtils';

interface PendingApproval {
    sessionId: string;
    session: Session;
    permissionId: string;
    toolName: string;
    toolArguments: unknown;
    createdAt: number;
}

/**
 * Approvals page component - displays all pending permission requests across sessions
 */
export default function ApprovalsPage() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const safeArea = useSafeAreaInsets();
    const sessions = useAllSessions();
    const isDataReady = useIsDataReady();
    const [loadingApprovals, setLoadingApprovals] = React.useState<Record<string, 'approve' | 'deny' | null>>({});

    // Extract all pending approvals from sessions
    const pendingApprovals = React.useMemo<PendingApproval[]>(() => {
        if (!sessions) return [];

        const approvals: PendingApproval[] = [];

        for (const session of sessions) {
            // Only include online sessions with pending requests
            if (session.presence !== 'online' || !session.agentState?.requests) {
                continue;
            }

            const requests = session.agentState.requests;
            const completedRequests = session.agentState.completedRequests || {};

            for (const [permId, request] of Object.entries(requests)) {
                // Skip if already completed
                if (completedRequests[permId]) {
                    continue;
                }

                const req = request as { tool: string; arguments: unknown; createdAt?: number | null };
                approvals.push({
                    sessionId: session.id,
                    session,
                    permissionId: permId,
                    toolName: req.tool,
                    toolArguments: req.arguments,
                    createdAt: req.createdAt || Date.now(),
                });
            }
        }

        // Sort by createdAt descending (newest first)
        return approvals.sort((a, b) => b.createdAt - a.createdAt);
    }, [sessions]);

    const handleApprove = React.useCallback(async (sessionId: string, permissionId: string) => {
        const key = `${sessionId}:${permissionId}`;
        if (loadingApprovals[key]) return;

        setLoadingApprovals(prev => ({ ...prev, [key]: 'approve' }));
        try {
            await sessionAllow(sessionId, permissionId);
        } catch (error) {
            console.error('Failed to approve permission:', error);
        } finally {
            setLoadingApprovals(prev => ({ ...prev, [key]: null }));
        }
    }, [loadingApprovals]);

    const handleDeny = React.useCallback(async (sessionId: string, permissionId: string) => {
        const key = `${sessionId}:${permissionId}`;
        if (loadingApprovals[key]) return;

        setLoadingApprovals(prev => ({ ...prev, [key]: 'deny' }));
        try {
            await sessionDeny(sessionId, permissionId);
        } catch (error) {
            console.error('Failed to deny permission:', error);
        } finally {
            setLoadingApprovals(prev => ({ ...prev, [key]: null }));
        }
    }, [loadingApprovals]);

    const renderApprovalCard = React.useCallback(({ item }: { item: PendingApproval }) => {
        const key = `${item.sessionId}:${item.permissionId}`;
        const isLoading = loadingApprovals[key];
        const sessionName = getSessionName(item.session);

        // Calculate time since creation
        const minutesAgo = Math.floor((Date.now() - item.createdAt) / 60000);

        return (
            <View
                testID={`approval-card-${item.permissionId}`}
                style={{
                    backgroundColor: theme.colors.surfaceHigh,
                    borderRadius: 12,
                    padding: 16,
                    marginHorizontal: 16,
                    marginVertical: 8,
                }}
            >
                {/* Header: Session name and tool name */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: theme.dark ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 204, 0, 0.15)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                        }}
                    >
                        <Ionicons name="shield-checkmark" size={20} color="#FFCC00" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>
                            {item.toolName}
                        </Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                            {sessionName}
                        </Text>
                    </View>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                        {minutesAgo < 1 ? 'Just now' : `${minutesAgo}m ago`}
                    </Text>
                </View>

                {/* Tool arguments preview */}
                {item.toolArguments != null && (
                    <View
                        style={{
                            backgroundColor: theme.dark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 12,
                        }}
                    >
                        <Text
                            style={{
                                color: theme.colors.textSecondary,
                                fontSize: 12,
                                fontFamily: 'monospace',
                            }}
                            numberOfLines={3}
                        >
                            {typeof item.toolArguments === 'string'
                                ? item.toolArguments
                                : JSON.stringify(item.toolArguments, null, 2).slice(0, 200)}
                        </Text>
                    </View>
                )}

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable
                        testID={`approval-approve-${item.permissionId}`}
                        onPress={() => handleApprove(item.sessionId, item.permissionId)}
                        disabled={isLoading !== null && isLoading !== undefined}
                        style={{
                            flex: 1,
                            backgroundColor: theme.dark ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.15)',
                            borderRadius: 8,
                            paddingVertical: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            opacity: isLoading && isLoading !== 'approve' ? 0.5 : 1,
                        }}
                    >
                        {isLoading === 'approve' ? (
                            <ActivityIndicator size="small" color="#34C759" />
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={18} color="#34C759" />
                                <Text style={{ color: '#34C759', fontSize: 14, fontWeight: '600', marginLeft: 6 }}>
                                    {t('common.yes')}
                                </Text>
                            </>
                        )}
                    </Pressable>

                    <Pressable
                        testID={`approval-deny-${item.permissionId}`}
                        onPress={() => handleDeny(item.sessionId, item.permissionId)}
                        disabled={isLoading !== null && isLoading !== undefined}
                        style={{
                            flex: 1,
                            backgroundColor: theme.dark ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.15)',
                            borderRadius: 8,
                            paddingVertical: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            opacity: isLoading && isLoading !== 'deny' ? 0.5 : 1,
                        }}
                    >
                        {isLoading === 'deny' ? (
                            <ActivityIndicator size="small" color="#FF3B30" />
                        ) : (
                            <>
                                <Ionicons name="close" size={18} color="#FF3B30" />
                                <Text style={{ color: '#FF3B30', fontSize: 14, fontWeight: '600', marginLeft: 6 }}>
                                    {t('common.no')}
                                </Text>
                            </>
                        )}
                    </Pressable>
                </View>

                {/* View session link */}
                <Pressable
                    testID={`approval-view-session-${item.permissionId}`}
                    onPress={() => router.push(`/session/${item.sessionId}`)}
                    style={{
                        marginTop: 12,
                        paddingVertical: 8,
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ color: theme.colors.textLink, fontSize: 13 }}>
                        {t('approvals.viewSession')}
                    </Text>
                </Pressable>
            </View>
        );
    }, [theme, loadingApprovals, handleApprove, handleDeny, router]);

    // Loading state
    if (!isDataReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface }}>
                <ActivityIndicator size="large" color={theme.colors.textSecondary} />
            </View>
        );
    }

    // Empty state
    if (pendingApprovals.length === 0) {
        return (
            <View
                testID="approvals-empty"
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: theme.colors.surface,
                    paddingHorizontal: 32,
                }}
            >
                <View
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: theme.dark ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 24,
                    }}
                >
                    <Ionicons name="checkmark-circle" size={40} color="#34C759" />
                </View>
                <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '600', textAlign: 'center' }}>
                    {t('approvals.empty')}
                </Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 15, marginTop: 8, textAlign: 'center' }}>
                    {t('approvals.emptyDescription')}
                </Text>
            </View>
        );
    }

    return (
        <FlatList
            testID="approvals-list"
            data={pendingApprovals}
            keyExtractor={(item) => `${item.sessionId}:${item.permissionId}`}
            renderItem={renderApprovalCard}
            contentContainerStyle={{
                paddingTop: 8,
                paddingBottom: safeArea.bottom + 16,
            }}
            style={{ flex: 1, backgroundColor: theme.colors.surface }}
        />
    );
}
