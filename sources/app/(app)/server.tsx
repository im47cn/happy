/**
 * @file Server Configuration Page
 * @input serverConfig, network service, camera permissions
 * @output Server configuration UI with QR scanning, connection testing
 * @pos Phase 6 ServerSetup page for remote approval system
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/StyledText';
import { Typography } from '@/constants/Typography';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { RoundButton } from '@/components/RoundButton';
import { Modal } from '@/modal';
import { layout } from '@/components/layout';
import { t } from '@/text';
import { getServerUrl, setServerUrl, validateServerUrl, getServerInfo } from '@/sync/serverConfig';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useCheckScannerPermissions } from '@/hooks/useCheckCameraPermissions';
import { isConnected as checkNetworkConnected } from '@/network';
import { ActivityIndicator } from 'react-native';

const stylesheet = StyleSheet.create((theme) => ({
    keyboardAvoidingView: {
        flex: 1,
    },
    itemListContainer: {
        flex: 1,
    },
    contentContainer: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        width: '100%',
        maxWidth: layout.maxWidth,
        alignSelf: 'center',
    },
    labelText: {
        ...Typography.default('semiBold'),
        fontSize: 12,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: theme.colors.input.background,
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        ...Typography.mono(),
        fontSize: 14,
        color: theme.colors.input.text,
    },
    textInputValidating: {
        opacity: 0.6,
    },
    errorText: {
        ...Typography.default(),
        fontSize: 12,
        color: theme.colors.textDestructive,
        marginBottom: 12,
    },
    validatingText: {
        ...Typography.default(),
        fontSize: 12,
        color: theme.colors.status.connecting,
        marginBottom: 12,
    },
    successText: {
        ...Typography.default(),
        fontSize: 12,
        color: theme.colors.status.connected,
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    buttonWrapper: {
        flex: 1,
    },
    statusText: {
        ...Typography.default(),
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    rowContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    protocolContainer: {
        flex: 1,
    },
    portContainer: {
        width: 100,
    },
    protocolButton: {
        backgroundColor: theme.colors.input.background,
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    protocolButtonText: {
        ...Typography.mono(),
        fontSize: 14,
        color: theme.colors.input.text,
    },
    scanButton: {
        backgroundColor: theme.colors.radio.active,
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 12,
    },
    scanButtonText: {
        ...Typography.default('semiBold'),
        fontSize: 14,
        color: '#FFFFFF',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 12,
    },
}));

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export default function ServerConfigScreen() {
    const { theme } = useUnistyles();
    const styles = stylesheet;
    const checkScannerPermissions = useCheckScannerPermissions();
    const serverInfo = getServerInfo();

    // Parse existing server URL into components
    const parseServerUrl = useCallback((url: string) => {
        try {
            const parsed = new URL(url);
            return {
                protocol: parsed.protocol.replace(':', '') as 'http' | 'https',
                hostname: parsed.hostname,
                port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80'),
            };
        } catch {
            return { protocol: 'https' as const, hostname: '', port: '443' };
        }
    }, []);

    const existingConfig = serverInfo.isCustom ? parseServerUrl(getServerUrl()) : null;

    // State
    const [protocol, setProtocol] = useState<'http' | 'https'>(existingConfig?.protocol || 'https');
    const [hostname, setHostname] = useState(existingConfig?.hostname || '');
    const [port, setPort] = useState(existingConfig?.port || '443');
    const [error, setError] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');

    // Build full URL from components
    const buildUrl = useCallback(() => {
        if (!hostname.trim()) return '';
        const defaultPort = protocol === 'https' ? '443' : '80';
        const portSuffix = port && port !== defaultPort ? `:${port}` : '';
        return `${protocol}://${hostname.trim()}${portSuffix}`;
    }, [protocol, hostname, port]);

    // Toggle protocol between http and https
    const toggleProtocol = useCallback(() => {
        setProtocol(prev => {
            const newProtocol = prev === 'https' ? 'http' : 'https';
            // Update port to default for new protocol
            if (port === '443' && newProtocol === 'http') setPort('80');
            if (port === '80' && newProtocol === 'https') setPort('443');
            return newProtocol;
        });
        setError(null);
        setConnectionStatus('idle');
    }, [port]);

    // Test connection to server
    const testConnection = useCallback(async () => {
        const url = buildUrl();
        if (!url) {
            setError(t('server.enterServerUrl'));
            return false;
        }

        // Check network connectivity first
        const isNetworkConnected = await checkNetworkConnected();
        if (!isNetworkConnected) {
            setError(t('errors.notConnectedToServer'));
            setConnectionStatus('error');
            return false;
        }

        setConnectionStatus('testing');
        setError(null);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'text/plain' },
            });

            if (!response.ok) {
                setError(t('server.serverReturnedError'));
                setConnectionStatus('error');
                return false;
            }

            const text = await response.text();
            if (!text.includes('Welcome to Happy Server!')) {
                setError(t('server.notValidHappyServer'));
                setConnectionStatus('error');
                return false;
            }

            setConnectionStatus('success');
            return true;
        } catch {
            setError(t('server.failedToConnectToServer'));
            setConnectionStatus('error');
            return false;
        }
    }, [buildUrl]);

    // Handle QR code scan for server configuration
    const handleScanQR = useCallback(async () => {
        if (await checkScannerPermissions()) {
            CameraView.launchScanner({ barcodeTypes: ['qr'] });
        } else {
            Modal.alert(t('common.error'), t('modals.cameraPermissionsRequired'), [{ text: t('common.ok') }]);
        }
    }, [checkScannerPermissions]);

    // Process scanned QR code
    useEffect(() => {
        if (CameraView.isModernBarcodeScannerAvailable) {
            const subscription = CameraView.onModernBarcodeScanned(async (event) => {
                // Expect QR code format: happy://server?url=https://example.com:3005
                // or direct URL: https://example.com:3005
                const data = event.data;

                if (Platform.OS === 'ios') {
                    await CameraView.dismissScanner();
                }

                let serverUrl = data;
                if (data.startsWith('happy://server?url=')) {
                    serverUrl = decodeURIComponent(data.slice('happy://server?url='.length));
                }

                try {
                    const parsed = parseServerUrl(serverUrl);
                    setProtocol(parsed.protocol);
                    setHostname(parsed.hostname);
                    setPort(parsed.port);
                    setError(null);
                    setConnectionStatus('idle');
                    Modal.alert(t('common.success'), t('server.serverConfigScanned'));
                } catch {
                    Modal.alert(t('common.error'), t('server.invalidQrCode'));
                }
            });
            return () => subscription.remove();
        }
    }, [parseServerUrl]);

    // Save configuration
    const handleSave = useCallback(async () => {
        const url = buildUrl();
        if (!url) {
            Modal.alert(t('common.error'), t('server.enterServerUrl'));
            return;
        }

        const validation = validateServerUrl(url);
        if (!validation.valid) {
            setError(validation.error || t('errors.invalidFormat'));
            return;
        }

        // Validate server before saving
        const isValid = await testConnection();
        if (!isValid) return;

        const confirmed = await Modal.confirm(
            t('server.changeServer'),
            t('server.continueWithServer'),
            { confirmText: t('common.continue'), destructive: true }
        );

        if (confirmed) {
            setServerUrl(url);
        }
    }, [buildUrl, testConnection]);

    // Reset to default
    const handleReset = useCallback(async () => {
        const confirmed = await Modal.confirm(
            t('server.resetToDefault'),
            t('server.resetServerDefault'),
            { confirmText: t('common.reset'), destructive: true }
        );

        if (confirmed) {
            setServerUrl(null);
            setProtocol('https');
            setHostname('');
            setPort('443');
            setError(null);
            setConnectionStatus('idle');
        }
    }, []);

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: t('server.serverConfiguration'),
                    headerBackTitle: t('common.back'),
                }}
            />

            <KeyboardAvoidingView 
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ItemList style={styles.itemListContainer}>
                    <ItemGroup footer={t('server.advancedFeatureFooter')}>
                        <View style={styles.contentContainer} testID="server-setup-container">
                            {/* Protocol and Port Row */}
                            <View style={styles.rowContainer}>
                                <View style={styles.protocolContainer}>
                                    <Text style={styles.labelText}>{t('server.protocolLabel').toUpperCase()}</Text>
                                    <Pressable
                                        style={styles.protocolButton}
                                        onPress={toggleProtocol}
                                        testID="server-setup-protocol-select"
                                    >
                                        <Text style={styles.protocolButtonText}>{protocol.toUpperCase()}</Text>
                                        <Ionicons name="chevron-expand" size={16} color={theme.colors.textSecondary} />
                                    </Pressable>
                                </View>
                                <View style={styles.portContainer}>
                                    <Text style={styles.labelText}>{t('server.portLabel').toUpperCase()}</Text>
                                    <TextInput
                                        style={[
                                            styles.textInput,
                                            connectionStatus === 'testing' && styles.textInputValidating,
                                            { marginBottom: 0 }
                                        ]}
                                        value={port}
                                        onChangeText={(text) => {
                                            setPort(text.replace(/[^0-9]/g, ''));
                                            setError(null);
                                            setConnectionStatus('idle');
                                        }}
                                        placeholder="443"
                                        placeholderTextColor={theme.colors.input.placeholder}
                                        keyboardType="number-pad"
                                        maxLength={5}
                                        editable={connectionStatus !== 'testing'}
                                        testID="server-setup-port-input"
                                    />
                                </View>
                            </View>

                            {/* Hostname Input */}
                            <Text style={styles.labelText}>{t('server.hostnameLabel').toUpperCase()}</Text>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    connectionStatus === 'testing' && styles.textInputValidating
                                ]}
                                value={hostname}
                                onChangeText={(text) => {
                                    setHostname(text);
                                    setError(null);
                                    setConnectionStatus('idle');
                                }}
                                placeholder="example.com"
                                placeholderTextColor={theme.colors.input.placeholder}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                                editable={connectionStatus !== 'testing'}
                                testID="server-setup-url-input"
                            />

                            {/* Status Messages */}
                            {error && (
                                <Text style={styles.errorText} testID="server-setup-status-text">
                                    {error}
                                </Text>
                            )}
                            {connectionStatus === 'testing' && (
                                <View style={styles.loadingContainer} testID="server-setup-loading">
                                    <ActivityIndicator size="small" color={theme.colors.status.connecting} />
                                    <Text style={styles.validatingText}>
                                        {t('server.validatingServer')}
                                    </Text>
                                </View>
                            )}
                            {connectionStatus === 'success' && !error && (
                                <Text style={styles.successText} testID="server-setup-status-text">
                                    {t('server.connectionSuccess')}
                                </Text>
                            )}

                            {/* QR Code Scan Button */}
                            <Pressable
                                style={styles.scanButton}
                                onPress={handleScanQR}
                                testID="server-setup-button-scan"
                            >
                                <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.scanButtonText}>{t('server.scanQrCode')}</Text>
                            </Pressable>

                            {/* Action Buttons */}
                            <View style={styles.buttonRow}>
                                <View style={styles.buttonWrapper} testID="server-setup-button-test">
                                    <RoundButton
                                        title={t('server.testConnection')}
                                        size="normal"
                                        display="inverted"
                                        onPress={testConnection}
                                        disabled={connectionStatus === 'testing' || !hostname.trim()}
                                    />
                                </View>
                                <View style={styles.buttonWrapper} testID="server-setup-button-save">
                                    <RoundButton
                                        title={connectionStatus === 'testing' ? t('server.validating') : t('common.save')}
                                        size="normal"
                                        action={handleSave}
                                        disabled={connectionStatus === 'testing' || !hostname.trim()}
                                    />
                                </View>
                            </View>

                            {/* Reset Button */}
                            {serverInfo.isCustom && (
                                <View style={{ marginTop: 8 }}>
                                    <RoundButton
                                        title={t('server.resetToDefault')}
                                        size="normal"
                                        display="inverted"
                                        onPress={handleReset}
                                    />
                                    <Text style={[styles.statusText, { marginTop: 12 }]}>
                                        {t('server.currentlyUsingCustomServer')}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </ItemGroup>
                </ItemList>
            </KeyboardAvoidingView>
        </>
    );
}
