/**
 * @file ApprovalDialog.tsx
 * @input Modal system, session data, sync/ops for approval actions
 * @output Reusable approval modal component with approve/reject/modify actions
 * @pos Mobile component for handling approval requests in modal format
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Modal } from '@/modal';
import { sessionAllow, sessionDeny } from '@/sync/ops';
import { Session } from '@/sync/storageTypes';
import { t } from '@/text';
import { getSessionName } from '@/utils/sessionUtils';

// ============================================================================
// Types
// ============================================================================

export interface ApprovalData {
    sessionId: string;
    session: Session;
    permissionId: string;
    toolName: string;
    toolArguments: unknown;
    createdAt: number;
    riskLevel?: 'low' | 'medium' | 'high';
}

export interface ApprovalDialogProps {
    data: ApprovalData;
    onClose: () => void;
    onActionComplete?: (action: 'approved' | 'rejected' | 'modified') => void;
}

type ActionState = 'idle' | 'approve' | 'reject' | 'modify';

// ============================================================================
// Component
// ============================================================================

export function ApprovalDialog({ data, onClose, onActionComplete }: ApprovalDialogProps) {
    const { theme } = useUnistyles();
    const safeArea = useSafeAreaInsets();
    const [actionState, setActionState] = React.useState<ActionState>('idle');
    const [showRejectReason, setShowRejectReason] = React.useState(false);
    const [showModifyParams, setShowModifyParams] = React.useState(false);
    const [rejectReason, setRejectReason] = React.useState('');
    const [modifiedParams, setModifiedParams] = React.useState(
        typeof data.toolArguments === 'string'
            ? data.toolArguments
            : JSON.stringify(data.toolArguments, null, 2)
    );
    const [error, setError] = React.useState<string | null>(null);

    const sessionName = getSessionName(data.session);
    const minutesAgo = Math.floor((Date.now() - data.createdAt) / 60000);

    const getRiskLevelColor = () => {
        switch (data.riskLevel) {
            case 'high':
                return '#FF3B30';
            case 'medium':
                return '#FF9500';
            case 'low':
            default:
                return '#34C759';
        }
    };

    const handleApprove = React.useCallback(async () => {
        if (actionState !== 'idle') return;

        setActionState('approve');
        setError(null);
        try {
            await sessionAllow(data.sessionId, data.permissionId, undefined, undefined, 'approved');
            onActionComplete?.('approved');
            onClose();
        } catch (err) {
            console.error('Failed to approve:', err);
            setError(t('approvalDialog.approveError'));
            setActionState('idle');
        }
    }, [actionState, data.sessionId, data.permissionId, onActionComplete, onClose]);

    const handleReject = React.useCallback(async () => {
        if (actionState !== 'idle') return;

        if (!showRejectReason) {
            setShowRejectReason(true);
            setShowModifyParams(false);
            return;
        }

        setActionState('reject');
        setError(null);
        try {
            await sessionDeny(data.sessionId, data.permissionId, undefined, undefined, 'denied');
            onActionComplete?.('rejected');
            onClose();
        } catch (err) {
            console.error('Failed to reject:', err);
            setError(t('approvalDialog.rejectError'));
            setActionState('idle');
        }
    }, [actionState, data.sessionId, data.permissionId, onActionComplete, onClose, showRejectReason]);

    const handleModify = React.useCallback(async () => {
        if (actionState !== 'idle') return;

        if (!showModifyParams) {
            setShowModifyParams(true);
            setShowRejectReason(false);
            return;
        }

        // Validate JSON
        try {
            JSON.parse(modifiedParams);
        } catch {
            setError(t('approvalDialog.invalidJson'));
            return;
        }

        setActionState('modify');
        setError(null);
        try {
            // For modify, we approve with the modified decision type
            // Note: In a full implementation, modified params would be sent to the server
            await sessionAllow(data.sessionId, data.permissionId, undefined, undefined, 'approved');
            onActionComplete?.('modified');
            onClose();
        } catch (err) {
            console.error('Failed to modify:', err);
            setError(t('approvalDialog.modifyError'));
            setActionState('idle');
        }
    }, [actionState, data.sessionId, data.permissionId, modifiedParams, onActionComplete, onClose, showModifyParams]);

    const handleCancel = React.useCallback(() => {
        if (showRejectReason || showModifyParams) {
            setShowRejectReason(false);
            setShowModifyParams(false);
            setError(null);
        } else {
            onClose();
        }
    }, [onClose, showModifyParams, showRejectReason]);

    const isLoading = actionState !== 'idle';

    return (
        <View
            testID="approval-dialog"
            style={[
                styles.container,
                { backgroundColor: theme.colors.surfaceHigh },
            ]}
        >
            {/* Header */}
            <View testID="approval-dialog-header" style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: theme.dark ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 204, 0, 0.15)' }]}>
                    <Ionicons name="shield-checkmark" size={24} color="#FFCC00" />
                </View>
                <View style={styles.headerText}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        {t('approvals.permissionRequest')}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        {sessionName}
                    </Text>
                </View>
                <Pressable
                    testID="approval-dialog-close"
                    onPress={onClose}
                    style={styles.closeButton}
                    disabled={isLoading}
                >
                    <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </Pressable>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Operation Info */}
                <View testID="approval-dialog-info" style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                            {t('approvalDialog.operation')}
                        </Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                            {data.toolName}
                        </Text>
                    </View>

                    {data.riskLevel && (
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                                {t('approvalDialog.riskLevel')}
                            </Text>
                            <View style={[styles.riskBadge, { backgroundColor: `${getRiskLevelColor()}20` }]}>
                                <Text style={[styles.riskText, { color: getRiskLevelColor() }]}>
                                    {data.riskLevel.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                            {t('approvalDialog.requestedAt')}
                        </Text>
                        <Text style={[styles.infoValue, { color: theme.colors.textSecondary }]}>
                            {minutesAgo < 1 ? t('time.justNow') : t('time.minutesAgo', { count: minutesAgo })}
                        </Text>
                    </View>
                </View>

                {/* Arguments Preview */}
                {data.toolArguments != null && !showModifyParams && (
                    <View
                        testID="approval-dialog-arguments"
                        style={[styles.argumentsContainer, { backgroundColor: theme.dark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)' }]}
                    >
                        <Text style={[styles.argumentsLabel, { color: theme.colors.textSecondary }]}>
                            {t('approvalDialog.parameters')}
                        </Text>
                        <Text
                            style={[styles.argumentsText, { color: theme.colors.text }]}
                            numberOfLines={8}
                        >
                            {typeof data.toolArguments === 'string'
                                ? data.toolArguments
                                : JSON.stringify(data.toolArguments, null, 2)}
                        </Text>
                    </View>
                )}

                {/* Reject Reason Input */}
                {showRejectReason && (
                    <View testID="approval-dialog-reject-reason" style={styles.inputSection}>
                        <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                            {t('approvalDialog.rejectReasonLabel')}
                        </Text>
                        <TextInput
                            testID="approval-dialog-reject-reason-input"
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: theme.dark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                                    color: theme.colors.text,
                                    borderColor: theme.colors.divider,
                                },
                            ]}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            placeholder={t('approvalDialog.rejectReasonPlaceholder')}
                            placeholderTextColor={theme.colors.textSecondary}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>
                )}

                {/* Modify Params Editor */}
                {showModifyParams && (
                    <View testID="approval-dialog-modify-params" style={styles.inputSection}>
                        <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                            {t('approvalDialog.modifyParamsLabel')}
                        </Text>
                        <TextInput
                            testID="approval-dialog-modify-params-input"
                            style={[
                                styles.codeInput,
                                {
                                    backgroundColor: theme.dark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                                    color: theme.colors.text,
                                    borderColor: theme.colors.divider,
                                },
                            ]}
                            value={modifiedParams}
                            onChangeText={setModifiedParams}
                            placeholder="{}"
                            placeholderTextColor={theme.colors.textSecondary}
                            multiline
                            numberOfLines={8}
                            textAlignVertical="top"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                )}

                {/* Error Message */}
                {error && (
                    <View testID="approval-dialog-error" style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
            </ScrollView>

            {/* Action Buttons */}
            <View
                testID="approval-dialog-actions"
                style={[styles.actions, { paddingBottom: safeArea.bottom + 16 }]}
            >
                {showRejectReason || showModifyParams ? (
                    // Show Cancel and Confirm when in reject/modify mode
                    <View style={styles.twoButtonRow}>
                        <Pressable
                            testID="approval-dialog-cancel"
                            onPress={handleCancel}
                            disabled={isLoading}
                            style={[
                                styles.button,
                                styles.cancelButton,
                                { backgroundColor: theme.dark ? 'rgba(128, 128, 128, 0.2)' : 'rgba(128, 128, 128, 0.1)' },
                            ]}
                        >
                            <Text style={[styles.buttonText, { color: theme.colors.textSecondary }]}>
                                {t('common.cancel')}
                            </Text>
                        </Pressable>

                        <Pressable
                            testID={showRejectReason ? 'approval-dialog-confirm-reject' : 'approval-dialog-confirm-modify'}
                            onPress={showRejectReason ? handleReject : handleModify}
                            disabled={isLoading}
                            style={[
                                styles.button,
                                styles.confirmButton,
                                {
                                    backgroundColor: showRejectReason
                                        ? theme.dark ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.15)'
                                        : theme.dark ? 'rgba(255, 149, 0, 0.2)' : 'rgba(255, 149, 0, 0.15)',
                                },
                            ]}
                        >
                            {isLoading ? (
                                <ActivityIndicator
                                    size="small"
                                    color={showRejectReason ? '#FF3B30' : '#FF9500'}
                                />
                            ) : (
                                <Text
                                    style={[
                                        styles.buttonText,
                                        { color: showRejectReason ? '#FF3B30' : '#FF9500' },
                                    ]}
                                >
                                    {showRejectReason ? t('approvalDialog.confirmReject') : t('approvalDialog.confirmModify')}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                ) : (
                    // Show all three action buttons
                    <View style={styles.threeButtonRow}>
                        {/* Approve Button */}
                        <Pressable
                            testID="approval-dialog-approve"
                            onPress={handleApprove}
                            disabled={isLoading}
                            style={[
                                styles.button,
                                styles.approveButton,
                                {
                                    backgroundColor: theme.dark ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.15)',
                                    opacity: isLoading && actionState !== 'approve' ? 0.5 : 1,
                                },
                            ]}
                        >
                            {actionState === 'approve' ? (
                                <ActivityIndicator size="small" color="#34C759" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark" size={18} color="#34C759" />
                                    <Text style={[styles.buttonText, { color: '#34C759', marginLeft: 6 }]}>
                                        {t('approvalDialog.approve')}
                                    </Text>
                                </>
                            )}
                        </Pressable>

                        {/* Modify Button */}
                        <Pressable
                            testID="approval-dialog-modify"
                            onPress={handleModify}
                            disabled={isLoading}
                            style={[
                                styles.button,
                                styles.modifyButton,
                                {
                                    backgroundColor: theme.dark ? 'rgba(255, 149, 0, 0.2)' : 'rgba(255, 149, 0, 0.15)',
                                    opacity: isLoading && actionState !== 'modify' ? 0.5 : 1,
                                },
                            ]}
                        >
                            {actionState === 'modify' ? (
                                <ActivityIndicator size="small" color="#FF9500" />
                            ) : (
                                <>
                                    <Ionicons name="create-outline" size={18} color="#FF9500" />
                                    <Text style={[styles.buttonText, { color: '#FF9500', marginLeft: 6 }]}>
                                        {t('approvalDialog.modify')}
                                    </Text>
                                </>
                            )}
                        </Pressable>

                        {/* Reject Button */}
                        <Pressable
                            testID="approval-dialog-reject"
                            onPress={handleReject}
                            disabled={isLoading}
                            style={[
                                styles.button,
                                styles.rejectButton,
                                {
                                    backgroundColor: theme.dark ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.15)',
                                    opacity: isLoading && actionState !== 'reject' ? 0.5 : 1,
                                },
                            ]}
                        >
                            {actionState === 'reject' ? (
                                <ActivityIndicator size="small" color="#FF3B30" />
                            ) : (
                                <>
                                    <Ionicons name="close" size={18} color="#FF3B30" />
                                    <Text style={[styles.buttonText, { color: '#FF3B30', marginLeft: 6 }]}>
                                        {t('approvalDialog.reject')}
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                )}
            </View>
        </View>
    );
}

// ============================================================================
// Helper Function to Show Dialog
// ============================================================================

/**
 * Show the approval dialog for a pending approval
 * @param data - The approval data to display
 * @param onActionComplete - Optional callback when an action is completed
 * @returns The modal ID for programmatic control
 */
export function showApprovalDialog(
    data: ApprovalData,
    onActionComplete?: (action: 'approved' | 'rejected' | 'modified') => void
): string {
    return Modal.show({
        component: ApprovalDialog,
        props: {
            data,
            onActionComplete,
        },
    });
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create((theme) => ({
    container: {
        borderRadius: 16,
        maxWidth: 400,
        width: '100%',
        maxHeight: '80%',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    closeButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    infoSection: {
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    riskBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    riskText: {
        fontSize: 11,
        fontWeight: '700',
    },
    argumentsContainer: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    argumentsLabel: {
        fontSize: 12,
        marginBottom: 8,
    },
    argumentsText: {
        fontSize: 12,
        fontFamily: 'monospace',
    },
    inputSection: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    textInput: {
        borderRadius: 8,
        borderWidth: 1,
        padding: 12,
        fontSize: 14,
        minHeight: 80,
    },
    codeInput: {
        borderRadius: 8,
        borderWidth: 1,
        padding: 12,
        fontSize: 12,
        fontFamily: 'monospace',
        minHeight: 150,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderRadius: 8,
        padding: 12,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 13,
        marginLeft: 8,
        flex: 1,
    },
    actions: {
        padding: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
    },
    twoButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    threeButtonRow: {
        flexDirection: 'row',
        gap: 8,
    },
    button: {
        flex: 1,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    approveButton: {},
    modifyButton: {},
    rejectButton: {},
    cancelButton: {},
    confirmButton: {},
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
}));
