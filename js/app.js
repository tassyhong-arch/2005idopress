// 앱 초기화 및 기본 설정
class EbookApp {
    constructor() {
        this.currentBook = null;
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.applySettings();
        this.setupEventListeners();
        this.loadLastBook();
        this.showNotification('앱이 준비되었습니다! 📚');
    }

    loadSettings() {
        const defaultSettings = {
            theme: 'light',
            fontSize: 16,
            lineHeight: 1.5,
            letterSpacing: 'normal'
        };
        
        const saved = localStorage.getItem('ebook-settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('ebook-settings', JSON.stringify(this.settings));
    }

    applySettings() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        const bookContent = document.getElementById('bookContent');
        if (bookContent) {
            bookContent.style.fontSize = `${this.settings.fontSize}px`;
            bookContent.style.lineHeight = this.settings.lineHeight;
            bookContent.style.letterSpacing = this.settings.letterSpacing;
        }
    }

    setupEventListeners() {
        // 도움말 버튼
        const helpBtn = document.getElementById('helpBtn');
        helpBtn?.addEventListener('click', () => {
            this.showHelp();
        });

        // 설정 모달
        const settingsBtn = document.getElementById('settingsBtn');
        const closeModal = document.getElementById('closeModal');
        const settingsModal = document.getElementById('settingsModal');

        settingsBtn?.addEventListener('click', () => {
            settingsModal.style.display = 'flex';
        });

        closeModal?.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });

        // 설정 변경
        const themeSelect = document.getElementById('themeSelect');
        const lineHeightSelect = document.getElementById('lineHeightSelect');
        const letterSpacingSelect = document.getElementById('letterSpacingSelect');

        if (themeSelect) {
            themeSelect.value = this.settings.theme;
            themeSelect.addEventListener('change', (e) => {
                this.settings.theme = e.target.value;
                this.saveSettings();
                this.applySettings();
                this.showNotification(`테마가 변경되었습니다: ${e.target.value}`);
            });
        }

        if (lineHeightSelect) {
            lineHeightSelect.value = this.settings.lineHeight;
            lineHeightSelect.addEventListener('change', (e) => {
                this.settings.lineHeight = e.target.value;
                this.saveSettings();
                this.applySettings();
                this.showNotification('줄 간격이 변경되었습니다');
            });
        }

        if (letterSpacingSelect) {
            letterSpacingSelect.value = this.settings.letterSpacing;
            letterSpacingSelect.addEventListener('change', (e) => {
                this.settings.letterSpacing = e.target.value;
                this.saveSettings();
                this.applySettings();
                this.showNotification('글자 간격이 변경되었습니다');
            });
        }

        // 모달 외부 클릭 시 닫기
        settingsModal?.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });
    }

    loadLastBook() {
        const lastBookId = localStorage.getItem('last-book-id');
        if (lastBookId) {
            // 마지막으로 읽던 책 로드
            if (window.bookStorage) {
                window.bookStorage.loadBook(lastBookId);
            }
        } else {
            // 기본 콘텐츠 로드
            this.loadDefaultContent();
        }
    }

    loadDefaultContent() {
        fetch('content.txt')
            .then(response => response.text())
            .then(text => {
                if (window.reader) {
                    window.reader.loadContent(text, '기본 도서');
                }
            })
            .catch(error => {
                console.error('콘텐츠 로드 실패:', error);
                this.showNotification('콘텐츠를 불러올 수 없습니다', 'error');
            });
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        if (notification && notificationText) {
            notificationText.textContent = message;
            notification.className = `notification ${type} show`;
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    }

    updateFontSize(delta) {
        const newSize = Math.max(12, Math.min(24, this.settings.fontSize + delta));
        if (newSize !== this.settings.fontSize) {
            this.settings.fontSize = newSize;
            this.saveSettings();
            this.applySettings();
            this.showNotification(`폰트 크기: ${newSize}px`);
            
            // 페이지 재계산
            if (window.reader) {
                window.reader.recalculatePages();
            }
        }
    }

    resetFontSize() {
        this.settings.fontSize = 16;
        this.saveSettings();
        this.applySettings();
        this.showNotification('폰트 크기가 초기화되었습니다');
        
        if (window.reader) {
            window.reader.recalculatePages();
        }
    }

    showHelp() {
        const helpText = `
📚 이북 리더 사용 방법

🎯 도서 목록 보기:
→ 우측 상단 "📚 도서" 버튼 클릭

➕ 도서 추가하기:
1. "도서" 버튼 클릭
2. "도서 다운로드" 또는 "텍스트 추가" 선택
3. URL 입력 또는 텍스트 붙여넣기

📖 도서 읽기:
1. "도서" 버튼으로 목록 열기
2. 읽고 싶은 도서 선택
3. "읽기" 버튼 클릭

🎨 폰트 조절:
• A⁻ : 축소
• A⁺ : 확대
• ⟲ : 초기화

🎨 테마 변경:
→ "설정" 버튼 → "테마" 선택

📱 페이지 이동:
• ◀▶ 버튼 또는 ←→ 키
• 모바일: 좌우 스와이프

💡 팁:
• 모든 도서는 오프라인에서도 읽을 수 있습니다
• 읽기 위치가 자동으로 저장됩니다
• 최대 100MB까지 저장 가능합니다

자세한 가이드: guide.html 참고
        `.trim();

        alert(helpText);
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EbookApp();
});
