// 앱 초기화 및 기본 설정
class EbookApp {
    constructor() {
        this.currentBook = null;
        this.settings = this.loadSettings();
        this.initTimeout = null;
        this.init();
    }

    async init() {
        // 다른 모듈이 로드될 때까지 대기
        await this.waitForModules();
        
        this.applySettings();
        this.setupEventListeners();
        this.loadLastBook();
        this.showNotification('앱이 준비되었습니다! 📚');
    }

    async waitForModules() {
        // 필수 모듈이 로드될 때까지 대기 (최대 5초)
        const maxWait = 5000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            if (window.bookStorage && window.reader && window.bookDownloader && window.bookManager) {
                console.log('모든 모듈 로드 완료');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.warn('일부 모듈 로드 대기 시간 초과');
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
        // TTS 모달 및 컨트롤
        this.setupTTSControls();
        
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
            settingsModal.classList.add('show');
        });

        closeModal?.addEventListener('click', () => {
            settingsModal.style.display = 'none';
            settingsModal.classList.remove('show');
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
                settingsModal.classList.remove('show');
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
            
            // 시각적 피드백 개선
            const icon = delta > 0 ? '🔼' : '🔽';
            this.showNotification(`${icon} 폰트 크기: ${newSize}px`, 'info');
            
            // 페이지 재계산
            if (window.reader) {
                window.reader.recalculatePages();
            }
        } else {
            // 한계에 도달했을 때
            const limitMsg = newSize === 12 ? '최소 크기입니다' : '최대 크기입니다';
            this.showNotification(`⚠️ ${limitMsg} (${newSize}px)`, 'warning');
        }
    }

    resetFontSize() {
        this.settings.fontSize = 16;
        this.saveSettings();
        this.applySettings();
        this.showNotification('🔄 폰트 크기가 초기화되었습니다 (16px)', 'success');
        
        if (window.reader) {
            window.reader.recalculatePages();
        }
    }

    setupTTSControls() {
        const ttsBtn = document.getElementById('ttsBtn');
        const ttsModal = document.getElementById('ttsModal');
        const closeTtsModal = document.getElementById('closeTtsModal');
        const ttsPlayBtn = document.getElementById('ttsPlayBtn');
        const ttsPauseBtn = document.getElementById('ttsPauseBtn');
        const ttsStopBtn = document.getElementById('ttsStopBtn');
        const ttsRate = document.getElementById('ttsRate');
        const ttsRateDisplay = document.getElementById('ttsRateDisplay');
        const ttsVoice = document.getElementById('ttsVoice');
        const ttsAutoPageTurn = document.getElementById('ttsAutoPageTurn');
        const ttsStatus = document.getElementById('ttsStatus');

        // TTS 모달 열기
        ttsBtn?.addEventListener('click', () => {
            if (!window.ttsManager) {
                this.showNotification('TTS 기능을 초기화하는 중입니다...', 'info');
                return;
            }
            
            this.populateTTSVoices();
            ttsModal.style.display = 'flex';
            ttsModal.classList.add('show');
        });

        // TTS 모달 닫기
        closeTtsModal?.addEventListener('click', () => {
            ttsModal.style.display = 'none';
            ttsModal.classList.remove('show');
        });

        ttsModal?.addEventListener('click', (e) => {
            if (e.target === ttsModal) {
                ttsModal.style.display = 'none';
                ttsModal.classList.remove('show');
            }
        });

        // TTS 재생 버튼
        ttsPlayBtn?.addEventListener('click', () => {
            if (!window.ttsManager) return;
            
            if (window.ttsManager.isPaused) {
                window.ttsManager.resume();
            } else {
                window.ttsManager.readCurrentPage();
            }
            
            ttsPlayBtn.style.display = 'none';
            ttsPauseBtn.style.display = 'inline-flex';
            if (ttsStatus) ttsStatus.textContent = '재생 중...';
        });

        // TTS 일시정지 버튼
        ttsPauseBtn?.addEventListener('click', () => {
            if (!window.ttsManager) return;
            
            window.ttsManager.pause();
            ttsPauseBtn.style.display = 'none';
            ttsPlayBtn.style.display = 'inline-flex';
            if (ttsStatus) ttsStatus.textContent = '일시정지';
        });

        // TTS 정지 버튼
        ttsStopBtn?.addEventListener('click', () => {
            if (!window.ttsManager) return;
            
            window.ttsManager.stop();
            ttsPauseBtn.style.display = 'none';
            ttsPlayBtn.style.display = 'inline-flex';
            if (ttsStatus) ttsStatus.textContent = '정지됨';
        });

        // TTS 속도 조절
        ttsRate?.addEventListener('input', (e) => {
            if (!window.ttsManager) return;
            
            const rate = parseFloat(e.target.value);
            window.ttsManager.setRate(rate);
            if (ttsRateDisplay) {
                ttsRateDisplay.textContent = `${rate.toFixed(1)}x`;
            }
        });

        // TTS 음성 선택
        ttsVoice?.addEventListener('change', (e) => {
            if (!window.ttsManager) return;
            
            const selectedVoice = window.ttsManager.voices.find(v => v.name === e.target.value);
            if (selectedVoice) {
                window.ttsManager.setVoice(selectedVoice);
                this.showNotification(`음성이 변경되었습니다: ${selectedVoice.name}`);
            }
        });

        // TTS 자동 페이지 넘김
        ttsAutoPageTurn?.addEventListener('change', (e) => {
            if (!window.ttsManager) return;
            
            window.ttsManager.setAutoPageTurn(e.target.checked);
            const message = e.target.checked ? '자동 페이지 넘김 활성화' : '자동 페이지 넘김 비활성화';
            this.showNotification(message);
        });

        // TTS 이벤트 핸들러
        if (window.ttsManager) {
            window.ttsManager.onStart = () => {
                if (ttsStatus) ttsStatus.textContent = '재생 중...';
            };

            window.ttsManager.onEnd = () => {
                if (ttsStatus) ttsStatus.textContent = '재생 완료';
                if (ttsPauseBtn) ttsPauseBtn.style.display = 'none';
                if (ttsPlayBtn) ttsPlayBtn.style.display = 'inline-flex';
            };

            window.ttsManager.onError = (error) => {
                if (ttsStatus) ttsStatus.textContent = '오류 발생';
                this.showNotification('음성 재생 오류가 발생했습니다', 'error');
            };
        }
    }

    populateTTSVoices() {
        if (!window.ttsManager) return;
        
        const ttsVoice = document.getElementById('ttsVoice');
        if (!ttsVoice) return;
        
        const grouped = window.ttsManager.getAvailableVoices();
        ttsVoice.innerHTML = '';
        
        // 한국어 음성
        if (grouped.korean.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = '한국어';
            grouped.korean.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                if (voice === window.ttsManager.currentVoice) {
                    option.selected = true;
                }
                optgroup.appendChild(option);
            });
            ttsVoice.appendChild(optgroup);
        }
        
        // 영어 음성
        if (grouped.english.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = '영어';
            grouped.english.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                if (voice === window.ttsManager.currentVoice) {
                    option.selected = true;
                }
                optgroup.appendChild(option);
            });
            ttsVoice.appendChild(optgroup);
        }
        
        // 기타 음성
        if (grouped.other.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = '기타';
            grouped.other.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                if (voice === window.ttsManager.currentVoice) {
                    option.selected = true;
                }
                optgroup.appendChild(option);
            });
            ttsVoice.appendChild(optgroup);
        }
    }

    async testGoogleDocs(docUrl) {
        if (!window.bookDownloader) {
            console.error('BookDownloader가 초기화되지 않았습니다');
            return;
        }
        
        console.log('Google Docs 테스트 시작:', docUrl);
        const title = 'Google Docs 테스트 도서';
        
        try {
            await window.bookDownloader.downloadFromUrl(docUrl, title);
            this.showNotification('Google Docs 다운로드 성공! 📚');
        } catch (error) {
            console.error('테스트 실패:', error);
            this.showNotification('테스트 실패: ' + error.message, 'error');
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

// 전역 에러 핸들러
window.addEventListener('error', (event) => {
    console.error('전역 에러:', event.error);
    if (window.app) {
        window.app.showNotification('예기치 않은 오류가 발생했습니다', 'error');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('처리되지 않은 Promise 거부:', event.reason);
    if (window.app) {
        window.app.showNotification('작업을 완료할 수 없습니다', 'error');
    }
    event.preventDefault();
});

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EbookApp();
});
