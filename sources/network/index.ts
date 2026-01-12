/**
 * @file Network Module Index
 * @input networkService, types
 * @output Unified exports for network state management
 * @pos Module entry point for network connectivity
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

// Re-export types
export type {
    NetworkConnectionType,
    CellularGeneration,
    NetworkState,
    NetworkQuality,
    NetworkQualityInfo,
    NetworkStateChangeEvent,
    NetworkStateListener,
    NetworkServiceStatus,
    NetworkIPInfo,
    AirplaneModeStatus,
} from './types';

// Re-export service functions
export {
    // State access
    getNetworkState,
    getNetworkStateSync,
    isConnected,
    isOnWifi,
    isOnCellular,
    isExpensiveConnection,

    // Quality assessment
    getNetworkQuality,
    assessNetworkQuality,

    // IP information
    getIPAddress,

    // Airplane mode (Android)
    isAirplaneModeEnabled,

    // Listeners
    addNetworkStateListener,
    removeAllListeners,

    // Service management
    getServiceStatus,
    initializeNetworkService,
    cleanupNetworkService,
    refreshNetworkState,
} from './networkService';
