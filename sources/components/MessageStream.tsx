/**
 * @file 实时消息流组件
 * @input Message[], Session, sync/typesMessage
 * @output FlatList-based 消息流组件，支持流式渲染、自动滚动、消息详情
 * @pos Phase 2 Remote Control - 实时输出流组件优化
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import * as React from "react";
import {
    ActivityIndicator,
    FlatList,
    ListRenderItem,
    Modal,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";

import { MessageView } from "./MessageView";
import { ChatFooter } from "./ChatFooter";
import { useSession, useSessionMessages } from "@/sync/storage";
import { Message } from "@/sync/typesMessage";
import { Metadata, Session } from "@/sync/storageTypes";
import { useHeaderHeight } from "@/utils/responsive";
import { t } from "@/text";

interface MessageStreamProps {
    /** Session object */
    session: Session;
    /** Enable auto-scroll to latest message when new messages arrive */
    autoScrollEnabled?: boolean;
}

interface MessageDetailModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Message to show details for */
    message: Message | null;
    /** Callback to close the modal */
    onClose: () => void;
}

/**
 * Message detail modal component
 * Shows timestamp, messageId, and encryption status
 */
const MessageDetailModal = React.memo<MessageDetailModalProps>(
    ({ visible, message, onClose }) => {
        const { theme } = useUnistyles();
        const safeArea = useSafeAreaInsets();

        if (!message) return null;

        const formatTimestamp = (timestamp: number): string => {
            try {
                const date = new Date(timestamp);
                return date.toLocaleString();
            } catch {
                return t("message.unknownTime");
            }
        };

        // All messages in the system use E2EE encryption
        // We don't have a per-message flag, so we show as encrypted by default
        const isEncrypted = true;

        return (
            <Modal
                visible={visible}
                animationType="slide"
                transparent={true}
                onRequestClose={onClose}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={onClose} />
                    <View
                        testID="messagestream-detail-modal"
                        style={[
                            styles.modalContent,
                            {
                                backgroundColor: theme.colors.surface,
                                paddingBottom: safeArea.bottom + 16,
                            },
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text
                                style={[
                                    styles.modalTitle,
                                    { color: theme.colors.text },
                                ]}
                            >
                                {t("message.details")}
                            </Text>
                            <Pressable
                                onPress={onClose}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={theme.colors.textSecondary}
                                />
                            </Pressable>
                        </View>

                        {/* Details */}
                        <View style={styles.modalBody}>
                            {/* Message ID */}
                            <View style={styles.detailRow}>
                                <Text
                                    style={[
                                        styles.detailLabel,
                                        { color: theme.colors.textSecondary },
                                    ]}
                                >
                                    {t("message.id")}
                                </Text>
                                <Text
                                    testID="messagestream-detail-messageId"
                                    style={[
                                        styles.detailValue,
                                        styles.monospace,
                                        { color: theme.colors.text },
                                    ]}
                                    selectable
                                    numberOfLines={1}
                                >
                                    {message.id}
                                </Text>
                            </View>

                            {/* Timestamp */}
                            <View style={styles.detailRow}>
                                <Text
                                    style={[
                                        styles.detailLabel,
                                        { color: theme.colors.textSecondary },
                                    ]}
                                >
                                    {t("message.timestamp")}
                                </Text>
                                <Text
                                    testID="messagestream-detail-timestamp"
                                    style={[
                                        styles.detailValue,
                                        { color: theme.colors.text },
                                    ]}
                                >
                                    {formatTimestamp(message.createdAt)}
                                </Text>
                            </View>

                            {/* Message Type */}
                            <View style={styles.detailRow}>
                                <Text
                                    style={[
                                        styles.detailLabel,
                                        { color: theme.colors.textSecondary },
                                    ]}
                                >
                                    {t("message.type")}
                                </Text>
                                <View
                                    style={[
                                        styles.typeBadge,
                                        {
                                            backgroundColor:
                                                theme.colors.surfaceHigh,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.typeBadgeText,
                                            { color: theme.colors.text },
                                        ]}
                                    >
                                        {message.kind}
                                    </Text>
                                </View>
                            </View>

                            {/* Encryption Status */}
                            <View style={styles.detailRow}>
                                <Text
                                    style={[
                                        styles.detailLabel,
                                        { color: theme.colors.textSecondary },
                                    ]}
                                >
                                    {t("message.encryption")}
                                </Text>
                                <View
                                    testID="messagestream-detail-encrypted"
                                    style={[
                                        styles.encryptionBadge,
                                        {
                                            backgroundColor: isEncrypted
                                                ? theme.dark
                                                    ? "rgba(52, 199, 89, 0.2)"
                                                    : "rgba(52, 199, 89, 0.15)"
                                                : theme.dark
                                                  ? "rgba(255, 204, 0, 0.2)"
                                                  : "rgba(255, 204, 0, 0.15)",
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={
                                            isEncrypted
                                                ? "lock-closed"
                                                : "lock-open"
                                        }
                                        size={14}
                                        color={
                                            isEncrypted ? "#34C759" : "#FFCC00"
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.encryptionText,
                                            {
                                                color: isEncrypted
                                                    ? "#34C759"
                                                    : "#FFCC00",
                                            },
                                        ]}
                                    >
                                        {isEncrypted
                                            ? t("message.encrypted")
                                            : t("message.unencrypted")}
                                    </Text>
                                </View>
                            </View>

                            {/* Local ID (if exists) */}
                            {"localId" in message && message.localId && (
                                <View style={styles.detailRow}>
                                    <Text
                                        style={[
                                            styles.detailLabel,
                                            {
                                                color: theme.colors
                                                    .textSecondary,
                                            },
                                        ]}
                                    >
                                        {t("message.localId")}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.detailValue,
                                            styles.monospace,
                                            { color: theme.colors.text },
                                        ]}
                                        selectable
                                        numberOfLines={1}
                                    >
                                        {message.localId}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }
);

/**
 * MessageStream Component
 *
 * An optimized message list component using FlashList for better performance
 * with real-time streaming messages. Features include:
 * - FlashList for virtualized rendering
 * - Auto-scroll to latest messages
 * - Message detail modal on long press
 * - Support for all message types (user-text, agent-text, tool-call, agent-event)
 *
 * @example
 * ```tsx
 * <MessageStream session={session} autoScrollEnabled={true} />
 * ```
 */
export const MessageStream = React.memo<MessageStreamProps>(
    ({ session, autoScrollEnabled = true }) => {
        const { messages, isLoaded } = useSessionMessages(session.id);
        const [showAutoScrollButton, setShowAutoScrollButton] =
            React.useState(false);
        const [selectedMessage, setSelectedMessage] =
            React.useState<Message | null>(null);
        const [isDetailModalVisible, setIsDetailModalVisible] =
            React.useState(false);
        const listRef = React.useRef<FlatList<Message> | null>(null);
        const isUserScrolling = React.useRef(false);

        // Show auto-scroll button when user scrolls away from bottom
        const handleScroll = React.useCallback(
            (event: { nativeEvent: { contentOffset: { y: number } } }) => {
                const { y } = event.nativeEvent.contentOffset;
                // Since list is inverted, y > threshold means scrolled away from "bottom" (actually top)
                const isScrolledAway = y > 100;
                setShowAutoScrollButton(isScrolledAway);
                isUserScrolling.current = isScrolledAway;
            },
            []
        );

        // Scroll to latest message (top of inverted list = index 0)
        const scrollToLatest = React.useCallback(() => {
            listRef.current?.scrollToIndex({
                index: 0,
                animated: true,
            });
            setShowAutoScrollButton(false);
        }, []);

        // Handle message long press to show details
        const handleMessageLongPress = React.useCallback((message: Message) => {
            setSelectedMessage(message);
            setIsDetailModalVisible(true);
        }, []);

        // Close detail modal
        const closeDetailModal = React.useCallback(() => {
            setIsDetailModalVisible(false);
            setSelectedMessage(null);
        }, []);

        // Auto-scroll to latest when new messages arrive (if enabled and user hasn't scrolled)
        React.useEffect(() => {
            if (
                autoScrollEnabled &&
                messages.length > 0 &&
                !isUserScrolling.current
            ) {
                // Small delay to ensure list has updated
                setTimeout(() => {
                    listRef.current?.scrollToIndex({
                        index: 0,
                        animated: true,
                    });
                }, 100);
            }
        }, [messages.length, autoScrollEnabled]);

        const keyExtractor = React.useCallback(
            (item: Message) => item.id,
            []
        );

        const renderItem: ListRenderItem<Message> = React.useCallback(
            ({ item }) => (
                <MessageItemWrapper
                    message={item}
                    metadata={session.metadata}
                    sessionId={session.id}
                    onLongPress={handleMessageLongPress}
                />
            ),
            [session.metadata, session.id, handleMessageLongPress]
        );

        const ListHeaderComponent = React.useMemo(
            () => <ListFooterInternal sessionId={session.id} />,
            [session.id]
        );

        const ListFooterComponent = React.useMemo(
            () => <ListHeaderInternal />,
            []
        );

        // Loading state
        if (!isLoaded) {
            return (
                <View
                    testID="messagestream-container"
                    style={styles.loadingContainer}
                >
                    <ActivityIndicator size="small" />
                </View>
            );
        }

        return (
            <View testID="messagestream-container" style={styles.container}>
                <FlatList
                    ref={listRef}
                    data={messages}
                    inverted={true}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={
                        Platform.OS === "ios" ? "interactive" : "none"
                    }
                    ListHeaderComponent={ListHeaderComponent}
                    ListFooterComponent={ListFooterComponent}
                    maintainVisibleContentPosition={{
                        minIndexForVisible: 0,
                        autoscrollToTopThreshold: 10,
                    }}
                />

                {/* Auto-scroll button */}
                {showAutoScrollButton && (
                    <AutoScrollButton onPress={scrollToLatest} />
                )}

                {/* Message detail modal */}
                <MessageDetailModal
                    visible={isDetailModalVisible}
                    message={selectedMessage}
                    onClose={closeDetailModal}
                />
            </View>
        );
    }
);

/**
 * Wrapper component to add long press handler to messages
 */
const MessageItemWrapper = React.memo<{
    message: Message;
    metadata: Metadata | null;
    sessionId: string;
    onLongPress: (message: Message) => void;
}>(({ message, metadata, sessionId, onLongPress }) => {
    const handleLongPress = React.useCallback(() => {
        onLongPress(message);
    }, [message, onLongPress]);

    return (
        <Pressable onLongPress={handleLongPress} delayLongPress={500}>
            <MessageView
                message={message}
                metadata={metadata}
                sessionId={sessionId}
            />
        </Pressable>
    );
});

/**
 * Auto-scroll button component
 */
const AutoScrollButton = React.memo<{ onPress: () => void }>(({ onPress }) => {
    const { theme } = useUnistyles();
    const safeArea = useSafeAreaInsets();

    return (
        <Pressable
            testID="messagestream-autoscroll"
            onPress={onPress}
            style={[
                styles.autoScrollButton,
                {
                    backgroundColor: theme.colors.surfaceHighest,
                    bottom: safeArea.bottom + 120,
                },
            ]}
        >
            <Ionicons
                name="chevron-down"
                size={20}
                color={theme.colors.text}
            />
        </Pressable>
    );
});

/**
 * List header component (shows at bottom of inverted list)
 */
const ListHeaderInternal = React.memo(() => {
    const headerHeight = useHeaderHeight();
    const safeArea = useSafeAreaInsets();
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                height: headerHeight + safeArea.top + 32,
            }}
        />
    );
});

/**
 * List footer component (shows at top of inverted list)
 */
const ListFooterInternal = React.memo<{ sessionId: string }>(
    ({ sessionId }) => {
        const session = useSession(sessionId);
        if (!session) return null;
        return (
            <ChatFooter
                controlledByUser={session.agentState?.controlledByUser || false}
            />
        );
    }
);

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    autoScrollButton: {
        position: "absolute",
        right: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: theme.colors.shadow.color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.colors.shadow.opacity,
        shadowRadius: 4,
        elevation: 4,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    modalBackdrop: {
        ...Platform.select({
            ios: {
                ...StyleSheet.absoluteFillObject,
            },
            default: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            },
        }),
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 8,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.divider,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    modalCloseButton: {
        padding: 4,
    },
    modalBody: {
        padding: 16,
        gap: 16,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    detailLabel: {
        fontSize: 14,
    },
    detailValue: {
        fontSize: 14,
        flex: 1,
        textAlign: "right",
        marginLeft: 16,
    },
    monospace: {
        fontFamily: Platform.select({
            ios: "Menlo",
            android: "monospace",
            default: "monospace",
        }),
        fontSize: 12,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: "500",
    },
    encryptionBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    encryptionText: {
        fontSize: 12,
        fontWeight: "500",
    },
}));
