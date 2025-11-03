// 반응형 디자인 및 디바이스 최적화
class ResponsiveManager {
    constructor() {
        this.deviceType = this.detectDevice();
        this.orientation = this.detectOrientation();
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.init();
    }

    init() {
        this.applyDeviceStyles();
        this.setupOrientationListener();
        this.setupTouchGestures();
        this.setupResizeListener();
    }

    detectDevice() {
        const width = window.innerWidth;
        
        if (width <= 480) {
            return 'mobile';
        } else if (width <= 768) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    detectOrientation() {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }

    applyDeviceStyles() {
        document.body.setAttribute('data-device', this.deviceType);
        document.body.setAttribute('data-orientation', this.orientation);

        // 디바이스별 최적화
        switch(this.deviceType) {
            case 'mobile':
                this.applyMobileOptimizations();
                break;
            case 'tablet':
                this.applyTabletOptimizations();
                break;
            case 'desktop':
                this.applyDesktopOptimizations();
                break;
        }
    }

    applyMobileOptimizations() {
        // 모바일 최적화
        const bookContent = document.getElementById('bookContent');
        if (bookContent) {
            bookContent.style.padding = '16px';
        }

        // 터치 피드백 개선
        document.body.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0.1)';
    }

    applyTabletOptimizations() {
        // 태블릿 최적화
        const bookContent = document.getElementById('bookContent');
        if (bookContent) {
            bookContent.style.padding = '24px';
        }
    }

    applyDesktopOptimizations() {
        // 데스크톱 최적화
        const bookContent = document.getElementById('bookContent');
        if (bookContent) {
            bookContent.style.padding = '32px';
            bookContent.style.maxWidth = '800px';
            bookContent.style.margin = '0 auto';
        }
    }

    setupOrientationListener() {
        // 방향 변경 감지
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.orientation = this.detectOrientation();
                document.body.setAttribute('data-orientation', this.orientation);
                
                if (window.app) {
                    window.app.showNotification(`화면 방향: ${this.orientation === 'portrait' ? '세로' : '가로'}`);
                }

                // 페이지 재계산
                if (window.reader) {
                    window.reader.handleResize();
                }
            }, 100);
        });
    }

    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newDeviceType = this.detectDevice();
                
                if (newDeviceType !== this.deviceType) {
                    this.deviceType = newDeviceType;
                    this.applyDeviceStyles();
                    
                    if (window.app) {
                        window.app.showNotification(`디바이스 모드: ${this.deviceType}`);
                    }
                }

                this.orientation = this.detectOrientation();
                document.body.setAttribute('data-orientation', this.orientation);
            }, 250);
        });
    }

    setupTouchGestures() {
        const bookContent = document.getElementById('bookContent');
        if (!bookContent) return;

        // 스와이프 제스처
        bookContent.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        bookContent.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });

        // 더블 탭으로 폰트 크기 조절
        let lastTap = 0;
        bookContent.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 300 && tapLength > 0) {
                // 더블 탭 감지
                e.preventDefault();
                if (window.app) {
                    window.app.resetFontSize();
                }
            }
            lastTap = currentTime;
        });
    }

    handleSwipe() {
        const swipeThreshold = 50;
        const difference = this.touchStartX - this.touchEndX;

        if (Math.abs(difference) < swipeThreshold) return;

        if (difference > 0) {
            // 왼쪽으로 스와이프 - 다음 페이지
            if (window.reader) {
                window.reader.nextPage();
            }
        } else {
            // 오른쪽으로 스와이프 - 이전 페이지
            if (window.reader) {
                window.reader.prevPage();
            }
        }
    }

    // 현재 디바이스 정보 반환
    getDeviceInfo() {
        return {
            type: this.deviceType,
            orientation: this.orientation,
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            touch: 'ontouchstart' in window
        };
    }
}

// 반응형 매니저 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.responsiveManager = new ResponsiveManager();
    
    // 디바이스 정보 로그
    console.log('Device Info:', window.responsiveManager.getDeviceInfo());
});
