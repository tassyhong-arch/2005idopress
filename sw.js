const CACHE_NAME = 'ebook-reader-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/reader.js',
  '/js/responsive.js',
  '/js/storage.js',
  '/js/download.js',
  '/js/book-manager.js',
  '/js/pwa.js',
  '/content.txt'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('[Service Worker] 설치 중...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] 캐시에 파일 저장 중...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] 설치 완료');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] 캐시 저장 실패:', error);
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 활성화 중...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] 활성화 완료');
      return self.clients.claim();
    })
  );
});

// Fetch 이벤트 (네트워크 우선 전략)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 외부 리소스는 네트워크 우선
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // 로컬 리소스는 캐시 우선, 네트워크 폴백
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          // 캐시에서 찾은 경우, 백그라운드에서 업데이트
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, networkResponse.clone());
                  });
              }
            })
            .catch(() => {
              // 네트워크 오류는 무시
            });
          
          return response;
        }

        // 캐시에 없으면 네트워크에서 가져오기
        return fetch(request)
          .then((networkResponse) => {
            // 유효한 응답인지 확인
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // 응답을 캐시에 저장
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch 실패:', error);
            
            // 오프라인 폴백
            if (request.destination === 'document') {
              return caches.match('/index.html')
                .then((response) => {
                  return response || new Response('오프라인 상태입니다.', {
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                  });
                });
            }

            return new Response('네트워크 오류가 발생했습니다.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          });
      })
  );
});

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] 백그라운드 동기화:', event.tag);
  
  if (event.tag === 'sync-books') {
    event.waitUntil(syncBooks());
  }
});

// 도서 동기화 함수
async function syncBooks() {
  try {
    console.log('[Service Worker] 도서 동기화 시작');
    
    // 여기에 실제 동기화 로직 추가
    // 예: 서버와 로컬 도서 목록 동기화
    
    console.log('[Service Worker] 도서 동기화 완료');
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] 도서 동기화 실패:', error);
    return Promise.reject(error);
  }
}

// 푸시 알림
self.addEventListener('push', (event) => {
  console.log('[Service Worker] 푸시 알림 수신');
  
  const options = {
    body: event.data ? event.data.text() : '새로운 도서가 있습니다!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: '열기'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('이북 리더', options)
  );
});

// 알림 클릭
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] 알림 클릭:', event.action);
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 메시지 수신 (클라이언트와 통신)
self.addEventListener('message', (event) => {
  console.log('[Service Worker] 메시지 수신:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] 로드 완료');
