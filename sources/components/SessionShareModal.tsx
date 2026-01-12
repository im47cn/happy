/**
 * @file SessionShareModal.tsx
 * @input onClose callback, onShare callback
 * @output Modal for selecting friend and permission level to share a session
 * @pos Phase 7 Session Sharing - Share session modal component
 */

import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';
import { useAcceptedFriends } from '@/sync/storage';
import { UserProfile, getDisplayName } from '@/sync/friendTypes';
import { AccessLevel } from '@/sync/sessionShareTypes';
import { Avatar } from '@/components/Avatar';
import { RoundButton } from '@/components/RoundButton';
import { Item } from '@/components/Item';

export type SessionShareModalProps = {
    onClose: () => void;
    onShare: (friendId: string, accessLevel: AccessLevel) => Promise<void>;
    /** IDs of friends already shared with (to exclude from list) */
    excludeFriendIds?: string[];
};

export function SessionShareModal({
    onClose,
    onShare,
    excludeFriendIds = [],
}: SessionShareModalProps) {
    const friends = useAcceptedFriends();
    const [selectedFriend, setSelectedFriend] = React.useState<UserProfile | null>(null);
    const [selectedLevel, setSelectedLevel] = React.useState<AccessLevel>('view');
    const [isSharing, setIsSharing] = React.useState(false);

    // Filter out friends already shared with
    const availableFriends = React.useMemo(() => {
        const excludeSet = new Set(excludeFriendIds);
        return friends.filter(f => !excludeSet.has(f.id));
    }, [friends, excludeFriendIds]);

    const handleShare = React.useCallback(async () => {
        if (!selectedFriend || isSharing) return;

        setIsSharing(true);
        try {
            await onShare(selectedFriend.id, selectedLevel);
            onClose();
        } catch (error) {
            console.error('Failed to share session:', error);
        } finally {
            setIsSharing(false);
        }
    }, [selectedFriend, selectedLevel, isSharing, onShare, onClose]);

    // Step 1: Friend selection
    if (!selectedFriend) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>{t('sessionSharing.shareSession')}</Text>
                <Text style={styles.subtitle}>{t('sessionSharing.selectFriend')}</Text>

                {availableFriends.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            {t('sessionSharing.noFriendsToShare')}
                        </Text>
                    </View>
                ) : (
                    <ScrollView style={styles.friendList}>
                        {availableFriends.map((friend) => (
                            <FriendSelectItem
                                key={friend.id}
                                friend={friend}
                                onSelect={() => setSelectedFriend(friend)}
                            />
                        ))}
                    </ScrollView>
                )}

                <View style={styles.buttonRow}>
                    <RoundButton
                        title={t('common.cancel')}
                        onPress={onClose}
                        size="normal"
                        style={styles.cancelButton}
                    />
                </View>
            </View>
        );
    }

    // Step 2: Permission selection
    const friendName = getDisplayName(selectedFriend);
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('sessionSharing.shareWith', { name: friendName })}</Text>
            <Text style={styles.subtitle}>{t('sessionSharing.selectPermission')}</Text>

            <View style={styles.permissionList}>
                <PermissionOption
                    level="view"
                    selected={selectedLevel === 'view'}
                    onSelect={() => setSelectedLevel('view')}
                />
                <PermissionOption
                    level="collaborate"
                    selected={selectedLevel === 'collaborate'}
                    onSelect={() => setSelectedLevel('collaborate')}
                />
            </View>

            <View style={styles.buttonRow}>
                <RoundButton
                    title={t('common.back')}
                    onPress={() => setSelectedFriend(null)}
                    size="normal"
                    style={styles.cancelButton}
                />
                <RoundButton
                    title={t('sessionSharing.shareSession')}
                    onPress={handleShare}
                    size="normal"
                    loading={isSharing}
                    style={styles.shareButton}
                />
            </View>
        </View>
    );
}

// Friend selection item component
function FriendSelectItem({
    friend,
    onSelect,
}: {
    friend: UserProfile;
    onSelect: () => void;
}) {
    const displayName = getDisplayName(friend);
    const avatarUrl = friend.avatar?.url || friend.avatar?.path;

    return (
        <Item
            title={displayName}
            subtitle={`@${friend.username}`}
            subtitleLines={1}
            leftElement={
                <Avatar
                    id={friend.id}
                    size={40}
                    imageUrl={avatarUrl}
                    thumbhash={friend.avatar?.thumbhash}
                />
            }
            onPress={onSelect}
            showChevron={true}
        />
    );
}

// Permission level option component
function PermissionOption({
    level,
    selected,
    onSelect,
}: {
    level: AccessLevel;
    selected: boolean;
    onSelect: () => void;
}) {
    const label = level === 'view'
        ? t('sessionSharing.accessLevel.view')
        : t('sessionSharing.accessLevel.collaborate');

    const description = level === 'view'
        ? t('sessionSharing.readOnlyDescription')
        : t('sessionSharing.collaborateDescription');

    return (
        <Pressable
            style={[styles.permissionOption, selected && styles.permissionOptionSelected]}
            onPress={onSelect}
        >
            <View style={styles.permissionRadio}>
                {selected && <View style={styles.permissionRadioInner} />}
            </View>
            <View style={styles.permissionContent}>
                <Text style={[styles.permissionLabel, selected && styles.permissionLabelSelected]}>
                    {label}
                </Text>
                <Text style={styles.permissionDescription}>
                    {description}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        width: 340,
        maxWidth: '90%',
        maxHeight: '80%',
    },
    title: {
        ...Typography.default('semiBold'),
        fontSize: 20,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        ...Typography.default(),
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 16,
    },
    friendList: {
        maxHeight: 300,
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        ...Typography.default(),
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    permissionList: {
        marginBottom: 16,
    },
    permissionOption: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 10,
        backgroundColor: theme.colors.surfacePressed,
        marginBottom: 8,
    },
    permissionOptionSelected: {
        backgroundColor: '#007AFF15',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    permissionRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: theme.colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    permissionRadioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#007AFF',
    },
    permissionContent: {
        flex: 1,
    },
    permissionLabel: {
        ...Typography.default('semiBold'),
        fontSize: 15,
        color: theme.colors.text,
        marginBottom: 2,
    },
    permissionLabelSelected: {
        color: '#007AFF',
    },
    permissionDescription: {
        ...Typography.default(),
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
    },
    shareButton: {
        flex: 1,
    },
}));
