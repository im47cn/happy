/**
 * Browser capabilities detection for Web Speech API
 *
 * @input Platform detection from environment
 * @output Functions to check speech recognition and synthesis support
 * @pos Utility layer - provides browser capability detection for voice features
 *
 * Update this file's header comments and parent CLAUDE.md when modified.
 */

import { Platform } from 'react-native';

/**
 * Browser capability detection result
 */
export interface BrowserCapabilities {
    /** Whether SpeechRecognition API is supported */
    speechRecognitionSupported: boolean;
    /** Whether SpeechSynthesis API is supported */
    speechSynthesisSupported: boolean;
    /** Browser name (chrome, safari, firefox, edge, unknown) */
    browserName: string;
    /** Browser major version number */
    browserVersion: number;
    /** Whether running on web platform */
    isWeb: boolean;
}

/**
 * Get the SpeechRecognition constructor if available
 * Handles webkit prefix for Chrome/Edge
 */
export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
        return null;
    }

    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Check if Web Speech API SpeechRecognition is supported
 * @returns true if speech recognition is available
 */
export function isSpeechRecognitionSupported(): boolean {
    return getSpeechRecognitionConstructor() !== null;
}

/**
 * Check if SpeechSynthesis API is supported
 * @returns true if speech synthesis is available
 */
export function isSpeechSynthesisSupported(): boolean {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
        return false;
    }

    return 'speechSynthesis' in window && typeof window.speechSynthesis !== 'undefined';
}

/**
 * Detect browser name from user agent
 * @returns Browser name: 'chrome', 'safari', 'firefox', 'edge', or 'unknown'
 */
export function detectBrowserName(): string {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
        return 'unknown';
    }

    const userAgent = navigator.userAgent.toLowerCase();

    // Order matters - Edge contains 'chrome', Chrome contains 'safari'
    if (userAgent.includes('edg/')) {
        return 'edge';
    }
    if (userAgent.includes('chrome') && !userAgent.includes('edg/')) {
        return 'chrome';
    }
    if (userAgent.includes('firefox')) {
        return 'firefox';
    }
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        return 'safari';
    }

    return 'unknown';
}

/**
 * Detect browser major version number
 * @returns Browser major version or 0 if unknown
 */
export function detectBrowserVersion(): number {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
        return 0;
    }

    const userAgent = navigator.userAgent;
    const browserName = detectBrowserName();

    let versionMatch: RegExpMatchArray | null = null;

    switch (browserName) {
        case 'chrome':
            versionMatch = userAgent.match(/Chrome\/(\d+)/i);
            break;
        case 'safari':
            versionMatch = userAgent.match(/Version\/(\d+)/i);
            break;
        case 'firefox':
            versionMatch = userAgent.match(/Firefox\/(\d+)/i);
            break;
        case 'edge':
            versionMatch = userAgent.match(/Edg\/(\d+)/i);
            break;
    }

    return versionMatch ? parseInt(versionMatch[1], 10) : 0;
}

/**
 * Get complete browser capabilities information
 * @returns Browser capabilities object
 */
export function getBrowserCapabilities(): BrowserCapabilities {
    const isWeb = Platform.OS === 'web';

    return {
        speechRecognitionSupported: isSpeechRecognitionSupported(),
        speechSynthesisSupported: isSpeechSynthesisSupported(),
        browserName: detectBrowserName(),
        browserVersion: detectBrowserVersion(),
        isWeb,
    };
}

/**
 * Check if browser meets minimum requirements for voice features
 * Minimum requirements:
 * - Chrome 90+
 * - Edge 90+
 * - Safari 14.1+
 * - Firefox: Only synthesis supported (no recognition)
 *
 * @returns Object with support status and reason if not supported
 */
export function checkBrowserVoiceSupport(): {
    supported: boolean;
    recognitionSupported: boolean;
    synthesisSupported: boolean;
    reason: string | null;
} {
    const capabilities = getBrowserCapabilities();

    if (!capabilities.isWeb) {
        return {
            supported: false,
            recognitionSupported: false,
            synthesisSupported: false,
            reason: 'voice.browser.notWebPlatform',
        };
    }

    const { browserName, browserVersion, speechRecognitionSupported, speechSynthesisSupported } = capabilities;

    // Check minimum version requirements
    const minVersions: Record<string, number> = {
        chrome: 90,
        edge: 90,
        safari: 14,
        firefox: 85, // Only synthesis
    };

    const minVersion = minVersions[browserName] || 0;
    const meetsVersion = browserVersion >= minVersion;

    if (!meetsVersion && browserName !== 'unknown') {
        return {
            supported: false,
            recognitionSupported: false,
            synthesisSupported: false,
            reason: 'voice.browser.outdatedBrowser',
        };
    }

    // Firefox doesn't support SpeechRecognition
    if (browserName === 'firefox') {
        return {
            supported: speechSynthesisSupported,
            recognitionSupported: false,
            synthesisSupported: speechSynthesisSupported,
            reason: speechSynthesisSupported ? null : 'voice.browser.notSupported',
        };
    }

    // General support check
    if (!speechRecognitionSupported && !speechSynthesisSupported) {
        return {
            supported: false,
            recognitionSupported: false,
            synthesisSupported: false,
            reason: 'voice.browser.notSupported',
        };
    }

    return {
        supported: speechRecognitionSupported || speechSynthesisSupported,
        recognitionSupported: speechRecognitionSupported,
        synthesisSupported: speechSynthesisSupported,
        reason: null,
    };
}

/**
 * Get list of available speech synthesis voices
 * @returns Promise resolving to array of SpeechSynthesisVoice objects
 */
export async function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
    if (!isSpeechSynthesisSupported()) {
        return [];
    }

    return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();

        if (voices.length > 0) {
            resolve(voices);
            return;
        }

        // Some browsers need to wait for voiceschanged event
        const handleVoicesChanged = () => {
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            resolve(window.speechSynthesis.getVoices());
        };

        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

        // Fallback timeout in case event doesn't fire
        setTimeout(() => {
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            resolve(window.speechSynthesis.getVoices());
        }, 1000);
    });
}

/**
 * Check if a specific language is supported for speech recognition
 * Note: This is a best-effort check as browser support varies
 * @param languageCode - BCP 47 language code (e.g., 'en-US', 'zh-CN')
 * @returns true if language is likely supported
 */
export function isLanguageSupported(languageCode: string): boolean {
    // Basic validation
    if (!languageCode || typeof languageCode !== 'string') {
        return false;
    }

    // Most modern browsers support these common languages
    const commonLanguages = [
        'zh-CN', 'zh-TW', 'zh-HK',
        'en-US', 'en-GB', 'en-AU',
        'ja-JP', 'ko-KR',
        'es-ES', 'es-MX',
        'fr-FR', 'de-DE', 'it-IT',
        'pt-BR', 'pt-PT',
        'ru-RU', 'pl-PL', 'nl-NL',
    ];

    return commonLanguages.includes(languageCode);
}
