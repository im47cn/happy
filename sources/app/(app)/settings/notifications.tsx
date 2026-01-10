/**
 * @file Web Push 通知设置页面
 * @input @/hooks/usePushSubscription, @/pwa/types
 * @output 通知订阅管理界面，仅在 Web 平台显示
 * @pos 设置模块的通知子页面，提供推送通知订阅和偏好管理
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import { Platform, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Switch } from '@/components/Switch';
import { Text } from '@/components/StyledText';
import { t } from '@/text';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useUnistyles } from 'react-native-unistyles';
import { useCallback } from 'react';
import type { NotificationPreferences } from '@/pwa/types';

export default function NotificationsSettingsScreen() {
    const { theme } = useUnistyles();
    const {
        isInitializing,
        isSupported,
        isWeb,
        status,
        permission,
        isSubscribed,
        deviceId,
        preferences,
        isLoading,
        error,
        requestPermission,
        subscribe,
        unsubscribe,
        updatePreferences,
    } = usePushSubscription();

    // Handle main notification toggle
    const handleToggleNotifications = useCallback(async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            // Request permission first if needed
            if (permission === 'default') {
                const result = await requestPermission();
                if (result !== 'granted') {
                    return;
                }
            }
            await subscribe();
        }
    }, [isSubscribed, permission, requestPermission, subscribe, unsubscribe]);

    // Handle preference toggle
    const handleTogglePreference = useCallback(async (
        key: keyof NotificationPreferences,
        value: boolean
    ) => {
        const newPreferences = { ...preferences, [key]: value };
        await updatePreferences(newPreferences);
    }, [preferences, updatePreferences]);

    // Non-web platform message
    if (!isWeb) {
        return (
            <ItemList style={{ paddingTop: 0 }}>
                <ItemGroup>
                    <Item
                        title={t('settingsNotifications.notSupported')}
                        subtitle={t('settingsNotifications.notSupportedDescription')}
                        icon={<Ionicons name="notifications-off-outline" size={29} color={theme.colors.textSecondary} />}
                        showChevron={false}
                    />
                </ItemGroup>
            </ItemList>
        );
    }

    // Loading state
    if (isInitializing) {
        return (
            <ItemList style={{ paddingTop: 0 }}>
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.radio.active} />
                </View>
            </ItemList>
        );
    }

    // Browser not supported
    if (!isSupported) {
        return (
            <ItemList style={{ paddingTop: 0 }}>
                <ItemGroup
                    title={t('settingsNotifications.webPush')}
                    footer={t('settingsNotifications.notSupportedDescription')}
                >
                    <Item
                        title={t('settingsNotifications.notSupported')}
                        subtitle={t('settingsNotifications.notSupportedDescription')}
                        icon={<Ionicons name="notifications-off-outline" size={29} color={theme.colors.textSecondary} />}
                        showChevron={false}
                    />
                </ItemGroup>
            </ItemList>
        );
    }

    // Permission denied
    if (permission === 'denied') {
        return (
            <ItemList style={{ paddingTop: 0 }}>
                <ItemGroup
                    title={t('settingsNotifications.webPush')}
                    footer={t('settingsNotifications.permissionDeniedDescription')}
                >
                    <Item
                        title={t('settingsNotifications.permissionDenied')}
                        subtitle={t('settingsNotifications.permissionDeniedDescription')}
                        icon={<Ionicons name="ban-outline" size={29} color="#FF3B30" />}
                        showChevron={false}
                    />
                </ItemGroup>
            </ItemList>
        );
    }

    // Get status text and color
    const getStatusInfo = () => {
        switch (status) {
            case 'subscribed':
                return {
                    text: t('settingsNotifications.subscribed'),
                    description: t('settingsNotifications.subscribedDescription'),
                    color: '#34C759',
                    icon: 'notifications' as const,
                };
            case 'permission_default':
                return {
                    text: t('settingsNotifications.permissionRequired'),
                    description: t('settingsNotifications.permissionRequiredDescription'),
                    color: '#FF9500',
                    icon: 'notifications-outline' as const,
                };
            default:
                return {
                    text: t('settingsNotifications.unsubscribed'),
                    description: t('settingsNotifications.unsubscribedDescription'),
                    color: theme.colors.textSecondary,
                    icon: 'notifications-off-outline' as const,
                };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <ItemList style={{ paddingTop: 0 }}>
            {/* Main Push Notification Toggle */}
            <ItemGroup
                title={t('settingsNotifications.webPush')}
                footer={t('settingsNotifications.webPushDescription')}
            >
                <Item
                    title={t('settingsNotifications.webPush')}
                    subtitle={statusInfo.description}
                    icon={<Ionicons name={statusInfo.icon} size={29} color={statusInfo.color} />}
                    rightElement={
                        isLoading ? (
                            <ActivityIndicator size="small" color={theme.colors.radio.active} />
                        ) : (
                            <Switch
                                value={isSubscribed}
                                onValueChange={handleToggleNotifications}
                            />
                        )
                    }
                    showChevron={false}
                />
            </ItemGroup>

            {/* Notification Types - Only show when subscribed */}
            {isSubscribed && (
                <ItemGroup
                    title={t('settingsNotifications.notificationTypes')}
                    footer={t('settingsNotifications.notificationTypesDescription')}
                >
                    <Item
                        title={t('settingsNotifications.approvalRequest')}
                        subtitle={t('settingsNotifications.approvalRequestDescription')}
                        icon={<Ionicons name="checkmark-circle-outline" size={29} color="#007AFF" />}
                        rightElement={
                            <Switch
                                value={preferences.enableApprovalRequests}
                                onValueChange={(value) => handleTogglePreference('enableApprovalRequests', value)}
                                disabled={isLoading}
                            />
                        }
                        showChevron={false}
                    />
                    <Item
                        title={t('settingsNotifications.taskComplete')}
                        subtitle={t('settingsNotifications.taskCompleteDescription')}
                        icon={<Ionicons name="checkbox-outline" size={29} color="#34C759" />}
                        rightElement={
                            <Switch
                                value={preferences.enableTaskComplete}
                                onValueChange={(value) => handleTogglePreference('enableTaskComplete', value)}
                                disabled={isLoading}
                            />
                        }
                        showChevron={false}
                    />
                    <Item
                        title={t('settingsNotifications.newMessage')}
                        subtitle={t('settingsNotifications.newMessageDescription')}
                        icon={<Ionicons name="chatbubble-outline" size={29} color="#5856D6" />}
                        rightElement={
                            <Switch
                                value={preferences.enableNewMessage}
                                onValueChange={(value) => handleTogglePreference('enableNewMessage', value)}
                                disabled={isLoading}
                            />
                        }
                        showChevron={false}
                    />
                    <Item
                        title={t('settingsNotifications.systemNotification')}
                        subtitle={t('settingsNotifications.systemNotificationDescription')}
                        icon={<Ionicons name="information-circle-outline" size={29} color="#FF9500" />}
                        rightElement={
                            <Switch
                                value={preferences.enableSystemAnnouncements}
                                onValueChange={(value) => handleTogglePreference('enableSystemAnnouncements', value)}
                                disabled={isLoading}
                            />
                        }
                        showChevron={false}
                    />
                </ItemGroup>
            )}

            {/* Device Information - Only show when subscribed */}
            {isSubscribed && deviceId && (
                <ItemGroup
                    title={t('settingsNotifications.deviceInfo')}
                >
                    <Item
                        title={t('settingsNotifications.deviceId')}
                        detail={deviceId.substring(0, 8) + '...'}
                        icon={<Ionicons name="phone-portrait-outline" size={29} color={theme.colors.textSecondary} />}
                        showChevron={false}
                    />
                </ItemGroup>
            )}

            {/* Error Display */}
            {error && (
                <ItemGroup>
                    <View style={{ padding: 16, backgroundColor: 'rgba(255, 59, 48, 0.1)', borderRadius: 8, margin: 16 }}>
                        <Text style={{ color: '#FF3B30', fontSize: 14 }}>
                            {error}
                        </Text>
                    </View>
                </ItemGroup>
            )}
        </ItemList>
    );
}
