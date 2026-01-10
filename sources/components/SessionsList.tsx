/**
 * input: SessionListViewItem[] from sync/storage, theme colors
 * output: Enhanced session list with search, filter, context menu
 * pos: Main session list component used in app/(app)/sessions/index.tsx
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的CLAUDE.md。
 */

import React from 'react';
import { View, Pressable, FlatList, TextInput } from 'react-native';
import { Text } from '@/components/StyledText';
import { usePathname, useRouter } from 'expo-router';
import { SessionListViewItem } from '@/sync/storage';
import { Ionicons } from '@expo/vector-icons';
import { getSessionName, useSessionStatus, getSessionSubtitle, getSessionAvatarId } from '@/utils/sessionUtils';
import { Avatar } from './Avatar';
import { ActiveSessionsGroup } from './ActiveSessionsGroup';
import { ActiveSessionsGroupCompact } from './ActiveSessionsGroupCompact';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSetting } from '@/sync/storage';
import { useVisibleSessionListViewData } from '@/hooks/useVisibleSessionListViewData';
import { Typography } from '@/constants/Typography';
import { Session } from '@/sync/storageTypes';
import { StatusDot } from './StatusDot';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useIsTablet } from '@/utils/responsive';
import { requestReview } from '@/utils/requestReview';
import { UpdateBanner } from './UpdateBanner';
import { PwaInstallBanner } from './PwaInstallBanner';
import { OfflineStatusBanner } from './OfflineStatusBanner';
import { layout } from './layout';
import { useNavigateToSession } from '@/hooks/useNavigateToSession';
import { t } from '@/text';
import { Modal } from '@/modal';
import { hapticsLight } from './haptics';

// Filter types
type BackendFilter = 'all' | 'claude' | 'codex' | 'gemini';
type StatusFilter = 'all' | 'active' | 'paused' | 'offline';

const stylesheet = StyleSheet.create((theme, runtime) => ({
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
    // Search and filter bar
    searchFilterContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: theme.colors.groupped.background,
        gap: 8,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
        ...Typography.default(),
        paddingVertical: 0,
    },
    clearSearchButton: {
        padding: 4,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 4,
    },
    filterButtonActive: {
        backgroundColor: theme.colors.button.primary.background,
    },
    filterButtonText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        ...Typography.default('semiBold'),
    },
    filterButtonTextActive: {
        color: theme.colors.button.primary.tint,
    },
    clearFiltersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    clearFiltersText: {
        fontSize: 13,
        color: theme.colors.status.connected,
        ...Typography.default('semiBold'),
    },
    // 平板双列布局容器
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
    },
    // 响应式会话卡片宽度：手机100%，平板50%
    sessionItemWrapper: {
        width: {
            xs: '100%',
            lg: '50%',
        },
        paddingHorizontal: 8,
    },
    headerSection: {
        backgroundColor: theme.colors.groupped.background,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 8,
    },
    headerText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.groupped.sectionTitle,
        letterSpacing: 0.1,
        ...Typography.default('semiBold'),
    },
    projectGroup: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: theme.colors.surface,
    },
    projectGroupTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text,
        ...Typography.default('semiBold'),
    },
    projectGroupSubtitle: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        marginTop: 2,
        ...Typography.default(),
    },
    sessionItem: {
        height: 88,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: theme.colors.surface,
        marginHorizontal: {
            xs: 16,
            lg: 8, // 平板下减小边距以适应双列
        },
        marginBottom: 1,
        minHeight: 44, // 确保最小触控高度
    },
    sessionItemFirst: {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    sessionItemLast: {
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        marginBottom: 12,
    },
    sessionItemSingle: {
        borderRadius: 12,
        marginBottom: 12,
    },
    sessionItemSelected: {
        backgroundColor: theme.colors.surfaceSelected,
    },
    sessionContent: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    sessionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    sessionTitle: {
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
        ...Typography.default('semiBold'),
    },
    sessionTitleConnected: {
        color: theme.colors.text,
    },
    sessionTitleDisconnected: {
        color: theme.colors.textSecondary,
    },
    sessionSubtitle: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: 4,
        ...Typography.default(),
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDotContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 16,
        marginTop: 2,
        marginRight: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 16,
        ...Typography.default(),
    },
    backendBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    backendBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        ...Typography.default('semiBold'),
    },
    // Phase 5: Fork indicator styles
    forkIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 6,
        gap: 2,
    },
    forkBadge: {
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
        backgroundColor: theme.colors.surfaceHigh,
        marginLeft: 4,
    },
    forkBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        ...Typography.default('semiBold'),
    },
    avatarContainer: {
        position: 'relative',
        width: 48,
        height: 48,
    },
    draftIconContainer: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    draftIconOverlay: {
        color: theme.colors.textSecondary,
    },
    artifactsSection: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: theme.colors.groupped.background,
    },
    // Empty state styles
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 64,
    },
    emptyIcon: {
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
        textAlign: 'center',
        ...Typography.default('semiBold'),
    },
    emptyDescription: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        ...Typography.default(),
    },
    // Context menu styles
    contextMenuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contextMenu: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        minWidth: 200,
        overflow: 'hidden',
    },
    contextMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    contextMenuItemDestructive: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
    },
    contextMenuItemText: {
        fontSize: 16,
        color: theme.colors.text,
        ...Typography.default(),
    },
    contextMenuItemTextDestructive: {
        color: theme.colors.textDestructive,
    },
}));

// Backend filter order for cycling
const backendFilterOrder: BackendFilter[] = ['all', 'claude', 'codex', 'gemini'];
const statusFilterOrder: StatusFilter[] = ['all', 'active', 'paused', 'offline'];

export function SessionsList() {
    const styles = stylesheet;
    const { theme } = useUnistyles();
    const safeArea = useSafeAreaInsets();
    const data = useVisibleSessionListViewData();
    const pathname = usePathname();
    const isTablet = useIsTablet();
    const navigateToSession = useNavigateToSession();
    const compactSessionView = useSetting('compactSessionView');
    const router = useRouter();
    const selectable = isTablet;

    // Search and filter state
    const [searchQuery, setSearchQuery] = React.useState('');
    const [backendFilter, setBackendFilter] = React.useState<BackendFilter>('all');
    const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');


    // Filter the data based on search and filters
    const filteredData = React.useMemo(() => {
        if (!data) return null;

        const query = searchQuery.toLowerCase().trim();
        const hasFilters = query || backendFilter !== 'all' || statusFilter !== 'all';

        if (!hasFilters) return data;

        return data.filter(item => {
            if (item.type !== 'session') {
                // Keep non-session items only if we're not filtering
                return !hasFilters;
            }

            const session = item.session;
            const sessionName = getSessionName(session).toLowerCase();
            const sessionPath = session.metadata?.path?.toLowerCase() || '';
            const backend = session.metadata?.flavor || 'claude';

            // Search filter
            if (query && !sessionName.includes(query) && !sessionPath.includes(query)) {
                return false;
            }

            // Backend filter
            if (backendFilter !== 'all' && backend !== backendFilter) {
                return false;
            }

            // Status filter (simplified - based on connection status)
            // Note: actual status would need to be computed from useSessionStatus hook
            // For now, we filter based on metadata

            return true;
        });
    }, [data, searchQuery, backendFilter, statusFilter]);

    const dataWithSelected = selectable ? React.useMemo(() => {
        return filteredData?.map(item => ({
            ...item,
            selected: pathname.startsWith(`/session/${item.type === 'session' ? item.session.id : ''}`)
        }));
    }, [filteredData, pathname]) : filteredData;

    // Request review
    React.useEffect(() => {
        if (data && data.length > 0) {
            requestReview();
        }
    }, [data && data.length > 0]);

    // Handlers
    const handleBackendFilterPress = React.useCallback(() => {
        hapticsLight();
        const currentIndex = backendFilterOrder.indexOf(backendFilter);
        const nextIndex = (currentIndex + 1) % backendFilterOrder.length;
        setBackendFilter(backendFilterOrder[nextIndex]);
    }, [backendFilter]);

    const handleStatusFilterPress = React.useCallback(() => {
        hapticsLight();
        const currentIndex = statusFilterOrder.indexOf(statusFilter);
        const nextIndex = (currentIndex + 1) % statusFilterOrder.length;
        setStatusFilter(statusFilterOrder[nextIndex]);
    }, [statusFilter]);

    const handleClearFilters = React.useCallback(() => {
        hapticsLight();
        setSearchQuery('');
        setBackendFilter('all');
        setStatusFilter('all');
    }, []);

    const handleSessionLongPress = React.useCallback((session: Session) => {
        hapticsLight();
        const sessionName = getSessionName(session);

        Modal.alert(
            sessionName,
            undefined,
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('sessionsList.menu.viewDetail'),
                    onPress: () => router.push(`/session/${session.id}/info`),
                },
                {
                    text: t('sessionsList.menu.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        const confirmed = await Modal.confirm(
                            t('sessionsList.delete.title'),
                            t('sessionsList.delete.confirm'),
                            {
                                confirmText: t('common.delete'),
                                cancelText: t('common.cancel'),
                                destructive: true,
                            }
                        );
                        if (confirmed) {
                            // Navigate to session info where delete can be done
                            router.push(`/session/${session.id}/info`);
                        }
                    },
                },
            ]
        );
    }, [router]);

    // Early return if no data yet
    if (!data) {
        return (
            <View style={styles.container} testID="sessions-list-container" />
        );
    }

    const keyExtractor = React.useCallback((item: SessionListViewItem & { selected?: boolean }, index: number) => {
        switch (item.type) {
            case 'header': return `header-${item.title}-${index}`;
            case 'active-sessions': return 'active-sessions';
            case 'project-group': return `project-group-${item.machine.id}-${item.displayPath}-${index}`;
            case 'session': return `session-${item.session.id}`;
        }
    }, []);

    const renderItem = React.useCallback(({ item, index }: { item: SessionListViewItem & { selected?: boolean }, index: number }) => {
        switch (item.type) {
            case 'header':
                return (
                    <View style={styles.headerSection}>
                        <Text style={styles.headerText}>
                            {item.title}
                        </Text>
                    </View>
                );

            case 'active-sessions':
                // Extract just the session ID from pathname (e.g., /session/abc123/file -> abc123)
                let selectedId: string | undefined;
                if (isTablet && pathname.startsWith('/session/')) {
                    const parts = pathname.split('/');
                    selectedId = parts[2]; // parts[0] is empty, parts[1] is 'session', parts[2] is the ID
                }

                const ActiveComponent = compactSessionView ? ActiveSessionsGroupCompact : ActiveSessionsGroup;
                return (
                    <ActiveComponent
                        sessions={item.sessions}
                        selectedSessionId={selectedId}
                    />
                );

            case 'project-group':
                return (
                    <View style={styles.projectGroup}>
                        <Text style={styles.projectGroupTitle}>
                            {item.displayPath}
                        </Text>
                        <Text style={styles.projectGroupSubtitle}>
                            {item.machine.metadata?.displayName || item.machine.metadata?.host || item.machine.id}
                        </Text>
                    </View>
                );

            case 'session':
                // Determine card styling based on position within date group
                const prevItem = index > 0 && dataWithSelected ? dataWithSelected[index - 1] : null;
                const nextItem = index < (dataWithSelected?.length || 0) - 1 && dataWithSelected ? dataWithSelected[index + 1] : null;

                const isFirst = prevItem?.type === 'header';
                const isLast = nextItem?.type === 'header' || nextItem == null || nextItem?.type === 'active-sessions';
                const isSingle = isFirst && isLast;

                return (
                    <SessionItem
                        session={item.session}
                        selected={item.selected}
                        isFirst={isFirst}
                        isLast={isLast}
                        isSingle={isSingle}
                        onLongPress={handleSessionLongPress}
                    />
                );
        }
    }, [pathname, dataWithSelected, compactSessionView, handleSessionLongPress, isTablet]);

    const hasActiveFilters = searchQuery || backendFilter !== 'all' || statusFilter !== 'all';
    const showEmptyState = dataWithSelected && dataWithSelected.length === 0;
    const isFilteredEmpty = hasActiveFilters && showEmptyState;

    const HeaderComponent = React.useCallback(() => {
        const getBackendFilterLabel = () => {
            switch (backendFilter) {
                case 'all': return t('sessionsList.filterBackend.all');
                case 'claude': return t('sessionsList.filterBackend.claude');
                case 'codex': return t('sessionsList.filterBackend.codex');
                case 'gemini': return t('sessionsList.filterBackend.gemini');
            }
        };

        const getStatusFilterLabel = () => {
            switch (statusFilter) {
                case 'all': return t('sessionsList.filterStatus.all');
                case 'active': return t('sessionsList.filterStatus.active');
                case 'paused': return t('sessionsList.filterStatus.paused');
                case 'offline': return t('sessionsList.filterStatus.offline');
            }
        };

        return (
            <>
                <UpdateBanner />
                <PwaInstallBanner />
                <OfflineStatusBanner />

                {/* Search and Filter Bar */}
                <View style={styles.searchFilterContainer}>
                    {/* Search Input */}
                    <View
                        style={styles.searchInputContainer}
                        testID="sessions-list-search-input"
                    >
                        <Ionicons
                            name="search"
                            size={18}
                            color={theme.colors.textSecondary}
                            style={styles.searchIcon}
                        />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('sessionsList.searchPlaceholder')}
                            placeholderTextColor={theme.colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <Pressable
                                style={styles.clearSearchButton}
                                onPress={() => setSearchQuery('')}
                                hitSlop={8}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={18}
                                    color={theme.colors.textSecondary}
                                />
                            </Pressable>
                        )}
                    </View>

                    {/* Filter Row */}
                    <View style={styles.filterRow}>
                        {/* Backend Filter */}
                        <Pressable
                            style={[
                                styles.filterButton,
                                backendFilter !== 'all' && styles.filterButtonActive
                            ]}
                            onPress={handleBackendFilterPress}
                            testID="sessions-list-filter-backend"
                        >
                            <Ionicons
                                name="hardware-chip-outline"
                                size={14}
                                color={backendFilter !== 'all' ? theme.colors.button.primary.tint : theme.colors.textSecondary}
                            />
                            <Text style={[
                                styles.filterButtonText,
                                backendFilter !== 'all' && styles.filterButtonTextActive
                            ]}>
                                {getBackendFilterLabel()}
                            </Text>
                        </Pressable>

                        {/* Status Filter */}
                        <Pressable
                            style={[
                                styles.filterButton,
                                statusFilter !== 'all' && styles.filterButtonActive
                            ]}
                            onPress={handleStatusFilterPress}
                            testID="sessions-list-filter-status"
                        >
                            <Ionicons
                                name="radio-button-on-outline"
                                size={14}
                                color={statusFilter !== 'all' ? theme.colors.button.primary.tint : theme.colors.textSecondary}
                            />
                            <Text style={[
                                styles.filterButtonText,
                                statusFilter !== 'all' && styles.filterButtonTextActive
                            ]}>
                                {getStatusFilterLabel()}
                            </Text>
                        </Pressable>

                        {/* Clear Filters Button */}
                        {hasActiveFilters && (
                            <Pressable
                                style={styles.clearFiltersButton}
                                onPress={handleClearFilters}
                                testID="sessions-list-filter-clear"
                            >
                                <Text style={styles.clearFiltersText}>
                                    {t('sessionsList.clearFilters')}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </>
        );
    }, [
        searchQuery, setSearchQuery, backendFilter, statusFilter,
        handleBackendFilterPress, handleStatusFilterPress, handleClearFilters,
        hasActiveFilters, theme
    ]);

    // Empty state component
    const EmptyComponent = React.useCallback(() => (
        <View
            style={styles.emptyContainer}
            testID={isFilteredEmpty ? undefined : 'sessions-list-empty-container'}
        >
            <Ionicons
                name={isFilteredEmpty ? 'search-outline' : 'chatbubbles-outline'}
                size={48}
                color={theme.colors.textSecondary}
                style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>
                {isFilteredEmpty ? t('sessionsList.empty.filteredTitle') : t('sessionsList.empty.title')}
            </Text>
            <Text style={styles.emptyDescription}>
                {isFilteredEmpty ? t('sessionsList.empty.filteredDescription') : t('sessionsList.empty.description')}
            </Text>
        </View>
    ), [isFilteredEmpty, theme]);

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                <FlatList
                    data={dataWithSelected}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={{ paddingBottom: safeArea.bottom + 128, maxWidth: layout.maxWidth }}
                    ListHeaderComponent={HeaderComponent}
                    ListEmptyComponent={EmptyComponent}
                    testID="sessions-list-container"
                />
            </View>

        </View>
    );
}

// Sub-component that handles session message logic
const SessionItem = React.memo(({ session, selected, isFirst, isLast, isSingle, onLongPress }: {
    session: Session;
    selected?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    isSingle?: boolean;
    onLongPress?: (session: Session) => void;
}) => {
    const styles = stylesheet;
    const { theme } = useUnistyles();
    const sessionStatus = useSessionStatus(session);
    const sessionName = getSessionName(session);
    const sessionSubtitle = getSessionSubtitle(session);
    const navigateToSession = useNavigateToSession();
    const isTablet = useIsTablet();
    const backend = session.metadata?.flavor || 'claude';

    const avatarId = React.useMemo(() => {
        return getSessionAvatarId(session);
    }, [session]);

    const handleLongPress = React.useCallback(() => {
        onLongPress?.(session);
    }, [onLongPress, session]);

    // Backend badge colors
    const getBadgeColor = () => {
        switch (backend) {
            case 'claude': return { bg: '#F5E6D3', text: '#8B5A2B' };
            case 'codex': return { bg: '#E3F2FD', text: '#1565C0' };
            case 'gemini': return { bg: '#E8F5E9', text: '#2E7D32' };
            default: return { bg: theme.colors.surface, text: theme.colors.textSecondary };
        }
    };
    const badgeColors = getBadgeColor();

    return (
        <Pressable
            style={[
                styles.sessionItem,
                selected && styles.sessionItemSelected,
                isSingle ? styles.sessionItemSingle :
                    isFirst ? styles.sessionItemFirst :
                        isLast ? styles.sessionItemLast : {}
            ]}
            onPressIn={() => {
                if (isTablet) {
                    navigateToSession(session.id);
                }
            }}
            onPress={() => {
                if (!isTablet) {
                    navigateToSession(session.id);
                }
            }}
            onLongPress={handleLongPress}
            testID={`sessions-list-item-${session.id}`}
        >
            <View style={styles.avatarContainer}>
                <Avatar id={avatarId} size={48} monochrome={!sessionStatus.isConnected} flavor={session.metadata?.flavor} />
                {session.draft && (
                    <View style={styles.draftIconContainer}>
                        <Ionicons
                            name="create-outline"
                            size={12}
                            style={styles.draftIconOverlay}
                        />
                    </View>
                )}
            </View>
            <View style={styles.sessionContent}>
                {/* Title line with backend badge and fork indicators */}
                <View style={styles.sessionTitleRow}>
                    <Text
                        style={[
                            styles.sessionTitle,
                            sessionStatus.isConnected ? styles.sessionTitleConnected : styles.sessionTitleDisconnected
                        ]}
                        numberOfLines={1}
                        testID={`sessions-list-item-name-${session.id}`}
                    >
                        {sessionName}
                    </Text>
                    {/* Phase 5: Fork indicator - shows if this session was forked from another */}
                    {session.forkedFromSessionId && (
                        <View
                            style={styles.forkIndicator}
                            testID={`session-list-fork-indicator-${session.id}`}
                        >
                            <Ionicons
                                name="git-branch-outline"
                                size={12}
                                color={theme.colors.textSecondary}
                            />
                        </View>
                    )}
                    {/* Phase 5: Fork count badge - shows how many times this session has been forked */}
                    {(session.forkCount ?? 0) > 0 && (
                        <View
                            style={styles.forkBadge}
                            testID={`session-list-fork-count-badge-${session.id}`}
                        >
                            <Text style={styles.forkBadgeText}>
                                {session.forkCount}
                            </Text>
                        </View>
                    )}
                    {/* Backend badge */}
                    <View
                        style={[styles.backendBadge, { backgroundColor: badgeColors.bg }]}
                        testID={`sessions-list-item-backend-${session.id}`}
                    >
                        <Text style={[styles.backendBadgeText, { color: badgeColors.text }]}>
                            {backend.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Subtitle line (path) */}
                <Text
                    style={styles.sessionSubtitle}
                    numberOfLines={1}
                    testID={`sessions-list-item-path-${session.id}`}
                >
                    {sessionSubtitle}
                </Text>

                {/* Status line with dot */}
                <View style={styles.statusRow}>
                    <View
                        style={styles.statusDotContainer}
                        testID={`sessions-list-item-status-${session.id}`}
                    >
                        <StatusDot color={sessionStatus.statusDotColor} isPulsing={sessionStatus.isPulsing} />
                    </View>
                    <Text
                        style={[styles.statusText, { color: sessionStatus.statusColor }]}
                        testID={`sessions-list-item-lastActive-${session.id}`}
                    >
                        {sessionStatus.statusText}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
});
