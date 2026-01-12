/**
 * @file SharedSessionsList.tsx
 * @input Auth credentials from context
 * @output List of sessions shared with the current user
 * @pos Phase 7 Session Sharing - Shared sessions list component
 */

import * as React from 'react';
import { View, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '@/components/StyledText';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';
import { useAuth } from '@/auth/AuthContext';
import { getSharedSessions } from '@/sync/apiSessionShare';
import { SharedSession } from '@/sync/sessionShareTypes';
import { getDisplayName } from '@/sync/friendTypes';
import { Avatar } from '@/components/Avatar';
import { SessionAccessBadge } from '@/components/SessionAccessBadge';
import { useNavigateToSession } from '@/hooks/useNavigateToSession';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '@/components/layout';

// Session metadata is encrypted, so we use the session ID as fallback

export const SharedSessionsList = React.memo(() => {
    const { theme } = useUnistyles();
    const { credentials } = useAuth();
    const navigateToSession = useNavigateToSession();
    const safeArea = useSafeAreaInsets();

    const [sessions, setSessions] = React.useState<SharedSession[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [hasMore, setHasMore] = React.useState(false);
    const [cursor, setCursor] = React.useState<string | null>(null);

    const loadSessions = React.useCallback(async (isRefresh = false) => {
        if (!credentials) return;

        if (isRefresh) {
            setRefreshing(true);
        } else if (!loading) {
            setLoading(true);
        }

        try {
            const result = await getSharedSessions(
                credentials,
                isRefresh ? undefined : cursor ?? undefined
            );
            if (isRefresh) {
                setSessions(result.sessions);
            } else {
                setSessions(prev => [...prev, ...result.sessions]);
            }
            setCursor(result.nextCursor);
            setHasMore(result.hasNext);
        } catch (error) {
            console.error('Failed to load shared sessions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [credentials, cursor, loading]);

    React.useEffect(() => {
        loadSessions(true);
    }, [credentials]);

    const handleRefresh = React.useCallback(() => {
        loadSessions(true);
    }, [loadSessions]);

    const handleLoadMore = React.useCallback(() => {
        if (hasMore && !loading) {
            loadSessions(false);
        }
    }, [hasMore, loading, loadSessions]);

    const renderItem = React.useCallback(({ item }: { item: SharedSession }) => (
        <SharedSessionItem
            session={item}
            onPress={() => navigateToSession(item.id)}
        />
    ), [navigateToSession]);

    const keyExtractor = React.useCallback((item: SharedSession) => item.id, []);

    if (loading && sessions.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.textSecondary} />
            </View>
        );
    }

    if (sessions.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                    {t('sessionSharing.noSharedSessions')}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                <FlatList
                    data={sessions}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={theme.colors.textSecondary}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={{
                        paddingBottom: safeArea.bottom + 16,
                        paddingTop: 8,
                    }}
                    ListFooterComponent={
                        loading && sessions.length > 0 ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                            </View>
                        ) : null
                    }
                />
            </View>
        </View>
    );
});

// Individual shared session item
function SharedSessionItem({
    session,
    onPress,
}: {
    session: SharedSession;
    onPress: () => void;
}) {
    // Session metadata is encrypted, use session ID for avatar
    const sessionName = t('sessionSharing.mySessions'); // Generic name for shared session
    const avatarId = session.id;

    const ownerName = getDisplayName({
        id: session.owner.id,
        firstName: session.owner.firstName,
        lastName: session.owner.lastName,
        username: session.owner.username,
        avatar: session.owner.avatar,
        bio: null,
        status: 'friend',
    });

    return (
        <Pressable style={styles.sessionCard} onPress={onPress}>
            <Avatar id={avatarId} size={48} />
            <View style={styles.sessionContent}>
                <View style={styles.sessionHeader}>
                    <Text style={styles.sessionTitle} numberOfLines={1}>
                        {sessionName}
                    </Text>
                    <SessionAccessBadge accessLevel={session.accessLevel} size="small" />
                </View>
                <Text style={styles.sessionSubtitle} numberOfLines={1}>
                    {t('sessionSharing.sharedBy', { name: ownerName })}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'stretch',
        backgroundColor: theme.colors.groupped.background,
    },
    contentContainer: {
        flex: 1,
        maxWidth: layout.maxWidth,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 32,
        backgroundColor: theme.colors.groupped.background,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        backgroundColor: theme.colors.groupped.background,
    },
    emptyText: {
        ...Typography.default(),
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    sessionCard: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: 16,
        marginBottom: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    sessionContent: {
        flex: 1,
        marginLeft: 12,
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sessionTitle: {
        ...Typography.default('semiBold'),
        fontSize: 15,
        color: theme.colors.text,
        flex: 1,
    },
    sessionSubtitle: {
        ...Typography.default(),
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    footerLoader: {
        paddingVertical: 16,
        alignItems: 'center',
    },
}));
