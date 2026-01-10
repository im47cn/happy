/**
 * Browser native speech synthesis hook using SpeechSynthesis API
 *
 * @input Browser SpeechSynthesis API, speech settings
 * @output React hook providing speech synthesis state and controls
 * @pos Logic layer - provides declarative speech synthesis interface
 *
 * Update this file's header comments and parent CLAUDE.md when modified.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { isSpeechSynthesisSupported, getAvailableVoices } from '@/utils/browserCapabilities';
import { VoiceError, VoiceErrorType, createSynthesisError } from '@/utils/voiceErrors';
import {
    BROWSER_SPEECH_RATE,
    BROWSER_SPEECH_PITCH,
    BROWSER_SPEECH_VOLUME,
} from '../voiceConfig';

/**
 * Speech synthesis state
 */
export type SpeechSynthesisStatus = 'idle' | 'speaking' | 'paused' | 'error';

/**
 * Voice information for display
 */
export interface VoiceInfo {
    /** Voice name */
    name: string;
    /** BCP 47 language code */
    lang: string;
    /** Whether this is the default voice */
    default: boolean;
    /** Whether this is a local voice (not network) */
    localService: boolean;
    /** Voice URI identifier */
    voiceURI: string;
}

/**
 * Options for speak function
 */
export interface SpeakOptions {
    /** Speech rate (0.5-2.0) */
    rate?: number;
    /** Speech pitch (0.5-2.0) */
    pitch?: number;
    /** Speech volume (0-1.0) */
    volume?: number;
    /** Selected voice name */
    voiceName?: string | null;
    /** Callback when speech starts */
    onStart?: () => void;
    /** Callback when speech ends */
    onEnd?: () => void;
    /** Callback on error */
    onError?: (error: VoiceError) => void;
}

/**
 * Return type for useSpeechSynthesis hook
 */
export interface UseSpeechSynthesisReturn {
    /** Whether the browser supports SpeechSynthesis API */
    isSupported: boolean;
    /** Whether currently speaking */
    isSpeaking: boolean;
    /** Whether currently paused */
    isPaused: boolean;
    /** Current synthesis status */
    status: SpeechSynthesisStatus;
    /** Available voices */
    voices: VoiceInfo[];
    /** Current error if any */
    error: VoiceError | null;
    /** Speak text with optional settings */
    speak: (text: string, options?: SpeakOptions) => void;
    /** Pause current speech */
    pause: () => void;
    /** Resume paused speech */
    resume: () => void;
    /** Cancel all speech and reset */
    cancel: () => void;
}

/**
 * Maximum text length before splitting into chunks
 */
const MAX_TEXT_LENGTH = 1000;

/**
 * Split text into speakable chunks at natural boundaries
 */
function splitTextIntoChunks(text: string, maxLength: number = MAX_TEXT_LENGTH): string[] {
    if (text.length <= maxLength) {
        return [text];
    }

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
            chunks.push(remaining);
            break;
        }

        // Find natural break point (sentence end, paragraph, comma)
        let breakPoint = -1;
        const searchRange = remaining.substring(0, maxLength);

        // Try sentence end first
        const sentenceEnd = Math.max(
            searchRange.lastIndexOf('。'),
            searchRange.lastIndexOf('.'),
            searchRange.lastIndexOf('!'),
            searchRange.lastIndexOf('?'),
            searchRange.lastIndexOf('！'),
            searchRange.lastIndexOf('？')
        );
        if (sentenceEnd > maxLength * 0.5) {
            breakPoint = sentenceEnd + 1;
        }

        // Try paragraph
        if (breakPoint === -1) {
            const paragraphEnd = searchRange.lastIndexOf('\n');
            if (paragraphEnd > maxLength * 0.3) {
                breakPoint = paragraphEnd + 1;
            }
        }

        // Try comma
        if (breakPoint === -1) {
            const commaEnd = Math.max(
                searchRange.lastIndexOf(','),
                searchRange.lastIndexOf('，'),
                searchRange.lastIndexOf('、')
            );
            if (commaEnd > maxLength * 0.3) {
                breakPoint = commaEnd + 1;
            }
        }

        // Fallback to space
        if (breakPoint === -1) {
            const spaceEnd = searchRange.lastIndexOf(' ');
            if (spaceEnd > maxLength * 0.2) {
                breakPoint = spaceEnd + 1;
            }
        }

        // Last resort: hard break
        if (breakPoint === -1) {
            breakPoint = maxLength;
        }

        chunks.push(remaining.substring(0, breakPoint).trim());
        remaining = remaining.substring(breakPoint).trim();
    }

    return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Hook for browser native speech synthesis using SpeechSynthesis API
 *
 * @example
 * ```tsx
 * const {
 *   isSupported,
 *   isSpeaking,
 *   voices,
 *   speak,
 *   cancel
 * } = useSpeechSynthesis();
 *
 * if (!isSupported) return <Text>Browser not supported</Text>;
 *
 * return (
 *   <Button onPress={() => speak('Hello world', { rate: 1.2 })}>
 *     Speak
 *   </Button>
 * );
 * ```
 */
export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
    // Check browser support once
    const isSupported = Platform.OS === 'web' && isSpeechSynthesisSupported();

    // State
    const [status, setStatus] = useState<SpeechSynthesisStatus>('idle');
    const [voices, setVoices] = useState<VoiceInfo[]>([]);
    const [error, setError] = useState<VoiceError | null>(null);

    // Track speaking queue
    const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
    const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Load available voices
    useEffect(() => {
        if (!isSupported) return;

        const loadVoices = async () => {
            try {
                const availableVoices = await getAvailableVoices();
                const voiceInfos: VoiceInfo[] = availableVoices.map((voice) => ({
                    name: voice.name,
                    lang: voice.lang,
                    default: voice.default,
                    localService: voice.localService,
                    voiceURI: voice.voiceURI,
                }));
                setVoices(voiceInfos);
            } catch {
                // Ignore voice loading errors
            }
        };

        loadVoices();

        // Listen for voice changes
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const handleVoicesChanged = () => {
                loadVoices();
            };
            window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
            return () => {
                window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            };
        }
    }, [isSupported]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isSupported && typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            utteranceQueueRef.current = [];
            currentUtteranceRef.current = null;
        };
    }, [isSupported]);

    /**
     * Find voice by name
     */
    const findVoice = useCallback((voiceName: string | null | undefined): SpeechSynthesisVoice | undefined => {
        if (!voiceName || typeof window === 'undefined') return undefined;
        const synthVoices = window.speechSynthesis.getVoices();
        return synthVoices.find((v) => v.name === voiceName);
    }, []);

    /**
     * Create and configure utterance
     */
    const createUtterance = useCallback((
        text: string,
        options: SpeakOptions = {}
    ): SpeechSynthesisUtterance => {
        const utterance = new SpeechSynthesisUtterance(text);

        // Apply settings with validation
        utterance.rate = Math.max(
            BROWSER_SPEECH_RATE.MIN,
            Math.min(BROWSER_SPEECH_RATE.MAX, options.rate ?? BROWSER_SPEECH_RATE.DEFAULT)
        );
        utterance.pitch = Math.max(
            BROWSER_SPEECH_PITCH.MIN,
            Math.min(BROWSER_SPEECH_PITCH.MAX, options.pitch ?? BROWSER_SPEECH_PITCH.DEFAULT)
        );
        utterance.volume = Math.max(
            BROWSER_SPEECH_VOLUME.MIN,
            Math.min(BROWSER_SPEECH_VOLUME.MAX, options.volume ?? BROWSER_SPEECH_VOLUME.DEFAULT)
        );

        // Set voice if specified
        if (options.voiceName) {
            const voice = findVoice(options.voiceName);
            if (voice) {
                utterance.voice = voice;
            }
        }

        return utterance;
    }, [findVoice]);

    /**
     * Speak text with optional settings
     */
    const speak = useCallback((text: string, options: SpeakOptions = {}) => {
        if (!isSupported || typeof window === 'undefined') {
            setError({
                type: VoiceErrorType.BrowserNotSupported,
                context: 'SpeechSynthesis API not available',
            });
            setStatus('error');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        utteranceQueueRef.current = [];
        currentUtteranceRef.current = null;

        // Split text into chunks if too long
        const chunks = splitTextIntoChunks(text);

        // Create utterances for each chunk
        const utterances = chunks.map((chunk, index) => {
            const utterance = createUtterance(chunk, options);

            // Handle start event (only for first chunk)
            if (index === 0) {
                utterance.onstart = () => {
                    setStatus('speaking');
                    setError(null);
                    options.onStart?.();
                };
            }

            // Handle end event
            utterance.onend = () => {
                currentUtteranceRef.current = null;

                // If there are more chunks, they will be handled by the queue
                // Only trigger onEnd for the last chunk
                if (index === chunks.length - 1) {
                    setStatus('idle');
                    options.onEnd?.();
                }
            };

            // Handle pause
            utterance.onpause = () => {
                setStatus('paused');
            };

            // Handle resume
            utterance.onresume = () => {
                setStatus('speaking');
            };

            // Handle error
            utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
                // 'interrupted' is not a real error - happens when we cancel
                if (event.error === 'interrupted' || event.error === 'canceled') {
                    return;
                }

                const voiceError = createSynthesisError(event);
                setError(voiceError);
                setStatus('error');
                options.onError?.(voiceError);
            };

            return utterance;
        });

        // Queue all utterances
        utteranceQueueRef.current = utterances;

        // Start speaking all chunks
        for (const utterance of utterances) {
            currentUtteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    }, [isSupported, createUtterance]);

    /**
     * Pause current speech
     */
    const pause = useCallback(() => {
        if (!isSupported || typeof window === 'undefined') return;

        window.speechSynthesis.pause();
        setStatus('paused');
    }, [isSupported]);

    /**
     * Resume paused speech
     */
    const resume = useCallback(() => {
        if (!isSupported || typeof window === 'undefined') return;

        window.speechSynthesis.resume();
        setStatus('speaking');
    }, [isSupported]);

    /**
     * Cancel all speech and reset
     */
    const cancel = useCallback(() => {
        if (!isSupported || typeof window === 'undefined') return;

        window.speechSynthesis.cancel();
        utteranceQueueRef.current = [];
        currentUtteranceRef.current = null;
        setStatus('idle');
        setError(null);
    }, [isSupported]);

    // Compute derived values
    const isSpeaking = status === 'speaking';
    const isPaused = status === 'paused';

    return {
        isSupported,
        isSpeaking,
        isPaused,
        status,
        voices,
        error,
        speak,
        pause,
        resume,
        cancel,
    };
}
