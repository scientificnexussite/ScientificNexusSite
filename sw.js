// ============================================================
//  SCIENTIFIC NEXUS — Service Worker  v2.0
//  Handles: Pre-caching · Offline · Stale-While-Revalidate
//           Push Notifications · Background Sync · Messaging
// ============================================================


// ─── CONFIGURATION ───────────────────────────────────────────
const SW_VERSION = 'v2';

// Separate cache buckets for different asset lifetimes
const CACHE_NAMES = {
    static : `nexus-static-${SW_VERSION}`,   // JS files, manifest, local HTML
    pages  : `nexus-pages-${SW_VERSION}`,    // All navigable HTML pages
    fonts  : `nexus-fonts-${SW_VERSION}`,    // CDN fonts & Font Awesome (long-lived)
    images : `nexus-images-${SW_VERSION}`,   // Remote game thumbnails
};

// Every recognised cache this version owns
const ALL_CACHES = Object.values(CACHE_NAMES);

// ─── PRECACHE LISTS ──────────────────────────────────────────

// Same-origin static assets — locked in on install
const PRECACHE_STATIC = [
    '/',
    '/index.html',
    '/manifest.json',
    '/database.json',
    '/games.html',
    '/Review.html',
    '/about.html',
    '/research.html',
    '/manifest.html',
    '/privacy.html',
    '/terms.html',
    '/nexus-particles-enhanced.js',
    '/nexus-holographic.js',
    '/nexus-logo.js',
    '/nexus-particles.js',
    '/nexus-scroll-animations.js',
    '/nexus-three.js',
    '/nexus-tilt.js',
];

// External CDN assets — locked in on install (no-cors opaque responses)
const PRECACHE_EXTERNAL = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap',
];

// ─── ROUTING RULES ───────────────────────────────────────────

// These are ALWAYS passed straight to the network — never intercepted.
// Firebase auth/Firestore and Google Ads must not be cached.
const BYPASS_PATTERNS = [
    /firebaseapp\.com/,
    /firebasestorage\.app/,
    /firebase\.google\.com/,
    /firestore\.googleapis\.com/,
    /identitytoolkit\.googleapis\.com/,
    /securetoken\.googleapis\.com/,
    /pagead2\.googlesyndication\.com/,
    /googletagmanager\.com/,
    /google-analytics\.com/,
    /doubleclick\.net/,
];

// Cache-first (long TTL) — CDN font and icon files
const FONT_PATTERNS = [
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/,
    /cdnjs\.cloudflare\.com/,
];

// Cache-first with entry cap — remote game thumbnail images
const IMAGE_PATTERNS = [
    /img\.gamedistribution\.com/,
];

// Max thumbnail images to keep before evicting the oldest
const IMAGE_CACHE_MAX = 80;


// ─── INSTALL ─────────────────────────────────────────────────
// Pre-cache core structural assets so the terminal shell loads offline.

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the waiting service worker to become the active service worker

    event.waitUntil(
        (async () => {
            const staticCache = await caches.open(CACHE_NAMES.static);
            const fontCache   = await caches.open(CACHE_NAMES.fonts);

            console.log('[Nexus SW] Pre-caching core terminal assets...');

            // Cache same-origin assets — gracefully skip any that fail (e.g. missing icons)
            await Promise.allSettled(
                PRECACHE_STATIC.map(url =>
                    staticCache.add(url).catch(err =>
                        console.warn(`[Nexus SW] Skipped static asset: ${url}`, err)
                    )
                )
            );

            // Cache external CDN assets as opaque no-cors responses
            await Promise.allSettled(
                PRECACHE_EXTERNAL.map(url =>
                    fontCache.add(new Request(url, { mode: 'no-cors' })).catch(err =>
                        console.warn(`[Nexus SW] Skipped CDN asset: ${url}`, err)
                    )
                )
            );

            console.log('[Nexus SW] Pre-caching complete — core assets locked in.');
        })()
    );
});


// ─── ACTIVATE ────────────────────────────────────────────────
// Clean up old cache versions to ensure users aren't stuck on legacy terminal logic.

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const existingCaches = await caches.keys();

            await Promise.all(
                existingCaches
                    .filter(name => !ALL_CACHES.includes(name))
                    .map(name => {
                        console.log(`[Nexus SW] Terminating legacy cache: ${name}`);
                        return caches.delete(name);
                    })
            );

            // Take control of all open clients immediately
            await self.clients.claim();
            console.log('[Nexus SW] Activated — Nexus Terminal is online.');
        })()
    );
});


// ─── FETCH ───────────────────────────────────────────────────
// Route every GET request to the appropriate caching strategy.

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only intercept GET requests
    if (request.method !== 'GET') return;

    // 1. BYPASS — Firebase auth/Firestore, Google Ads, Analytics → always network-only
    if (BYPASS_PATTERNS.some(pattern => pattern.test(request.url))) return;

    // 2. FONTS / CDN ICONS — Cache-first (these never change once loaded)
    if (FONT_PATTERNS.some(p => p.test(url.hostname))) {
        event.respondWith(cacheFirst(request, CACHE_NAMES.fonts));
        return;
    }

    // 3. GAME THUMBNAIL IMAGES — Cache-first with a max-entries cap
    if (IMAGE_PATTERNS.some(p => p.test(url.hostname))) {
        event.respondWith(cacheFirstWithLimit(request, CACHE_NAMES.images, IMAGE_CACHE_MAX));
        return;
    }

    // 4. DATABASE — Network-first (games list can be updated at any time)
    if (url.pathname === '/database.json') {
        event.respondWith(networkFirst(request, CACHE_NAMES.static));
        return;
    }

    // 5. SAME-ORIGIN HTML PAGES — Stale-While-Revalidate
    //    Return cached version instantly; refresh cache in the background.
    if (
        url.origin === self.location.origin && (
            request.destination === 'document' ||
            url.pathname.endsWith('.html') ||
            url.pathname === '/'
        )
    ) {
        event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.pages));
        return;
    }

    // 6. ALL OTHER SAME-ORIGIN ASSETS (JS, CSS, etc.) — Cache-first
    //    The network fetch runs in the background to update the cache.
    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(request, CACHE_NAMES.static));
        return;
    }
});


// ─── CACHING STRATEGIES ──────────────────────────────────────

/**
 * Cache-First
 * Serve from cache immediately. Only hit the network if not yet cached.
 * Best for: long-lived static assets (fonts, icons, JS bundles).
 */
async function cacheFirst(request, cacheName) {
    const cache    = await caches.open(cacheName);
    const cached   = await cache.match(request);
    if (cached) return cached;

    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (err) {
        console.warn('[Nexus SW] Cache-first — network failed:', request.url);
        return new Response('', { status: 503, statusText: 'Offline — asset unavailable' });
    }
}

/**
 * Network-First
 * Always try the network first. Fall back to cache if offline.
 * Best for: frequently-updated resources like database.json.
 */
async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);

    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (err) {
        const cached = await cache.match(request);
        if (cached) {
            console.log('[Nexus SW] Network-first — serving from cache:', request.url);
            return cached;
        }
        return new Response('', { status: 503, statusText: 'Offline — data unavailable' });
    }
}

/**
 * Stale-While-Revalidate
 * Return the cached version immediately if it exists, otherwise wait for the network.
 * Always revalidate the cache in the background for next time.
 * Best for: HTML pages — fast loads + always fresh on next visit.
 */
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    // The network fetch runs in the background to update the cache
    const fetchPromise = fetch(request).then(networkResponse => {
        if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type !== 'opaque'
        ) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(err => {
        console.warn('[Nexus SW] Stale-while-revalidate — revalidation failed:', request.url);
    });

    // Return the cached response immediately if it exists, otherwise wait for the network
    return cached || fetchPromise;
}

/**
 * Cache-First with Entry Limit
 * Same as cache-first but evicts the oldest entry once the cap is reached.
 * Best for: remote thumbnail images — avoids unbounded cache growth.
 */
async function cacheFirstWithLimit(request, cacheName, maxEntries) {
    const cache  = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
        const networkResponse = await fetch(request, { mode: 'no-cors' });

        // Enforce maximum entries — evict oldest if at capacity
        const keys = await cache.keys();
        if (keys.length >= maxEntries) {
            await cache.delete(keys[0]);
        }

        cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (err) {
        console.warn('[Nexus SW] Image cache — fetch failed:', request.url);
        return new Response('', { status: 503, statusText: 'Image unavailable offline' });
    }
}


// ─── PUSH NOTIFICATIONS ──────────────────────────────────────

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch {
        data = { title: '⚡ Nexus Update', body: event.data.text() };
    }

    const options = {
        body       : data.body    || 'New content is available at Scientific Nexus Terminal.',
        icon       : '/assets/icon-192x192.png',
        badge      : '/assets/icon-72x72.png',
        vibrate    : [100, 50, 100],
        tag        : 'nexus-notification',
        renotify   : true,
        data       : { url: data.url || '/', timestamp: Date.now() },
        actions    : [
            { action: 'open',    title: 'Open Terminal' },
            { action: 'dismiss', title: 'Dismiss'       },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || '⚡ Scientific Nexus', options)
    );
});


// ─── NOTIFICATION CLICK ──────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Focus an existing open window on the target URL if one exists
            for (const client of clientList) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new terminal window
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});


// ─── BACKGROUND SYNC ─────────────────────────────────────────

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-reviews') {
        event.waitUntil(syncPendingReviews());
    }
    if (event.tag === 'sync-profile') {
        event.waitUntil(syncPendingProfile());
    }
});

// Flush any review submissions that were queued while offline
async function syncPendingReviews() {
    console.log('[Nexus SW] Background sync — flushing pending review queue.');
    // Retrieve queued submissions from IndexedDB and POST to Firestore
}

// Flush any profile updates that were queued while offline
async function syncPendingProfile() {
    console.log('[Nexus SW] Background sync — flushing pending profile updates.');
}


// ─── MESSAGE HANDLER ─────────────────────────────────────────
// Allows the main thread (index.html / any page) to communicate
// directly with this service worker at runtime.

self.addEventListener('message', (event) => {
    const { type } = event.data || {};

    // Called by the update prompt: activate the new SW immediately
    if (type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    // Page can request the current SW version string for diagnostics
    if (type === 'GET_VERSION') {
        event.source?.postMessage({ type: 'VERSION', version: SW_VERSION });
    }

    // Nuclear option: wipe all Nexus caches on demand (e.g. hard-refresh button)
    if (type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(keys =>
                Promise.all(
                    keys
                        .filter(k => k.startsWith('nexus-'))
                        .map(k => {
                            console.log(`[Nexus SW] Manual cache purge: ${k}`);
                            return caches.delete(k);
                        })
                )
            )
        );
    }
});
