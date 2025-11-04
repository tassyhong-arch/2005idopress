// 앱 초기화 및 전역 상태 관리
(function() {
    'use strict';

    // 전역 앱 상태
    window.EbookApp = {
        currentBook: null,
        currentPage: 1,
        totalPages: 1,
        fontSize: 16,
        theme: 'light',
        lineHeight: 1.5,
        letterSpacing: 'normal',
        books: [],
        initialized: false
    };

    // DOM 요소 캐싱
    const elements = {
        bookContent: document.getElementById('bookContent'),
        currentPage: document.getElementById('currentPage'),
        totalPages: document.getElementById('totalPages'),
        progressText: document.getElementById('progressText'),
        progressFill: document.getElementById('progressFill'),
        scrollProgress: document.getElementById('scrollProgress'),
        notification: document.getElementById('notification'),
        notificationText: document.getElementById('notificationText')
    };

    // 로컬 스토리지에서 설정 로드
    function loadSettings() {
        try {
            const savedSettings = localStorage.getItem('ebookSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                window.EbookApp.fontSize = settings.fontSize || 16;
                window.EbookApp.theme = settings.theme || 'light';
                window.EbookApp.lineHeight = settings.lineHeight || 1.5;
                window.EbookApp.letterSpacing = settings.letterSpacing || 'normal';
                window.EbookApp.currentPage = settings.currentPage || 1;
            }
        } catch (error) {
            console.error('설정 로드 실패:', error);
        }
    }

    // 설정 저장
    function saveSettings() {
        try {
            const settings = {
                fontSize: window.EbookApp.fontSize,
                theme: window.EbookApp.theme,
                lineHeight: window.EbookApp.lineHeight,
                letterSpacing: window.EbookApp.letterSpacing,
                currentPage: window.EbookApp.currentPage
            };
            localStorage.setItem('ebookSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('설정 저장 실패:', error);
            showNotification('설정 저장에 실패했습니다.', 'error');
        }
    }

    // 알림 표시
    function showNotification(message, type = 'info') {
        if (!elements.notification || !elements.notificationText) return;
        
        elements.notificationText.textContent = message;
        elements.notification.className = `notification ${type}`;
        elements.notification.style.display = 'block';
        
        setTimeout(() => {
            elements.notification.style.display = 'none';
        }, 3000);
    }

    // 진행률 업데이트
    function updateProgress() {
        const progress = Math.round((window.EbookApp.currentPage / window.EbookApp.totalPages) * 100);
        
        if (elements.progressText) {
            elements.progressText.textContent = `${progress}%`;
        }
        
        if (elements.progressFill) {
            elements.progressFill.style.width = `${progress}%`;
        }
        
        if (elements.currentPage) {
            elements.currentPage.textContent = window.EbookApp.currentPage;
        }
        
        if (elements.totalPages) {
            elements.totalPages.textContent = window.EbookApp.totalPages;
        }
    }

    // 스크롤 진행률 업데이트
    function updateScrollProgress() {
        if (!elements.scrollProgress) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        
        elements.scrollProgress.style.width = `${scrollPercent}%`;
        elements.scrollProgress.setAttribute('aria-valuenow', Math.round(scrollPercent));
    }

    // 테마 적용
    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        window.EbookApp.theme = theme;
        saveSettings();
    }

    // 폰트 크기 적용
    function applyFontSize(size) {
        if (elements.bookContent) {
            elements.bookContent.style.fontSize = `${size}px`;
            window.EbookApp.fontSize = size;
            saveSettings();
        }
    }

    // 줄 간격 적용
    function applyLineHeight(height) {
        if (elements.bookContent) {
            elements.bookContent.style.lineHeight = height;
            window.EbookApp.lineHeight = height;
            saveSettings();
        }
    }

    // 글자 간격 적용
    function applyLetterSpacing(spacing) {
        if (elements.bookContent) {
            elements.bookContent.style.letterSpacing = spacing;
            window.EbookApp.letterSpacing = spacing;
            saveSettings();
        }
    }

    // 초기 콘텐츠 로드
    async function loadInitialContent() {
        try {
            const response = await fetch('content.txt');
            if (!response.ok) {
                throw new Error('콘텐츠 로드 실패');
            }
            const text = await response.text();
            
            if (elements.bookContent) {
                // 마크다운 스타일 텍스트를 HTML로 간단히 변환
                const html = text
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/^\d+\.\s+(.*$)/gim, '<li>$1</li>');
                
                elements.bookContent.innerHTML = `<p>${html}</p>`;
            }
            
            window.EbookApp.currentBook = {
                title: '기본 도서',
                content: text
            };
            
            showNotification('도서를 불러왔습니다.', 'success');
        } catch (error) {
            console.error('초기 콘텐츠 로드 실패:', error);
            if (elements.bookContent) {
                elements.bookContent.innerHTML = '<p>콘텐츠를 불러오는데 실패했습니다. 도서 관리에서 새 도서를 추가해주세요.</p>';
            }
        }
    }

    // 앱 초기화
    async function initApp() {
        if (window.EbookApp.initialized) return;
        
        console.log('이북 리더 앱 초기화 중...');
        
        // 설정 로드
        loadSettings();
        
        // 테마 적용
        applyTheme(window.EbookApp.theme);
        applyFontSize(window.EbookApp.fontSize);
        applyLineHeight(window.EbookApp.lineHeight);
        applyLetterSpacing(window.EbookApp.letterSpacing);
        
        // 초기 콘텐츠 로드
        await loadInitialContent();
        
        // 진행률 업데이트
        updateProgress();
        
        // 스크롤 이벤트 리스너
        window.addEventListener('scroll', updateScrollProgress);
        
        // 초기 스크롤 진행률 업데이트
        updateScrollProgress();
        
        window.EbookApp.initialized = true;
        console.log('이북 리더 앱 초기화 완료');
    }

    // 전역 함수 노출
    window.EbookApp.showNotification = showNotification;
    window.EbookApp.updateProgress = updateProgress;
    window.EbookApp.saveSettings = saveSettings;
    window.EbookApp.applyTheme = applyTheme;
    window.EbookApp.applyFontSize = applyFontSize;
    window.EbookApp.applyLineHeight = applyLineHeight;
    window.EbookApp.applyLetterSpacing = applyLetterSpacing;

    // DOM 로드 완료 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();
