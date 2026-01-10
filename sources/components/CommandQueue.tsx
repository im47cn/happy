/**
 * @file 命令队列管理组件
 * @input Command[], sessionId, onSend, onClose
 * @output 模态框形式的命令队列管理 UI，支持编辑、删除、清空、发送
 * @pos Phase 2 Remote Control - 命令队列管理 UI 实现
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import * as React from "react";
import {
    FlatList,
    ListRenderItem,
    Modal,
    Pressable,
    Text,
    TextInput,
    View,
    Alert,
    Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";

import { t } from "@/text";

/**
 * Command item in the queue
 */
export interface QueuedCommand {
    /** Unique identifier */
    id: string;
    /** Command text content */
    text: string;
    /** Timestamp when command was added */
    createdAt: number;
    /** Command status */
    status: "pending" | "sending" | "sent" | "failed";
}

interface CommandQueueProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** List of queued commands */
    commands: QueuedCommand[];
    /** Callback when a command is edited */
    onEdit: (id: string, newText: string) => void;
    /** Callback when a command is deleted */
    onDelete: (id: string) => void;
    /** Callback when all commands are cleared */
    onClear: () => void;
    /** Callback to send a command */
    onSend: (id: string) => void;
    /** Callback to close the modal */
    onClose: () => void;
}

interface EditingState {
    id: string;
    text: string;
}

/**
 * Command Queue Management Modal
 * Displays queued commands with edit, delete, and clear capabilities
 */
export const CommandQueue = React.memo<CommandQueueProps>(
    ({ visible, commands, onEdit, onDelete, onClear, onSend, onClose }) => {
        const { theme } = useUnistyles();
        const safeArea = useSafeAreaInsets();
        const [editing, setEditing] = React.useState<EditingState | null>(null);

        const formatTime = React.useCallback((timestamp: number): string => {
            try {
                const date = new Date(timestamp);
                return date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                });
            } catch {
                return t("message.unknownTime");
            }
        }, []);

        const handleEdit = React.useCallback((command: QueuedCommand) => {
            setEditing({ id: command.id, text: command.text });
        }, []);

        const handleSaveEdit = React.useCallback(() => {
            if (editing && editing.text.trim()) {
                onEdit(editing.id, editing.text.trim());
                setEditing(null);
            }
        }, [editing, onEdit]);

        const handleCancelEdit = React.useCallback(() => {
            setEditing(null);
        }, []);

        const handleDelete = React.useCallback(
            (id: string) => {
                if (Platform.OS === "web") {
                    // On web, use confirm dialog
                    if (window.confirm(t("commandQueue.deleteConfirm"))) {
                        onDelete(id);
                    }
                } else {
                    Alert.alert(
                        t("commandQueue.deleteTitle"),
                        t("commandQueue.deleteConfirm"),
                        [
                            { text: t("common.cancel"), style: "cancel" },
                            {
                                text: t("common.delete"),
                                style: "destructive",
                                onPress: () => onDelete(id),
                            },
                        ]
                    );
                }
            },
            [onDelete]
        );

        const handleClear = React.useCallback(() => {
            if (commands.length === 0) return;

            if (Platform.OS === "web") {
                if (window.confirm(t("commandQueue.clearConfirm"))) {
                    onClear();
                }
            } else {
                Alert.alert(
                    t("commandQueue.clearTitle"),
                    t("commandQueue.clearConfirm"),
                    [
                        { text: t("common.cancel"), style: "cancel" },
                        {
                            text: t("commandQueue.clear"),
                            style: "destructive",
                            onPress: onClear,
                        },
                    ]
                );
            }
        }, [commands.length, onClear]);

        const renderItem: ListRenderItem<QueuedCommand> = React.useCallback(
            ({ item }) => {
                const isEditing = editing?.id === item.id;

                return (
                    <View
                        testID={`queue-list-item-${item.id}`}
                        style={[
                            styles.commandItem,
                            { backgroundColor: theme.colors.surface },
                        ]}
                    >
                        {isEditing ? (
                            // Edit mode
                            <View style={styles.editContainer}>
                                <TextInput
                                    testID={`queue-list-item-edit-input-${item.id}`}
                                    style={[
                                        styles.editInput,
                                        {
                                            color: theme.colors.text,
                                            backgroundColor:
                                                theme.colors.surfaceHigh,
                                            borderColor: theme.colors.status.connected,
                                        },
                                    ]}
                                    value={editing?.text || ""}
                                    onChangeText={(text) =>
                                        setEditing((prev) =>
                                            prev ? { ...prev, text } : null
                                        )
                                    }
                                    multiline
                                    autoFocus
                                    placeholder={t(
                                        "commandQueue.editPlaceholder"
                                    )}
                                    placeholderTextColor={
                                        theme.colors.textSecondary
                                    }
                                />
                                <View style={styles.editActions}>
                                    <Pressable
                                        testID={`queue-list-item-edit-cancel-${item.id}`}
                                        style={[
                                            styles.editButton,
                                            {
                                                backgroundColor:
                                                    theme.colors.surfaceHighest,
                                            },
                                        ]}
                                        onPress={handleCancelEdit}
                                    >
                                        <Text
                                            style={{
                                                color: theme.colors.textSecondary,
                                            }}
                                        >
                                            {t("common.cancel")}
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        testID={`queue-list-item-edit-save-${item.id}`}
                                        style={[
                                            styles.editButton,
                                            {
                                                backgroundColor:
                                                    theme.colors.button.primary.background,
                                            },
                                        ]}
                                        onPress={handleSaveEdit}
                                    >
                                        <Text style={{ color: "#fff" }}>
                                            {t("common.save")}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        ) : (
                            // Display mode
                            <>
                                <View style={styles.commandContent}>
                                    <Text
                                        testID={`queue-list-item-text-${item.id}`}
                                        style={[
                                            styles.commandText,
                                            { color: theme.colors.text },
                                        ]}
                                        numberOfLines={3}
                                        ellipsizeMode="tail"
                                    >
                                        {item.text}
                                    </Text>
                                    <View style={styles.commandMeta}>
                                        <Text
                                            testID={`queue-list-item-time-${item.id}`}
                                            style={[
                                                styles.commandTime,
                                                {
                                                    color: theme.colors
                                                        .textSecondary,
                                                },
                                            ]}
                                        >
                                            {formatTime(item.createdAt)}
                                        </Text>
                                        {item.status !== "pending" && (
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    {
                                                        backgroundColor:
                                                            item.status ===
                                                            "sending"
                                                                ? theme.colors
                                                                      .warning
                                                                : item.status ===
                                                                    "sent"
                                                                  ? theme.colors
                                                                        .success
                                                                  : theme.colors
                                                                        .status.error,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={styles.statusText}
                                                >
                                                    {t(
                                                        `commandQueue.status.${item.status}`
                                                    )}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <View style={styles.commandActions}>
                                    <Pressable
                                        testID={`queue-list-item-send-${item.id}`}
                                        style={[
                                            styles.actionButton,
                                            { marginRight: 4 },
                                        ]}
                                        onPress={() => onSend(item.id)}
                                        disabled={item.status === "sending"}
                                    >
                                        <Ionicons
                                            name="send"
                                            size={18}
                                            color={
                                                item.status === "sending"
                                                    ? theme.colors.textSecondary
                                                    : theme.colors.status.connected
                                            }
                                        />
                                    </Pressable>
                                    <Pressable
                                        testID={`queue-list-item-edit-${item.id}`}
                                        style={[
                                            styles.actionButton,
                                            { marginRight: 4 },
                                        ]}
                                        onPress={() => handleEdit(item)}
                                        disabled={item.status === "sending"}
                                    >
                                        <Ionicons
                                            name="pencil"
                                            size={18}
                                            color={
                                                item.status === "sending"
                                                    ? theme.colors.textSecondary
                                                    : theme.colors.status.connected
                                            }
                                        />
                                    </Pressable>
                                    <Pressable
                                        testID={`queue-list-item-delete-${item.id}`}
                                        style={styles.actionButton}
                                        onPress={() => handleDelete(item.id)}
                                        disabled={item.status === "sending"}
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={18}
                                            color={
                                                item.status === "sending"
                                                    ? theme.colors.textSecondary
                                                    : theme.colors.status.error
                                            }
                                        />
                                    </Pressable>
                                </View>
                            </>
                        )}
                    </View>
                );
            },
            [
                theme,
                editing,
                formatTime,
                handleEdit,
                handleSaveEdit,
                handleCancelEdit,
                handleDelete,
                onSend,
            ]
        );

        const keyExtractor = React.useCallback(
            (item: QueuedCommand) => item.id,
            []
        );

        const ListEmptyComponent = React.useCallback(
            () => (
                <View style={styles.emptyContainer}>
                    <Ionicons
                        name="list-outline"
                        size={48}
                        color={theme.colors.textSecondary}
                    />
                    <Text
                        style={[
                            styles.emptyText,
                            { color: theme.colors.textSecondary },
                        ]}
                    >
                        {t("commandQueue.empty")}
                    </Text>
                    <Text
                        style={[
                            styles.emptySubtext,
                            { color: theme.colors.textSecondary, opacity: 0.7 },
                        ]}
                    >
                        {t("commandQueue.emptyDescription")}
                    </Text>
                </View>
            ),
            [theme]
        );

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
                        testID="queue-modal-container"
                        style={[
                            styles.modalContent,
                            {
                                backgroundColor: theme.colors.groupped.background,
                                paddingBottom: safeArea.bottom + 16,
                            },
                        ]}
                    >
                        {/* Header */}
                        <View
                            style={[
                                styles.modalHeader,
                                { borderBottomColor: theme.colors.divider },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.modalTitle,
                                    { color: theme.colors.text },
                                ]}
                            >
                                {t("commandQueue.title")}
                            </Text>
                            <View style={styles.headerActions}>
                                {commands.length > 0 && (
                                    <Pressable
                                        testID="queue-control-clear"
                                        style={[
                                            styles.headerButton,
                                            { marginRight: 8 },
                                        ]}
                                        onPress={handleClear}
                                    >
                                        <Text
                                            style={[
                                                styles.headerButtonText,
                                                { color: theme.colors.textDestructive },
                                            ]}
                                        >
                                            {t("commandQueue.clear")}
                                        </Text>
                                    </Pressable>
                                )}
                                <Pressable
                                    testID="queue-control-close"
                                    style={styles.closeButton}
                                    onPress={onClose}
                                >
                                    <Ionicons
                                        name="close"
                                        size={24}
                                        color={theme.colors.text}
                                    />
                                </Pressable>
                            </View>
                        </View>

                        {/* Queue count */}
                        <View
                            style={[
                                styles.countBar,
                                { backgroundColor: theme.colors.surface },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.countText,
                                    { color: theme.colors.textSecondary },
                                ]}
                            >
                                {t("commandQueue.count", {
                                    count: commands.length,
                                })}
                            </Text>
                        </View>

                        {/* Command list */}
                        <FlatList
                            testID="queue-list-container"
                            data={commands}
                            renderItem={renderItem}
                            keyExtractor={keyExtractor}
                            ListEmptyComponent={ListEmptyComponent}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ItemSeparatorComponent={() => (
                                <View style={styles.separator} />
                            )}
                        />
                    </View>
                </View>
            </Modal>
        );
    }
);

CommandQueue.displayName = "CommandQueue";

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        maxHeight: "80%",
        minHeight: 300,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    headerButtonText: {
        fontSize: 14,
        fontWeight: "500",
    },
    closeButton: {
        padding: 4,
    },
    countBar: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    countText: {
        fontSize: 13,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
        flexGrow: 1,
    },
    commandItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
    },
    commandContent: {
        flex: 1,
        marginRight: 8,
    },
    commandText: {
        fontSize: 15,
        lineHeight: 20,
    },
    commandMeta: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    commandTime: {
        fontSize: 12,
    },
    statusBadge: {
        marginLeft: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        color: "#fff",
        fontWeight: "500",
    },
    commandActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    actionButton: {
        padding: 8,
    },
    editContainer: {
        flex: 1,
    },
    editInput: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 15,
        minHeight: 60,
        textAlignVertical: "top",
    },
    editActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 8,
        gap: 8,
    },
    editButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    separator: {
        height: 8,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: "500",
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 4,
        textAlign: "center",
    },
});
