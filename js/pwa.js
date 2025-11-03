// PWA 기능 관리 (서비스 워커, 설치, 오프라인)
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isOnline = navigator.onLine;
        this.init();
    }

    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupOnlineOfflineDetection();
        this.updateOnlineStatus();
    }

    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker를 지원하지 않는 브라우저입니다.');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('Service Worker 등록 성공:', registration.scope);

            // 업데이트 확인
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('새로운 Service Worker를 발견했습니다');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        if (window.app) {
                            window.app.showNotification('새 버전이 있습니다. 새로고침하세요! 🔄');
                        }
                    }
                });
            });

            // 주기적으로 업데이트 확인 (1시간마다)
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000);

        } catch (error) {
            console.error('Service Worker 등록 실패:', error);
        }
    }

    setupInstallPrompt() {
        const installPrompt = document.getElementById('installPrompt');
        const installBtn = document.getElementById('installBtn');
        const dismissInstall = document.getElementById('dismissInstall');

        // beforeinstallprompt 이벤트 처리
        window.addEventListener('beforeinstallprompt', (e) => {
            // 기본 설치 프롬프트 방지
            e.preventDefault();
            this.deferredPrompt = e;

            // 이미 설치됨 확인
            if (this.isAppInstalled()) {
                return;
            }

            // 이전에 닫았는지 확인
            const dismissed = localStorage.getItem('install-prompt-dismissed');
            if (dismissed) {
                const dismissedTime = parseInt(dismissed);
                const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
                if (daysSinceDismissed < 7) {
                    return; // 7일 동안 다시 표시하지 않음
                }
            }

            // 설치 프롬프트 표시
            if (installPrompt) {
                setTimeout(() => {
                    installPrompt.classList.add('show');
                }, 2000);
            }
        });

        // 설치 버튼 클릭
        installBtn?.addEventListener('click', async () => {
            if (!this.deferredPrompt) return;

            // 설치 프롬프트 표시
            this.deferredPrompt.prompt();

            // 사용자 응답 대기
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`설치 프롬프트 결과: ${outcome}`);

            if (outcome === 'accepted') {
                if (window.app) {
                    window.app.showNotification('앱 설치가 시작됩니다! 🎉');
                }
            }

            // 프롬프트 초기화
            this.deferredPrompt = null;
            if (installPrompt) {
                installPrompt.classList.remove('show');
            }
        });

        // 닫기 버튼
        dismissInstall?.addEventListener('click', () => {
            if (installPrompt) {
                installPrompt.classList.remove('show');
            }
            localStorage.setItem('install-prompt-dismissed', Date.now().toString());
        });

        // 앱 설치 감지
        window.addEventListener('appinstalled', () => {
            console.log('PWA가 설치되었습니다');
            if (window.app) {
                window.app.showNotification('앱이 성공적으로 설치되었습니다! 🎉');
            }
            this.deferredPrompt = null;
            if (installPrompt) {
                installPrompt.classList.remove('show');
            }
        });
    }

    setupOnlineOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateOnlineStatus();
            if (window.app) {
                window.app.showNotification('인터넷에 연결되었습니다 🌐');
            }
            this.syncWhenOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateOnlineStatus();
            if (window.app) {
                window.app.showNotification('오프라인 모드입니다 📴', 'warning');
            }
        });
    }

    updateOnlineStatus() {
        // 헤더에 온라인 상태 표시
        const header = document.querySelector('.header');
        if (header) {
            if (this.isOnline) {
                header.classList.remove('offline');
                document.body.classList.remove('offline');
            } else {
                header.classList.add('offline');
                document.body.classList.add('offline');
            }
        }

        // 온라인 상태 인디케이터 추가
        this.updateOnlineIndicator();
    }

    updateOnlineIndicator() {
        let indicator = document.getElementById('onlineIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'onlineIndicator';
            indicator.className = 'online-indicator';
            document.body.appendChild(indicator);
        }

        if (this.isOnline) {
            indicator.innerHTML = '<i class="fas fa-wifi"></i> 온라인';
            indicator.className = 'online-indicator online';
        } else {
            indicator.innerHTML = '<i class="fas fa-wifi-slash"></i> 오프라인';
            indicator.className = 'online-indicator offline';
        }

        // 3초 후 자동 숨김
        setTimeout(() => {
            indicator.classList.add('hidden');
        }, 3000);
    }

    async syncWhenOnline() {
        if (!this.isOnline) return;

        try {
            // 백그라운드 동기화 등록
            if ('sync' in navigator.serviceWorker && 'SyncManager' in window) {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('sync-books');
                console.log('백그라운드 동기화 등록됨');
            }
        } catch (error) {
            console.error('백그라운드 동기화 등록 실패:', error);
        }
    }

    isAppInstalled() {
        // iOS
        if (window.navigator.standalone === true) {
            return true;
        }

        // Android
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return true;
        }

        return false;
    }

    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const usage = estimate.usage || 0;
                const quota = estimate.quota || 0;
                const percentUsed = ((usage / quota) * 100).toFixed(2);

                console.log(`저장소 사용량: ${this.formatBytes(usage)} / ${this.formatBytes(quota)} (${percentUsed}%)`);

                return { usage, quota, percentUsed };
            } catch (error) {
                console.error('저장소 정보 조회 실패:', error);
            }
        }
        return null;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // 푸시 알림 권한 요청
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('이 브라우저는 알림을 지원하지 않습니다');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    // 로컬 알림 표시
    async showLocalNotification(title, options = {}) {
        const hasPermission = await this.requestNotificationPermission();
        
        if (hasPermission && this.isAppInstalled()) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification(title, {
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                    vibrate: [200, 100, 200],
                    ...options
                });
            } catch (error) {
                console.error('알림 표시 실패:', error);
            }
        }
    }
}

// PWA 매니저 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});
