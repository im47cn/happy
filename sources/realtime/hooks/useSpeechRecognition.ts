/**
 * Browser native speech recognition hook using Web Speech API
 *
 * @input Browser SpeechRecognition API, recognition language setting
 * @output React hook providing speech recognition state and controls
 * @pos Logic layer - provides declarative speech recognition interface
 *
 * Update this file's header comments and parent CLAUDE.md when modified.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import {
    getSpeechRecognitionConstructor,
    isSpeechRecognitionSupported,
} from '@/utils/browserCapabilities';
import {
    VoiceError,
    VoiceErrorType,
    createVoiceError,
    mapSpeechRecognitionError,
} from '@/utils/voiceErrors';

/**
 * Speech recognition state
 */
export type SpeechRecognitionStatus = 'idle' | 'listening' | 'processing' | 'error';

/**
 * Options for starting speech recognition
 */
export interface StartListeningOptions {
    /** BCP 47 language code (e.g., 'zh-CN', 'en-US') */
    language?: string;
    /** Enable continuous recognition mode */
    continuous?: boolean;
    /** Enable interim results */
    interimResults?: boolean;
}

/**
 * Return type for useSpeechRecognition hook
 */
export interface UseSpeechRecognitionReturn {
    /** Whether the browser supports Web Speech API */
    isSupported: boolean;
    /** Whether speech recognition is currently active */
    isListening: boolean;
    /** Current recognition status */
    status: SpeechRecognitionStatus;
    /** Combined transcript (interim + final) */
    transcript: string;
    /** Interim recognition result (changes in real-time) */
    interimTranscript: string;
    /** Final confirmed recognition result */
    finalTranscript: string;
    /** Current error if any */
    error: VoiceError | null;
    /** Start speech recognition */
    startListening: (options?: StartListeningOptions) => void;
    /** Stop speech recognition */
    stopListening: () => void;
    /** Reset all transcript values */
    resetTranscript: () => void;
}

/**
 * Hook for browser native speech recognition using Web Speech API
 *
 * @example
 * ```tsx
 * const {
 *   isSupported,
 *   isListening,
 *   transcript,
 *   startListening,
 *   stopListening
 * } = useSpeechRecognition();
 *
 * if (!isSupported) return <Text>Browser not supported</Text>;
 *
 * return (
 *   <Button onPress={() => isListening ? stopListening() : startListening({ language: 'zh-CN' })}>
 *     {isListening ? 'Stop' : 'Start'}
 *   </Button>
 * );
 * ```
 */
export function useSpeechRecognition(): UseSpeechRecognitionReturn {
    // Check browser support once
    const isSupported = Platform.OS === 'web' && isSpeechRecognitionSupported();

    // State
    const [status, setStatus] = useState<SpeechRecognitionStatus>('idle');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [finalTranscript, setFinalTranscript] = useState('');
    const [error, setError] = useState<VoiceError | null>(null);

    // Refs for managing recognition instance
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const isListeningRef = useRef(false);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch {
                    // Ignore cleanup errors
                }
                recognitionRef.current = null;
            }
        };
    }, []);

    /**
     * Start speech recognition
     */
    const startListening = useCallback((options: StartListeningOptions = {}) => {
        if (!isSupported) {
            setError({
                type: VoiceErrorType.BrowserNotSupported,
                context: 'SpeechRecognition API not available',
            });
            setStatus('error');
            return;
        }

        // Stop any existing recognition
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch {
                // Ignore
            }
        }

        const SpeechRecognitionConstructor = getSpeechRecognitionConstructor();
        if (!SpeechRecognitionConstructor) {
            setError({
                type: VoiceErrorType.BrowserNotSupported,
                context: 'Failed to get SpeechRecognition constructor',
            });
            setStatus('error');
            return;
        }

        try {
            const recognition = new SpeechRecognitionConstructor();

            // Configure recognition
            recognition.lang = options.language || 'zh-CN';
            recognition.continuous = options.continuous ?? false;
            recognition.interimResults = options.interimResults ?? true;
            recognition.maxAlternatives = 1;

            // Handle results
            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    const text = result[0].transcript;

                    if (result.isFinal) {
                        final += text;
                    } else {
                        interim += text;
                    }
                }

                if (final) {
                    setFinalTranscript((prev) => prev + final);
                }
                setInterimTranscript(interim);
                setStatus('processing');
            };

            // Handle start
            recognition.onstart = () => {
                isListeningRef.current = true;
                setStatus('listening');
                setError(null);
            };

            // Handle end
            recognition.onend = () => {
                isListeningRef.current = false;
                setStatus('idle');
                setInterimTranscript('');

                // If continuous mode is enabled and we're still supposed to be listening, restart
                if (options.continuous && recognitionRef.current === recognition) {
                    try {
                        recognition.start();
                    } catch {
                        // Ignore restart errors
                    }
                }
            };

            // Handle errors
            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                const errorType = mapSpeechRecognitionError(event);

                // Some errors are not critical and recognition can continue
                if (event.error === 'no-speech' || event.error === 'aborted') {
                    // Non-critical errors - just update status
                    if (event.error === 'no-speech') {
                        setError({
                            type: errorType,
                            originalError: event,
                            context: event.message || undefined,
                        });
                    }
                    return;
                }

                // Critical errors - stop recognition
                isListeningRef.current = false;
                setStatus('error');
                setError(createVoiceError(event));

                try {
                    recognition.abort();
                } catch {
                    // Ignore
                }
            };

            // Handle audio start/end for visual feedback
            recognition.onaudiostart = () => {
                setStatus('listening');
            };

            recognition.onspeechstart = () => {
                setStatus('processing');
            };

            // Store reference and start
            recognitionRef.current = recognition;
            recognition.start();

        } catch (e) {
            setError({
                type: VoiceErrorType.Unknown,
                originalError: e instanceof Error ? e : undefined,
                context: 'Failed to start speech recognition',
            });
            setStatus('error');
        }
    }, [isSupported]);

    /**
     * Stop speech recognition
     */
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {
                // If stop fails, try abort
                try {
                    recognitionRef.current.abort();
                } catch {
                    // Ignore
                }
            }
            recognitionRef.current = null;
        }
        isListeningRef.current = false;
        setStatus('idle');
        setInterimTranscript('');
    }, []);

    /**
     * Reset all transcript values
     */
    const resetTranscript = useCallback(() => {
        setInterimTranscript('');
        setFinalTranscript('');
        setError(null);
    }, []);

    // Compute derived values
    const isListening = status === 'listening' || status === 'processing';
    const transcript = finalTranscript + interimTranscript;

    return {
        isSupported,
        isListening,
        status,
        transcript,
        interimTranscript,
        finalTranscript,
        error,
        startListening,
        stopListening,
        resetTranscript,
    };
}
