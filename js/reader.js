// 독서 기능 관리
(function() {
    'use strict';

    // DOM 요소
    const elements = {
        fontDecrease: document.getElementById('fontDecrease'),
        fontIncrease: document.getElementById('fontIncrease'),
        fontReset: document.getElementById('fontReset'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        settingsBtn: document.getElementById('settingsBtn'),
        settingsModal: document.getElementById('settingsModal'),
        closeModal: document.getElementById('closeModal'),
        themeSelect: document.getElementById('themeSelect'),
        lineHeightSelect: document.getElementById('lineHeightSelect'),
        letterSpacingSelect: document.getElementById('letterSpacingSelect')
    };

    // 폰트 크기 감소
    function decreaseFontSize() {
        const minSize = 12;
        const currentSize = window.EbookApp.fontSize;
        const newSize = Math.max(minSize, currentSize - 2);
        
        window.EbookApp.applyFontSize(newSize);
        window.EbookApp.showNotification(`폰트 크기: ${newSize}px`, 'info');
    }

    // 폰트 크기 증가
    function increaseFontSize() {
        const maxSize = 32;
        const currentSize = window.EbookApp.fontSize;
        const newSize = Math.min(maxSize, currentSize + 2);
        
        window.EbookApp.applyFontSize(newSize);
        window.EbookApp.showNotification(`폰트 크기: ${newSize}px`, 'info');
    }

    // 폰트 크기 리셋
    function resetFontSize() {
        const defaultSize = 16;
        window.EbookApp.applyFontSize(defaultSize);
        window.EbookApp.showNotification('폰트 크기가 기본값으로 재설정되었습니다.', 'info');
    }

    // 이전 페이지
    function previousPage() {
        if (window.EbookApp.currentPage > 1) {
            window.EbookApp.currentPage--;
            window.EbookApp.updateProgress();
            window.EbookApp.saveSettings();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.EbookApp.showNotification(`페이지 ${window.EbookApp.currentPage}`, 'info');
        } else {
            window.EbookApp.showNotification('첫 페이지입니다.', 'warning');
        }
    }

    // 다음 페이지
    function nextPage() {
        if (window.EbookApp.currentPage < window.EbookApp.totalPages) {
            window.EbookApp.currentPage++;
            window.EbookApp.updateProgress();
            window.EbookApp.saveSettings();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.EbookApp.showNotification(`페이지 ${window.EbookApp.currentPage}`, 'info');
        } else {
            window.EbookApp.showNotification('마지막 페이지입니다.', 'warning');
        }
    }

    // 설정 모달 열기
    function openSettings() {
        if (elements.settingsModal) {
            elements.settingsModal.style.display = 'flex';
            
            // 현재 설정값 반영
            if (elements.themeSelect) {
                elements.themeSelect.value = window.EbookApp.theme;
            }
            if (elements.lineHeightSelect) {
                elements.lineHeightSelect.value = window.EbookApp.lineHeight;
            }
            if (elements.letterSpacingSelect) {
                elements.letterSpacingSelect.value = window.EbookApp.letterSpacing;
            }
        }
    }

    // 설정 모달 닫기
    function closeSettings() {
        if (elements.settingsModal) {
            elements.settingsModal.style.display = 'none';
        }
    }

    // 테마 변경
    function changeTheme(event) {
        const theme = event.target.value;
        window.EbookApp.applyTheme(theme);
        window.EbookApp.showNotification(`테마: ${theme}`, 'info');
    }

    // 줄 간격 변경
    function changeLineHeight(event) {
        const lineHeight = event.target.value;
        window.EbookApp.applyLineHeight(lineHeight);
        window.EbookApp.showNotification(`줄 간격: ${lineHeight}`, 'info');
    }

    // 글자 간격 변경
    function changeLetterSpacing(event) {
        const spacing = event.target.value;
        window.EbookApp.applyLetterSpacing(spacing);
        window.EbookApp.showNotification(`글자 간격: ${spacing}`, 'info');
    }

    // 키보드 단축키
    function handleKeyboard(event) {
        // Ctrl/Cmd + 키 조합
        if (event.ctrlKey || event.metaKey) {
            switch(event.key) {
                case '+':
                case '=':
                    event.preventDefault();
                    increaseFontSize();
                    break;
                case '-':
                    event.preventDefault();
                    decreaseFontSize();
                    break;
                case '0':
                    event.preventDefault();
                    resetFontSize();
                    break;
            }
        } else {
            // 일반 키
            switch(event.key) {
                case 'ArrowLeft':
                    previousPage();
                    break;
                case 'ArrowRight':
                    nextPage();
                    break;
                case 'Escape':
                    closeSettings();
                    break;
            }
        }
    }

    // 이벤트 리스너 등록
    function initEventListeners() {
        // 폰트 크기 조절
        if (elements.fontDecrease) {
            elements.fontDecrease.addEventListener('click', decreaseFontSize);
        }
        if (elements.fontIncrease) {
            elements.fontIncrease.addEventListener('click', increaseFontSize);
        }
        if (elements.fontReset) {
            elements.fontReset.addEventListener('click', resetFontSize);
        }

        // 페이지 네비게이션
        if (elements.prevBtn) {
            elements.prevBtn.addEventListener('click', previousPage);
        }
        if (elements.nextBtn) {
            elements.nextBtn.addEventListener('click', nextPage);
        }

        // 설정 모달
        if (elements.settingsBtn) {
            elements.settingsBtn.addEventListener('click', openSettings);
        }
        if (elements.closeModal) {
            elements.closeModal.addEventListener('click', closeSettings);
        }
        if (elements.settingsModal) {
            elements.settingsModal.addEventListener('click', (e) => {
                if (e.target === elements.settingsModal) {
                    closeSettings();
                }
            });
        }

        // 설정 변경
        if (elements.themeSelect) {
            elements.themeSelect.addEventListener('change', changeTheme);
        }
        if (elements.lineHeightSelect) {
            elements.lineHeightSelect.addEventListener('change', changeLineHeight);
        }
        if (elements.letterSpacingSelect) {
            elements.letterSpacingSelect.addEventListener('change', changeLetterSpacing);
        }

        // 키보드 단축키
        document.addEventListener('keydown', handleKeyboard);

        // 터치 제스처 (모바일)
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // 왼쪽으로 스와이프 (다음 페이지)
                    nextPage();
                } else {
                    // 오른쪽으로 스와이프 (이전 페이지)
                    previousPage();
                }
            }
        }
    }

    // 초기화
    function init() {
        initEventListeners();
        console.log('독서 기능 초기화 완료');
    }

    // DOM 로드 완료 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
