// PWA 기능 (Service Worker 등록 및 설치 프롬프트)
(function() {
    'use strict';

    let deferredPrompt = null;

    // DOM 요소
    const elements = {
        installPrompt: document.getElementById('installPrompt'),
        installBtn: document.getElementById('installBtn'),
        dismissInstall: document.getElementById('dismissInstall')
    };

    // Service Worker 등록
    async function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                console.log('Service Worker 등록 성공:', registration.scope);

                // 업데이트 확인
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // 새 버전 사용 가능
                            if (confirm('새 버전이 있습니다. 업데이트하시겠습니까?')) {
                                window.location.reload();
                            }
                        }
                    });
                });

                // 주기적 업데이트 확인
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000); // 1시간마다

            } catch (error) {
                console.error('Service Worker 등록 실패:', error);
            }
        } else {
            console.warn('이 브라우저는 Service Worker를 지원하지 않습니다.');
        }
    }

    // 설치 프롬프트 표시
    function showInstallPrompt() {
        if (elements.installPrompt) {
            elements.installPrompt.classList.add('show');
        }
    }

    // 설치 프롬프트 숨기기
    function hideInstallPrompt() {
        if (elements.installPrompt) {
            elements.installPrompt.classList.remove('show');
        }
    }

    // 앱 설치
    async function installApp() {
        if (!deferredPrompt) {
            window.EbookApp.showNotification('설치가 이미 완료되었거나 지원되지 않습니다.', 'info');
            return;
        }

        // 설치 프롬프트 표시
        deferredPrompt.prompt();

        // 사용자 선택 대기
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`설치 프롬프트 결과: ${outcome}`);

        if (outcome === 'accepted') {
            window.EbookApp.showNotification('앱이 설치되었습니다!', 'success');
        } else {
            window.EbookApp.showNotification('설치가 취소되었습니다.', 'info');
        }

        // 프롬프트 초기화
        deferredPrompt = null;
        hideInstallPrompt();
    }

    // 설치 가능 여부 확인
    function checkInstallability() {
        // beforeinstallprompt 이벤트 리스너
        window.addEventListener('beforeinstallprompt', (e) => {
            // 기본 프롬프트 방지
            e.preventDefault();
            
            // 이벤트 저장
            deferredPrompt = e;
            
            // 커스텀 설치 프롬프트 표시
            setTimeout(() => {
                showInstallPrompt();
            }, 3000); // 3초 후 표시

            console.log('앱 설치 가능');
        });

        // 앱 설치 완료 이벤트
        window.addEventListener('appinstalled', () => {
            console.log('앱이 설치되었습니다');
            window.EbookApp.showNotification('앱이 성공적으로 설치되었습니다!', 'success');
            deferredPrompt = null;
            hideInstallPrompt();
        });
    }

    // 온라인/오프라인 상태 감지
    function setupNetworkDetection() {
        function updateOnlineStatus() {
            if (navigator.onLine) {
                window.EbookApp.showNotification('온라인 상태입니다.', 'success');
            } else {
                window.EbookApp.showNotification('오프라인 상태입니다. 저장된 도서만 읽을 수 있습니다.', 'warning');
            }
        }

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
    }

    // 백그라운드 동기화 (지원되는 경우)
    async function setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('sync-books');
                console.log('백그라운드 동기화 등록 완료');
            } catch (error) {
                console.error('백그라운드 동기화 등록 실패:', error);
            }
        }
    }

    // 푸시 알림 권한 요청 (선택적)
    async function requestNotificationPermission() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                console.log('알림 권한 허용됨');
            } else {
                console.log('알림 권한 거부됨');
            }
        }
    }

    // 이벤트 리스너 등록
    function initEventListeners() {
        if (elements.installBtn) {
            elements.installBtn.addEventListener('click', installApp);
        }

        if (elements.dismissInstall) {
            elements.dismissInstall.addEventListener('click', () => {
                hideInstallPrompt();
                // 24시간 동안 다시 표시하지 않음
                localStorage.setItem('installPromptDismissed', Date.now());
            });
        }
    }

    // 초기화
    async function init() {
        // Service Worker 등록
        await registerServiceWorker();

        // 설치 가능 여부 확인
        checkInstallability();

        // 네트워크 상태 감지
        setupNetworkDetection();

        // 백그라운드 동기화 설정
        await setupBackgroundSync();

        // 이벤트 리스너 등록
        initEventListeners();

        // 설치 프롬프트 표시 여부 확인
        const dismissed = localStorage.getItem('installPromptDismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            const now = Date.now();
            const dayInMs = 24 * 60 * 60 * 1000;
            
            // 24시간이 지났으면 다시 표시
            if (now - dismissedTime > dayInMs) {
                localStorage.removeItem('installPromptDismissed');
            }
        }

        console.log('PWA 기능 초기화 완료');
    }

    // DOM 로드 완료 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
