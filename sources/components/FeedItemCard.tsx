/**
 * @file FeedItemCard.tsx
 * @input FeedItem from feedTypes.ts
 * @output Notification card component with type-specific rendering and quick actions
 * @pos Phase 7 Social Features - Extended notification card with accept/reject actions
 */

import * as React from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components/StyledText';
import { FeedItem } from '@/sync/feedTypes';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/text';
import { useRouter } from 'expo-router';
import { useUser } from '@/sync/storage';
import { useAuth } from '@/auth/AuthContext';
import { Avatar } from './Avatar';
import { Item } from './Item';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { sendFriendRequest, rejectFriendRequest } from '@/sync/apiFriends';
import { SessionAccessBadge } from './SessionAccessBadge';

interface FeedItemCardProps {
    item: FeedItem;
    /** Callback when item state changes (e.g., friend request accepted/rejected) */
    onItemStateChange?: (itemId: string) => void;
}

export const FeedItemCard = React.memo(({ item, onItemStateChange }: FeedItemCardProps) => {
    const { theme } = useUnistyles();
    const router = useRouter();
    const { credentials } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);
    const [actionTaken, setActionTaken] = React.useState<'accepted' | 'rejected' | null>(null);

    // Get user profile from global users cache for user-related items
    const userIdFromBody = React.useMemo(() => {
        if ('uid' in item.body) {
            return item.body.uid;
        }
        return undefined;
    }, [item.body]);

    const user = useUser(userIdFromBody);

    const getTimeAgo = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return t('time.justNow');
        if (minutes < 60) return t('time.minutesAgo', { count: minutes });
        if (hours < 24) return t('time.hoursAgo', { count: hours });
        return t('sessionHistory.daysAgo', { count: days });
    };

    // Handle accept friend request
    const handleAcceptRequest = React.useCallback(async () => {
        if (!credentials || !userIdFromBody || isLoading) return;

        setIsLoading(true);
        try {
            await sendFriendRequest(credentials, userIdFromBody);
            setActionTaken('accepted');
            onItemStateChange?.(item.id);
        } catch (error) {
            console.error('Failed to accept friend request:', error);
        } finally {
            setIsLoading(false);
        }
    }, [credentials, userIdFromBody, isLoading, item.id, onItemStateChange]);

    // Handle reject friend request
    const handleRejectRequest = React.useCallback(async () => {
        if (!credentials || !userIdFromBody || isLoading) return;

        setIsLoading(true);
        try {
            await rejectFriendRequest(credentials, userIdFromBody);
            setActionTaken('rejected');
            onItemStateChange?.(item.id);
        } catch (error) {
            console.error('Failed to reject friend request:', error);
        } finally {
            setIsLoading(false);
        }
    }, [credentials, userIdFromBody, isLoading, item.id, onItemStateChange]);

    // Helper to get user display name
    const getUserDisplayName = () => {
        if (!user) return t('feed.unknownUser');
        return user.firstName || user.username || t('feed.unknownUser');
    };

    // Helper to get session title with fallback
    const getSessionTitle = (sessionTitle: string | undefined, sessionId: string) => {
        return sessionTitle || t('feed.session');
    };

    // Render avatar element
    const renderAvatarElement = (iconName: keyof typeof Ionicons.glyphMap = 'person', iconColor?: string) => {
        if (user?.avatar) {
            return (
                <Avatar
                    id={user.id}
                    imageUrl={user.avatar.url}
                    size={40}
                />
            );
        }
        return (
            <Ionicons
                name={iconName}
                size={20}
                color={iconColor || theme.colors.textSecondary}
            />
        );
    };

    switch (item.body.kind) {
        case 'friend_request': {
            // If action was taken, show confirmation
            if (actionTaken) {
                return (
                    <Item
                        title={actionTaken === 'accepted'
                            ? t('feed.friendRequestAcceptedConfirm', { name: getUserDisplayName() })
                            : t('feed.friendRequestRejectedConfirm', { name: getUserDisplayName() })
                        }
                        subtitle={getTimeAgo(item.createdAt)}
                        leftElement={renderAvatarElement(
                            actionTaken === 'accepted' ? 'checkmark-circle' : 'close-circle',
                            actionTaken === 'accepted' ? theme.colors.status.connected : theme.colors.textSecondary
                        )}
                        showChevron={false}
                    />
                );
            }

            return (
                <View style={styles.friendRequestContainer} testID="feed-item-friend-request">
                    <Pressable
                        style={styles.friendRequestContent}
                        onPress={() => router.push(`/user/${user?.id}`)}
                    >
                        <View style={styles.avatarContainer}>
                            {renderAvatarElement()}
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title} numberOfLines={2}>
                                {t('feed.friendRequestFrom', { name: getUserDisplayName() })}
                            </Text>
                            <Text style={styles.subtitle}>
                                {getTimeAgo(item.createdAt)}
                            </Text>
                        </View>
                    </Pressable>
                    <View style={styles.actionsContainer}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                        ) : (
                            <>
                                <Pressable
                                    style={[styles.actionButton, styles.acceptButton]}
                                    onPress={handleAcceptRequest}
                                    testID="feed-friend-request-accept-button"
                                >
                                    <Ionicons name="checkmark" size={18} color="#fff" />
                                </Pressable>
                                <Pressable
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={handleRejectRequest}
                                    testID="feed-friend-request-reject-button"
                                >
                                    <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
                                </Pressable>
                            </>
                        )}
                    </View>
                </View>
            );
        }

        case 'friend_accepted': {
            return (
                <Item
                    title={t('feed.friendAccepted', { name: getUserDisplayName() })}
                    subtitle={getTimeAgo(item.createdAt)}
                    leftElement={renderAvatarElement('checkmark-circle', theme.colors.status.connected)}
                    onPress={() => router.push(`/user/${user?.id}`)}
                    showChevron={true}
                    testID="feed-item-friend-accepted"
                />
            );
        }

        // Phase 7: Friend rejected notification
        case 'friend_rejected': {
            return (
                <Item
                    title={t('feed.friendRejected', { name: getUserDisplayName() })}
                    subtitle={getTimeAgo(item.createdAt)}
                    leftElement={renderAvatarElement('close-circle', theme.colors.textSecondary)}
                    onPress={() => router.push(`/user/${user?.id}`)}
                    showChevron={true}
                    testID="feed-item-friend-rejected"
                />
            );
        }

        // Phase 7: Session shared notification
        case 'session_shared': {
            const { sessionId } = item.body;
            const sessionTitle = getSessionTitle(item.body.sessionTitle, sessionId);

            return (
                <View style={styles.sessionNotificationContainer} testID="feed-item-session-shared">
                    <Pressable
                        style={styles.sessionNotificationContent}
                        onPress={() => router.push(`/session/${sessionId}`)}
                    >
                        <View style={styles.avatarContainer}>
                            {renderAvatarElement('share-outline', theme.colors.textLink)}
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title} numberOfLines={2}>
                                {t('feed.sessionShared', { name: getUserDisplayName() })}
                            </Text>
                            <View style={styles.sessionInfoRow}>
                                <Text style={styles.sessionTitle} numberOfLines={1}>
                                    {sessionTitle}
                                </Text>
                                <SessionAccessBadge accessLevel={item.body.accessLevel} size="small" />
                            </View>
                            <Text style={styles.subtitle}>
                                {getTimeAgo(item.createdAt)}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </Pressable>
                </View>
            );
        }

        // Phase 7: Share permission changed notification
        case 'share_permission_changed': {
            const { sessionId, accessLevel } = item.body;
            const sessionTitle = getSessionTitle(item.body.sessionTitle, sessionId);
            const accessLevelText = accessLevel === 'view'
                ? t('sessionSharing.accessLevel.view')
                : t('sessionSharing.accessLevel.collaborate');

            return (
                <View style={styles.sessionNotificationContainer} testID="feed-item-share-permission-changed">
                    <Pressable
                        style={styles.sessionNotificationContent}
                        onPress={() => router.push(`/session/${sessionId}`)}
                    >
                        <View style={styles.avatarContainer}>
                            <Ionicons name="settings-outline" size={20} color={theme.colors.textLink} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title} numberOfLines={2}>
                                {t('feed.sharePermissionChanged', { sessionTitle, accessLevel: accessLevelText })}
                            </Text>
                            <View style={styles.sessionInfoRow}>
                                <SessionAccessBadge accessLevel={accessLevel} size="small" />
                            </View>
                            <Text style={styles.subtitle}>
                                {getTimeAgo(item.createdAt)}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </Pressable>
                </View>
            );
        }

        // Phase 7: Share revoked notification
        case 'share_revoked': {
            const sessionTitle = getSessionTitle(item.body.sessionTitle, item.body.sessionId);

            return (
                <Item
                    title={t('feed.shareRevoked', { name: getUserDisplayName(), sessionTitle })}
                    subtitle={getTimeAgo(item.createdAt)}
                    leftElement={renderAvatarElement('remove-circle-outline', theme.colors.status.error)}
                    showChevron={false}
                    testID="feed-item-share-revoked"
                />
            );
        }

        // Phase 7: Session activity notification
        case 'session_activity': {
            const { sessionId } = item.body;
            const sessionTitle = getSessionTitle(item.body.sessionTitle, sessionId);

            return (
                <Item
                    title={t('feed.sessionActivity', { name: getUserDisplayName(), sessionTitle })}
                    subtitle={getTimeAgo(item.createdAt)}
                    leftElement={renderAvatarElement('chatbubble-outline', theme.colors.textLink)}
                    onPress={() => router.push(`/session/${sessionId}`)}
                    showChevron={true}
                    testID="feed-item-session-activity"
                />
            );
        }

        case 'text':
            return (
                <Item
                    title={item.body.text}
                    subtitle={getTimeAgo(item.createdAt)}
                    icon={<Ionicons name="information-circle" size={20} color={theme.colors.textSecondary} />}
                    showChevron={false}
                    testID="feed-item-text"
                />
            );

        default:
            return null;
    }
});

const styles = StyleSheet.create((theme) => ({
    // Friend request with actions
    friendRequestContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 60,
    },
    friendRequestContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        ...Typography.default('semiBold'),
        fontSize: 15,
        color: theme.colors.text,
    },
    subtitle: {
        ...Typography.default(),
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: theme.colors.status.connected,
    },
    rejectButton: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.divider,
    },
    // Session notification styles
    sessionNotificationContainer: {
        backgroundColor: theme.colors.surface,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    sessionNotificationContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sessionInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    sessionTitle: {
        ...Typography.default(),
        fontSize: 13,
        color: theme.colors.textSecondary,
        flex: 1,
    },
}));
