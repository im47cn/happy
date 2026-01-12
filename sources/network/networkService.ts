/**
 * @file Network State Service
 * @input expo-network
 * @output Network state monitoring, connectivity checks, quality assessment
 * @pos Core service for network state management
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import * as Network from 'expo-network';
import { Platform } from 'react-native';
import { log } from '@/log';
import type {
    NetworkState,
    NetworkConnectionType,
    CellularGeneration,
    NetworkQuality,
    NetworkQualityInfo,
    NetworkStateChangeEvent,
    NetworkStateListener,
    NetworkServiceStatus,
    NetworkIPInfo,
    AirplaneModeStatus,
} from './types';

// ============================================================================
// State
// ============================================================================

let isInitialized = false;
let currentState: NetworkState | null = null;
let stateChanges = 0;
let listeners: NetworkStateListener[] = [];
let pollInterval: ReturnType<typeof setInterval> | null = null;

// Default polling interval (ms)
const DEFAULT_POLL_INTERVAL = 5000;

// ============================================================================
// Network State Helpers
// ============================================================================

/**
 * Convert expo-network type to our NetworkConnectionType
 */
function mapNetworkType(type: Network.NetworkStateType): NetworkConnectionType {
    switch (type) {
        case Network.NetworkStateType.WIFI:
            return 'wifi';
        case Network.NetworkStateType.CELLULAR:
            return 'cellular';
        case Network.NetworkStateType.BLUETOOTH:
            return 'bluetooth';
        case Network.NetworkStateType.ETHERNET:
            return 'ethernet';
        case Network.NetworkStateType.WIMAX:
            return 'wimax';
        case Network.NetworkStateType.VPN:
            return 'vpn';
        case Network.NetworkStateType.OTHER:
            return 'other';
        case Network.NetworkStateType.UNKNOWN:
            return 'unknown';
        case Network.NetworkStateType.NONE:
            return 'none';
        default:
            return 'unknown';
    }
}

/**
 * Create a NetworkState from expo-network state
 */
async function createNetworkState(): Promise<NetworkState> {
    try {
        const networkState = await Network.getNetworkStateAsync();

        const type = mapNetworkType(networkState.type ?? Network.NetworkStateType.UNKNOWN);
        const isConnected = networkState.isConnected ?? false;
        const isInternetReachable = networkState.isInternetReachable ?? false;

        // Determine cellular generation (only available on native)
        let cellularGeneration: CellularGeneration = null;
        if (type === 'cellular' && Platform.OS !== 'web') {
            // expo-network doesn't provide cellular generation directly
            // This would require additional native implementation
            // For now, we'll leave it as null
        }

        return {
            isConnected,
            isInternetReachable,
            type,
            isWifi: type === 'wifi',
            isCellular: type === 'cellular',
            cellularGeneration,
            isExpensive: type === 'cellular', // Cellular is typically metered
        };
    } catch (error) {
        log.log(`[network] Error getting network state: ${String(error)}`);
        return {
            isConnected: false,
            isInternetReachable: false,
            type: 'unknown',
            isWifi: false,
            isCellular: false,
            cellularGeneration: null,
            isExpensive: false,
        };
    }
}

/**
 * Compare two network states
 */
function hasStateChanged(oldState: NetworkState | null, newState: NetworkState): boolean {
    if (!oldState) return true;

    return (
        oldState.isConnected !== newState.isConnected ||
        oldState.isInternetReachable !== newState.isInternetReachable ||
        oldState.type !== newState.type
    );
}

// ============================================================================
// Network Quality Assessment
// ============================================================================

/**
 * Assess network quality based on current state
 */
export function assessNetworkQuality(state: NetworkState): NetworkQualityInfo {
    if (!state.isConnected || !state.isInternetReachable) {
        return {
            quality: 'none',
            suitableForLargeTransfers: false,
            suitableForRealtime: false,
            description: 'No internet connection',
        };
    }

    if (state.isWifi || state.type === 'ethernet') {
        return {
            quality: 'excellent',
            suitableForLargeTransfers: true,
            suitableForRealtime: true,
            description: 'High-speed connection',
        };
    }

    if (state.isCellular) {
        switch (state.cellularGeneration) {
            case '5g':
                return {
                    quality: 'excellent',
                    suitableForLargeTransfers: true,
                    suitableForRealtime: true,
                    description: '5G cellular connection',
                };
            case '4g':
                return {
                    quality: 'good',
                    suitableForLargeTransfers: true,
                    suitableForRealtime: true,
                    description: '4G/LTE cellular connection',
                };
            case '3g':
                return {
                    quality: 'fair',
                    suitableForLargeTransfers: false,
                    suitableForRealtime: true,
                    description: '3G cellular connection',
                };
            case '2g':
                return {
                    quality: 'poor',
                    suitableForLargeTransfers: false,
                    suitableForRealtime: false,
                    description: '2G cellular connection',
                };
            default:
                // Unknown cellular generation, assume good
                return {
                    quality: 'good',
                    suitableForLargeTransfers: false,
                    suitableForRealtime: true,
                    description: 'Cellular connection',
                };
        }
    }

    // Other connection types
    return {
        quality: 'fair',
        suitableForLargeTransfers: false,
        suitableForRealtime: true,
        description: `${state.type} connection`,
    };
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Update network state and notify listeners
 */
async function updateNetworkState(): Promise<void> {
    const newState = await createNetworkState();

    if (hasStateChanged(currentState, newState)) {
        const previousState = currentState;
        currentState = newState;
        stateChanges++;

        log.log(`[network] State changed: ${previousState?.type ?? 'unknown'} -> ${newState.type}, connected: ${newState.isConnected}`);

        // Notify listeners
        if (previousState) {
            const event: NetworkStateChangeEvent = {
                previous: previousState,
                current: newState,
                timestamp: Date.now(),
            };

            listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    log.log(`[network] Listener error: ${String(error)}`);
                }
            });
        }
    }
}

// ============================================================================
// Public API - State Access
// ============================================================================

/**
 * Get the current network state
 */
export async function getNetworkState(): Promise<NetworkState> {
    if (currentState && isInitialized) {
        return currentState;
    }
    return createNetworkState();
}

/**
 * Get current network state synchronously (may be stale)
 */
export function getNetworkStateSync(): NetworkState | null {
    return currentState;
}

/**
 * Check if connected to internet
 */
export async function isConnected(): Promise<boolean> {
    const state = await getNetworkState();
    return state.isConnected && state.isInternetReachable;
}

/**
 * Check if on WiFi
 */
export async function isOnWifi(): Promise<boolean> {
    const state = await getNetworkState();
    return state.isWifi;
}

/**
 * Check if on cellular
 */
export async function isOnCellular(): Promise<boolean> {
    const state = await getNetworkState();
    return state.isCellular;
}

/**
 * Check if connection is metered/expensive
 */
export async function isExpensiveConnection(): Promise<boolean> {
    const state = await getNetworkState();
    return state.isExpensive;
}

/**
 * Get current network quality assessment
 */
export async function getNetworkQuality(): Promise<NetworkQualityInfo> {
    const state = await getNetworkState();
    return assessNetworkQuality(state);
}

// ============================================================================
// Public API - IP Information
// ============================================================================

/**
 * Get device IP address
 */
export async function getIPAddress(): Promise<NetworkIPInfo> {
    try {
        const ip = await Network.getIpAddressAsync();
        return {
            ip,
            subnet: null, // expo-network doesn't provide subnet
        };
    } catch (error) {
        log.log(`[network] Error getting IP address: ${String(error)}`);
        return {
            ip: null,
            subnet: null,
        };
    }
}

// ============================================================================
// Public API - Airplane Mode (Android only)
// ============================================================================

/**
 * Check if airplane mode is enabled (Android only)
 */
export async function isAirplaneModeEnabled(): Promise<AirplaneModeStatus> {
    if (Platform.OS !== 'android') {
        return { isEnabled: false };
    }

    try {
        const enabled = await Network.isAirplaneModeEnabledAsync();
        return { isEnabled: enabled };
    } catch (error) {
        log.log(`[network] Error checking airplane mode: ${String(error)}`);
        return { isEnabled: false };
    }
}

// ============================================================================
// Public API - Listeners
// ============================================================================

/**
 * Add a network state change listener
 * @returns Unsubscribe function
 */
export function addNetworkStateListener(listener: NetworkStateListener): () => void {
    listeners.push(listener);
    log.log(`[network] Listener added (total: ${listeners.length})`);

    return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
            log.log(`[network] Listener removed (total: ${listeners.length})`);
        }
    };
}

/**
 * Remove all network state listeners
 */
export function removeAllListeners(): void {
    listeners = [];
    log.log('[network] All listeners removed');
}

// ============================================================================
// Service Management
// ============================================================================

/**
 * Get service status
 */
export function getServiceStatus(): NetworkServiceStatus {
    return {
        isInitialized,
        currentState,
        stateChanges,
        listenerCount: listeners.length,
    };
}

/**
 * Initialize the network service
 * Starts polling for network state changes
 */
export async function initializeNetworkService(options?: {
    pollInterval?: number;
}): Promise<NetworkServiceStatus> {
    if (isInitialized) {
        log.log('[network] Service already initialized');
        return getServiceStatus();
    }

    log.log('[network] Initializing network service');

    // Get initial state
    currentState = await createNetworkState();
    log.log(`[network] Initial state: ${currentState.type}, connected: ${currentState.isConnected}`);

    // Start polling for changes
    const interval = options?.pollInterval ?? DEFAULT_POLL_INTERVAL;
    pollInterval = setInterval(() => {
        updateNetworkState();
    }, interval);

    isInitialized = true;
    log.log(`[network] Service initialized (polling every ${interval}ms)`);

    return getServiceStatus();
}

/**
 * Cleanup the network service
 */
export function cleanupNetworkService(): void {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }

    listeners = [];
    currentState = null;
    stateChanges = 0;
    isInitialized = false;

    log.log('[network] Service cleaned up');
}

/**
 * Force refresh the network state
 */
export async function refreshNetworkState(): Promise<NetworkState> {
    await updateNetworkState();
    return currentState!;
}
