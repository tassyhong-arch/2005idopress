const CACHE_NAME = 'ebook-reader-v7';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/responsive.css',
  './js/app.js',
  './js/reader.js',
  './js/responsive.js',
  './js/storage.js',
  './js/download.js',
  './js/book-manager.js',
  './js/search.js',
  './js/bookmark.js',
  './js/pwa.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './content.txt',
  './jusaengjeon.txt',
  './clear-cache.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('캐시에 파일 저장 중...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('서비스 워커 설치 완료');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('캐시 저장 실패:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('서비스 워커 활성화 완료');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(() => {
            return caches.match('/offline.html')
              .then((response) => {
                if (response) {
                  return response;
                }
                return caches.match('/')
                  .then((defaultResponse) => {
                    return defaultResponse || new Response('오프라인 상태입니다.', {
                      headers: { 'Content-Type': 'text/plain' }
                    });
                  });
              });
          });
      })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-books') {
    event.waitUntil(syncBooks());
  }
});

function syncBooks() {
  return new Promise((resolve) => {
    console.log('백그라운드 동기화 시작');
    resolve();
  });
}

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새로운 도서가 있습니다!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  event.waitUntil(
    self.registration.showNotification('이북 리더', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
