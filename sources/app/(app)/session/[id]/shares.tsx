/**
 * @file shares.tsx
 * @input Session ID from route params, auth credentials from context
 * @output Session share management page with collaborator list
 * @pos Phase 7 Session Sharing - Share management page for session owners
 */

import * as React from 'react';
import { View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Text } from '@/components/StyledText';
import { useLocalSearchParams, Stack } from 'expo-router';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';
import { useAuth } from '@/auth/AuthContext';
import { useSession } from '@/sync/storage';
import {
    getSessionShares,
    updateSessionShare,
    revokeSessionShare,
    createSessionShare
} from '@/sync/apiSessionShare';
import { SessionShareRecord, AccessLevel } from '@/sync/sessionShareTypes';
import { SessionCollaboratorList } from '@/components/SessionCollaboratorList';
import { SessionShareModal } from '@/components/SessionShareModal';
import { layout } from '@/components/layout';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Modal } from '@/modal';

export default function SessionSharesPage() {
    const { theme } = useUnistyles();
    const { id: sessionId } = useLocalSearchParams<{ id: string }>();
    const { credentials } = useAuth();
    const session = useSession(sessionId ?? '');

    const [shares, setShares] = React.useState<SessionShareRecord[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [showShareModal, setShowShareModal] = React.useState(false);

    // Load shares on mount
    const loadShares = React.useCallback(async () => {
        if (!credentials || !sessionId) return;

        setLoading(true);
        setError(null);

        try {
            const result = await getSessionShares(credentials, sessionId);
            setShares(result);
        } catch (err) {
            console.error('Failed to load session shares:', err);
            setError(t('sessionSharing.shareError'));
        } finally {
            setLoading(false);
        }
    }, [credentials, sessionId]);

    React.useEffect(() => {
        loadShares();
    }, [loadShares]);

    // Handle update permission
    const handleUpdatePermission = React.useCallback(async (shareId: string, newLevel: AccessLevel) => {
        if (!credentials || !sessionId) return;

        try {
            const result = await updateSessionShare(credentials, sessionId, shareId, newLevel);
            if (result) {
                // Update local state
                setShares(prev => prev.map(s => s.id === shareId ? result : s));
            }
        } catch (err) {
            console.error('Failed to update share:', err);
            Modal.alert(t('common.error'), t('sessionSharing.shareError'), [{ text: t('common.ok') }]);
        }
    }, [credentials, sessionId]);

    // Handle revoke access
    const handleRevokeAccess = React.useCallback(async (shareId: string, _userName: string) => {
        if (!credentials || !sessionId) return;

        try {
            const success = await revokeSessionShare(credentials, sessionId, shareId);
            if (success) {
                // Remove from local state
                setShares(prev => prev.filter(s => s.id !== shareId));
            }
        } catch (err) {
            console.error('Failed to revoke share:', err);
            Modal.alert(t('common.error'), t('sessionSharing.shareError'), [{ text: t('common.ok') }]);
        }
    }, [credentials, sessionId]);

    // Handle share with friend
    const handleShare = React.useCallback(async (friendId: string, accessLevel: AccessLevel) => {
        if (!credentials || !sessionId) return;

        const result = await createSessionShare(credentials, sessionId, friendId, accessLevel);
        if (result) {
            setShares(prev => [...prev, result]);
        } else {
            throw new Error('Failed to create share');
        }
    }, [credentials, sessionId]);

    // Get already shared friend IDs
    const excludeFriendIds = React.useMemo(() =>
        shares.map(s => s.sharedWithUser?.id).filter((id): id is string => !!id),
    [shares]);

    // Loading state
    if (loading) {
        return (
            <>
                <Stack.Screen
                    options={{
                        title: t('sessionSharing.manageSharing'),
                        headerBackTitle: t('common.back'),
                    }}
                />
                <View style={styles.container}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.textSecondary} />
                    </View>
                </View>
            </>
        );
    }

    // Error state
    if (error) {
        return (
            <>
                <Stack.Screen
                    options={{
                        title: t('sessionSharing.manageSharing'),
                        headerBackTitle: t('common.back'),
                    }}
                />
                <View style={styles.container}>
                    <View style={styles.errorContainer}>
                        <Ionicons
                            name="alert-circle-outline"
                            size={48}
                            color={theme.colors.textSecondary}
                        />
                        <Text style={styles.errorText}>{error}</Text>
                        <Pressable
                            style={styles.retryButton}
                            onPress={loadShares}
                            testID="session-shares-retry-button"
                        >
                            <Text style={styles.retryButtonText}>
                                {t('common.retry')}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </>
        );
    }

    // Session not found
    if (!session) {
        return null;
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: t('sessionSharing.manageSharing'),
                    headerBackTitle: t('common.back'),
                }}
            />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                testID="session-shares-page"
            >
                {/* Header section */}
                <View style={styles.headerSection}>
                    <Text style={styles.sectionTitle}>
                        {t('sessionSharing.collaborators')}
                    </Text>
                </View>

                {/* Collaborator list or empty state */}
                {shares.length > 0 ? (
                    <SessionCollaboratorList
                        shares={shares}
                        onUpdatePermission={handleUpdatePermission}
                        onRevokeAccess={handleRevokeAccess}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Image
                            source={require('@/assets/images/brutalist/Brutalism 10.png')}
                            contentFit="contain"
                            style={[{ width: 64, height: 64 }, styles.emptyIcon]}
                            tintColor={theme.colors.textSecondary}
                        />
                        <Text style={styles.emptyTitle}>
                            {t('sessionSharing.noCollaborators')}
                        </Text>
                    </View>
                )}

                {/* Add collaborator button */}
                <View style={styles.addButtonContainer}>
                    <Pressable
                        style={styles.addButton}
                        onPress={() => setShowShareModal(true)}
                        testID="session-shares-add-button"
                    >
                        <Ionicons
                            name="person-add-outline"
                            size={20}
                            color={theme.colors.button.primary.tint}
                        />
                        <Text style={styles.addButtonText}>
                            {t('sessionSharing.shareSession')}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>

            {/* Share modal */}
            {showShareModal && (
                <View style={styles.modalOverlay}>
                    <SessionShareModal
                        onClose={() => setShowShareModal(false)}
                        onShare={handleShare}
                        excludeFriendIds={excludeFriendIds}
                    />
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.groupped.background,
    },
    contentContainer: {
        maxWidth: layout.maxWidth,
        alignSelf: 'center',
        width: '100%',
        paddingBottom: 32,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    errorText: {
        ...Typography.default(),
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: theme.colors.button.primary.background,
        borderRadius: 8,
    },
    retryButtonText: {
        ...Typography.default('semiBold'),
        fontSize: 14,
        color: theme.colors.button.primary.tint,
    },
    headerSection: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 16,
    },
    sectionTitle: {
        ...Typography.default('semiBold'),
        fontSize: 14,
        color: theme.colors.groupped.sectionTitle,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyIcon: {
        marginBottom: 16,
    },
    emptyTitle: {
        ...Typography.default('semiBold'),
        fontSize: 18,
        color: theme.colors.text,
        textAlign: 'center',
    },
    addButtonContainer: {
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: theme.colors.button.primary.background,
        borderRadius: 12,
    },
    addButtonText: {
        ...Typography.default('semiBold'),
        fontSize: 16,
        color: theme.colors.button.primary.tint,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
