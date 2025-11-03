// 이북 리더 핵심 기능
class EbookReader {
    constructor() {
        this.content = '';
        this.currentPage = 1;
        this.totalPages = 1;
        this.pageHeight = 0;
        this.bookTitle = '';
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.calculatePageHeight();
        window.addEventListener('resize', this.debounce(() => this.handleResize(), 250));
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });
    }

    setupElements() {
        this.bookContent = document.getElementById('bookContent');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.currentPageSpan = document.getElementById('currentPage');
        this.totalPagesSpan = document.getElementById('totalPages');
        this.progressText = document.getElementById('progressText');
        this.progressFill = document.getElementById('progressFill');
        this.bookTitleElement = document.querySelector('.book-title');
    }

    setupEventListeners() {
        // 페이지 네비게이션
        this.prevBtn?.addEventListener('click', () => this.prevPage());
        this.nextBtn?.addEventListener('click', () => this.nextPage());

        // 폰트 조절 버튼
        document.getElementById('fontDecrease')?.addEventListener('click', () => {
            if (window.app) window.app.updateFontSize(-1);
        });

        document.getElementById('fontIncrease')?.addEventListener('click', () => {
            if (window.app) window.app.updateFontSize(1);
        });

        document.getElementById('fontReset')?.addEventListener('click', () => {
            if (window.app) window.app.resetFontSize();
        });

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch(e.key) {
                case 'ArrowLeft':
                    this.prevPage();
                    break;
                case 'ArrowRight':
                    this.nextPage();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    if (window.app) window.app.updateFontSize(1);
                    break;
                case '-':
                case '_':
                    e.preventDefault();
                    if (window.app) window.app.updateFontSize(-1);
                    break;
                case '0':
                    e.preventDefault();
                    if (window.app) window.app.resetFontSize();
                    break;
            }
        });

        // 스크롤 진행률
        if (this.bookContent) {
            this.bookContent.addEventListener('scroll', () => this.updateProgress());
        }
    }

    loadContent(text, title = '이북') {
        this.content = text;
        this.bookTitle = title;
        
        if (this.bookContent) {
            // 텍스트를 단락으로 분리
            const paragraphs = text.split('\n\n').filter(p => p.trim());
            this.bookContent.innerHTML = paragraphs
                .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
                .join('');
        }

        if (this.bookTitleElement) {
            this.bookTitleElement.textContent = title;
        }

        // 페이지 계산
        setTimeout(() => {
            this.calculatePages();
            this.restoreReadingPosition();
        }, 100);
    }

    calculatePageHeight() {
        const header = document.querySelector('.header');
        const bottomNav = document.querySelector('.bottom-nav');
        const headerHeight = header ? header.offsetHeight : 60;
        const navHeight = bottomNav ? bottomNav.offsetHeight : 50;
        this.pageHeight = window.innerHeight - headerHeight - navHeight - 40; // 40px for padding
    }

    calculatePages() {
        if (!this.bookContent) return;

        this.calculatePageHeight();
        const contentHeight = this.bookContent.scrollHeight;
        this.totalPages = Math.ceil(contentHeight / this.pageHeight) || 1;
        
        if (this.totalPagesSpan) {
            this.totalPagesSpan.textContent = this.totalPages;
        }

        this.updatePageDisplay();
    }

    recalculatePages() {
        const scrollPercentage = this.getScrollPercentage();
        this.calculatePages();
        this.setScrollPercentage(scrollPercentage);
    }

    getScrollPercentage() {
        if (!this.bookContent) return 0;
        const { scrollTop, scrollHeight, clientHeight } = this.bookContent;
        return scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0;
    }

    setScrollPercentage(percentage) {
        if (!this.bookContent) return;
        const { scrollHeight, clientHeight } = this.bookContent;
        const maxScroll = scrollHeight - clientHeight;
        this.bookContent.scrollTop = (maxScroll * percentage) / 100;
    }

    updatePageDisplay() {
        if (!this.bookContent) return;

        const scrollTop = this.bookContent.scrollTop;
        this.currentPage = Math.floor(scrollTop / this.pageHeight) + 1;
        
        if (this.currentPageSpan) {
            this.currentPageSpan.textContent = this.currentPage;
        }

        this.updateProgress();
        this.saveReadingPosition();
    }

    updateProgress() {
        const percentage = Math.round(this.getScrollPercentage());
        
        if (this.progressText) {
            this.progressText.textContent = `${percentage}%`;
        }
        
        if (this.progressFill) {
            this.progressFill.style.width = `${percentage}%`;
        }

        // 스크롤 진행 바
        const scrollProgress = document.getElementById('scrollProgress');
        if (scrollProgress) {
            scrollProgress.style.width = `${percentage}%`;
        }
    }

    nextPage() {
        if (!this.bookContent || this.currentPage >= this.totalPages) return;
        
        const newScrollTop = this.currentPage * this.pageHeight;
        this.smoothScrollTo(newScrollTop);
    }

    prevPage() {
        if (!this.bookContent || this.currentPage <= 1) return;
        
        const newScrollTop = (this.currentPage - 2) * this.pageHeight;
        this.smoothScrollTo(Math.max(0, newScrollTop));
    }

    smoothScrollTo(targetScroll) {
        if (!this.bookContent) return;
        
        this.bookContent.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
    }

    saveReadingPosition() {
        if (!this.bookTitle) return;
        
        const position = {
            page: this.currentPage,
            scrollPercentage: this.getScrollPercentage(),
            timestamp: Date.now()
        };
        
        localStorage.setItem(`reading-position-${this.bookTitle}`, JSON.stringify(position));
    }

    restoreReadingPosition() {
        if (!this.bookTitle) return;
        
        const saved = localStorage.getItem(`reading-position-${this.bookTitle}`);
        if (saved) {
            try {
                const position = JSON.parse(saved);
                this.setScrollPercentage(position.scrollPercentage);
                
                if (window.app) {
                    window.app.showNotification(`이전 읽기 위치로 이동했습니다 (${Math.round(position.scrollPercentage)}%)`);
                }
            } catch (error) {
                console.error('읽기 위치 복원 실패:', error);
            }
        }
    }

    handleResize() {
        this.recalculatePages();
    }

    debounce(func, wait) {
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
}

// 리더 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.reader = new EbookReader();
});
