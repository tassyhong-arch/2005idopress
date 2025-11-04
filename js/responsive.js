// 반응형 디자인 및 모바일 최적화
(function() {
    'use strict';

    let isDesktop = window.innerWidth >= 768;
    let isMobile = window.innerWidth < 768;

    // 화면 크기 감지
    function detectScreenSize() {
        const width = window.innerWidth;
        
        isDesktop = width >= 768;
        isMobile = width < 768;

        // body에 클래스 추가
        if (isMobile) {
            document.body.classList.add('mobile');
            document.body.classList.remove('desktop');
        } else {
            document.body.classList.add('desktop');
            document.body.classList.remove('mobile');
        }
    }

    // 화면 방향 변경 감지
    function handleOrientationChange() {
        const orientation = window.screen.orientation || window.orientation;
        
        if (orientation) {
            const angle = orientation.angle || orientation;
            
            if (angle === 0 || angle === 180) {
                document.body.classList.add('portrait');
                document.body.classList.remove('landscape');
            } else {
                document.body.classList.add('landscape');
                document.body.classList.remove('portrait');
            }
        }
    }

    // 뷰포트 높이 조정 (모바일 브라우저 주소창 대응)
    function adjustViewportHeight() {
        // CSS 변수로 실제 뷰포트 높이 설정
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // 터치 이벤트 최적화
    function optimizeTouchEvents() {
        // 더블 탭 줌 방지 (필요한 경우)
        let lastTouchEnd = 0;
        
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    // 스크롤 성능 최적화
    function optimizeScroll() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    // 스크롤 관련 업데이트
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // 리사이즈 디바운싱
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 리사이즈 핸들러
    const handleResize = debounce(() => {
        detectScreenSize();
        adjustViewportHeight();
        handleOrientationChange();
    }, 250);

    // 폰트 크기 자동 조정 (접근성)
    function adjustFontForAccessibility() {
        // 시스템 폰트 크기 설정 감지
        const baseFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        
        if (baseFontSize !== 16) {
            // 사용자가 시스템 폰트 크기를 변경한 경우
            const scale = baseFontSize / 16;
            document.documentElement.style.setProperty('--font-scale', scale);
        }
    }

    // 다크 모드 시스템 설정 감지
    function detectSystemTheme() {
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // 초기 감지
            if (darkModeQuery.matches && !localStorage.getItem('ebookSettings')) {
                // 사용자가 설정을 저장하지 않았고 시스템이 다크 모드인 경우
                window.EbookApp.applyTheme('dark');
            }

            // 변경 감지
            darkModeQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem('ebookSettings')) {
                    // 사용자 설정이 없는 경우에만 시스템 설정 따르기
                    window.EbookApp.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    // 감소된 모션 설정 감지 (접근성)
    function detectReducedMotion() {
        if (window.matchMedia) {
            const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            
            if (reducedMotionQuery.matches) {
                document.body.classList.add('reduced-motion');
            }

            reducedMotionQuery.addEventListener('change', (e) => {
                if (e.matches) {
                    document.body.classList.add('reduced-motion');
                } else {
                    document.body.classList.remove('reduced-motion');
                }
            });
        }
    }

    // 풀스크린 모드 (선택적)
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('풀스크린 모드 진입 실패:', err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    // 화면 깜빡임 방지
    function preventScreenFlicker() {
        // 페이지 로드 시 깜빡임 방지
        document.documentElement.style.visibility = 'visible';
    }

    // 이벤트 리스너 등록
    function initEventListeners() {
        // 리사이즈 이벤트
        window.addEventListener('resize', handleResize);

        // 방향 변경 이벤트
        if (window.screen.orientation) {
            window.screen.orientation.addEventListener('change', handleOrientationChange);
        } else {
            window.addEventListener('orientationchange', handleOrientationChange);
        }

        // 페이지 가시성 변경 (백그라운드/포그라운드)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('앱이 백그라운드로 이동');
            } else {
                console.log('앱이 포그라운드로 복귀');
                // 필요한 경우 데이터 새로고침
            }
        });
    }

    // 초기화
    function init() {
        // 화면 크기 감지
        detectScreenSize();
        
        // 뷰포트 높이 조정
        adjustViewportHeight();
        
        // 화면 방향 감지
        handleOrientationChange();
        
        // 터치 이벤트 최적화
        if (isMobile) {
            optimizeTouchEvents();
        }
        
        // 스크롤 최적화
        optimizeScroll();
        
        // 접근성 폰트 조정
        adjustFontForAccessibility();
        
        // 시스템 테마 감지
        if (window.EbookApp && window.EbookApp.applyTheme) {
            detectSystemTheme();
        }
        
        // 감소된 모션 감지
        detectReducedMotion();
        
        // 화면 깜빡임 방지
        preventScreenFlicker();
        
        // 이벤트 리스너 등록
        initEventListeners();

        console.log('반응형 디자인 모듈 초기화 완료');
    }

    // 전역 함수 노출
    window.EbookResponsive = {
        isDesktop: () => isDesktop,
        isMobile: () => isMobile,
        toggleFullscreen
    };

    // DOM 로드 완료 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
