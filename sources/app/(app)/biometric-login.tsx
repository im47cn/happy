/**
 * @file Biometric Login Page
 * @input biometricService, AuthContext, expo-router
 * @output Biometric authentication UI for quick login
 * @pos Phase 6 biometric login page for returning users
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import * as React from 'react';
import { View, Text, Platform, ActivityIndicator, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { RoundButton } from '@/components/RoundButton';
import { useAuth } from '@/auth/AuthContext';
import { t } from '@/text';
import { Typography } from '@/constants/Typography';
import {
    checkBiometricAvailability,
    getBiometricTypeName,
    biometricQuickLogin,
    isBiometricLoginEnabled,
    type BiometricAvailability,
    type BiometricType,
} from '@/notifications/biometricService';
import { log } from '@/log';

// ============================================================================
// Types
// ============================================================================

type LoginState =
    | 'checking'      // Checking biometric availability
    | 'ready'         // Ready to authenticate
    | 'authenticating' // Authentication in progress
    | 'success'       // Authentication successful
    | 'error';        // Authentication failed

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get icon name based on biometric type
 */
function getBiometricIcon(type: BiometricType): keyof typeof Ionicons.glyphMap {
    switch (type) {
        case 'facial':
            return Platform.OS === 'ios' ? 'scan-outline' : 'happy-outline';
        case 'fingerprint':
            return 'finger-print-outline';
        case 'iris':
            return 'eye-outline';
        default:
            return 'lock-closed-outline';
    }
}

/**
 * Get localized biometric type name
 */
function getLocalizedBiometricName(type: BiometricType): string {
    switch (type) {
        case 'facial':
            return Platform.OS === 'ios' ? t('biometricLogin.faceId') : t('biometricLogin.biometric');
        case 'fingerprint':
            return Platform.OS === 'ios' ? t('biometricLogin.touchId') : t('biometricLogin.fingerprint');
        case 'iris':
            return t('biometricLogin.biometric');
        default:
            return t('biometricLogin.biometric');
    }
}

// ============================================================================
// Component
// ============================================================================

export default function BiometricLoginPage() {
    const { theme } = useUnistyles();
    const insets = useSafeAreaInsets();
    const auth = useAuth();

    // State
    const [loginState, setLoginState] = React.useState<LoginState>('checking');
    const [availability, setAvailability] = React.useState<BiometricAvailability | null>(null);
    const [errorMessage, setErrorMessage] = React.useState<string>('');

    // Check biometric availability on mount
    React.useEffect(() => {
        checkAvailability();
    }, []);

    const checkAvailability = async () => {
        setLoginState('checking');
        setErrorMessage('');

        try {
            // Check if biometric login is enabled
            const enabled = await isBiometricLoginEnabled();
            if (!enabled) {
                setLoginState('error');
                setErrorMessage(t('biometricLogin.noCredentials'));
                return;
            }

            // Check biometric availability
            const result = await checkBiometricAvailability();
            setAvailability(result);

            if (!result.isAvailable) {
                setLoginState('error');
                setErrorMessage(t('biometricLogin.hardwareNotAvailable'));
                return;
            }

            if (!result.isEnrolled) {
                setLoginState('error');
                setErrorMessage(t('biometricLogin.notEnrolled'));
                return;
            }

            setLoginState('ready');
        } catch (error) {
            log.log(`[BiometricLogin] Availability check failed: ${String(error)}`);
            setLoginState('error');
            setErrorMessage(t('biometricLogin.notAvailable'));
        }
    };

    const handleBiometricLogin = async () => {
        setLoginState('authenticating');
        setErrorMessage('');

        try {
            const result = await biometricQuickLogin();

            if (result.success && result.credentials) {
                setLoginState('success');

                // Login with stored credentials
                await auth.login(result.credentials.token, result.credentials.secret);

                // Navigate to home
                router.replace('/');
            } else {
                setLoginState('ready');

                // Handle specific errors
                if (result.error === 'Authentication cancelled') {
                    setErrorMessage(t('biometricLogin.cancelled'));
                } else if (result.error === 'Too many failed attempts') {
                    setErrorMessage(t('biometricLogin.lockout'));
                } else if (result.error === 'No stored credentials') {
                    setErrorMessage(t('biometricLogin.noCredentials'));
                } else {
                    setErrorMessage(result.error || t('biometricLogin.authenticationFailed'));
                }
            }
        } catch (error) {
            log.log(`[BiometricLogin] Login failed: ${String(error)}`);
            setLoginState('ready');
            setErrorMessage(t('biometricLogin.authenticationFailed'));
        }
    };

    const handleUsePassword = () => {
        // Navigate back to home to use password login
        router.back();
    };

    const biometricTypeName = availability
        ? getLocalizedBiometricName(availability.type)
        : t('biometricLogin.biometric');

    const biometricIcon = availability
        ? getBiometricIcon(availability.type)
        : 'lock-closed-outline';

    return (
        <View
            style={[
                styles.container,
                { paddingTop: insets.top, paddingBottom: insets.bottom },
            ]}
            testID="CP-06-biometric-login-page"
        >
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    onPress={handleUsePassword}
                    style={styles.backButton}
                    testID="CP-06-back-button"
                >
                    <Ionicons
                        name="chevron-back"
                        size={28}
                        color={theme.colors.text}
                    />
                </Pressable>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Icon */}
                <View
                    style={[
                        styles.iconContainer,
                        { backgroundColor: theme.colors.surfaceHigh },
                    ]}
                    testID="CP-06-biometric-icon"
                >
                    {loginState === 'checking' || loginState === 'authenticating' ? (
                        <ActivityIndicator
                            size="large"
                            color={theme.colors.button.primary.background}
                        />
                    ) : (
                        <Ionicons
                            name={biometricIcon}
                            size={64}
                            color={
                                loginState === 'success'
                                    ? theme.colors.success
                                    : loginState === 'error'
                                    ? theme.colors.textDestructive
                                    : theme.colors.button.primary.background
                            }
                        />
                    )}
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    {t('biometricLogin.title')}
                </Text>

                {/* Subtitle */}
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    {loginState === 'authenticating'
                        ? t('biometricLogin.authenticating')
                        : loginState === 'success'
                        ? t('biometricLogin.authenticationSuccess')
                        : t('biometricLogin.subtitle')}
                </Text>

                {/* Error message */}
                {errorMessage && loginState !== 'authenticating' && (
                    <View
                        style={[
                            styles.errorContainer,
                            { backgroundColor: theme.colors.box.error.background },
                        ]}
                        testID="CP-06-error-message"
                    >
                        <Ionicons
                            name="warning-outline"
                            size={20}
                            color={theme.colors.textDestructive}
                        />
                        <Text style={[styles.errorText, { color: theme.colors.textDestructive }]}>
                            {errorMessage}
                        </Text>
                    </View>
                )}

                {/* Secure storage info */}
                {loginState === 'ready' && (
                    <View style={styles.securityInfo}>
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={16}
                            color={theme.colors.textSecondary}
                        />
                        <Text
                            style={[styles.securityText, { color: theme.colors.textSecondary }]}
                        >
                            {t('biometricLogin.secureStorage')}
                        </Text>
                    </View>
                )}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
                {loginState === 'ready' && (
                    <>
                        <View style={styles.primaryButton} testID="CP-06-login-button">
                            <RoundButton
                                title={t('biometricLogin.loginWith', { type: biometricTypeName })}
                                onPress={handleBiometricLogin}
                            />
                        </View>
                        <View style={styles.secondaryButton} testID="CP-06-use-password-button">
                            <RoundButton
                                size="normal"
                                title={t('biometricLogin.usePassword')}
                                onPress={handleUsePassword}
                                display="inverted"
                            />
                        </View>
                    </>
                )}

                {loginState === 'error' && (
                    <>
                        <View style={styles.primaryButton}>
                            <RoundButton
                                title={t('common.retry')}
                                onPress={checkAvailability}
                            />
                        </View>
                        <View style={styles.secondaryButton}>
                            <RoundButton
                                size="normal"
                                title={t('biometricLogin.usePassword')}
                                onPress={handleUsePassword}
                                display="inverted"
                            />
                        </View>
                    </>
                )}

                {(loginState === 'checking' || loginState === 'authenticating') && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator
                            size="small"
                            color={theme.colors.textSecondary}
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    title: {
        ...Typography.default('semiBold'),
        fontSize: 28,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        ...Typography.default(),
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 8,
        gap: 8,
    },
    errorText: {
        ...Typography.default(),
        fontSize: 14,
        flex: 1,
    },
    securityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
    },
    securityText: {
        ...Typography.default(),
        fontSize: 13,
    },
    buttonContainer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    primaryButton: {
        marginBottom: 12,
    },
    secondaryButton: {
        alignItems: 'center',
    },
    loadingContainer: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
