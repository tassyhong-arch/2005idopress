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
        let touchStartY = 0;
        let currentX = 0;
        let isDragging = false;
        let startTime = 0;
        let hasMovedEnough = false;

        // 터치 시작
        this.bookContent.addEventListener('touchstart', (e) => {
            if (this.isAnimating) return;
            
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            currentX = touchStartX;
            isDragging = true;
            hasMovedEnough = false;
            startTime = Date.now();
            
            // 처음에는 텍스트 선택 허용 (롱프레스를 위해)
            // 스와이프가 확실해지면 비활성화
        }, { passive: true });

        // 터치 이동 (실시간 드래그)
        this.bookContent.addEventListener('touchmove', (e) => {
            if (!isDragging || this.isAnimating) return;
            
            currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - touchStartX;
            const deltaY = currentY - touchStartY;
            
            // 스와이프 방향 감지 (10px 이상 움직였을 때)
            if (!hasMovedEnough && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
                hasMovedEnough = true;
                
                // 수평 스와이프인 경우에만 텍스트 선택 비활성화
                if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
                    this.bookContent.style.userSelect = 'none';
                    this.bookContent.style.webkitUserSelect = 'none';
                    this.bookContent.style.transition = 'none';
                }
            }
            
            // 수평 스와이프인 경우에만 처리
            if (hasMovedEnough && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
                e.preventDefault();
                
                // 경계 체크 (탄성 효과)
                let moveX = deltaX;
                if ((this.currentPage === 0 && deltaX > 0) || 
                    (this.currentPage >= this.totalPages - 1 && deltaX < 0)) {
                    // 첫/마지막 페이지에서는 이동을 제한 (탄성)
                    moveX = deltaX * 0.3;
                }
                
                // 실시간으로 페이지 이동
                this.bookContent.style.transform = `translateX(${moveX}px)`;
            }
        }, { passive: false });

        // 터치 종료
        this.bookContent.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const deltaTime = Date.now() - startTime;
            const velocity = Math.abs(deltaX) / deltaTime; // px/ms
            
            isDragging = false;
            
            // 텍스트 선택 재활성화 (하이라이트를 위해)
            setTimeout(() => {
                this.bookContent.style.userSelect = 'text';
                this.bookContent.style.webkitUserSelect = 'text';
            }, 100);
            
            // 트랜지션 재활성화
            this.bookContent.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            
            // 수평 스와이프인 경우
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // 빠른 스와이프 (velocity) 또는 충분한 거리 이동
                const threshold = 50;
                const shouldChangePage = Math.abs(deltaX) > threshold || velocity > 0.3;
                
                if (shouldChangePage) {
                    if (deltaX > 0 && this.currentPage > 0) {
                        // 오른쪽으로 스와이프 → 이전 페이지
                        this.prevPage();
                    } else if (deltaX < 0 && this.currentPage < this.totalPages - 1) {
                        // 왼쪽으로 스와이프 → 다음 페이지
                        this.nextPage();
                    } else {
                        // 경계에 도달 - 원위치로 복귀
                        this.bookContent.style.transform = 'translateX(0)';
                    }
                } else {
                    // 이동 거리가 부족 - 원위치로 복귀
                    this.bookContent.style.transform = 'translateX(0)';
                }
            } else {
                // 수직 스와이프 - 원위치로 복귀
                this.bookContent.style.transform = 'translateX(0)';
            }
        }, { passive: true });

        // 터치 취소
        this.bookContent.addEventListener('touchcancel', () => {
            isDragging = false;
            this.bookContent.style.userSelect = 'text';
            this.bookContent.style.webkitUserSelect = 'text';
            this.bookContent.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            this.bookContent.style.transform = 'translateX(0)';
        }, { passive: true });

        // 마우스 드래그 (데스크톱)
        let mouseStartX = 0;
        let mouseIsDragging = false;
        let mouseStartTime = 0;

        this.bookContent.addEventListener('mousedown', (e) => {
            if (this.isAnimating) return;
            
            mouseStartX = e.clientX;
            mouseIsDragging = true;
            mouseStartTime = Date.now();
            this.bookContent.style.userSelect = 'none';
            this.bookContent.style.webkitUserSelect = 'none';
            this.bookContent.style.transition = 'none';
            this.bookContent.style.cursor = 'grabbing';
        });

        this.bookContent.addEventListener('mousemove', (e) => {
            if (!mouseIsDragging || this.isAnimating) return;
            
            const deltaX = e.clientX - mouseStartX;
            
            // 경계 체크
            let moveX = deltaX;
            if ((this.currentPage === 0 && deltaX > 0) || 
                (this.currentPage >= this.totalPages - 1 && deltaX < 0)) {
                moveX = deltaX * 0.3;
            }
            
            this.bookContent.style.transform = `translateX(${moveX}px)`;
        });

        this.bookContent.addEventListener('mouseup', (e) => {
            if (!mouseIsDragging) return;
            
            const deltaX = e.clientX - mouseStartX;
            const deltaTime = Date.now() - mouseStartTime;
            const velocity = Math.abs(deltaX) / deltaTime;
            
            mouseIsDragging = false;
            
            // 텍스트 선택 재활성화
            setTimeout(() => {
                this.bookContent.style.userSelect = 'text';
                this.bookContent.style.webkitUserSelect = 'text';
            }, 100);
            
            this.bookContent.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            this.bookContent.style.cursor = 'grab';
            
            const threshold = 80;
            const shouldChangePage = Math.abs(deltaX) > threshold || velocity > 0.5;
            
            if (shouldChangePage) {
                if (deltaX > 0 && this.currentPage > 0) {
                    this.prevPage();
                } else if (deltaX < 0 && this.currentPage < this.totalPages - 1) {
                    this.nextPage();
                } else {
                    this.bookContent.style.transform = 'translateX(0)';
                }
            } else {
                this.bookContent.style.transform = 'translateX(0)';
            }
        });

        this.bookContent.addEventListener('mouseleave', () => {
            if (mouseIsDragging) {
                mouseIsDragging = false;
                this.bookContent.style.userSelect = 'text';
                this.bookContent.style.webkitUserSelect = 'text';
                this.bookContent.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                this.bookContent.style.cursor = 'grab';
                this.bookContent.style.transform = 'translateX(0)';
            }
        });
    }

    loadContent(text, title = '이북') {
        if (!text || typeof text !== 'string') {
            console.error('Invalid content provided to loadContent');
            if (window.app) {
                window.app.showNotification('도서 내용을 불러올 수 없습니다', 'error');
            }
            return;
        }

        this.content = text;
        this.bookTitle = title;
        
        if (this.bookTitleElement) {
            this.bookTitleElement.textContent = title;
        }

        // Modern UI 헤더 제목 업데이트
        if (window.modernUI) {
            window.modernUI.updateBookTitle(title);
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

        // Modern UI 페이지 슬라이더 업데이트
        if (window.modernUI) {
            window.modernUI.updatePageSlider(this.currentPage, this.totalPages);
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

        // 좌우 슬라이딩 효과 강화
        const distance = direction === 'left' ? '-100%' : '100%';
        
        // 현재 페이지를 왼쪽/오른쪽으로 슬라이드 아웃
        this.bookContent.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
        this.bookContent.style.transform = `translateX(${distance})`;
        this.bookContent.style.opacity = '0.5';

        setTimeout(() => {
            // 새 페이지 내용 로드
            this.displayCurrentPage();
            
            // 반대 방향에서 슬라이드 인
            const oppositeDistance = direction === 'left' ? '100%' : '-100%';
            this.bookContent.style.transition = 'none';
            this.bookContent.style.transform = `translateX(${oppositeDistance})`;
            this.bookContent.style.opacity = '0.5';
            
            requestAnimationFrame(() => {
                this.bookContent.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
                this.bookContent.style.transform = 'translateX(0)';
                this.bookContent.style.opacity = '1';
                
                setTimeout(() => {
                    this.isAnimating = false;
                    // 하이라이트 재적용
                    if (window.highlightManager) {
                        window.highlightManager.applyHighlights();
                    }
                }, 300);
            });
        }, 300);
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
