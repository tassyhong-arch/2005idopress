// 이북 리더 핵심 기능 - 좌우 페이지 넘김 방식
class EbookReader {
    constructor() {
        this.content = '';
        this.pages = [];
        this.currentPage = 0;
        this.totalPages = 0;
        this.bookTitle = '';
        this.isAnimating = false;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.calculatePageDimensions();
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
        // 페이지 네비게이션 버튼
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

        // 키보드 단축키 (←→ 방향키)
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevPage();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
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

        // 터치 제스처 (좌우 스와이프)
        if (this.bookContent) {
            this.setupTouchGestures();
        }
    }

    setupTouchGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;

        this.bookContent.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        this.bookContent.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // 수평 스와이프가 수직 스와이프보다 큰 경우에만 페이지 넘김
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    // 오른쪽으로 스와이프 → 이전 페이지
                    this.prevPage();
                } else {
                    // 왼쪽으로 스와이프 → 다음 페이지
                    this.nextPage();
                }
            }
        }, { passive: true });

        // 마우스 드래그도 지원 (데스크톱)
        let mouseStartX = 0;
        let isDragging = false;

        this.bookContent.addEventListener('mousedown', (e) => {
            mouseStartX = e.clientX;
            isDragging = true;
        });

        this.bookContent.addEventListener('mouseup', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - mouseStartX;
                if (Math.abs(deltaX) > 100) {
                    if (deltaX > 0) {
                        this.prevPage();
                    } else {
                        this.nextPage();
                    }
                }
                isDragging = false;
            }
        });

        this.bookContent.addEventListener('mouseleave', () => {
            isDragging = false;
        });
    }

    loadContent(text, title = '이북') {
        this.content = text;
        this.bookTitle = title;
        
        if (this.bookTitleElement) {
            this.bookTitleElement.textContent = title;
        }

        // 페이지 분할 준비
        setTimeout(() => {
            this.paginateContent();
            this.restoreReadingPosition();
        }, 100);
    }

    calculatePageDimensions() {
        if (!this.bookContent) return;

        const header = document.querySelector('.header');
        const bottomNav = document.querySelector('.bottom-nav');
        const headerHeight = header ? header.offsetHeight : 60;
        const navHeight = bottomNav ? bottomNav.offsetHeight : 50;
        
        this.pageWidth = this.bookContent.offsetWidth;
        this.pageHeight = window.innerHeight - headerHeight - navHeight;
    }

    paginateContent() {
        if (!this.bookContent || !this.content) return;

        // 페이지 크기 계산
        this.calculatePageDimensions();

        // 임시 컨테이너 생성하여 텍스트 측정
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
            position: absolute;
            visibility: hidden;
            width: ${this.pageWidth}px;
            height: ${this.pageHeight}px;
            padding: 24px 16px;
            overflow: hidden;
            font-size: ${window.getComputedStyle(this.bookContent).fontSize};
            line-height: ${window.getComputedStyle(this.bookContent).lineHeight};
            letter-spacing: ${window.getComputedStyle(this.bookContent).letterSpacing};
            font-family: ${window.getComputedStyle(this.bookContent).fontFamily};
        `;
        document.body.appendChild(tempDiv);

        // 단락 분리
        const paragraphs = this.content.split('\n\n').filter(p => p.trim());
        this.pages = [];
        let currentPageContent = '';

        for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i].trim();
            const testContent = currentPageContent + (currentPageContent ? '\n\n' : '') + paragraph;
            
            tempDiv.innerHTML = testContent.split('\n').map(line => `<p>${line}</p>`).join('');
            
            if (tempDiv.scrollHeight > this.pageHeight && currentPageContent) {
                // 현재 페이지 저장
                this.pages.push(currentPageContent);
                currentPageContent = paragraph;
            } else {
                currentPageContent = testContent;
            }
        }

        // 마지막 페이지 추가
        if (currentPageContent) {
            this.pages.push(currentPageContent);
        }

        document.body.removeChild(tempDiv);

        this.totalPages = this.pages.length || 1;
        this.currentPage = 0;

        if (this.totalPagesSpan) {
            this.totalPagesSpan.textContent = this.totalPages;
        }

        this.displayCurrentPage();
    }

    displayCurrentPage() {
        if (!this.bookContent || this.pages.length === 0) return;

        const pageContent = this.pages[this.currentPage] || '';
        const paragraphs = pageContent.split('\n\n').filter(p => p.trim());
        
        this.bookContent.innerHTML = paragraphs
            .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
            .join('');

        // 애니메이션 효과
        if (!this.isAnimating) {
            this.bookContent.style.opacity = '0';
            this.bookContent.style.transform = 'translateX(0)';
            
            requestAnimationFrame(() => {
                this.bookContent.style.transition = 'opacity 0.3s ease';
                this.bookContent.style.opacity = '1';
            });
        }

        this.updatePageDisplay();
    }

    updatePageDisplay() {
        if (this.currentPageSpan) {
            this.currentPageSpan.textContent = this.currentPage + 1;
        }

        this.updateProgress();
        this.updateNavigationButtons();
        this.saveReadingPosition();
    }

    updateProgress() {
        const percentage = this.totalPages > 0 
            ? Math.round(((this.currentPage + 1) / this.totalPages) * 100) 
            : 0;
        
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

    updateNavigationButtons() {
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentPage === 0;
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentPage >= this.totalPages - 1;
        }
    }

    nextPage() {
        if (this.isAnimating || this.currentPage >= this.totalPages - 1) return;
        
        this.isAnimating = true;
        this.currentPage++;
        
        // 슬라이드 애니메이션
        this.animatePageTransition('left');
    }

    prevPage() {
        if (this.isAnimating || this.currentPage <= 0) return;
        
        this.isAnimating = true;
        this.currentPage--;
        
        // 슬라이드 애니메이션
        this.animatePageTransition('right');
    }

    animatePageTransition(direction) {
        if (!this.bookContent) return;

        const distance = direction === 'left' ? '-30px' : '30px';
        
        // 페이드 아웃
        this.bookContent.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        this.bookContent.style.opacity = '0';
        this.bookContent.style.transform = `translateX(${distance})`;

        setTimeout(() => {
            this.displayCurrentPage();
            
            // 페이드 인
            const oppositeDistance = direction === 'left' ? '30px' : '-30px';
            this.bookContent.style.transition = 'none';
            this.bookContent.style.transform = `translateX(${oppositeDistance})`;
            
            requestAnimationFrame(() => {
                this.bookContent.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
                this.bookContent.style.opacity = '1';
                this.bookContent.style.transform = 'translateX(0)';
                
                setTimeout(() => {
                    this.isAnimating = false;
                }, 150);
            });
        }, 150);
    }

    goToPage(pageNumber) {
        if (pageNumber < 0 || pageNumber >= this.totalPages) return;
        
        const direction = pageNumber > this.currentPage ? 'left' : 'right';
        this.currentPage = pageNumber;
        this.animatePageTransition(direction);
    }

    saveReadingPosition() {
        if (!this.bookTitle) return;
        
        const position = {
            page: this.currentPage,
            totalPages: this.totalPages,
            percentage: Math.round(((this.currentPage + 1) / this.totalPages) * 100),
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
                if (position.page >= 0 && position.page < this.totalPages) {
                    this.currentPage = position.page;
                    this.displayCurrentPage();
                    
                    if (window.app) {
                        window.app.showNotification(
                            `이전 읽기 위치로 이동했습니다 (${position.percentage}%)`
                        );
                    }
                }
            } catch (error) {
                console.error('읽기 위치 복원 실패:', error);
            }
        }
    }

    recalculatePages() {
        const savedPage = this.currentPage;
        const savedPercentage = this.totalPages > 0 
            ? (this.currentPage / this.totalPages) 
            : 0;
        
        this.paginateContent();
        
        // 비슷한 위치로 이동
        const newPage = Math.floor(savedPercentage * this.totalPages);
        this.currentPage = Math.max(0, Math.min(newPage, this.totalPages - 1));
        this.displayCurrentPage();
    }

    handleResize() {
        this.debounce(() => {
            this.recalculatePages();
        }, 250)();
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

    // 검색 기능을 위한 헬퍼 메서드
    getFullContent() {
        return this.content;
    }

    getCurrentPageContent() {
        return this.pages[this.currentPage] || '';
    }
}

// 리더 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.reader = new EbookReader();
});
