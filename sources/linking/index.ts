/**
 * @file Deep Linking Module Index
 * @input linkingService, types
 * @output Unified exports for deep linking functionality
 * @pos Module entry point for app deep linking
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

// Re-export types
export type {
    URLScheme,
    DeepLinkRoute,
    ParsedDeepLink,
    AppLaunchState,
    DeepLinkEvent,
    DeepLinkHandler,
    RouteHandlers,
    UniversalLinkConfig,
    LinkingConfig,
    LinkingServiceStatus,
} from './types';

// Re-export service functions
export {
    // URL parsing
    parseUrl,

    // URL generation
    createDeepLink,
    createSessionLink,
    createApprovalLink,
    createConnectLink,

    // Handler registration
    registerRouteHandler,
    removeRouteHandler,
    setDefaultHandler,

    // Status
    getLinkingStatus,
    getInitialUrl,

    // External URL handling
    openUrl,
    openSettings,
    canOpenUrl,

    // Initialization
    initializeLinkingService,
    cleanupLinkingService,

    // Expo Router support
    getLinkingPrefixes,
    createLinkingConfig,
} from './linkingService';
