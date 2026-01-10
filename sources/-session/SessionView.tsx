import { AgentContentView } from '@/components/AgentContentView';
import { AgentInput } from '@/components/AgentInput';
import { getSuggestions } from '@/components/autocomplete/suggestions';
import { ChatHeaderView } from '@/components/ChatHeaderView';
import { ChatList } from '@/components/ChatList';
import { Deferred } from '@/components/Deferred';
import { EmptyMessages } from '@/components/EmptyMessages';
import { hapticsLight } from '@/components/haptics';
import { VoiceAssistantStatusBar } from '@/components/VoiceAssistantStatusBar';
import { useDraft } from '@/hooks/useDraft';
import { Modal } from '@/modal';
import { voiceHooks } from '@/realtime/hooks/voiceHooks';
import { startRealtimeSession, stopRealtimeSession } from '@/realtime/RealtimeSession';
import { gitStatusSync } from '@/sync/gitStatusSync';
import { sessionAbort, sessionPause, sessionResume, sessionTerminate, sessionSwitch } from '@/sync/ops';
import { storage, useIsDataReady, useLocalSetting, useRealtimeStatus, useSessionMessages, useSessionUsage, useSetting } from '@/sync/storage';
import { useSession } from '@/sync/storage';
import { Session } from '@/sync/storageTypes';
import { sync } from '@/sync/sync';
import { t } from '@/text';
import { tracking, trackMessageSent } from '@/track';
import { isRunningOnMac } from '@/utils/platform';
import { useDeviceType, useHeaderHeight, useIsLandscape, useIsTablet } from '@/utils/responsive';
import { formatPathRelativeToHome, getSessionAvatarId, getSessionName, useSessionStatus } from '@/utils/sessionUtils';
import { isVersionSupported, MINIMUM_CLI_VERSION } from '@/utils/versionUtils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useMemo } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnistyles } from 'react-native-unistyles';

export const SessionView = React.memo((props: { id: string }) => {
    const sessionId = props.id;
    const router = useRouter();
    const session = useSession(sessionId);
    const isDataReady = useIsDataReady();
    const { theme } = useUnistyles();
    const safeArea = useSafeAreaInsets();
    const isLandscape = useIsLandscape();
    const deviceType = useDeviceType();
    const headerHeight = useHeaderHeight();
    const realtimeStatus = useRealtimeStatus();
    const isTablet = useIsTablet();

    // Compute header props based on session state
    const headerProps = useMemo(() => {
        if (!isDataReady) {
            // Loading state - show empty header
            return {
                title: '',
                subtitle: undefined,
                avatarId: undefined,
                onAvatarPress: undefined,
                isConnected: false,
                flavor: null
            };
        }

        if (!session) {
            // Deleted state - show deleted message in header
            return {
                title: t('errors.sessionDeleted'),
                subtitle: undefined,
                avatarId: undefined,
                onAvatarPress: undefined,
                isConnected: false,
                flavor: null
            };
        }

        // Normal state - show session info
        const isConnected = session.presence === 'online';
        return {
            title: getSessionName(session),
            subtitle: session.metadata?.path ? formatPathRelativeToHome(session.metadata.path, session.metadata?.homeDir) : undefined,
            avatarId: getSessionAvatarId(session),
            onAvatarPress: () => router.push(`/session/${sessionId}/info`),
            isConnected: isConnected,
            flavor: session.metadata?.flavor || null,
            tintColor: isConnected ? '#000' : '#8E8E93'
        };
    }, [session, isDataReady, sessionId, router]);

    return (
        <>
            {/* Status bar shadow for landscape mode */}
            {isLandscape && deviceType === 'phone' && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: safeArea.top,
                    backgroundColor: theme.colors.surface,
                    zIndex: 1000,
                    shadowColor: theme.colors.shadow.color,
                    shadowOffset: {
                        width: 0,
                        height: 2,
                    },
                    shadowOpacity: theme.colors.shadow.opacity,
                    shadowRadius: 3,
                    elevation: 5,
                }} />
            )}

            {/* Header - always shown, hidden in landscape mode on phone */}
            {!(isLandscape && deviceType === 'phone') && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000
                }}>
                    <ChatHeaderView
                        {...headerProps}
                        onBackPress={() => router.back()}
                    />
                    {/* Voice status bar below header - not on tablet (shown in sidebar) */}
                    {!isTablet && realtimeStatus !== 'disconnected' && (
                        <VoiceAssistantStatusBar variant="full" />
                    )}
                </View>
            )}

            {/* Content based on state */}
            <View style={{ flex: 1, paddingTop: !(isLandscape && deviceType === 'phone') ? safeArea.top + headerHeight + (!isTablet && realtimeStatus !== 'disconnected' ? 48 : 0) : 0 }}>
                {!isDataReady ? (
                    // Loading state
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="small" color={theme.colors.textSecondary} />
                    </View>
                ) : !session ? (
                    // Deleted state
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="trash-outline" size={48} color={theme.colors.textSecondary} />
                        <Text style={{ color: theme.colors.text, fontSize: 20, marginTop: 16, fontWeight: '600' }}>{t('errors.sessionDeleted')}</Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 15, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>{t('errors.sessionDeletedDescription')}</Text>
                    </View>
                ) : (
                    // Normal session view
                    <SessionViewLoaded key={sessionId} sessionId={sessionId} session={session} />
                )}
            </View>
        </>
    );
});


function SessionViewLoaded({ sessionId, session }: { sessionId: string, session: Session }) {
    const { theme } = useUnistyles();
    const router = useRouter();
    const safeArea = useSafeAreaInsets();
    const isLandscape = useIsLandscape();
    const deviceType = useDeviceType();
    const [message, setMessage] = React.useState('');
    const realtimeStatus = useRealtimeStatus();
    const { messages, isLoaded } = useSessionMessages(sessionId);
    const acknowledgedCliVersions = useLocalSetting('acknowledgedCliVersions');

    // Phase 2: Control state
    const [controlAction, setControlAction] = React.useState<'pause' | 'resume' | 'terminate' | 'switch' | null>(null);
    const isControlling = controlAction !== null;

    // Check if CLI version is outdated and not already acknowledged
    const cliVersion = session.metadata?.version;
    const machineId = session.metadata?.machineId;
    const isCliOutdated = cliVersion && !isVersionSupported(cliVersion, MINIMUM_CLI_VERSION);
    const isAcknowledged = machineId && acknowledgedCliVersions[machineId] === cliVersion;
    const shouldShowCliWarning = isCliOutdated && !isAcknowledged;
    // Get permission mode from session object, default to 'default'
    const permissionMode = session.permissionMode || 'default';
    const sessionStatus = useSessionStatus(session);
    const sessionUsage = useSessionUsage(sessionId);
    const alwaysShowContextSize = useSetting('alwaysShowContextSize');
    const experiments = useSetting('experiments');

    // Use draft hook for auto-saving message drafts
    const { clearDraft } = useDraft(sessionId, message, setMessage);

    // Handle dismissing CLI version warning
    const handleDismissCliWarning = React.useCallback(() => {
        if (machineId && cliVersion) {
            storage.getState().applyLocalSettings({
                acknowledgedCliVersions: {
                    ...acknowledgedCliVersions,
                    [machineId]: cliVersion
                }
            });
        }
    }, [machineId, cliVersion, acknowledgedCliVersions]);

    // Function to update permission mode
    const updatePermissionMode = React.useCallback((mode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'read-only' | 'safe-yolo' | 'yolo') => {
        storage.getState().updateSessionPermissionMode(sessionId, mode);
    }, [sessionId]);

    // Phase 2: Control handlers
    const handlePause = React.useCallback(async () => {
        if (isControlling) return;
        hapticsLight();
        setControlAction('pause');
        try {
            const result = await sessionPause(sessionId);
            if (!result.success) {
                Modal.alert(t('common.error'), result.error || t('errors.controlFailed'));
            }
        } catch (error) {
            Modal.alert(t('common.error'), error instanceof Error ? error.message : t('errors.controlFailed'));
        } finally {
            setControlAction(null);
        }
    }, [sessionId, isControlling]);

    const handleResume = React.useCallback(async () => {
        if (isControlling) return;
        hapticsLight();
        setControlAction('resume');
        try {
            const result = await sessionResume(sessionId);
            if (!result.success) {
                Modal.alert(t('common.error'), result.error || t('errors.controlFailed'));
            }
        } catch (error) {
            Modal.alert(t('common.error'), error instanceof Error ? error.message : t('errors.controlFailed'));
        } finally {
            setControlAction(null);
        }
    }, [sessionId, isControlling]);

    const handleTerminate = React.useCallback(async () => {
        if (isControlling) return;
        hapticsLight();
        // Confirm before terminating
        Modal.alert(
            t('session.terminateTitle'),
            t('session.terminateConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('session.terminate'),
                    style: 'destructive',
                    onPress: async () => {
                        setControlAction('terminate');
                        try {
                            const result = await sessionTerminate(sessionId);
                            if (!result.success) {
                                Modal.alert(t('common.error'), result.error || t('errors.controlFailed'));
                            }
                        } catch (error) {
                            Modal.alert(t('common.error'), error instanceof Error ? error.message : t('errors.controlFailed'));
                        } finally {
                            setControlAction(null);
                        }
                    }
                }
            ]
        );
    }, [sessionId, isControlling]);

    const handleSwitchMode = React.useCallback(async () => {
        if (isControlling) return;
        hapticsLight();
        // Determine target mode (toggle between local and remote)
        const currentMode = session.metadata?.flavor === 'local' ? 'local' : 'remote';
        const targetMode = currentMode === 'local' ? 'remote' : 'local';

        // Confirm mode switch
        Modal.alert(
            t('session.switchModeTitle'),
            t('session.switchModeConfirm', { mode: targetMode }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('session.switchMode'),
                    onPress: async () => {
                        setControlAction('switch');
                        try {
                            const success = await sessionSwitch(sessionId, targetMode);
                            if (!success) {
                                Modal.alert(t('common.error'), t('errors.controlFailed'));
                            }
                        } catch (error) {
                            Modal.alert(t('common.error'), error instanceof Error ? error.message : t('errors.controlFailed'));
                        } finally {
                            setControlAction(null);
                        }
                    }
                }
            ]
        );
    }, [sessionId, session.metadata?.flavor, isControlling]);


    // Handle microphone button press - memoized to prevent button flashing
    const handleMicrophonePress = React.useCallback(async () => {
        if (realtimeStatus === 'connecting') {
            return; // Prevent actions during transitions
        }
        if (realtimeStatus === 'disconnected' || realtimeStatus === 'error') {
            try {
                const initialPrompt = voiceHooks.onVoiceStarted(sessionId);
                await startRealtimeSession(sessionId, initialPrompt);
                tracking?.capture('voice_session_started', { sessionId });
            } catch (error) {
                console.error('Failed to start realtime session:', error);
                Modal.alert(t('common.error'), t('errors.voiceSessionFailed'));
                tracking?.capture('voice_session_error', { error: error instanceof Error ? error.message : 'Unknown error' });
            }
        } else if (realtimeStatus === 'connected') {
            await stopRealtimeSession();
            tracking?.capture('voice_session_stopped');

            // Notify voice assistant about voice session stop
            voiceHooks.onVoiceStopped();
        }
    }, [realtimeStatus, sessionId]);

    // Memoize mic button state to prevent flashing during chat transitions
    const micButtonState = useMemo(() => ({
        onMicPress: handleMicrophonePress,
        isMicActive: realtimeStatus === 'connected' || realtimeStatus === 'connecting'
    }), [handleMicrophonePress, realtimeStatus]);

    // Trigger session visibility and initialize git status sync
    React.useLayoutEffect(() => {

        // Trigger session sync
        sync.onSessionVisible(sessionId);


        // Initialize git status sync for this session
        gitStatusSync.getSync(sessionId);
    }, [sessionId, realtimeStatus]);

    let content = (
        <>
            <Deferred>
                {messages.length > 0 && (
                    <ChatList session={session} />
                )}
            </Deferred>
        </>
    );
    const placeholder = messages.length === 0 ? (
        <>
            {isLoaded ? (
                <EmptyMessages session={session} />
            ) : (
                <ActivityIndicator size="small" color={theme.colors.textSecondary} />
            )}
        </>
    ) : null;

    const input = (
        <AgentInput
            placeholder={t('session.inputPlaceholder')}
            value={message}
            onChangeText={setMessage}
            sessionId={sessionId}
            permissionMode={permissionMode}
            onPermissionModeChange={updatePermissionMode}
            metadata={session.metadata}
            connectionStatus={{
                text: sessionStatus.statusText,
                color: sessionStatus.statusColor,
                dotColor: sessionStatus.statusDotColor,
                isPulsing: sessionStatus.isPulsing
            }}
            onSend={() => {
                if (message.trim()) {
                    setMessage('');
                    clearDraft();
                    sync.sendMessage(sessionId, message);
                    trackMessageSent();
                }
            }}
            onMicPress={micButtonState.onMicPress}
            isMicActive={micButtonState.isMicActive}
            onAbort={() => sessionAbort(sessionId)}
            showAbortButton={sessionStatus.state === 'thinking' || sessionStatus.state === 'waiting'}
            onFileViewerPress={experiments ? () => router.push(`/session/${sessionId}/files`) : undefined}
            // Autocomplete configuration
            autocompletePrefixes={['@', '/']}
            autocompleteSuggestions={(query) => getSuggestions(sessionId, query)}
            usageData={sessionUsage ? {
                inputTokens: sessionUsage.inputTokens,
                outputTokens: sessionUsage.outputTokens,
                cacheCreation: sessionUsage.cacheCreation,
                cacheRead: sessionUsage.cacheRead,
                contextSize: sessionUsage.contextSize
            } : session.latestUsage ? {
                inputTokens: session.latestUsage.inputTokens,
                outputTokens: session.latestUsage.outputTokens,
                cacheCreation: session.latestUsage.cacheCreation,
                cacheRead: session.latestUsage.cacheRead,
                contextSize: session.latestUsage.contextSize
            } : undefined}
            alwaysShowContextSize={alwaysShowContextSize}
        />
    );


    return (
        <>
            {/* CLI Version Warning Overlay - Subtle centered pill */}
            {shouldShowCliWarning && !(isLandscape && deviceType === 'phone') && (
                <Pressable
                    onPress={handleDismissCliWarning}
                    style={{
                        position: 'absolute',
                        top: 8, // Position at top of content area (padding handled by parent)
                        alignSelf: 'center',
                        backgroundColor: '#FFF3CD',
                        borderRadius: 100, // Fully rounded pill
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        flexDirection: 'row',
                        alignItems: 'center',
                        zIndex: 998, // Below voice bar but above content
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 4,
                    }}
                >
                    <Ionicons name="warning-outline" size={14} color="#FF9500" style={{ marginRight: 6 }} />
                    <Text style={{
                        fontSize: 12,
                        color: '#856404',
                        fontWeight: '600'
                    }}>
                        {t('sessionInfo.cliVersionOutdated')}
                    </Text>
                    <Ionicons name="close" size={14} color="#856404" style={{ marginLeft: 8 }} />
                </Pressable>
            )}

            {/* Phase 2: Session Control Bar - shown when session is online */}
            {session.presence === 'online' && (
                <View
                    testID="session-control-bar"
                    style={{
                        position: 'absolute',
                        top: shouldShowCliWarning ? 48 : 8,
                        right: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        zIndex: 997,
                    }}
                >
                    {/* Pause/Resume Button */}
                    {session.executionState === 'paused' ? (
                        <Pressable
                            testID="session-control-resume"
                            onPress={handleResume}
                            disabled={isControlling}
                            style={{
                                backgroundColor: theme.dark ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.15)',
                                borderRadius: 20,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                opacity: isControlling ? 0.5 : 1,
                            }}
                        >
                            {controlAction === 'resume' ? (
                                <ActivityIndicator size="small" color="#34C759" />
                            ) : (
                                <>
                                    <Ionicons name="play" size={16} color="#34C759" />
                                    <Text style={{ color: '#34C759', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>
                                        {t('session.resume')}
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    ) : (
                        <Pressable
                            testID="session-control-pause"
                            onPress={handlePause}
                            disabled={isControlling}
                            style={{
                                backgroundColor: theme.dark ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 204, 0, 0.15)',
                                borderRadius: 20,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                opacity: isControlling ? 0.5 : 1,
                            }}
                        >
                            {controlAction === 'pause' ? (
                                <ActivityIndicator size="small" color="#FFCC00" />
                            ) : (
                                <>
                                    <Ionicons name="pause" size={16} color="#FFCC00" />
                                    <Text style={{ color: '#FFCC00', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>
                                        {t('session.pause')}
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    )}

                    {/* Terminate Button */}
                    <Pressable
                        testID="session-control-terminate"
                        onPress={handleTerminate}
                        disabled={isControlling}
                        style={{
                            backgroundColor: theme.dark ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.15)',
                            borderRadius: 20,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            opacity: isControlling ? 0.5 : 1,
                        }}
                    >
                        {controlAction === 'terminate' ? (
                            <ActivityIndicator size="small" color="#FF3B30" />
                        ) : (
                            <>
                                <Ionicons name="stop" size={16} color="#FF3B30" />
                                <Text style={{ color: '#FF3B30', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>
                                    {t('session.terminate')}
                                </Text>
                            </>
                        )}
                    </Pressable>

                    {/* Switch Mode Button - only show in remote mode */}
                    {session.metadata?.flavor !== 'local' && (
                        <Pressable
                            testID="session-control-switch-mode"
                            onPress={handleSwitchMode}
                            disabled={isControlling}
                            style={{
                                backgroundColor: theme.dark ? 'rgba(88, 86, 214, 0.2)' : 'rgba(88, 86, 214, 0.15)',
                                borderRadius: 20,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                opacity: isControlling ? 0.5 : 1,
                            }}
                        >
                            {controlAction === 'switch' ? (
                                <ActivityIndicator size="small" color="#5856D6" />
                            ) : (
                                <>
                                    <Ionicons name="swap-horizontal" size={16} color="#5856D6" />
                                    <Text style={{ color: '#5856D6', fontSize: 13, fontWeight: '600', marginLeft: 4 }}>
                                        {t('session.switchMode')}
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    )}
                </View>
            )}

            {/* Paused Banner - shown when session is paused */}
            {session.executionState === 'paused' && session.presence === 'online' && (
                <View
                    testID="session-paused-banner"
                    style={{
                        position: 'absolute',
                        bottom: safeArea.bottom + 100,
                        alignSelf: 'center',
                        backgroundColor: theme.dark ? 'rgba(255, 204, 0, 0.15)' : 'rgba(255, 204, 0, 0.2)',
                        borderRadius: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        zIndex: 999,
                    }}
                >
                    <Ionicons name="pause-circle" size={20} color="#FFCC00" />
                    <Text style={{ color: '#FFCC00', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
                        {t('session.paused')}
                    </Text>
                </View>
            )}

            {/* Main content area - no padding since header is overlay */}
            <View style={{ flexBasis: 0, flexGrow: 1, paddingBottom: safeArea.bottom + ((isRunningOnMac() || Platform.OS === 'web') ? 32 : 0) }}>
                <AgentContentView
                    content={content}
                    input={input}
                    placeholder={placeholder}
                />
            </View >

            {/* Back button for landscape phone mode when header is hidden */}
            {
                isLandscape && deviceType === 'phone' && (
                    <Pressable
                        onPress={() => router.back()}
                        style={{
                            position: 'absolute',
                            top: safeArea.top + 8,
                            left: 16,
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: `rgba(${theme.dark ? '28, 23, 28' : '255, 255, 255'}, 0.9)`,
                            alignItems: 'center',
                            justifyContent: 'center',
                            ...Platform.select({
                                ios: {
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                },
                                android: {
                                    elevation: 2,
                                }
                            }),
                        }}
                        hitSlop={15}
                    >
                        <Ionicons
                            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
                            size={Platform.select({ ios: 28, default: 24 })}
                            color="#000"
                        />
                    </Pressable>
                )
            }
        </>
    )
}
