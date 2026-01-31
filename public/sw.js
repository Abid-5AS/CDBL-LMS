const CACHE_VERSION = 'v1';
const CACHE_NAME = `cdbl-lms-${CACHE_VERSION}`;

// Resources to cache on install
const STATIC_CACHE = [
  '/',
  '/login',
  '/dashboard/employee',
  '/offline',
  // Add other critical routes or assets here if known, e.g., icons, fonts
];

// Install event: Cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('cdbl-lms-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network-first strategy for API, Cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: Network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request).then((cached) => {
            return cached || new Response(
              JSON.stringify({ error: 'Offline', offline: true }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Static assets: Cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-leaves') {
    event.waitUntil(syncOfflineLeaves());
  }
});

async function syncOfflineLeaves() {
  // Retrieve pending actions from IndexedDB
  // Note: We need to include idb library or use raw indexedDB API in SW. 
  // Since importing modules in SW can be tricky without bundler config for SW, 
  // we'll use a simple raw IndexedDB helper or assume idb is available if bundled.
  // For simplicity in this prompt context, I'll use raw IndexedDB.
  
  const db = await openDB();
  const transaction = db.transaction('pendingActions', 'readonly');
  const store = transaction.objectStore('pendingActions');
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = async () => {
        const pendingActions = request.result;
        for (const action of pendingActions) {
            try {
            await fetch(action.url, {
                method: action.method,
                body: JSON.stringify(action.body),
                headers: { 'Content-Type': 'application/json' }
            });
            // Delete from DB on success
            const deleteTx = db.transaction('pendingActions', 'readwrite');
            deleteTx.objectStore('pendingActions').delete(action.id);
            } catch (error) {
            console.error('Sync failed for action:', action.id, error);
            }
        }
        resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cdbl-lms-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingActions')) {
          db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}
