/**
 * @file Service Worker for Happy Coder PWA
 * @input Web Push events, fetch requests
 * @output Cached responses, push notifications
 * @pos PWA 核心，处理离线缓存和推送通知
 *
 * 一旦我被更新，务必更新我的开头注释，以及 public/CLAUDE.md。
 */

// Cache version - update when static resources change
const CACHE_VERSION = 'happy-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Resources to cache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// URL patterns that should never be cached
const CACHE_EXCLUDE_PATTERNS = [
  /\/api\//,           // API requests
  /socket\.io/,        // WebSocket connections
  /\.hot-update\./,    // Hot module replacement
  /__webpack_hmr/,     // Webpack HMR
  /localhost/,         // Development server
];

// URL patterns for static resources (Cache First strategy)
const STATIC_PATTERNS = [
  /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/,
  /\/static\//,
  /\/_expo\//,
];

// ============================================================================
// Install Event - Cache core resources
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching static resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Pre-cache failed:', error);
      })
  );
});

// ============================================================================
// Activate Event - Clean up old caches
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete caches that don't match current version
              return cacheName.startsWith('happy-') && !cacheName.startsWith(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// ============================================================================
// Fetch Event - Handle network requests
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip excluded patterns
  if (CACHE_EXCLUDE_PATTERNS.some((pattern) => pattern.test(request.url))) {
    return;
  }

  // Skip cross-origin requests (except for CDN resources)
  if (url.origin !== location.origin && !url.hostname.includes('expo')) {
    return;
  }

  // Determine caching strategy based on request type
  if (isStaticResource(request.url)) {
    // Cache First for static resources
    event.respondWith(cacheFirst(request));
  } else if (isNavigationRequest(request)) {
    // Network First for navigation requests
    event.respondWith(networkFirst(request));
  } else {
    // Stale While Revalidate for other requests
    event.respondWith(staleWhileRevalidate(request));
  }
});

/**
 * Check if URL is for a static resource
 */
function isStaticResource(url) {
  return STATIC_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Check if request is a navigation request
 */
function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

/**
 * Cache First Strategy
 * Use cached version if available, otherwise fetch from network
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Cache first fetch failed:', error);
    // Return offline fallback if available
    return caches.match('/');
  }
}

/**
 * Network First Strategy
 * Try network first, fall back to cache
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network first failed, trying cache');
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page for navigation requests
    return caches.match('/');
  }
}

/**
 * Stale While Revalidate Strategy
 * Return cached version immediately, update cache in background
 */
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// ============================================================================
// Push Event - Handle push notifications
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');

  if (!event.data) {
    console.log('[ServiceWorker] Push has no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('[ServiceWorker] Failed to parse push data:', error);
    // Try to get as text for debugging
    console.log('[ServiceWorker] Raw push data:', event.data.text());
    return;
  }

  // Handle silent push (data-only, no notification)
  if (data.silent || data.type === 'silent_sync') {
    console.log('[ServiceWorker] Silent push - triggering background sync');
    event.waitUntil(handleSilentPush(data));
    return;
  }

  // Handle badge-only update
  if (data.type === 'badge_update') {
    event.waitUntil(updateBadgeCount(data.badgeCount || 0));
    return;
  }

  const { title, body, icon, badge, tag, data: notificationData, type } = data;

  // Determine notification type from data or root level
  const notificationType = notificationData?.type || type || 'system';

  // Build notification options
  const options = {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: badge || '/icon-192.png',
    tag: tag || `happy-${notificationType}-${Date.now()}`,
    data: {
      ...notificationData,
      type: notificationType,
      timestamp: Date.now(),
    },
    vibrate: getVibrationPattern(notificationType),
    requireInteraction: notificationType === 'approval_request',
    actions: getNotificationActions(notificationType),
    renotify: true, // Re-notify even if same tag
    silent: notificationType === 'system', // System notifications are silent
  };

  // Add timestamp for notification grouping
  if (notificationData?.timestamp) {
    options.timestamp = notificationData.timestamp;
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title || 'Happy Coder', options),
      incrementBadgeCount(),
    ])
  );
});

/**
 * Get notification actions based on notification type
 */
function getNotificationActions(type) {
  switch (type) {
    case 'approval_request':
      return [
        { action: 'approve', title: 'Approve', icon: '/icon-approve.png' },
        { action: 'reject', title: 'Reject', icon: '/icon-reject.png' },
      ];
    case 'new_message':
      return [
        { action: 'view', title: 'View', icon: '/icon-view.png' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'task_complete':
      return [
        { action: 'view', title: 'View Session', icon: '/icon-view.png' },
      ];
    default:
      return [];
  }
}

/**
 * Get vibration pattern based on notification type
 */
function getVibrationPattern(type) {
  switch (type) {
    case 'approval_request':
      // Urgent pattern: long-short-long
      return [300, 100, 300, 100, 300];
    case 'new_message':
      // Standard pattern: short-short
      return [200, 100, 200];
    case 'task_complete':
      // Success pattern: long vibrate
      return [400];
    case 'system':
      // No vibration for system notifications
      return [];
    default:
      return [200, 100, 200];
  }
}

/**
 * Handle silent push notification (data-only, no user notification)
 * Used for triggering background sync or updating app state
 */
async function handleSilentPush(data) {
  console.log('[ServiceWorker] Handling silent push:', data);

  // Notify all clients about the silent push data
  const windowClients = await clients.matchAll({ type: 'window' });

  for (const client of windowClients) {
    client.postMessage({
      type: 'SILENT_PUSH',
      payload: data,
    });
  }

  // Handle specific silent push types
  if (data.action === 'sync') {
    // Trigger background sync if supported
    if (self.registration.sync) {
      try {
        await self.registration.sync.register('push-triggered-sync');
      } catch (error) {
        console.error('[ServiceWorker] Background sync registration failed:', error);
      }
    }
  }

  if (data.action === 'clear_badge') {
    await updateBadgeCount(0);
  }

  return Promise.resolve();
}

// ============================================================================
// Badge Management
// ============================================================================

// Store badge count in memory (will reset on SW restart, but that's acceptable)
let currentBadgeCount = 0;

/**
 * Update the app badge count
 * Uses the Badging API if available
 */
async function updateBadgeCount(count) {
  currentBadgeCount = Math.max(0, count);

  // Use Badging API if available (Chrome, Edge on Windows/Mac)
  if ('setAppBadge' in navigator) {
    try {
      if (currentBadgeCount > 0) {
        await navigator.setAppBadge(currentBadgeCount);
      } else {
        await navigator.clearAppBadge();
      }
      console.log('[ServiceWorker] Badge updated:', currentBadgeCount);
    } catch (error) {
      console.error('[ServiceWorker] Failed to update badge:', error);
    }
  }

  // Notify clients about badge change
  const windowClients = await clients.matchAll({ type: 'window' });
  for (const client of windowClients) {
    client.postMessage({
      type: 'BADGE_UPDATE',
      count: currentBadgeCount,
    });
  }
}

/**
 * Increment the badge count by 1
 */
async function incrementBadgeCount() {
  await updateBadgeCount(currentBadgeCount + 1);
}

/**
 * Decrement the badge count by 1
 */
async function decrementBadgeCount() {
  await updateBadgeCount(currentBadgeCount - 1);
}

// ============================================================================
// Notification Click Event - Handle notification interactions
// ============================================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event.action);

  event.notification.close();

  const notificationData = event.notification.data || {};
  const { type, requestId, sessionId, messageId, url: customUrl } = notificationData;

  // Decrement badge count when notification is interacted with
  decrementBadgeCount();

  // Handle dismiss action - no navigation needed
  if (event.action === 'dismiss') {
    console.log('[ServiceWorker] Notification dismissed');
    return;
  }

  // Determine target URL based on notification type and action
  let targetUrl = customUrl || '/';

  if (event.action === 'approve' || event.action === 'reject') {
    // Handle approval actions
    targetUrl = `/app/inbox?requestId=${requestId}&action=${event.action}`;
  } else if (event.action === 'view') {
    // Handle view action based on notification type
    switch (type) {
      case 'new_message':
        targetUrl = sessionId
          ? `/session/${sessionId}${messageId ? `#message-${messageId}` : ''}`
          : '/';
        break;
      case 'task_complete':
        targetUrl = sessionId ? `/session/${sessionId}` : '/';
        break;
      default:
        targetUrl = customUrl || '/';
    }
  } else {
    // Handle notification click (no specific action)
    switch (type) {
      case 'approval_request':
        targetUrl = requestId ? `/app/inbox?requestId=${requestId}` : '/app/inbox';
        break;
      case 'task_complete':
        targetUrl = sessionId ? `/session/${sessionId}` : '/';
        break;
      case 'new_message':
        targetUrl = sessionId
          ? `/session/${sessionId}${messageId ? `#message-${messageId}` : ''}`
          : '/';
        break;
      case 'system':
        targetUrl = customUrl || '/settings';
        break;
      default:
        targetUrl = customUrl || '/';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if app is already open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: targetUrl,
              data: notificationData,
              action: event.action,
            });
            return client.focus();
          }
        }
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// ============================================================================
// Message Event - Handle messages from main app
// ============================================================================

self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      if (payload?.urls) {
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.addAll(payload.urls);
        });
      }
      break;

    case 'CLEAR_CACHE':
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      });
      break;

    case 'SET_BADGE':
      updateBadgeCount(payload?.count ?? 0);
      break;

    case 'CLEAR_BADGE':
      updateBadgeCount(0);
      break;

    case 'INCREMENT_BADGE':
      incrementBadgeCount();
      break;

    case 'DECREMENT_BADGE':
      decrementBadgeCount();
      break;

    case 'GET_BADGE':
      // Send current badge count back to the requesting client
      if (event.source) {
        event.source.postMessage({
          type: 'BADGE_COUNT',
          count: currentBadgeCount,
        });
      }
      break;

    case 'CLOSE_ALL_NOTIFICATIONS':
      // Close all notifications
      self.registration.getNotifications().then((notifications) => {
        notifications.forEach((notification) => notification.close());
        updateBadgeCount(0);
      });
      break;

    case 'CLOSE_NOTIFICATION':
      // Close specific notification by tag or requestId
      self.registration.getNotifications().then((notifications) => {
        const tag = payload?.tag;
        const requestId = payload?.requestId;
        let closed = false;

        notifications.forEach((notification) => {
          // Match by tag
          if (tag && notification.tag === tag) {
            notification.close();
            closed = true;
          }
          // Match by requestId in notification data
          if (requestId && notification.data?.requestId === requestId) {
            notification.close();
            closed = true;
          }
        });

        if (closed) {
          decrementBadgeCount();
        }
      });
      break;

    case 'CLOSE_NOTIFICATIONS':
      // Batch close notifications by tags or requestIds
      self.registration.getNotifications().then((notifications) => {
        const tags = payload?.tags || [];
        const requestIds = payload?.requestIds || [];
        let closedCount = 0;

        notifications.forEach((notification) => {
          // Match by tag
          if (tags.includes(notification.tag)) {
            notification.close();
            closedCount++;
            return;
          }
          // Match by requestId in notification data
          if (requestIds.includes(notification.data?.requestId)) {
            notification.close();
            closedCount++;
          }
        });

        if (closedCount > 0) {
          // Update badge count by subtracting closed count
          currentBadgeCount = Math.max(0, currentBadgeCount - closedCount);
          updateBadgeCount(currentBadgeCount);
        }
      });
      break;

    default:
      console.log('[ServiceWorker] Unknown message type:', type);
  }
});

// ============================================================================
// Push Subscription Change Event - Handle subscription expiration/renewal
// ============================================================================

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[ServiceWorker] Push subscription changed');

  // The old subscription is no longer valid
  // We need to re-subscribe and update the server

  event.waitUntil(
    (async () => {
      try {
        // Attempt to re-subscribe with the same options
        const subscription = await self.registration.pushManager.subscribe(
          event.oldSubscription?.options || {
            userVisibleOnly: true,
            // Note: applicationServerKey should be fetched from server or cached
            // The main app will handle this properly through pushSubscription.ts
          }
        );

        console.log('[ServiceWorker] Re-subscribed successfully');

        // Notify all clients about the subscription change
        const windowClients = await clients.matchAll({ type: 'window' });
        for (const client of windowClients) {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_CHANGED',
            oldEndpoint: event.oldSubscription?.endpoint,
            newSubscription: subscription.toJSON(),
          });
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to re-subscribe:', error);

        // Notify clients about the failure
        const windowClients = await clients.matchAll({ type: 'window' });
        for (const client of windowClients) {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_EXPIRED',
            oldEndpoint: event.oldSubscription?.endpoint,
            error: error.message,
          });
        }
      }
    })()
  );
});

// ============================================================================
// Notification Close Event
// ============================================================================

self.addEventListener('notificationclose', (event) => {
  console.log('[ServiceWorker] Notification closed');

  // Decrement badge count when notification is dismissed
  decrementBadgeCount();

  // Track notification dismissals
  const notificationData = event.notification.data || {};

  // Send dismissal event to main app
  clients.matchAll({ type: 'window' }).then((windowClients) => {
    windowClients.forEach((client) => {
      client.postMessage({
        type: 'NOTIFICATION_DISMISSED',
        data: notificationData,
        timestamp: Date.now(),
      });
    });
  });
});

// ============================================================================
// Background Sync Event - Handle offline sync when back online
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);

  if (event.tag === 'push-triggered-sync' || event.tag === 'offline-sync') {
    event.waitUntil(
      (async () => {
        // Notify clients to perform sync
        const windowClients = await clients.matchAll({ type: 'window' });
        for (const client of windowClients) {
          client.postMessage({
            type: 'BACKGROUND_SYNC',
            tag: event.tag,
          });
        }
      })()
    );
  }
});
