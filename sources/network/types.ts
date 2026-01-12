/**
 * @file Network Service Type Definitions
 * @input expo-network types
 * @output Type definitions for network state management
 * @pos Core type definitions for network module
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

// ============================================================================
// Network State Types
// ============================================================================

/**
 * Network connection type
 */
export type NetworkConnectionType =
    | 'wifi'
    | 'cellular'
    | 'bluetooth'
    | 'ethernet'
    | 'wimax'
    | 'vpn'
    | 'other'
    | 'unknown'
    | 'none';

/**
 * Cellular generation type
 */
export type CellularGeneration =
    | '2g'
    | '3g'
    | '4g'
    | '5g'
    | null;

/**
 * Network state information
 */
export interface NetworkState {
    /** Whether there is an active network connection */
    isConnected: boolean;
    /** Whether the network has internet access */
    isInternetReachable: boolean;
    /** The type of network connection */
    type: NetworkConnectionType;
    /** Whether using WiFi */
    isWifi: boolean;
    /** Whether using cellular data */
    isCellular: boolean;
    /** Cellular generation (2g/3g/4g/5g) if on cellular */
    cellularGeneration: CellularGeneration;
    /** Whether the connection is expensive (metered) */
    isExpensive: boolean;
}

// ============================================================================
// Network Quality Types
// ============================================================================

/**
 * Network quality assessment
 */
export type NetworkQuality =
    | 'excellent'   // WiFi or 5G
    | 'good'        // 4G/LTE
    | 'fair'        // 3G
    | 'poor'        // 2G or weak connection
    | 'none';       // No connection

/**
 * Network quality details
 */
export interface NetworkQualityInfo {
    /** Overall quality assessment */
    quality: NetworkQuality;
    /** Recommended for large transfers */
    suitableForLargeTransfers: boolean;
    /** Recommended for real-time communication */
    suitableForRealtime: boolean;
    /** Human-readable description */
    description: string;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Network state change event
 */
export interface NetworkStateChangeEvent {
    /** Previous network state */
    previous: NetworkState;
    /** Current network state */
    current: NetworkState;
    /** Timestamp of the change */
    timestamp: number;
}

/**
 * Network state change listener
 */
export type NetworkStateListener = (event: NetworkStateChangeEvent) => void;

// ============================================================================
// Service Types
// ============================================================================

/**
 * Network service status
 */
export interface NetworkServiceStatus {
    /** Whether the service is initialized */
    isInitialized: boolean;
    /** Current network state */
    currentState: NetworkState | null;
    /** Number of state changes detected */
    stateChanges: number;
    /** Number of active listeners */
    listenerCount: number;
}

/**
 * Network IP information
 */
export interface NetworkIPInfo {
    /** IP address */
    ip: string | null;
    /** Subnet mask */
    subnet: string | null;
}

/**
 * Airplane mode status
 */
export interface AirplaneModeStatus {
    /** Whether airplane mode is enabled */
    isEnabled: boolean;
}
