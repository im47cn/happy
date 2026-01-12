/**
 * @file Deep Linking Type Definitions
 * @input expo-linking types
 * @output Type definitions for deep link handling
 * @pos Core type definitions for linking module
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

// ============================================================================
// URL Scheme Types
// ============================================================================

/**
 * Supported URL schemes
 */
export type URLScheme = 'happy' | 'https' | 'http';

/**
 * Deep link routes supported by the app
 */
export type DeepLinkRoute =
    | 'session'           // Open specific session: happy://session/:sessionId
    | 'approval'          // Open approval request: happy://approval/:requestId
    | 'settings'          // Open settings: happy://settings
    | 'settings/notifications' // Notification settings
    | 'settings/security' // Security settings
    | 'connect'           // Connect via QR: happy://connect?token=xxx
    | 'unknown';          // Unrecognized route

/**
 * Parsed deep link result
 */
export interface ParsedDeepLink {
    /** The original URL */
    url: string;
    /** URL scheme (happy, https, etc.) */
    scheme: URLScheme | string;
    /** Parsed route type */
    route: DeepLinkRoute;
    /** Route path segments after the route type */
    pathSegments: string[];
    /** Query parameters */
    params: Record<string, string>;
    /** Primary ID from path (e.g., sessionId, requestId) */
    primaryId?: string;
}

// ============================================================================
// App State Types
// ============================================================================

/**
 * App launch state when handling deep link
 */
export type AppLaunchState =
    | 'cold'              // App was not running
    | 'background'        // App was in background
    | 'foreground';       // App was in foreground

/**
 * Deep link event with context
 */
export interface DeepLinkEvent {
    /** Parsed deep link */
    link: ParsedDeepLink;
    /** App state when link was received */
    launchState: AppLaunchState;
    /** Timestamp of the event */
    timestamp: number;
}

// ============================================================================
// Handler Types
// ============================================================================

/**
 * Deep link handler function
 */
export type DeepLinkHandler = (event: DeepLinkEvent) => void | Promise<void>;

/**
 * Route-specific handler map
 */
export type RouteHandlers = Partial<Record<DeepLinkRoute, DeepLinkHandler>>;

// ============================================================================
// Universal Link Types (iOS App Links / Android App Links)
// ============================================================================

/**
 * Universal link configuration
 */
export interface UniversalLinkConfig {
    /** Associated domain (e.g., happy.coder.app) */
    domain: string;
    /** Path prefixes to handle */
    pathPrefixes: string[];
}

/**
 * Linking service configuration
 */
export interface LinkingConfig {
    /** Custom URL scheme (e.g., 'happy') */
    scheme: string;
    /** Universal link domains */
    universalLinks?: UniversalLinkConfig[];
    /** Default route handler */
    defaultHandler?: DeepLinkHandler;
    /** Route-specific handlers */
    routeHandlers?: RouteHandlers;
}

// ============================================================================
// Service Status Types
// ============================================================================

/**
 * Linking service status
 */
export interface LinkingServiceStatus {
    /** Whether the service is initialized */
    isInitialized: boolean;
    /** Initial URL that launched the app (if any) */
    initialUrl: string | null;
    /** Last processed deep link */
    lastDeepLink: ParsedDeepLink | null;
    /** Number of deep links processed */
    linksProcessed: number;
}
