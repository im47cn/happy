/**
 * @file Deep Linking Service
 * @input expo-linking, types
 * @output Deep link handling, URL parsing, navigation triggers
 * @pos Core service for handling app deep links and universal links
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { log } from '@/log';
import type {
    ParsedDeepLink,
    DeepLinkRoute,
    DeepLinkEvent,
    DeepLinkHandler,
    RouteHandlers,
    LinkingServiceStatus,
    URLScheme,
    AppLaunchState,
} from './types';

// ============================================================================
// Constants
// ============================================================================

/** Default URL scheme for the app */
const DEFAULT_SCHEME = 'happy';

/** Route path mappings */
const ROUTE_PATHS: Record<string, DeepLinkRoute> = {
    'session': 'session',
    'approval': 'approval',
    'settings': 'settings',
    'settings/notifications': 'settings/notifications',
    'settings/security': 'settings/security',
    'connect': 'connect',
};

// ============================================================================
// State
// ============================================================================

let isInitialized = false;
let initialUrl: string | null = null;
let lastDeepLink: ParsedDeepLink | null = null;
let linksProcessed = 0;
let defaultHandler: DeepLinkHandler | null = null;
let routeHandlers: RouteHandlers = {};
let urlSubscription: { remove: () => void } | null = null;

// ============================================================================
// URL Parsing
// ============================================================================

/**
 * Parse a URL into its components
 */
export function parseUrl(url: string): ParsedDeepLink {
    try {
        const parsed = Linking.parse(url);

        // Determine scheme
        let scheme: URLScheme | string = 'unknown';
        if (url.startsWith('happy://')) {
            scheme = 'happy';
        } else if (url.startsWith('https://')) {
            scheme = 'https';
        } else if (url.startsWith('http://')) {
            scheme = 'http';
        } else if (parsed.scheme) {
            scheme = parsed.scheme;
        }

        // Parse path segments
        const pathSegments = parsed.path?.split('/').filter(Boolean) || [];

        // Determine route
        let route: DeepLinkRoute = 'unknown';
        let primaryId: string | undefined;

        if (pathSegments.length > 0) {
            const firstSegment = pathSegments[0];
            const twoSegmentPath = pathSegments.slice(0, 2).join('/');

            // Check for two-segment routes first (e.g., settings/notifications)
            if (ROUTE_PATHS[twoSegmentPath]) {
                route = ROUTE_PATHS[twoSegmentPath];
            } else if (ROUTE_PATHS[firstSegment]) {
                route = ROUTE_PATHS[firstSegment];
            }

            // Extract primary ID (second segment for most routes)
            if (pathSegments.length > 1 && !twoSegmentPath.includes(pathSegments[1])) {
                primaryId = pathSegments[1];
            }
        }

        // Parse query parameters
        const params: Record<string, string> = {};
        if (parsed.queryParams) {
            for (const [key, value] of Object.entries(parsed.queryParams)) {
                if (typeof value === 'string') {
                    params[key] = value;
                } else if (Array.isArray(value) && value.length > 0) {
                    params[key] = value[0];
                }
            }
        }

        return {
            url,
            scheme,
            route,
            pathSegments,
            params,
            primaryId,
        };
    } catch (error) {
        log.log(`[linking] Failed to parse URL: ${url} - ${String(error)}`);
        return {
            url,
            scheme: 'unknown',
            route: 'unknown',
            pathSegments: [],
            params: {},
        };
    }
}

// ============================================================================
// URL Generation
// ============================================================================

/**
 * Create a deep link URL for the app
 * @param route - The route path (e.g., 'session', 'approval/123')
 * @param params - Optional query parameters
 */
export function createDeepLink(route: string, params?: Record<string, string>): string {
    const baseUrl = Linking.createURL(route, {
        scheme: DEFAULT_SCHEME,
        queryParams: params,
    });
    return baseUrl;
}

/**
 * Create a session deep link
 */
export function createSessionLink(sessionId: string): string {
    return createDeepLink(`session/${sessionId}`);
}

/**
 * Create an approval request deep link
 */
export function createApprovalLink(requestId: string): string {
    return createDeepLink(`approval/${requestId}`);
}

/**
 * Create a connect deep link with token
 */
export function createConnectLink(token: string): string {
    return createDeepLink('connect', { token });
}

// ============================================================================
// Deep Link Handling
// ============================================================================

/**
 * Handle an incoming deep link
 */
async function handleDeepLink(url: string, launchState: AppLaunchState): Promise<void> {
    if (!url) {
        return;
    }

    log.log(`[linking] Handling deep link: ${url} (state: ${launchState})`);

    const parsedLink = parseUrl(url);
    lastDeepLink = parsedLink;
    linksProcessed++;

    const event: DeepLinkEvent = {
        link: parsedLink,
        launchState,
        timestamp: Date.now(),
    };

    // Try route-specific handler first
    const routeHandler = routeHandlers[parsedLink.route];
    if (routeHandler) {
        try {
            await routeHandler(event);
            log.log(`[linking] Route handler executed for: ${parsedLink.route}`);
            return;
        } catch (error) {
            log.log(`[linking] Route handler error: ${String(error)}`);
        }
    }

    // Fall back to default handler
    if (defaultHandler) {
        try {
            await defaultHandler(event);
            log.log('[linking] Default handler executed');
        } catch (error) {
            log.log(`[linking] Default handler error: ${String(error)}`);
        }
    }
}

/**
 * URL event listener callback
 */
function onUrlEvent(event: { url: string }): void {
    // App is already running, so this is foreground state
    handleDeepLink(event.url, 'foreground');
}

// ============================================================================
// Service Management
// ============================================================================

/**
 * Register a route-specific handler
 */
export function registerRouteHandler(route: DeepLinkRoute, handler: DeepLinkHandler): void {
    routeHandlers[route] = handler;
    log.log(`[linking] Registered handler for route: ${route}`);
}

/**
 * Remove a route handler
 */
export function removeRouteHandler(route: DeepLinkRoute): void {
    delete routeHandlers[route];
    log.log(`[linking] Removed handler for route: ${route}`);
}

/**
 * Set the default deep link handler
 */
export function setDefaultHandler(handler: DeepLinkHandler | null): void {
    defaultHandler = handler;
    log.log('[linking] Default handler updated');
}

/**
 * Get the service status
 */
export function getLinkingStatus(): LinkingServiceStatus {
    return {
        isInitialized,
        initialUrl,
        lastDeepLink,
        linksProcessed,
    };
}

/**
 * Get the initial URL that launched the app
 */
export async function getInitialUrl(): Promise<string | null> {
    try {
        const url = await Linking.getInitialURL();
        return url;
    } catch (error) {
        log.log(`[linking] Failed to get initial URL: ${String(error)}`);
        return null;
    }
}

// ============================================================================
// External URL Opening
// ============================================================================

/**
 * Open an external URL
 * @param url - The URL to open
 * @returns Whether the URL was opened successfully
 */
export async function openUrl(url: string): Promise<boolean> {
    try {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
            log.log(`[linking] Cannot open URL: ${url}`);
            return false;
        }

        await Linking.openURL(url);
        log.log(`[linking] Opened URL: ${url}`);
        return true;
    } catch (error) {
        log.log(`[linking] Failed to open URL: ${url} - ${String(error)}`);
        return false;
    }
}

/**
 * Open app settings
 */
export async function openSettings(): Promise<boolean> {
    try {
        await Linking.openSettings();
        log.log('[linking] Opened app settings');
        return true;
    } catch (error) {
        log.log(`[linking] Failed to open settings: ${String(error)}`);
        return false;
    }
}

/**
 * Check if a URL can be opened
 */
export async function canOpenUrl(url: string): Promise<boolean> {
    try {
        return await Linking.canOpenURL(url);
    } catch {
        return false;
    }
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the deep linking service
 * @param options - Optional configuration
 */
export async function initializeLinkingService(options?: {
    defaultHandler?: DeepLinkHandler;
    routeHandlers?: RouteHandlers;
}): Promise<LinkingServiceStatus> {
    if (isInitialized) {
        log.log('[linking] Service already initialized');
        return getLinkingStatus();
    }

    log.log('[linking] Initializing deep linking service');

    // Set handlers from options
    if (options?.defaultHandler) {
        defaultHandler = options.defaultHandler;
    }
    if (options?.routeHandlers) {
        routeHandlers = { ...routeHandlers, ...options.routeHandlers };
    }

    // Get initial URL (cold start)
    try {
        initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
            log.log(`[linking] Initial URL detected: ${initialUrl}`);
            // Process the initial URL with cold start state
            await handleDeepLink(initialUrl, 'cold');
        }
    } catch (error) {
        log.log(`[linking] Error getting initial URL: ${String(error)}`);
    }

    // Subscribe to URL events (warm/hot start)
    urlSubscription = Linking.addEventListener('url', onUrlEvent);

    isInitialized = true;
    log.log(`[linking] Service initialized (platform: ${Platform.OS})`);

    return getLinkingStatus();
}

/**
 * Cleanup the deep linking service
 */
export function cleanupLinkingService(): void {
    if (urlSubscription) {
        urlSubscription.remove();
        urlSubscription = null;
    }

    isInitialized = false;
    defaultHandler = null;
    routeHandlers = {};
    lastDeepLink = null;
    linksProcessed = 0;

    log.log('[linking] Service cleaned up');
}

// ============================================================================
// React Hook Support
// ============================================================================

/**
 * Get the Linking URL prefix for Expo Router
 * Used for configuring linking in navigation
 */
export function getLinkingPrefixes(): string[] {
    return [
        Linking.createURL('/'),  // happy:// scheme
        'https://happy.coder.app',  // Universal links
        'https://*.happy.coder.app',  // Subdomain universal links
    ];
}

/**
 * Create linking configuration for Expo Router
 */
export function createLinkingConfig() {
    return {
        prefixes: getLinkingPrefixes(),
        config: {
            screens: {
                '(tabs)': {
                    screens: {
                        index: '',
                        sessions: 'sessions',
                        settings: 'settings',
                    },
                },
                session: 'session/:sessionId',
                approval: 'approval/:requestId',
                connect: 'connect',
            },
        },
    };
}
