/**
 * @file 连接状态指示器组件
 * @input useSocketStatus from @/sync/storage, StatusDot, theme
 * @output 顶部连接状态指示器，显示 WebSocket 连接状态，提供详情展开和手动重连
 * @pos Phase 6 移动端组件 - 让用户清楚了解应用连接状态
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import * as React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useSocketStatus } from '@/sync/storage';
import { getServerInfo } from '@/sync/serverConfig';
import { StatusDot } from './StatusDot';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';
import { apiSocket } from '@/sync/apiSocket';

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.dark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.05)',
    },
    statusDot: {
        marginRight: 6,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '500',
        ...Typography.default(),
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 120,
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        width: '85%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalHeaderIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        ...Typography.default('semiBold'),
    },
    modalSubtitle: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.dark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.05)',
    },
    infoRowLast: {
        borderBottomWidth: 0,
    },
    infoLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    infoValue: {
        fontSize: 14,
        color: theme.colors.text,
        fontWeight: '500',
        textAlign: 'right',
        flex: 1,
        marginLeft: 12,
    },
    reconnectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.textLink,
        borderRadius: 12,
        paddingVertical: 14,
        marginTop: 16,
    },
    reconnectButtonDisabled: {
        opacity: 0.5,
    },
    reconnectButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 8,
        ...Typography.default('semiBold'),
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.dark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.05)',
    },
}));

export interface ConnectionIndicatorProps {
    /** 是否紧凑显示（仅显示图标） */
    compact?: boolean;
    /** 自定义样式 */
    style?: object;
}

export const ConnectionIndicator = React.memo(({ compact = false, style }: ConnectionIndicatorProps) => {
    const { theme } = useUnistyles();
    const styles = stylesheet;
    const socketStatus = useSocketStatus();
    const [modalVisible, setModalVisible] = React.useState(false);
    const [isReconnecting, setIsReconnecting] = React.useState(false);

    // 获取服务器信息
    const serverInfo = getServerInfo();

    // 获取连接状态样式和文本
    const getConnectionStatus = React.useCallback(() => {
        const { status } = socketStatus;
        switch (status) {
            case 'connected':
                return {
                    color: theme.colors.status.connected,
                    isPulsing: false,
                    text: t('status.connected'),
                    icon: 'checkmark-circle' as const,
                    iconColor: '#34C759',
                    bgColor: theme.dark ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)',
                };
            case 'connecting':
                return {
                    color: theme.colors.status.connecting,
                    isPulsing: true,
                    text: t('status.connecting'),
                    icon: 'sync' as const,
                    iconColor: '#FF9500',
                    bgColor: theme.dark ? 'rgba(255, 149, 0, 0.15)' : 'rgba(255, 149, 0, 0.1)',
                };
            case 'disconnected':
                return {
                    color: theme.colors.status.disconnected,
                    isPulsing: false,
                    text: t('status.disconnected'),
                    icon: 'close-circle' as const,
                    iconColor: '#FF3B30',
                    bgColor: theme.dark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.1)',
                };
            case 'error':
                return {
                    color: theme.colors.status.error,
                    isPulsing: false,
                    text: t('status.error'),
                    icon: 'alert-circle' as const,
                    iconColor: '#FF3B30',
                    bgColor: theme.dark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.1)',
                };
            default:
                return {
                    color: theme.colors.textSecondary,
                    isPulsing: false,
                    text: t('status.unknown'),
                    icon: 'help-circle' as const,
                    iconColor: theme.colors.textSecondary,
                    bgColor: theme.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                };
        }
    }, [socketStatus.status, theme]);

    const connectionStatus = getConnectionStatus();

    // 格式化时间
    const formatTime = React.useCallback((timestamp: number | null | undefined) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) {
            return t('time.justNow');
        } else if (diffMins < 60) {
            return t('time.minutesAgo', { count: diffMins });
        } else {
            const diffHours = Math.floor(diffMins / 60);
            return t('time.hoursAgo', { count: diffHours });
        }
    }, []);

    // 手动重连
    const handleReconnect = React.useCallback(async () => {
        if (isReconnecting || socketStatus.status === 'connected') return;

        setIsReconnecting(true);
        try {
            apiSocket.disconnect();
            // 短暂延迟后重连
            await new Promise(resolve => setTimeout(resolve, 500));
            apiSocket.connect();
        } finally {
            // 延迟重置状态，让用户看到操作反馈
            setTimeout(() => setIsReconnecting(false), 1500);
        }
    }, [isReconnecting, socketStatus.status]);

    // 获取服务器地址显示
    const serverAddress = React.useMemo(() => {
        if (serverInfo.isCustom) {
            return `${serverInfo.hostname}${serverInfo.port ? `:${serverInfo.port}` : ''}`;
        }
        return t('connectionIndicator.defaultServer');
    }, [serverInfo]);

    const canReconnect = socketStatus.status === 'disconnected' || socketStatus.status === 'error';

    return (
        <>
            <Pressable
                testID="CP-08-connection-indicator"
                onPress={() => setModalVisible(true)}
                style={[styles.container, style]}
            >
                <StatusDot
                    color={connectionStatus.color}
                    isPulsing={connectionStatus.isPulsing}
                    size={8}
                    style={styles.statusDot}
                />
                {!compact && (
                    <Text style={[styles.statusText, { color: connectionStatus.color }]}>
                        {connectionStatus.text}
                    </Text>
                )}
            </Pressable>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setModalVisible(false)}
                >
                    <Pressable
                        style={styles.modalContent}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <Pressable
                            testID="CP-08-modal-close"
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
                        </Pressable>

                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <View style={[styles.modalHeaderIcon, { backgroundColor: connectionStatus.bgColor }]}>
                                <Ionicons
                                    name={connectionStatus.icon}
                                    size={24}
                                    color={connectionStatus.iconColor}
                                />
                            </View>
                            <View>
                                <Text style={styles.modalTitle}>
                                    {t('connectionIndicator.title')}
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    {connectionStatus.text}
                                </Text>
                            </View>
                        </View>

                        {/* Server info */}
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>
                                {t('connectionIndicator.server')}
                            </Text>
                            <Text style={styles.infoValue} numberOfLines={1}>
                                {serverAddress}
                            </Text>
                        </View>

                        {/* Last connected */}
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>
                                {t('connectionIndicator.lastConnected')}
                            </Text>
                            <Text style={styles.infoValue}>
                                {formatTime(socketStatus.lastConnectedAt)}
                            </Text>
                        </View>

                        {/* Last disconnected (only show if disconnected) */}
                        {socketStatus.status !== 'connected' && socketStatus.lastDisconnectedAt && (
                            <View style={[styles.infoRow, styles.infoRowLast]}>
                                <Text style={styles.infoLabel}>
                                    {t('connectionIndicator.lastDisconnected')}
                                </Text>
                                <Text style={styles.infoValue}>
                                    {formatTime(socketStatus.lastDisconnectedAt)}
                                </Text>
                            </View>
                        )}

                        {/* Reconnect button */}
                        {canReconnect && (
                            <Pressable
                                testID="CP-08-reconnect-button"
                                style={[
                                    styles.reconnectButton,
                                    isReconnecting && styles.reconnectButtonDisabled
                                ]}
                                onPress={handleReconnect}
                                disabled={isReconnecting}
                            >
                                <Ionicons
                                    name={isReconnecting ? "sync" : "refresh"}
                                    size={20}
                                    color="#FFFFFF"
                                />
                                <Text style={styles.reconnectButtonText}>
                                    {isReconnecting
                                        ? t('connectionIndicator.reconnecting')
                                        : t('connectionIndicator.reconnect')
                                    }
                                </Text>
                            </Pressable>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
});

ConnectionIndicator.displayName = 'ConnectionIndicator';
