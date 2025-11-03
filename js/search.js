// 검색 기능
class BookSearch {
    constructor() {
        this.searchResults = [];
        this.currentResultIndex = -1;
        this.searchTerm = '';
        this.isSearchVisible = false;
        this.init();
    }

    init() {
        this.createSearchUI();
        this.setupEventListeners();
    }

    createSearchUI() {
        // 검색 오버레이 생성
        const searchOverlay = document.createElement('div');
        searchOverlay.id = 'searchOverlay';
        searchOverlay.className = 'search-overlay';
        searchOverlay.innerHTML = `
            <div class="search-container">
                <div class="search-header">
                    <div class="search-input-group">
                        <i class="fas fa-search"></i>
                        <input 
                            type="text" 
                            id="searchInput" 
                            class="search-input" 
                            placeholder="도서 내 검색..."
                            autocomplete="off"
                        />
                        <button id="clearSearchBtn" class="search-clear-btn" style="display: none;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <button id="closeSearchBtn" class="search-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="search-info">
                    <span id="searchResultCount">검색어를 입력하세요</span>
                </div>

                <div class="search-controls" id="searchControls" style="display: none;">
                    <button id="prevResultBtn" class="search-nav-btn">
                        <i class="fas fa-chevron-up"></i> 이전
                    </button>
                    <span id="currentResultInfo" class="search-current-info">-</span>
                    <button id="nextResultBtn" class="search-nav-btn">
                        다음 <i class="fas fa-chevron-down"></i>
                    </button>
                </div>

                <div id="searchResultsList" class="search-results-list"></div>
            </div>
        `;
        document.body.appendChild(searchOverlay);

        // 검색 버튼을 헤더에 추가
        const controls = document.querySelector('.controls');
        if (controls) {
            const searchBtn = document.createElement('button');
            searchBtn.id = 'searchBtn';
            searchBtn.className = 'control-btn search-btn';
            searchBtn.title = '검색 (Ctrl+F)';
            searchBtn.innerHTML = `
                <i class="fas fa-search"></i>
                <span class="btn-text">검색</span>
            `;
            controls.insertBefore(searchBtn, controls.firstChild);
        }
    }

    setupEventListeners() {
        // 검색 버튼
        const searchBtn = document.getElementById('searchBtn');
        searchBtn?.addEventListener('click', () => this.showSearch());

        // 검색 닫기
        const closeSearchBtn = document.getElementById('closeSearchBtn');
        closeSearchBtn?.addEventListener('click', () => this.hideSearch());

        // 오버레이 클릭 시 닫기
        const searchOverlay = document.getElementById('searchOverlay');
        searchOverlay?.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                this.hideSearch();
            }
        });

        // 검색 입력
        const searchInput = document.getElementById('searchInput');
        searchInput?.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        // 검색 입력 시 Enter 키
        searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.nextResult();
            } else if (e.key === 'Escape') {
                this.hideSearch();
            }
        });

        // 검색어 지우기
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        clearSearchBtn?.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                this.handleSearchInput('');
                searchInput.focus();
            }
        });

        // 이전/다음 결과
        const prevResultBtn = document.getElementById('prevResultBtn');
        const nextResultBtn = document.getElementById('nextResultBtn');
        prevResultBtn?.addEventListener('click', () => this.prevResult());
        nextResultBtn?.addEventListener('click', () => this.nextResult());

        // 키보드 단축키 (Ctrl+F)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.showSearch();
            }
        });
    }

    showSearch() {
        const searchOverlay = document.getElementById('searchOverlay');
        const searchInput = document.getElementById('searchInput');
        
        if (searchOverlay) {
            searchOverlay.style.display = 'flex';
            this.isSearchVisible = true;
            
            setTimeout(() => {
                searchInput?.focus();
            }, 100);
        }
    }

    hideSearch() {
        const searchOverlay = document.getElementById('searchOverlay');
        if (searchOverlay) {
            searchOverlay.style.display = 'none';
            this.isSearchVisible = false;
            this.clearHighlights();
        }
    }

    handleSearchInput(value) {
        const clearBtn = document.getElementById('clearSearchBtn');
        if (clearBtn) {
            clearBtn.style.display = value ? 'block' : 'none';
        }

        if (value.trim().length < 2) {
            this.searchTerm = '';
            this.searchResults = [];
            this.currentResultIndex = -1;
            this.updateSearchUI();
            return;
        }

        this.searchTerm = value.trim();
        this.performSearch();
    }

    performSearch() {
        if (!window.reader || !this.searchTerm) return;

        const content = window.reader.getFullContent();
        const pages = window.reader.pages;
        this.searchResults = [];

        // 정규식 검색 (대소문자 구분 없음)
        const regex = new RegExp(this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        let match;
        let totalMatches = 0;

        // 각 페이지에서 검색
        pages.forEach((pageContent, pageIndex) => {
            const matches = [];
            const pageRegex = new RegExp(regex.source, regex.flags);
            
            while ((match = pageRegex.exec(pageContent)) !== null) {
                // 컨텍스트 추출 (앞뒤 50자)
                const start = Math.max(0, match.index - 50);
                const end = Math.min(pageContent.length, match.index + match[0].length + 50);
                const context = pageContent.substring(start, end);
                const contextStart = start > 0 ? '...' : '';
                const contextEnd = end < pageContent.length ? '...' : '';

                matches.push({
                    page: pageIndex,
                    index: match.index,
                    text: match[0],
                    context: contextStart + context + contextEnd,
                    globalIndex: totalMatches
                });
                totalMatches++;
            }

            if (matches.length > 0) {
                this.searchResults.push(...matches);
            }
        });

        this.currentResultIndex = this.searchResults.length > 0 ? 0 : -1;
        this.updateSearchUI();
        this.displaySearchResults();

        if (this.searchResults.length > 0) {
            this.goToResult(0);
        }
    }

    updateSearchUI() {
        const resultCount = document.getElementById('searchResultCount');
        const controls = document.getElementById('searchControls');
        const currentInfo = document.getElementById('currentResultInfo');

        if (this.searchResults.length > 0) {
            if (resultCount) {
                resultCount.textContent = `${this.searchResults.length}개의 결과 찾음`;
                resultCount.className = 'search-info success';
            }
            if (controls) {
                controls.style.display = 'flex';
            }
            if (currentInfo) {
                currentInfo.textContent = `${this.currentResultIndex + 1} / ${this.searchResults.length}`;
            }
        } else if (this.searchTerm) {
            if (resultCount) {
                resultCount.textContent = '검색 결과 없음';
                resultCount.className = 'search-info error';
            }
            if (controls) {
                controls.style.display = 'none';
            }
        } else {
            if (resultCount) {
                resultCount.textContent = '검색어를 입력하세요';
                resultCount.className = 'search-info';
            }
            if (controls) {
                controls.style.display = 'none';
            }
        }
    }

    displaySearchResults() {
        const resultsList = document.getElementById('searchResultsList');
        if (!resultsList) return;

        if (this.searchResults.length === 0) {
            resultsList.innerHTML = '';
            return;
        }

        resultsList.innerHTML = this.searchResults.map((result, index) => `
            <div class="search-result-item ${index === this.currentResultIndex ? 'active' : ''}" 
                 data-index="${index}">
                <div class="search-result-page">페이지 ${result.page + 1}</div>
                <div class="search-result-context">${this.highlightSearchTerm(result.context)}</div>
            </div>
        `).join('');

        // 결과 항목 클릭 이벤트
        resultsList.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.goToResult(index);
            });
        });

        // 현재 결과로 스크롤
        const activeItem = resultsList.querySelector('.search-result-item.active');
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    highlightSearchTerm(text) {
        if (!this.searchTerm) return text;
        
        const regex = new RegExp(
            `(${this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
            'gi'
        );
        return text.replace(regex, '<mark>$1</mark>');
    }

    goToResult(index) {
        if (index < 0 || index >= this.searchResults.length) return;

        this.currentResultIndex = index;
        const result = this.searchResults[index];

        // 해당 페이지로 이동
        if (window.reader) {
            window.reader.goToPage(result.page);
        }

        this.updateSearchUI();
        this.displaySearchResults();
        this.highlightCurrentResult();
    }

    nextResult() {
        if (this.searchResults.length === 0) return;
        const nextIndex = (this.currentResultIndex + 1) % this.searchResults.length;
        this.goToResult(nextIndex);
    }

    prevResult() {
        if (this.searchResults.length === 0) return;
        const prevIndex = this.currentResultIndex - 1 < 0 
            ? this.searchResults.length - 1 
            : this.currentResultIndex - 1;
        this.goToResult(prevIndex);
    }

    highlightCurrentResult() {
        // 페이지 내용에서 현재 검색 결과 강조
        this.clearHighlights();
        
        if (this.currentResultIndex < 0 || !window.reader) return;
        
        const bookContent = document.getElementById('bookContent');
        if (!bookContent) return;

        const currentResult = this.searchResults[this.currentResultIndex];
        const regex = new RegExp(
            `(${this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
            'gi'
        );

        // 페이지 내용을 HTML로 가져와서 하이라이트 추가
        const walker = document.createTreeWalker(
            bookContent,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            if (regex.test(text)) {
                const span = document.createElement('span');
                span.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
                textNode.parentNode.replaceChild(span, textNode);
            }
        });
    }

    clearHighlights() {
        const bookContent = document.getElementById('bookContent');
        if (!bookContent) return;

        const highlights = bookContent.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
            const text = document.createTextNode(highlight.textContent);
            highlight.parentNode.replaceChild(text, highlight);
        });
    }
}

// 검색 기능 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.bookSearch = new BookSearch();
});
