/**
 * Voice controls component for web platform using browser native APIs
 *
 * @input Props for voice control callbacks, useSpeechRecognition, useSpeechSynthesis hooks
 * @output Interactive voice control UI with microphone button and status display
 * @pos UI layer - browser voice I/O controls for web platform
 *
 * Update this file's header comments and parent CLAUDE.md when modified.
 */

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { isSpeechRecognitionSupported, isSpeechSynthesisSupported } from '@/utils/browserCapabilities';
import { getVoiceErrorMessage, VoiceError } from '@/utils/voiceErrors';
import { VoiceBars } from '@/components/VoiceBars';
import {
    DEFAULT_RECOGNITION_LANGUAGE,
    BROWSER_SPEECH_RATE,
    BROWSER_SPEECH_PITCH,
    BROWSER_SPEECH_VOLUME,
} from '../voiceConfig';

/**
 * Voice controls status
 */
export type VoiceControlsStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

/**
 * Voice controls props
 */
export interface VoiceControlsProps {
    /** Callback when voice input transcript is available */
    onTranscript?: (transcript: string, isFinal: boolean) => void;
    /** Callback when voice input completes */
    onSpeechEnd?: (finalTranscript: string) => void;
    /** Text to speak via TTS (controlled mode) */
    textToSpeak?: string;
    /** Callback when TTS completes speaking */
    onSpeakComplete?: () => void;
    /** Whether to show expanded controls */
    expanded?: boolean;
    /** Custom style */
    style?: any;
    /** Recognition language (BCP 47 code) */
    language?: string;
    /** Speech rate (0.5-2.0) */
    speechRate?: number;
    /** Speech pitch (0.5-2.0) */
    speechPitch?: number;
    /** Speech volume (0-1.0) */
    speechVolume?: number;
    /** Selected voice name */
    voiceName?: string | null;
}

/**
 * Voice controls component for web platform
 * Provides microphone button, visual feedback, and TTS capabilities.
 */
export const VoiceControls: React.FC<VoiceControlsProps> = ({
    onTranscript,
    onSpeechEnd,
    textToSpeak,
    onSpeakComplete,
    expanded = false,
    style,
    language = DEFAULT_RECOGNITION_LANGUAGE,
    speechRate = BROWSER_SPEECH_RATE.DEFAULT,
    speechPitch = BROWSER_SPEECH_PITCH.DEFAULT,
    speechVolume = BROWSER_SPEECH_VOLUME.DEFAULT,
    voiceName,
}) => {
    const { theme } = useUnistyles();

    // Speech recognition hook
    const {
        isSupported: recognitionSupported,
        isListening,
        status: recognitionStatus,
        transcript,
        finalTranscript,
        error: recognitionError,
        startListening,
        stopListening,
        resetTranscript,
    } = useSpeechRecognition();

    // Speech synthesis hook
    const {
        isSupported: synthesisSupported,
        isSpeaking,
        status: synthesisStatus,
        error: synthesisError,
        speak,
        cancel: cancelSpeech,
    } = useSpeechSynthesis();

    // Track last spoken text to avoid repeating
    const lastSpokenTextRef = useRef<string | null>(null);

    // Combined status
    const [status, setStatus] = useState<VoiceControlsStatus>('idle');
    const [displayError, setDisplayError] = useState<VoiceError | null>(null);

    // Update combined status based on recognition and synthesis states
    useEffect(() => {
        if (recognitionError || synthesisError) {
            setStatus('error');
            setDisplayError(recognitionError || synthesisError);
        } else if (isSpeaking) {
            setStatus('speaking');
            setDisplayError(null);
        } else if (recognitionStatus === 'processing') {
            setStatus('processing');
            setDisplayError(null);
        } else if (isListening) {
            setStatus('listening');
            setDisplayError(null);
        } else {
            setStatus('idle');
            setDisplayError(null);
        }
    }, [recognitionStatus, isListening, isSpeaking, recognitionError, synthesisError]);

    // Forward transcript changes to parent
    useEffect(() => {
        if (transcript && onTranscript) {
            const isFinal = recognitionStatus !== 'listening' && recognitionStatus !== 'processing';
            onTranscript(transcript, isFinal);
        }
    }, [transcript, recognitionStatus, onTranscript]);

    // Handle speech end
    useEffect(() => {
        if (!isListening && finalTranscript && onSpeechEnd) {
            onSpeechEnd(finalTranscript);
        }
    }, [isListening, finalTranscript, onSpeechEnd]);

    // Handle controlled TTS mode - speak when textToSpeak changes
    useEffect(() => {
        if (textToSpeak && textToSpeak !== lastSpokenTextRef.current && synthesisSupported) {
            lastSpokenTextRef.current = textToSpeak;
            speak(textToSpeak, {
                rate: speechRate,
                pitch: speechPitch,
                volume: speechVolume,
                voiceName: voiceName,
                onEnd: onSpeakComplete,
            });
        }
    }, [textToSpeak, speechRate, speechPitch, speechVolume, voiceName, synthesisSupported, speak, onSpeakComplete]);

    // Handle microphone button press
    const handleMicPress = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            // Reset transcript before starting new recognition
            resetTranscript();
            setDisplayError(null);
            startListening({
                language,
                continuous: false,
                interimResults: true,
            });
        }
    }, [isListening, language, startListening, stopListening, resetTranscript]);

    // Handle stop speaking
    const handleStopSpeaking = useCallback(() => {
        cancelSpeech();
        lastSpokenTextRef.current = null;
    }, [cancelSpeech]);

    // Check browser support
    const isSupported = recognitionSupported || synthesisSupported;

    // Render unsupported state
    if (!isSupported) {
        return (
            <View style={[styles.container, styles.unsupportedContainer, style]}>
                <Ionicons
                    name="warning-outline"
                    size={16}
                    color={theme.colors.textSecondary}
                />
                <Text style={[styles.unsupportedText, { color: theme.colors.textSecondary }]}>
                    {t('voice.settings.browserNotSupported')}
                </Text>
            </View>
        );
    }

    // Get status color
    const getStatusColor = () => {
        switch (status) {
            case 'listening':
                return theme.colors.status.connected;
            case 'processing':
                return theme.colors.status.connecting;
            case 'speaking':
                return theme.colors.radio.active;
            case 'error':
                return theme.colors.status.error;
            default:
                return theme.colors.textSecondary;
        }
    };

    // Get status text
    const getStatusText = () => {
        switch (status) {
            case 'listening':
                return t('voice.controls.listening');
            case 'processing':
                return t('voice.controls.processing');
            case 'speaking':
                return t('voice.controls.speaking');
            case 'error':
                return displayError ? getVoiceErrorMessage(displayError.type).title : '';
            default:
                return '';
        }
    };

    // Compact mode - just the microphone button
    if (!expanded) {
        return (
            <View style={[styles.container, style]}>
                <Pressable
                    onPress={handleMicPress}
                    disabled={isSpeaking}
                    style={({ pressed }) => [
                        styles.micButton,
                        {
                            backgroundColor: isListening
                                ? theme.colors.status.connected
                                : theme.colors.button.primary.background,
                            opacity: pressed ? 0.7 : (isSpeaking ? 0.5 : 1),
                        },
                    ]}
                    accessibilityLabel={isListening ? t('voice.controls.stopListening') : t('voice.controls.startListening')}
                    accessibilityRole="button"
                >
                    {status === 'processing' ? (
                        <ActivityIndicator
                            size="small"
                            color={theme.colors.button.primary.tint}
                        />
                    ) : (
                        <Ionicons
                            name={isListening ? 'mic' : 'mic-outline'}
                            size={20}
                            color={theme.colors.button.primary.tint}
                        />
                    )}
                </Pressable>
            </View>
        );
    }

    // Expanded mode with status and transcript
    return (
        <View style={[styles.expandedContainer, style]}>
            {/* Status bar */}
            <View style={[styles.statusBar, { backgroundColor: theme.colors.surfaceHighest }]}>
                <View style={styles.statusLeft}>
                    {/* Status indicator */}
                    <View
                        style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor() },
                            (status === 'listening' || status === 'processing') && styles.statusDotPulsing,
                        ]}
                    />

                    {/* Microphone icon */}
                    <Ionicons
                        name={isListening ? 'mic' : 'mic-outline'}
                        size={16}
                        color={theme.colors.text}
                        style={styles.statusIcon}
                    />

                    {/* Status text */}
                    <Text style={[styles.statusText, { color: theme.colors.text }]}>
                        {getStatusText() || t('voice.controls.startListening')}
                    </Text>
                </View>

                <View style={styles.statusRight}>
                    {/* Voice bars when speaking */}
                    {status === 'speaking' && (
                        <VoiceBars
                            isActive={true}
                            color={theme.colors.text}
                            size="small"
                        />
                    )}

                    {/* Action button */}
                    {status === 'speaking' ? (
                        <Pressable
                            onPress={handleStopSpeaking}
                            style={({ pressed }) => [
                                styles.actionButton,
                                { opacity: pressed ? 0.7 : 1 },
                            ]}
                            hitSlop={10}
                        >
                            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                                {t('voice.controls.stopSpeaking')}
                            </Text>
                        </Pressable>
                    ) : isListening ? (
                        <Pressable
                            onPress={stopListening}
                            style={({ pressed }) => [
                                styles.actionButton,
                                { opacity: pressed ? 0.7 : 1 },
                            ]}
                            hitSlop={10}
                        >
                            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                                {t('voice.controls.stopListening')}
                            </Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            onPress={handleMicPress}
                            style={({ pressed }) => [
                                styles.actionButton,
                                { opacity: pressed ? 0.7 : 1 },
                            ]}
                            hitSlop={10}
                        >
                            <Ionicons
                                name="mic"
                                size={16}
                                color={theme.colors.text}
                            />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Transcript display */}
            {(transcript || displayError) && (
                <View style={[styles.transcriptContainer, { backgroundColor: theme.colors.surface }]}>
                    {displayError ? (
                        <View style={styles.errorContainer}>
                            <Ionicons
                                name="warning-outline"
                                size={16}
                                color={theme.colors.status.error}
                                style={styles.errorIcon}
                            />
                            <Text style={[styles.errorText, { color: theme.colors.status.error }]}>
                                {getVoiceErrorMessage(displayError.type).message}
                            </Text>
                        </View>
                    ) : (
                        <Text style={[styles.transcriptText, { color: theme.colors.text }]}>
                            {transcript}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
};

/**
 * Hook to check if voice controls are available
 * @returns true if speech recognition or synthesis is supported
 */
export function useVoiceControlsAvailable(): boolean {
    const [available, setAvailable] = useState(false);

    useEffect(() => {
        setAvailable(isSpeechRecognitionSupported() || isSpeechSynthesisSupported());
    }, []);

    return available;
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    unsupportedContainer: {
        flexDirection: 'row',
        gap: 8,
        padding: 12,
    },
    unsupportedText: {
        fontSize: 13,
        ...Typography.default(),
    },
    micButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    expandedContainer: {
        width: '100%',
    },
    statusBar: {
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    statusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusDotPulsing: {
        // Animation handled via CSS on web
    },
    statusIcon: {
        marginRight: 6,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '500',
        ...Typography.default(),
    },
    actionButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '400',
        opacity: 0.8,
        ...Typography.default(),
    },
    transcriptContainer: {
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        minHeight: 48,
    },
    transcriptText: {
        fontSize: 14,
        lineHeight: 20,
        ...Typography.default(),
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    errorIcon: {
        marginRight: 8,
        marginTop: 2,
    },
    errorText: {
        fontSize: 13,
        flex: 1,
        ...Typography.default(),
    },
});
