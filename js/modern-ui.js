// 교보문고 스타일 모던 UI 컨트롤러
class ModernUIController {
    constructor() {
        this.headerVisible = true;
        this.quickSettingsVisible = false;
        this.tapTimeout = null;
        this.lastTapTime = 0;
        this.init();
    }

    init() {
        this.setupTapToToggle();
        this.setupPageSlider();
        this.setupBottomToolbar();
        this.setupQuickSettings();
        console.log('Modern UI Controller initialized');
    }

    // 화면 탭하여 헤더/푸터 표시/숨김
    setupTapToToggle() {
        const contentWrapper = document.querySelector('.content-wrapper');
        const header = document.getElementById('readerHeader');
        const bottomNav = document.getElementById('readerBottomNav');

        if (!contentWrapper || !header || !bottomNav) return;

        contentWrapper.addEventListener('click', (e) => {
            // 링크나 버튼 클릭은 무시
            if (e.target.closest('a') || e.target.closest('button') || e.target.closest('.selection-tooltip')) {
                return;
            }

            // 더블 탭 감지
            const now = Date.now();
            if (now - this.lastTapTime < 300) {
                // 더블 탭: 폰트 크기 리셋
                if (window.app) {
                    window.app.resetFontSize();
                }
                this.lastTapTime = 0;
                return;
            }
            this.lastTapTime = now;

            // 싱글 탭: UI 토글
            this.toggleUI();
        });
    }

    toggleUI() {
        this.headerVisible = !this.headerVisible;
        const header = document.getElementById('readerHeader');
        const bottomNav = document.getElementById('readerBottomNav');

        if (this.headerVisible) {
            header?.classList.remove('hidden');
            bottomNav?.classList.remove('hidden');
        } else {
            header?.classList.add('hidden');
            bottomNav?.classList.add('hidden');
            // 빠른 설정도 숨김
            if (this.quickSettingsVisible) {
                this.hideQuickSettings();
            }
        }
    }

    showUI() {
        this.headerVisible = true;
        document.getElementById('readerHeader')?.classList.remove('hidden');
        document.getElementById('readerBottomNav')?.classList.remove('hidden');
    }

    hideUI() {
        this.headerVisible = false;
        document.getElementById('readerHeader')?.classList.add('hidden');
        document.getElementById('readerBottomNav')?.classList.add('hidden');
    }

    // 페이지 슬라이더
    setupPageSlider() {
        const pageSlider = document.getElementById('pageSlider');
        if (!pageSlider) return;

        let isDragging = false;

        pageSlider.addEventListener('input', (e) => {
            const pageNum = parseInt(e.target.value) - 1; // 0-based index
            if (window.reader) {
                window.reader.goToPage(pageNum);
            }
        });

        // 슬라이더 드래그 중 자동 숨김 방지
        pageSlider.addEventListener('mousedown', () => {
            isDragging = true;
        });

        pageSlider.addEventListener('touchstart', () => {
            isDragging = true;
        });

        pageSlider.addEventListener('mouseup', () => {
            isDragging = false;
        });

        pageSlider.addEventListener('touchend', () => {
            isDragging = false;
        });

        // reader 페이지 변경 시 슬라이더 업데이트
        if (window.reader) {
            const originalGoToPage = window.reader.goToPage;
            window.reader.goToPage = function(pageNumber) {
                originalGoToPage.call(this, pageNumber);
                
                // 슬라이더 업데이트
                if (pageSlider && !isDragging) {
                    pageSlider.value = pageNumber + 1;
                }
            };
        }
    }

    updatePageSlider(currentPage, totalPages) {
        const pageSlider = document.getElementById('pageSlider');
        const currentPageEl = document.getElementById('currentPage');
        const totalPagesEl = document.getElementById('totalPages');
        const progressText = document.getElementById('progressText');

        if (pageSlider) {
            pageSlider.max = totalPages;
            pageSlider.value = currentPage + 1;
        }

        if (currentPageEl) {
            currentPageEl.textContent = currentPage + 1;
        }

        if (totalPagesEl) {
            totalPagesEl.textContent = totalPages;
        }

        if (progressText) {
            const percentage = totalPages > 0 ? Math.round(((currentPage + 1) / totalPages) * 100) : 0;
            progressText.textContent = `${percentage}%`;
        }

        // 헤더 진행바도 업데이트
        const headerProgressFill = document.getElementById('headerProgressFill');
        if (headerProgressFill) {
            const percentage = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;
            headerProgressFill.style.width = `${percentage}%`;
        }
    }

    // 하단 툴바 버튼
    setupBottomToolbar() {
        // TTS 버튼
        const ttsBtn = document.getElementById('bottomTTSBtn');
        ttsBtn?.addEventListener('click', () => {
            document.getElementById('ttsBtn')?.click();
        });

        // 북마크 버튼
        const bookmarkBtn = document.getElementById('bottomBookmarkBtn');
        bookmarkBtn?.addEventListener('click', () => {
            document.getElementById('bookmarkBtn')?.click();
        });

        // 하이라이트 버튼
        const highlightBtn = document.getElementById('bottomHighlightBtn');
        highlightBtn?.addEventListener('click', () => {
            document.getElementById('highlightBtn')?.click();
        });

        // 검색 버튼
        const searchBtn = document.getElementById('bottomSearchBtn');
        searchBtn?.addEventListener('click', () => {
            document.getElementById('searchBtn')?.click();
        });

        // 설정 버튼
        const settingsBtn = document.getElementById('bottomSettingsBtn');
        settingsBtn?.addEventListener('click', () => {
            this.toggleQuickSettings();
        });

        // 뒤로 가기 버튼 - 도서관으로 이동
        const backBtn = document.getElementById('backBtn');
        backBtn?.addEventListener('click', () => {
            window.location.href = 'library.html';
        });

        // 메뉴 버튼 (추후 확장)
        const menuBtn = document.getElementById('menuBtn');
        menuBtn?.addEventListener('click', () => {
            this.toggleQuickSettings();
        });
    }

    // 빠른 설정 패널
    setupQuickSettings() {
        const panel = document.getElementById('quickSettingsPanel');
        if (!panel) return;

        // 폰트 크기 버튼
        const fontDecrease = document.getElementById('qsFontDecrease');
        const fontIncrease = document.getElementById('qsFontIncrease');

        fontDecrease?.addEventListener('click', () => {
            if (window.app) {
                window.app.updateFontSize(-1);
                this.updateFontSizeDisplay();
            }
        });

        fontIncrease?.addEventListener('click', () => {
            if (window.app) {
                window.app.updateFontSize(1);
                this.updateFontSizeDisplay();
            }
        });

        // 테마 버튼
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                if (window.app) {
                    window.app.settings.theme = theme;
                    window.app.saveSettings();
                    window.app.applySettings();
                    
                    // 활성 상태 업데이트
                    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    if (window.app) {
                        window.app.showNotification(`테마 변경: ${theme}`);
                    }
                }
            });
        });

        // 줄 간격 버튼
        document.querySelectorAll('.spacing-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const spacing = btn.dataset.spacing;
                if (window.app) {
                    window.app.settings.lineHeight = spacing;
                    window.app.saveSettings();
                    window.app.applySettings();
                    
                    // 활성 상태 업데이트
                    document.querySelectorAll('.spacing-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    if (window.app) {
                        window.app.showNotification('줄 간격 변경됨');
                    }
                }
            });
        });

        // 도서 관리 버튼
        const bookManagerBtn = document.getElementById('qsBookManager');
        bookManagerBtn?.addEventListener('click', () => {
            this.hideQuickSettings();
            document.getElementById('bookManagerBtn')?.click();
        });

        // 패널 외부 클릭 시 닫기
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                this.hideQuickSettings();
            }
        });
    }

    toggleQuickSettings() {
        if (this.quickSettingsVisible) {
            this.hideQuickSettings();
        } else {
            this.showQuickSettings();
        }
    }

    showQuickSettings() {
        const panel = document.getElementById('quickSettingsPanel');
        if (!panel) return;

        panel.classList.add('show');
        this.quickSettingsVisible = true;
        
        // UI 표시 강제
        this.showUI();
        
        // 현재 설정값으로 업데이트
        this.updateFontSizeDisplay();
        this.updateThemeDisplay();
        this.updateSpacingDisplay();
    }

    hideQuickSettings() {
        const panel = document.getElementById('quickSettingsPanel');
        if (!panel) return;

        panel.classList.remove('show');
        this.quickSettingsVisible = false;
    }

    updateFontSizeDisplay() {
        const fontSizeEl = document.getElementById('qsFontSize');
        if (fontSizeEl && window.app) {
            fontSizeEl.textContent = `${window.app.settings.fontSize}px`;
        }
    }

    updateThemeDisplay() {
        if (!window.app) return;
        
        const currentTheme = window.app.settings.theme;
        document.querySelectorAll('.theme-btn').forEach(btn => {
            if (btn.dataset.theme === currentTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateSpacingDisplay() {
        if (!window.app) return;
        
        const currentSpacing = window.app.settings.lineHeight;
        document.querySelectorAll('.spacing-btn').forEach(btn => {
            if (btn.dataset.spacing === currentSpacing) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateBookTitle(title) {
        const headerTitle = document.getElementById('headerBookTitle');
        if (headerTitle) {
            headerTitle.textContent = title || '이북 리더';
        }
    }
}

// 전역 인스턴스
window.modernUI = null;

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 약간의 지연을 두고 초기화 (다른 모듈 로드 대기)
    setTimeout(() => {
        window.modernUI = new ModernUIController();
        console.log('Modern UI initialized');
    }, 500);
});
