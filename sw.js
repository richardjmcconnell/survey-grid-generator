// Service Worker for Survey Grid Generator
// This enables offline functionality and proper PWA behavior

const CACHE_NAME = 'survey-grid-generator-v1';
const BASE_PATH = '/survey-grid-generator/';

// Files to cache for offline use
const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icon-192x192.png',
  BASE_PATH + 'icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      // Ensure the new service worker takes control immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', function(event) {
  // Only handle requests within our app's scope
  if (event.request.url.includes(BASE_PATH)) {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          // Return cached version if available
          if (response) {
            console.log('Serving from cache:', event.request.url);
            return response;
          }
          
          // Otherwise fetch from network
          console.log('Fetching from network:', event.request.url);
          return fetch(event.request).then(function(response) {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();
            
            // Add to cache for future use
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
        })
        .catch(function(error) {
          console.error('Fetch failed:', error);
          // Return a fallback response for navigation requests when offline
          if (event.request.mode === 'navigate') {
            return caches.match(BASE_PATH);
          }
          throw error;
        })
    );
  }
});

// Handle background sync (if supported)
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Add any background sync logic here
  }
});

// Handle push notifications (if needed in future)
self.addEventListener('push', function(event) {
  console.log('Push message received');
  // Add push notification handling here if needed
});