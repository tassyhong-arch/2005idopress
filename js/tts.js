// TTS (Text-to-Speech) 기능 - 교보문고 스타일
class TTSManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentRate = 1.0; // 기본 속도
        this.currentPitch = 1.0;
        this.currentVoice = null;
        this.voices = [];
        this.autoPageTurn = true; // 자동 페이지 넘김
        
        this.init();
    }

    async init() {
        try {
            // 음성 로드 (브라우저마다 시간이 걸릴 수 있음)
            await this.loadVoices();
            
            // 음성 변경 이벤트 리스너
            if (this.synth.onvoiceschanged !== undefined) {
                this.synth.onvoiceschanged = () => this.loadVoices();
            }
            
            console.log('TTS Manager initialized');
        } catch (error) {
            console.error('TTS initialization error:', error);
        }
    }

    async loadVoices() {
        return new Promise((resolve) => {
            this.voices = this.synth.getVoices();
            
            if (this.voices.length > 0) {
                // 한국어 음성 우선 선택
                const koreanVoice = this.voices.find(voice => voice.lang.startsWith('ko'));
                this.currentVoice = koreanVoice || this.voices[0];
                resolve();
            } else {
                // 음성이 로드되지 않았으면 다시 시도
                setTimeout(() => {
                    this.voices = this.synth.getVoices();
                    const koreanVoice = this.voices.find(voice => voice.lang.startsWith('ko'));
                    this.currentVoice = koreanVoice || this.voices[0];
                    resolve();
                }, 100);
            }
        });
    }

    getAvailableVoices() {
        // 언어별로 그룹화
        const grouped = {
            korean: this.voices.filter(v => v.lang.startsWith('ko')),
            english: this.voices.filter(v => v.lang.startsWith('en')),
            other: this.voices.filter(v => !v.lang.startsWith('ko') && !v.lang.startsWith('en'))
        };
        return grouped;
    }

    speak(text, options = {}) {
        if (!text || text.trim() === '') {
            console.warn('No text to speak');
            return;
        }

        // 기존 음성 중지
        this.stop();

        // 새로운 utterance 생성
        this.utterance = new SpeechSynthesisUtterance(text);
        
        // 설정 적용
        this.utterance.rate = options.rate || this.currentRate;
        this.utterance.pitch = options.pitch || this.currentPitch;
        this.utterance.voice = options.voice || this.currentVoice;
        this.utterance.volume = options.volume || 1.0;

        // 이벤트 핸들러
        this.utterance.onstart = () => {
            this.isPlaying = true;
            this.isPaused = false;
            this.onStart && this.onStart();
        };

        this.utterance.onend = () => {
            this.isPlaying = false;
            this.isPaused = false;
            this.onEnd && this.onEnd();
            
            // 자동 페이지 넘김
            if (this.autoPageTurn && window.reader) {
                setTimeout(() => {
                    if (window.reader.currentPage < window.reader.totalPages) {
                        window.reader.nextPage();
                        // 다음 페이지 텍스트 읽기
                        const nextText = this.getCurrentPageText();
                        if (nextText) {
                            this.speak(nextText);
                        }
                    }
                }, 500);
            }
        };

        this.utterance.onerror = (event) => {
            console.error('TTS error:', event);
            this.isPlaying = false;
            this.isPaused = false;
            this.onError && this.onError(event);
        };

        this.utterance.onpause = () => {
            this.isPaused = true;
            this.onPause && this.onPause();
        };

        this.utterance.onresume = () => {
            this.isPaused = false;
            this.onResume && this.onResume();
        };

        // 재생 시작
        this.synth.speak(this.utterance);
    }

    pause() {
        if (this.isPlaying && !this.isPaused) {
            this.synth.pause();
        }
    }

    resume() {
        if (this.isPlaying && this.isPaused) {
            this.synth.resume();
        }
    }

    stop() {
        if (this.isPlaying || this.isPaused) {
            this.synth.cancel();
            this.isPlaying = false;
            this.isPaused = false;
        }
    }

    setRate(rate) {
        this.currentRate = Math.max(0.5, Math.min(2.0, rate));
        if (this.utterance) {
            this.utterance.rate = this.currentRate;
        }
    }

    setPitch(pitch) {
        this.currentPitch = Math.max(0.5, Math.min(2.0, pitch));
        if (this.utterance) {
            this.utterance.pitch = this.currentPitch;
        }
    }

    setVoice(voice) {
        this.currentVoice = voice;
    }

    setAutoPageTurn(enabled) {
        this.autoPageTurn = enabled;
    }

    getCurrentPageText() {
        // reader에서 현재 페이지 텍스트 가져오기
        if (!window.reader) return '';
        
        const contentDiv = document.getElementById('book-content');
        if (!contentDiv) return '';
        
        // 현재 페이지의 텍스트만 추출 (HTML 태그 제거)
        const text = contentDiv.textContent || contentDiv.innerText || '';
        return text.trim();
    }

    readCurrentPage() {
        const text = this.getCurrentPageText();
        if (text) {
            this.speak(text);
        } else {
            console.warn('No text found on current page');
        }
    }

    // 선택된 텍스트만 읽기
    readSelectedText() {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text) {
            this.speak(text);
        } else {
            // 선택된 텍스트가 없으면 현재 페이지 읽기
            this.readCurrentPage();
        }
    }

    getStatus() {
        return {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            rate: this.currentRate,
            pitch: this.currentPitch,
            voice: this.currentVoice ? this.currentVoice.name : 'Default',
            autoPageTurn: this.autoPageTurn
        };
    }
}

// 전역 인스턴스 생성
window.ttsManager = new TTSManager();
