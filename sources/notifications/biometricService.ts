/**
 * @file Biometric Authentication Service
 * @input expo-local-authentication, expo-secure-store
 * @output Biometric authentication and secure credential storage
 * @pos Service for Face ID/Touch ID/Fingerprint authentication
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { log } from '@/log';

// ============================================================================
// Types
// ============================================================================

/**
 * Available biometric authentication types
 */
export type BiometricType =
    | 'none'           // No biometric available
    | 'fingerprint'    // Fingerprint (Touch ID on iOS, Fingerprint on Android)
    | 'facial'         // Face ID on iOS, Face recognition on Android
    | 'iris';          // Iris scanner (some Android devices)

/**
 * Biometric availability status
 */
export interface BiometricAvailability {
    /** Whether biometric hardware is available */
    isAvailable: boolean;
    /** The type of biometric available */
    type: BiometricType;
    /** Whether biometric is enrolled (user has set it up) */
    isEnrolled: boolean;
    /** Security level (iOS only) */
    securityLevel?: 'weak' | 'strong';
}

/**
 * Authentication result
 */
export interface BiometricAuthResult {
    success: boolean;
    error?: string;
    warning?: string;
}

// ============================================================================
// Constants
// ============================================================================

const SECURE_CREDENTIALS_KEY = 'happy-biometric-credentials';
const BIOMETRIC_ENABLED_KEY = 'happy-biometric-enabled';

// ============================================================================
// Availability Check
// ============================================================================

/**
 * Check if biometric authentication is available on this device
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
    try {
        // Check hardware availability
        const hasHardware = await LocalAuthentication.hasHardwareAsync();

        if (!hasHardware) {
            return {
                isAvailable: false,
                type: 'none',
                isEnrolled: false,
            };
        }

        // Check if biometric is enrolled
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        // Get supported authentication types
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

        // Determine biometric type
        let type: BiometricType = 'none';
        let securityLevel: 'weak' | 'strong' | undefined;

        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            type = 'facial';
            securityLevel = 'strong';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            type = 'fingerprint';
            securityLevel = 'strong';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            type = 'iris';
            securityLevel = 'strong';
        }

        log.log(`[biometric] Availability check: type=${type}, enrolled=${isEnrolled}`);

        return {
            isAvailable: hasHardware && type !== 'none',
            type,
            isEnrolled,
            securityLevel,
        };
    } catch (error) {
        log.log(`[biometric] Availability check failed: ${String(error)}`);
        return {
            isAvailable: false,
            type: 'none',
            isEnrolled: false,
        };
    }
}

/**
 * Get human-readable name for biometric type
 */
export function getBiometricTypeName(type: BiometricType): string {
    switch (type) {
        case 'facial':
            return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
        case 'fingerprint':
            return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
        case 'iris':
            return 'Iris Scanner';
        default:
            return 'Biometric';
    }
}

// ============================================================================
// Authentication
// ============================================================================

/**
 * Authenticate user with biometric
 * @param promptMessage - Message to show in the biometric prompt
 * @param fallbackLabel - Label for fallback button (use passcode)
 * @param cancelLabel - Label for cancel button
 */
export async function authenticate(options?: {
    promptMessage?: string;
    fallbackLabel?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
}): Promise<BiometricAuthResult> {
    const {
        promptMessage = 'Authenticate to continue',
        fallbackLabel = 'Use Passcode',
        cancelLabel = 'Cancel',
        disableDeviceFallback = false,
    } = options ?? {};

    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            fallbackLabel,
            cancelLabel,
            disableDeviceFallback,
        });

        if (result.success) {
            log.log('[biometric] Authentication successful');
            return { success: true };
        }

        // Handle specific errors
        let error: string;
        let warning: string | undefined;

        switch (result.error) {
            case 'user_cancel':
                error = 'Authentication cancelled';
                break;
            case 'user_fallback':
                error = 'User chose fallback';
                warning = 'User opted for passcode instead of biometric';
                break;
            case 'system_cancel':
                error = 'System cancelled authentication';
                break;
            case 'not_enrolled':
                error = 'Biometric not enrolled';
                warning = 'Please set up biometric authentication in device settings';
                break;
            case 'lockout':
                error = 'Too many failed attempts';
                warning = 'Biometric is locked. Please wait or use passcode.';
                break;
            case 'not_available':
                error = 'Biometric not available';
                break;
            default:
                error = result.error || 'Authentication failed';
        }

        log.log(`[biometric] Authentication failed: ${error}`);
        return { success: false, error, warning };
    } catch (error) {
        log.log(`[biometric] Authentication error: ${String(error)}`);
        return {
            success: false,
            error: String(error),
        };
    }
}

/**
 * Authenticate user for approval action
 * Shows appropriate prompt for approval scenarios
 */
export async function authenticateForApproval(operationType: string): Promise<BiometricAuthResult> {
    const availability = await checkBiometricAvailability();

    if (!availability.isAvailable || !availability.isEnrolled) {
        return {
            success: false,
            error: 'Biometric not available',
            warning: 'Please set up biometric authentication in device settings',
        };
    }

    const typeName = getBiometricTypeName(availability.type);

    return authenticate({
        promptMessage: `Authenticate with ${typeName} to approve: ${operationType}`,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
    });
}

// ============================================================================
// Credential Storage (for quick login)
// ============================================================================

/**
 * Save encrypted credentials for biometric quick login
 * @param credentials - The credentials to store securely
 */
export async function saveCredentials(credentials: {
    token: string;
    secret: string;
}): Promise<boolean> {
    try {
        const data = JSON.stringify(credentials);
        await SecureStore.setItemAsync(SECURE_CREDENTIALS_KEY, data, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');

        log.log('[biometric] Credentials saved for biometric login');
        return true;
    } catch (error) {
        log.log(`[biometric] Failed to save credentials: ${String(error)}`);
        return false;
    }
}

/**
 * Get stored credentials after biometric authentication
 * @returns Stored credentials or null if not available
 */
export async function getCredentials(): Promise<{
    token: string;
    secret: string;
} | null> {
    try {
        const data = await SecureStore.getItemAsync(SECURE_CREDENTIALS_KEY);
        if (!data) {
            return null;
        }
        return JSON.parse(data) as { token: string; secret: string };
    } catch (error) {
        log.log(`[biometric] Failed to get credentials: ${String(error)}`);
        return null;
    }
}

/**
 * Clear stored biometric credentials
 */
export async function clearCredentials(): Promise<boolean> {
    try {
        await SecureStore.deleteItemAsync(SECURE_CREDENTIALS_KEY);
        await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);

        log.log('[biometric] Credentials cleared');
        return true;
    } catch (error) {
        log.log(`[biometric] Failed to clear credentials: ${String(error)}`);
        return false;
    }
}

/**
 * Check if biometric login is enabled
 */
export async function isBiometricLoginEnabled(): Promise<boolean> {
    try {
        const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
        return enabled === 'true';
    } catch {
        return false;
    }
}

// ============================================================================
// Quick Login Flow
// ============================================================================

/**
 * Perform biometric quick login
 * Authenticates user and returns stored credentials if successful
 */
export async function biometricQuickLogin(): Promise<{
    success: boolean;
    credentials?: { token: string; secret: string };
    error?: string;
}> {
    // Check if biometric login is enabled
    const enabled = await isBiometricLoginEnabled();
    if (!enabled) {
        return {
            success: false,
            error: 'Biometric login not enabled',
        };
    }

    // Check availability
    const availability = await checkBiometricAvailability();
    if (!availability.isAvailable || !availability.isEnrolled) {
        return {
            success: false,
            error: 'Biometric not available or not enrolled',
        };
    }

    // Authenticate
    const authResult = await authenticate({
        promptMessage: `Sign in with ${getBiometricTypeName(availability.type)}`,
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
    });

    if (!authResult.success) {
        return {
            success: false,
            error: authResult.error,
        };
    }

    // Get credentials
    const credentials = await getCredentials();
    if (!credentials) {
        return {
            success: false,
            error: 'No stored credentials',
        };
    }

    log.log('[biometric] Quick login successful');
    return {
        success: true,
        credentials,
    };
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize biometric service
 * Checks availability and logs status
 */
export async function initializeBiometricService(): Promise<BiometricAvailability> {
    log.log('[biometric] Initializing biometric service');

    const availability = await checkBiometricAvailability();

    if (availability.isAvailable) {
        const typeName = getBiometricTypeName(availability.type);
        log.log(`[biometric] ${typeName} is available, enrolled: ${availability.isEnrolled}`);
    } else {
        log.log('[biometric] No biometric authentication available');
    }

    return availability;
}
