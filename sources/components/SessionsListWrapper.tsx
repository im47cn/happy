/**
 * @file SessionsListWrapper.tsx
 * @input Session list data from sync/storage, shared sessions from API
 * @output Wrapper component with tab switching between My Sessions and Shared Sessions
 * @pos Main sessions list wrapper with tab navigation for Phase 7 session sharing
 */

import * as React from 'react';
import { View, ActivityIndicator, Pressable } from 'react-native';
import { Text } from '@/components/StyledText';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { SessionsList } from './SessionsList';
import { SharedSessionsList } from './SharedSessionsList';
import { EmptyMainScreen } from './EmptyMainScreen';
import { useVisibleSessionListViewData } from '@/hooks/useVisibleSessionListViewData';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';

type SessionsTab = 'mine' | 'shared';

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
    },
    loadingContainerWrapper: {
        flex: 1,
        flexBasis: 0,
        flexGrow: 1,
        backgroundColor: theme.colors.groupped.background,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 32,
    },
    emptyStateContainer: {
        flex: 1,
        flexBasis: 0,
        flexGrow: 1,
        flexDirection: 'column',
        backgroundColor: theme.colors.groupped.background,
    },
    emptyStateContentContainer: {
        flex: 1,
        flexBasis: 0,
        flexGrow: 1,
    },
    // Tab bar styles
    tabBarContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
        backgroundColor: theme.colors.groupped.background,
        gap: 8,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
    },
    tabButtonActive: {
        backgroundColor: theme.colors.button.primary.background,
    },
    tabButtonText: {
        fontSize: 14,
        ...Typography.default('semiBold'),
        color: theme.colors.textSecondary,
    },
    tabButtonTextActive: {
        color: theme.colors.button.primary.tint,
    },
}));

export const SessionsListWrapper = React.memo(() => {
    const { theme } = useUnistyles();
    const sessionListViewData = useVisibleSessionListViewData();
    const styles = stylesheet;
    const [activeTab, setActiveTab] = React.useState<SessionsTab>('mine');

    const handleTabPress = React.useCallback((tab: SessionsTab) => {
        setActiveTab(tab);
    }, []);

    // Loading state - only for "mine" tab since shared sessions handle their own loading
    if (activeTab === 'mine' && sessionListViewData === null) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainerWrapper}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                    </View>
                </View>
            </View>
        );
    }

    // Tab bar component
    const TabBar = (
        <View style={styles.tabBarContainer} testID="sessions-tab-bar">
            <Pressable
                style={[
                    styles.tabButton,
                    activeTab === 'mine' && styles.tabButtonActive,
                ]}
                onPress={() => handleTabPress('mine')}
                testID="sessions-tab-mine"
            >
                <Text
                    style={[
                        styles.tabButtonText,
                        activeTab === 'mine' && styles.tabButtonTextActive,
                    ]}
                >
                    {t('sessionSharing.mySessions')}
                </Text>
            </Pressable>
            <Pressable
                style={[
                    styles.tabButton,
                    activeTab === 'shared' && styles.tabButtonActive,
                ]}
                onPress={() => handleTabPress('shared')}
                testID="sessions-tab-shared"
            >
                <Text
                    style={[
                        styles.tabButtonText,
                        activeTab === 'shared' && styles.tabButtonTextActive,
                    ]}
                >
                    {t('sessionSharing.sharedWithMe')}
                </Text>
            </Pressable>
        </View>
    );

    // Empty state for "mine" tab
    if (activeTab === 'mine' && sessionListViewData?.length === 0) {
        return (
            <View style={styles.container}>
                {TabBar}
                <View style={styles.emptyStateContainer}>
                    <View style={styles.emptyStateContentContainer}>
                        <EmptyMainScreen />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {TabBar}
            {activeTab === 'mine' ? (
                <SessionsList />
            ) : (
                <SharedSessionsList />
            )}
        </View>
    );
});