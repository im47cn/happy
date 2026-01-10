/**
 * Static voice context configuration
 */
export const VOICE_CONFIG = {
    /** Disable all tool call information from being sent to voice context */
    DISABLE_TOOL_CALLS: false,

    /** Send only tool names and descriptions, exclude arguments */
    LIMITED_TOOL_CALLS: true,

    /** Disable permission request forwarding */
    DISABLE_PERMISSION_REQUESTS: false,

    /** Disable session online/offline notifications */
    DISABLE_SESSION_STATUS: true,

    /** Disable message forwarding */
    DISABLE_MESSAGES: false,

    /** Disable session focus notifications */
    DISABLE_SESSION_FOCUS: false,

    /** Disable ready event notifications */
    DISABLE_READY_EVENTS: false,

    /** Maximum number of messages to include in session history */
    MAX_HISTORY_MESSAGES: 50,

    /** Enable debug logging for voice context updates */
    ENABLE_DEBUG_LOGGING: true,
} as const;

//
// Browser Native Voice I/O Configuration (Phase 4)
//

/** Voice provider type */
export type VoiceProvider = 'browser' | 'elevenlabs';

/** Browser speech rate constraints */
export const BROWSER_SPEECH_RATE = {
    MIN: 0.5,
    MAX: 2.0,
    DEFAULT: 1.0,
    STEP: 0.1,
} as const;

/** Browser speech pitch constraints */
export const BROWSER_SPEECH_PITCH = {
    MIN: 0.5,
    MAX: 2.0,
    DEFAULT: 1.0,
    STEP: 0.1,
} as const;

/** Browser speech volume constraints */
export const BROWSER_SPEECH_VOLUME = {
    MIN: 0,
    MAX: 1.0,
    DEFAULT: 1.0,
    STEP: 0.1,
} as const;

/** Recognition language info structure */
export interface RecognitionLanguageInfo {
    code: string;
    name: string;
    englishName: string;
}

/** Supported speech recognition languages with display names */
export const SUPPORTED_RECOGNITION_LANGUAGES: readonly RecognitionLanguageInfo[] = [
    { code: 'zh-CN', name: '中文（简体）', englishName: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: '中文（繁體-台灣）', englishName: 'Chinese (Traditional - Taiwan)' },
    { code: 'zh-HK', name: '中文（繁體-香港）', englishName: 'Chinese (Traditional - Hong Kong)' },
    { code: 'en-US', name: 'English (US)', englishName: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)', englishName: 'English (UK)' },
    { code: 'ja-JP', name: '日本語', englishName: 'Japanese' },
    { code: 'ko-KR', name: '한국어', englishName: 'Korean' },
    { code: 'es-ES', name: 'Español (España)', englishName: 'Spanish (Spain)' },
    { code: 'fr-FR', name: 'Français (France)', englishName: 'French (France)' },
    { code: 'de-DE', name: 'Deutsch (Deutschland)', englishName: 'German (Germany)' },
    { code: 'ru-RU', name: 'Русский', englishName: 'Russian' },
    { code: 'pt-BR', name: 'Português (Brasil)', englishName: 'Portuguese (Brazil)' },
    { code: 'it-IT', name: 'Italiano', englishName: 'Italian' },
    { code: 'pl-PL', name: 'Polski', englishName: 'Polish' },
    { code: 'nl-NL', name: 'Nederlands', englishName: 'Dutch' },
];

/** Default recognition language */
export const DEFAULT_RECOGNITION_LANGUAGE = 'zh-CN';

/**
 * Validate and clamp speech rate to valid range
 * @param rate - Input rate value
 * @returns Clamped rate value between 0.5 and 2.0, rounded to 1 decimal place
 */
export function validateSpeechRate(rate: number): number {
    const clamped = Math.max(BROWSER_SPEECH_RATE.MIN, Math.min(BROWSER_SPEECH_RATE.MAX, rate));
    return Math.round(clamped * 10) / 10;
}

/**
 * Validate and clamp speech pitch to valid range
 * @param pitch - Input pitch value
 * @returns Clamped pitch value between 0.5 and 2.0, rounded to 1 decimal place
 */
export function validateSpeechPitch(pitch: number): number {
    const clamped = Math.max(BROWSER_SPEECH_PITCH.MIN, Math.min(BROWSER_SPEECH_PITCH.MAX, pitch));
    return Math.round(clamped * 10) / 10;
}

/**
 * Validate and clamp speech volume to valid range
 * @param volume - Input volume value
 * @returns Clamped volume value between 0 and 1.0, rounded to 2 decimal places
 */
export function validateSpeechVolume(volume: number): number {
    const clamped = Math.max(BROWSER_SPEECH_VOLUME.MIN, Math.min(BROWSER_SPEECH_VOLUME.MAX, volume));
    return Math.round(clamped * 100) / 100;
}

/**
 * Validate recognition language code (BCP 47 format)
 * @param language - Input language code
 * @returns Valid language code or default if invalid
 */
export function validateRecognitionLanguage(language: string): string {
    if (!language || typeof language !== 'string') {
        return DEFAULT_RECOGNITION_LANGUAGE;
    }
    // Normalize to standard format (e.g., 'zh-cn' -> 'zh-CN')
    const normalized = language.replace(/^([a-z]{2})-([a-z]{2})$/i, (_, lang, region) =>
        `${lang.toLowerCase()}-${region.toUpperCase()}`
    );
    // Check if language is in supported list
    const isSupported = SUPPORTED_RECOGNITION_LANGUAGES.some(l => l.code === normalized);
    return isSupported ? normalized : DEFAULT_RECOGNITION_LANGUAGE;
}

/**
 * Check if a voice provider value is valid
 * @param provider - Input provider value
 * @returns true if valid voice provider
 */
export function isValidVoiceProvider(provider: unknown): provider is VoiceProvider {
    return provider === 'browser' || provider === 'elevenlabs';
}