/**
 * Voice controls component stub for non-web platforms
 *
 * @input Props for voice control callbacks
 * @output null - voice controls only available on web
 * @pos UI layer - browser voice I/O controls (non-web stub)
 *
 * Update this file's header comments and parent CLAUDE.md when modified.
 */

import React from 'react';

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
 * Voice controls component - stub for non-web platforms
 * Browser voice I/O is only available on web platform.
 */
export const VoiceControls: React.FC<VoiceControlsProps> = () => {
    // Voice controls only available on web platform
    return null;
};

/**
 * Hook to check if voice controls are available
 * @returns Always false on non-web platforms
 */
export function useVoiceControlsAvailable(): boolean {
    return false;
}
