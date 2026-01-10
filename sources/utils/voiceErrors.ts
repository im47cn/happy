/**
 * Voice error types and user-friendly error messages
 *
 * @input Error events from Web Speech API
 * @output Localized error messages and recovery suggestions
 * @pos Utility layer - provides unified error handling for voice features
 *
 * Update this file's header comments and parent CLAUDE.md when modified.
 */

import { t } from '@/text';

/**
 * Voice error type enumeration
 * Covers all error scenarios from design document section 2.4
 */
export enum VoiceErrorType {
    /** Browser doesn't support Web Speech API */
    BrowserNotSupported = 'browser_not_supported',
    /** User denied microphone permission */
    MicrophonePermissionDenied = 'microphone_permission_denied',
    /** Network connection failed during recognition */
    NetworkError = 'network_error',
    /** No speech detected within timeout */
    NoSpeechDetected = 'no_speech_detected',
    /** Selected language not supported by browser */
    LanguageNotSupported = 'language_not_supported',
    /** Speech synthesis failed */
    SynthesisError = 'synthesis_error',
    /** Recognition aborted by user or system */
    RecognitionAborted = 'recognition_aborted',
    /** Audio capture failed */
    AudioCaptureError = 'audio_capture_error',
    /** Service unavailable (browser speech service) */
    ServiceUnavailable = 'service_unavailable',
    /** Unknown error */
    Unknown = 'unknown',
}

/**
 * Voice error information
 */
export interface VoiceError {
    /** Error type */
    type: VoiceErrorType;
    /** Original error object if available */
    originalError?: Error | SpeechRecognitionErrorEvent;
    /** Additional context */
    context?: string;
}

/**
 * Error message with recovery suggestion
 */
export interface VoiceErrorMessage {
    /** User-friendly error title */
    title: string;
    /** Detailed error description */
    message: string;
    /** Recovery suggestion */
    suggestion: string;
    /** Whether the error is recoverable */
    recoverable: boolean;
    /** Whether to show retry button */
    showRetry: boolean;
    /** Whether to show settings button */
    showSettings: boolean;
}

/**
 * Map SpeechRecognition error event to VoiceErrorType
 * @param errorEvent - SpeechRecognitionErrorEvent from Web Speech API
 * @returns Corresponding VoiceErrorType
 */
export function mapSpeechRecognitionError(errorEvent: SpeechRecognitionErrorEvent): VoiceErrorType {
    switch (errorEvent.error) {
        case 'not-allowed':
            return VoiceErrorType.MicrophonePermissionDenied;
        case 'network':
            return VoiceErrorType.NetworkError;
        case 'no-speech':
            return VoiceErrorType.NoSpeechDetected;
        case 'language-not-supported':
            return VoiceErrorType.LanguageNotSupported;
        case 'aborted':
            return VoiceErrorType.RecognitionAborted;
        case 'audio-capture':
            return VoiceErrorType.AudioCaptureError;
        case 'service-not-allowed':
            return VoiceErrorType.ServiceUnavailable;
        default:
            return VoiceErrorType.Unknown;
    }
}

/**
 * Get localized error message for a voice error type
 * @param errorType - Voice error type
 * @returns Error message with title, description, suggestion, and action hints
 */
export function getVoiceErrorMessage(errorType: VoiceErrorType): VoiceErrorMessage {
    switch (errorType) {
        case VoiceErrorType.BrowserNotSupported:
            return {
                title: t('voice.errors.browserNotSupported.title'),
                message: t('voice.errors.browserNotSupported.message'),
                suggestion: t('voice.errors.browserNotSupported.suggestion'),
                recoverable: false,
                showRetry: false,
                showSettings: false,
            };

        case VoiceErrorType.MicrophonePermissionDenied:
            return {
                title: t('voice.errors.microphonePermissionDenied.title'),
                message: t('voice.errors.microphonePermissionDenied.message'),
                suggestion: t('voice.errors.microphonePermissionDenied.suggestion'),
                recoverable: true,
                showRetry: false,
                showSettings: true,
            };

        case VoiceErrorType.NetworkError:
            return {
                title: t('voice.errors.networkError.title'),
                message: t('voice.errors.networkError.message'),
                suggestion: t('voice.errors.networkError.suggestion'),
                recoverable: true,
                showRetry: true,
                showSettings: false,
            };

        case VoiceErrorType.NoSpeechDetected:
            return {
                title: t('voice.errors.noSpeechDetected.title'),
                message: t('voice.errors.noSpeechDetected.message'),
                suggestion: t('voice.errors.noSpeechDetected.suggestion'),
                recoverable: true,
                showRetry: true,
                showSettings: false,
            };

        case VoiceErrorType.LanguageNotSupported:
            return {
                title: t('voice.errors.languageNotSupported.title'),
                message: t('voice.errors.languageNotSupported.message'),
                suggestion: t('voice.errors.languageNotSupported.suggestion'),
                recoverable: true,
                showRetry: false,
                showSettings: true,
            };

        case VoiceErrorType.SynthesisError:
            return {
                title: t('voice.errors.synthesisError.title'),
                message: t('voice.errors.synthesisError.message'),
                suggestion: t('voice.errors.synthesisError.suggestion'),
                recoverable: true,
                showRetry: true,
                showSettings: false,
            };

        case VoiceErrorType.RecognitionAborted:
            return {
                title: t('voice.errors.recognitionAborted.title'),
                message: t('voice.errors.recognitionAborted.message'),
                suggestion: t('voice.errors.recognitionAborted.suggestion'),
                recoverable: true,
                showRetry: true,
                showSettings: false,
            };

        case VoiceErrorType.AudioCaptureError:
            return {
                title: t('voice.errors.audioCaptureError.title'),
                message: t('voice.errors.audioCaptureError.message'),
                suggestion: t('voice.errors.audioCaptureError.suggestion'),
                recoverable: true,
                showRetry: true,
                showSettings: false,
            };

        case VoiceErrorType.ServiceUnavailable:
            return {
                title: t('voice.errors.serviceUnavailable.title'),
                message: t('voice.errors.serviceUnavailable.message'),
                suggestion: t('voice.errors.serviceUnavailable.suggestion'),
                recoverable: true,
                showRetry: true,
                showSettings: false,
            };

        case VoiceErrorType.Unknown:
        default:
            return {
                title: t('voice.errors.unknown.title'),
                message: t('voice.errors.unknown.message'),
                suggestion: t('voice.errors.unknown.suggestion'),
                recoverable: true,
                showRetry: true,
                showSettings: false,
            };
    }
}

/**
 * Create a VoiceError from a SpeechRecognitionErrorEvent
 * @param errorEvent - SpeechRecognitionErrorEvent from Web Speech API
 * @returns VoiceError object
 */
export function createVoiceError(errorEvent: SpeechRecognitionErrorEvent): VoiceError {
    return {
        type: mapSpeechRecognitionError(errorEvent),
        originalError: errorEvent,
        context: errorEvent.message || undefined,
    };
}

/**
 * Create a VoiceError for synthesis failures
 * @param event - SpeechSynthesisErrorEvent
 * @returns VoiceError object
 */
export function createSynthesisError(event: SpeechSynthesisErrorEvent): VoiceError {
    return {
        type: VoiceErrorType.SynthesisError,
        context: event.error,
    };
}

/**
 * Check if an error is recoverable (user can retry or take action)
 * @param errorType - Voice error type
 * @returns true if error can be recovered from
 */
export function isRecoverableError(errorType: VoiceErrorType): boolean {
    return errorType !== VoiceErrorType.BrowserNotSupported;
}

/**
 * Get retry delay for recoverable errors (in milliseconds)
 * @param errorType - Voice error type
 * @param attemptNumber - Current retry attempt (1-based)
 * @returns Delay in milliseconds before retry, or -1 if no auto-retry
 */
export function getRetryDelay(errorType: VoiceErrorType, attemptNumber: number): number {
    const MAX_ATTEMPTS = 3;

    if (attemptNumber > MAX_ATTEMPTS) {
        return -1; // Stop retrying
    }

    switch (errorType) {
        case VoiceErrorType.NetworkError:
            // Exponential backoff: 2s, 4s, 8s
            return 2000 * Math.pow(2, attemptNumber - 1);
        case VoiceErrorType.ServiceUnavailable:
            // Longer delays for service issues
            return 5000 * attemptNumber;
        default:
            return -1; // No auto-retry for other errors
    }
}
