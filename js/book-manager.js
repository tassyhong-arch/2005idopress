// 도서 관리 UI
class BookManager {
    constructor() {
        this.currentBooks = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 도서 관리 모달
        const bookManagerBtn = document.getElementById('bookManagerBtn');
        const closeBookModal = document.getElementById('closeBookModal');
        const bookModal = document.getElementById('bookModal');

        bookManagerBtn?.addEventListener('click', async () => {
            bookModal.style.display = 'flex';
            await this.refreshBookList();
        });

        closeBookModal?.addEventListener('click', () => {
            bookModal.style.display = 'none';
        });

        // 모달 외부 클릭 시 닫기
        bookModal?.addEventListener('click', (e) => {
            if (e.target === bookModal) {
                bookModal.style.display = 'none';
            }
        });

        // 도서 다운로드 버튼
        const downloadBookBtn = document.getElementById('downloadBookBtn');
        downloadBookBtn?.addEventListener('click', () => {
            if (window.bookDownloader) {
                window.bookDownloader.promptDownloadUrl();
            }
        });

        // 텍스트 추가 버튼
        const addTextBookBtn = document.getElementById('addTextBookBtn');
        addTextBookBtn?.addEventListener('click', () => {
            if (window.bookDownloader) {
                window.bookDownloader.promptAddText();
            }
        });

        // 샘플 도서 로드 버튼
        const loadSampleBtn = document.getElementById('loadSampleBtn');
        loadSampleBtn?.addEventListener('click', async () => {
            await this.loadSampleBook();
        });

        // 저장소 통계 버튼
        const storageStatsBtn = document.getElementById('storageStatsBtn');
        storageStatsBtn?.addEventListener('click', () => {
            this.showStorageStats();
        });
    }

    async refreshBookList() {
        const bookListDiv = document.getElementById('bookList');
        if (!bookListDiv || !window.bookStorage) return;

        try {
            this.currentBooks = await window.bookStorage.getAllBooks();

            if (this.currentBooks.length === 0) {
                bookListDiv.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book"></i>
                        <p>저장된 도서가 없습니다.</p>
                        <small>온라인 상태에서 도서를 다운로드하세요.</small>
                    </div>
                `;
                return;
            }

            // 최근 읽은 순으로 정렬
            this.currentBooks.sort((a, b) => {
                const aTime = a.metadata?.lastRead || a.metadata?.addedAt || 0;
                const bTime = b.metadata?.lastRead || b.metadata?.addedAt || 0;
                return bTime - aTime;
            });

            bookListDiv.innerHTML = this.currentBooks.map(book => this.createBookCard(book)).join('');

            // 도서 카드 이벤트 리스너 추가
            this.setupBookCardListeners();

        } catch (error) {
            console.error('도서 목록 새로고침 실패:', error);
            bookListDiv.innerHTML = `
                <div class="empty-state error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>도서 목록을 불러올 수 없습니다.</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }

    createBookCard(book) {
        const { id, title, metadata } = book;
        const size = metadata?.size ? this.formatBytes(metadata.size) : '알 수 없음';
        const addedAt = metadata?.addedAt ? new Date(metadata.addedAt).toLocaleDateString() : '알 수 없음';
        const lastRead = metadata?.lastRead ? new Date(metadata.lastRead).toLocaleDateString() : '읽지 않음';
        const progress = this.getBookProgress(title);

        return `
            <div class="book-card" data-book-id="${id}">
                <div class="book-card-header">
                    <h3 class="book-card-title">${this.escapeHtml(title)}</h3>
                    <button class="book-delete-btn" data-book-id="${id}" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="book-card-body">
                    <div class="book-info">
                        <span><i class="fas fa-file-alt"></i> ${size}</span>
                        <span><i class="fas fa-calendar-plus"></i> ${addedAt}</span>
                    </div>
                    <div class="book-info">
                        <span><i class="fas fa-book-reader"></i> ${lastRead}</span>
                        ${progress > 0 ? `<span><i class="fas fa-chart-line"></i> ${progress}%</span>` : ''}
                    </div>
                </div>
                <button class="book-open-btn" data-book-id="${id}">
                    <i class="fas fa-book-open"></i> 읽기
                </button>
            </div>
        `;
    }

    setupBookCardListeners() {
        // 읽기 버튼
        document.querySelectorAll('.book-open-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const bookId = parseInt(e.currentTarget.dataset.bookId);
                await this.openBook(bookId);
            });
        });

        // 삭제 버튼
        document.querySelectorAll('.book-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const bookId = parseInt(e.currentTarget.dataset.bookId);
                await this.deleteBook(bookId);
            });
        });
    }

    async openBook(bookId) {
        try {
            if (window.bookStorage) {
                await window.bookStorage.loadBook(bookId);
                
                // 모달 닫기
                const bookModal = document.getElementById('bookModal');
                if (bookModal) {
                    bookModal.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('도서 열기 실패:', error);
            if (window.app) {
                window.app.showNotification('도서를 열 수 없습니다', 'error');
            }
        }
    }

    async deleteBook(bookId) {
        const book = this.currentBooks.find(b => b.id === bookId);
        if (!book) return;

        const confirmed = confirm(`"${book.title}" 도서를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`);
        if (!confirmed) return;

        try {
            if (window.bookStorage) {
                await window.bookStorage.deleteBook(bookId);
                await this.refreshBookList();
            }
        } catch (error) {
            console.error('도서 삭제 실패:', error);
            if (window.app) {
                window.app.showNotification('도서를 삭제할 수 없습니다', 'error');
            }
        }
    }

    getBookProgress(title) {
        const saved = localStorage.getItem(`reading-position-${title}`);
        if (saved) {
            try {
                const position = JSON.parse(saved);
                return Math.round(position.scrollPercentage || 0);
            } catch (error) {
                return 0;
            }
        }
        return 0;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async loadSampleBook() {
        try {
            if (window.app) {
                window.app.showNotification('샘플 도서 로드 중... 📚');
            }

            // jusaengjeon.txt 파일 로드
            const response = await fetch('./jusaengjeon.txt');
            if (!response.ok) {
                throw new Error('샘플 파일을 찾을 수 없습니다');
            }

            const content = await response.text();
            
            if (!content || content.trim().length === 0) {
                throw new Error('샘플 파일이 비어있습니다');
            }

            // 도서 저장
            if (window.bookStorage) {
                await window.bookStorage.saveBook('주생전 (周生傳)', content, {
                    source: 'sample',
                    author: '작자 미상',
                    description: 'Google Docs 샘플 도서 - 한국 고전소설',
                    addedAt: Date.now()
                });

                // 목록 새로고침
                await this.refreshBookList();

                if (window.app) {
                    window.app.showNotification('✅ "주생전" 샘플 도서가 추가되었습니다! 📚');
                }
            }
        } catch (error) {
            console.error('샘플 도서 로드 실패:', error);
            if (window.app) {
                window.app.showNotification(`샘플 로드 실패: ${error.message}`, 'error');
            }
        }
    }

    async showStorageStats() {
        if (!window.bookStorage) return;

        try {
            const books = await window.bookStorage.getAllBooks();
            const usedBytes = await window.bookStorage.getUsedStorage();
            const usedMB = (usedBytes / (1024 * 1024)).toFixed(2);
            const maxMB = (window.bookStorage.maxStorageSize / (1024 * 1024)).toFixed(0);
            const percentage = ((usedBytes / window.bookStorage.maxStorageSize) * 100).toFixed(1);

            const stats = `
📊 저장소 통계

📚 저장된 도서: ${books.length}권
💾 사용 중: ${usedMB}MB / ${maxMB}MB (${percentage}%)
📦 남은 공간: ${(maxMB - usedMB).toFixed(2)}MB

${books.length > 0 ? '\n📖 도서 목록:\n' + books.map(b => 
    `• ${b.title} (${this.formatBytes(b.metadata?.size || 0)})`
).join('\n') : ''}
            `.trim();

            alert(stats);
        } catch (error) {
            console.error('저장소 통계 조회 실패:', error);
            if (window.app) {
                window.app.showNotification('통계를 불러올 수 없습니다', 'error');
            }
        }
    }
}

// 도서 관리자 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.bookManager = new BookManager();
});
