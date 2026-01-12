/**
 * @file SessionCollaboratorList.tsx
 * @input sessionId, shares data, onUpdate/onRevoke callbacks
 * @output List of collaborators with permission management
 * @pos Phase 7 Session Sharing - Collaborator list component for session owners
 */

import * as React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';
import { SessionShareRecord, AccessLevel } from '@/sync/sessionShareTypes';
import { getDisplayName } from '@/sync/friendTypes';
import { Avatar } from '@/components/Avatar';
import { SessionAccessBadge } from '@/components/SessionAccessBadge';
import { Modal } from '@/modal';
import Ionicons from '@expo/vector-icons/Ionicons';

export type SessionCollaboratorListProps = {
    shares: SessionShareRecord[];
    loading?: boolean;
    onUpdatePermission: (shareId: string, newLevel: AccessLevel) => Promise<void>;
    onRevokeAccess: (shareId: string, userName: string) => Promise<void>;
};

export function SessionCollaboratorList({
    shares,
    loading = false,
    onUpdatePermission,
    onRevokeAccess,
}: SessionCollaboratorListProps) {
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" />
            </View>
        );
    }

    if (shares.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                    {t('sessionSharing.noCollaborators')}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('sessionSharing.collaborators')}</Text>
            <ScrollView style={styles.list}>
                {shares.map((share) => (
                    <CollaboratorItem
                        key={share.id}
                        share={share}
                        onUpdatePermission={onUpdatePermission}
                        onRevokeAccess={onRevokeAccess}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

function CollaboratorItem({
    share,
    onUpdatePermission,
    onRevokeAccess,
}: {
    share: SessionShareRecord;
    onUpdatePermission: (shareId: string, newLevel: AccessLevel) => Promise<void>;
    onRevokeAccess: (shareId: string, userName: string) => Promise<void>;
}) {
    const [isUpdating, setIsUpdating] = React.useState(false);
    const user = share.sharedWithUser;

    if (!user) {
        return null;
    }

    const displayName = getDisplayName({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        avatar: user.avatar,
        bio: null,
        status: 'friend',
    });
    const avatarUrl = user.avatar?.url || user.avatar?.path;

    const handleChangePermission = async () => {
        const newLevel: AccessLevel = share.accessLevel === 'view' ? 'collaborate' : 'view';
        setIsUpdating(true);
        try {
            await onUpdatePermission(share.id, newLevel);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRevokeAccess = async () => {
        const confirmed = await Modal.confirm(
            t('sessionSharing.revokeAccess'),
            t('sessionSharing.revokeAccessConfirm', { name: displayName }),
            {
                confirmText: t('sessionSharing.revokeAccess'),
                destructive: true,
            }
        );
        if (confirmed) {
            await onRevokeAccess(share.id, displayName);
        }
    };

    return (
        <View style={styles.collaboratorItem}>
            <Avatar
                id={user.id}
                size={40}
                imageUrl={avatarUrl}
                thumbhash={user.avatar?.thumbhash}
            />
            <View style={styles.collaboratorInfo}>
                <Text style={styles.collaboratorName} numberOfLines={1}>
                    {displayName}
                </Text>
                <Text style={styles.collaboratorUsername} numberOfLines={1}>
                    @{user.username}
                </Text>
            </View>
            <SessionAccessBadge accessLevel={share.accessLevel} />
            <View style={styles.actions}>
                <Pressable
                    style={styles.actionButton}
                    onPress={handleChangePermission}
                    disabled={isUpdating}
                >
                    {isUpdating ? (
                        <ActivityIndicator size="small" />
                    ) : (
                        <Ionicons name="swap-horizontal" size={20} color="#007AFF" />
                    )}
                </Pressable>
                <Pressable
                    style={styles.actionButton}
                    onPress={handleRevokeAccess}
                >
                    <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
    },
    loadingContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        ...Typography.default(),
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    title: {
        ...Typography.default('semiBold'),
        fontSize: 16,
        color: theme.colors.text,
        marginBottom: 12,
    },
    list: {
        maxHeight: 300,
    },
    collaboratorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    collaboratorInfo: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    collaboratorName: {
        ...Typography.default('semiBold'),
        fontSize: 15,
        color: theme.colors.text,
    },
    collaboratorUsername: {
        ...Typography.default(),
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
    },
}));
