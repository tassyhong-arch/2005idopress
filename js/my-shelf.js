// 내 책장 페이지 컨트롤러
class MyShelfController {
    constructor() {
        this.books = [];
        this.currentSort = 'recent';
        this.init();
    }

    async init() {
        // 로그인 확인
        if (!window.authManager.isLoggedIn()) {
            alert('로그인이 필요합니다');
            window.location.href = 'library.html';
            return;
        }

        this.updateUserInfo();
        await this.loadBooks();
        this.setupEventListeners();
        this.updateStats();
        this.renderBooks();
    }

    updateUserInfo() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        if (userName) {
            userName.textContent = user.displayName;
        }

        if (userAvatar) {
            userAvatar.style.backgroundColor = user.avatar;
            userAvatar.textContent = user.username.charAt(0).toUpperCase();
        }
    }

    async loadBooks() {
        try {
            if (window.bookStorage) {
                await window.bookStorage.init();
                this.books = await window.bookStorage.getAllBooks();
                console.log(`${this.books.length}권의 도서 로드됨`);
            }
        } catch (error) {
            console.error('도서 로드 실패:', error);
            this.books = [];
        }
    }

    setupEventListeners() {
        // 정렬 버튼
        const sortBtn = document.getElementById('sortBtn');
        sortBtn?.addEventListener('click', (e) => {
            this.toggleSortMenu(e);
        });

        // 정렬 메뉴 항목
        const sortMenu = document.getElementById('sortMenu');
        sortMenu?.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sortType = btn.dataset.sort;
                this.sortBooks(sortType);
                this.hideSortMenu();
            });
        });

        // 메뉴 외부 클릭 시 닫기
        document.addEventListener('click', (e) => {
            const sortMenu = document.getElementById('sortMenu');
            const sortBtn = document.getElementById('sortBtn');
            if (sortMenu && !sortMenu.contains(e.target) && e.target !== sortBtn && !sortBtn?.contains(e.target)) {
                this.hideSortMenu();
            }
        });

        // 보기 변경 버튼 (TODO: 리스트/그리드 뷰 전환)
        const viewBtn = document.getElementById('viewBtn');
        viewBtn?.addEventListener('click', () => {
            alert('보기 변경 기능은 곧 추가됩니다');
        });
    }

    toggleSortMenu(event) {
        const sortMenu = document.getElementById('sortMenu');
        if (!sortMenu) return;

        const isVisible = sortMenu.style.display === 'block';
        
        if (isVisible) {
            this.hideSortMenu();
        } else {
            const rect = event.target.getBoundingClientRect();
            sortMenu.style.display = 'block';
            sortMenu.style.top = `${rect.bottom + 8}px`;
            sortMenu.style.left = `${rect.left}px`;
        }
    }

    hideSortMenu() {
        const sortMenu = document.getElementById('sortMenu');
        if (sortMenu) {
            sortMenu.style.display = 'none';
        }
    }

    sortBooks(sortType) {
        this.currentSort = sortType;

        switch (sortType) {
            case 'recent':
                this.books.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
                break;
            case 'title':
                this.books.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'progress':
                this.books.sort((a, b) => (b.progress || 0) - (a.progress || 0));
                break;
            case 'size':
                this.books.sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0));
                break;
        }

        this.renderBooks();
    }

    updateStats() {
        const totalBooks = this.books.length;
        const readingBooks = this.books.filter(b => b.progress > 0 && b.progress < 100).length;
        const completedBooks = this.books.filter(b => b.progress >= 100).length;
        
        // 스토리지 사용량 계산
        let totalSize = 0;
        this.books.forEach(book => {
            if (book.content) {
                totalSize += new Blob([book.content]).size;
            }
        });
        const storageMB = (totalSize / (1024 * 1024)).toFixed(1);

        // UI 업데이트
        const totalBooksEl = document.getElementById('totalBooks');
        const readingBooksEl = document.getElementById('readingBooks');
        const completedBooksEl = document.getElementById('completedBooks');
        const storageUsedEl = document.getElementById('storageUsed');

        if (totalBooksEl) totalBooksEl.textContent = totalBooks;
        if (readingBooksEl) readingBooksEl.textContent = readingBooks;
        if (completedBooksEl) completedBooksEl.textContent = completedBooks;
        if (storageUsedEl) storageUsedEl.textContent = `${storageMB}MB`;
    }

    renderBooks() {
        const emptyState = document.getElementById('emptyState');
        const myBooksList = document.getElementById('myBooksList');
        const bookCount = document.getElementById('bookCount');

        if (!myBooksList) return;

        if (this.books.length === 0) {
            emptyState.style.display = 'block';
            myBooksList.style.display = 'none';
            if (bookCount) bookCount.textContent = '0권의 도서';
            return;
        }

        emptyState.style.display = 'none';
        myBooksList.style.display = 'grid';
        if (bookCount) bookCount.textContent = `${this.books.length}권의 도서`;

        myBooksList.innerHTML = this.books.map(book => this.createBookCard(book)).join('');

        // 이벤트 리스너 추가
        myBooksList.querySelectorAll('.read-now-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const bookId = btn.dataset.bookId;
                await this.readBook(bookId);
            });
        });

        myBooksList.querySelectorAll('.delete-book-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const bookId = btn.dataset.bookId;
                await this.deleteBook(bookId);
            });
        });
    }

    createBookCard(book) {
        const progress = book.progress || 0;
        const coverColor = this.generateCoverColor(book.title);
        const fileSize = book.content ? (new Blob([book.content]).size / 1024).toFixed(1) : 0;

        return `
            <div class="featured-book-card">
                <div class="book-cover-placeholder" style="background: linear-gradient(135deg, ${coverColor}, ${this.adjustColor(coverColor, -20)});">
                    <i class="fas fa-book"></i>
                    ${progress > 0 ? `
                        <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(255,255,255,0.3);">
                            <div style="height: 100%; width: ${progress}%; background: white;"></div>
                        </div>
                    ` : ''}
                </div>
                <div class="book-info">
                    <h3>${this.escapeHtml(book.title)}</h3>
                    <p class="book-author">${book.author || '작자 미상'}</p>
                    <p class="book-desc">
                        ${progress > 0 ? `📖 ${progress}% 읽음 · ` : ''}
                        📄 ${fileSize}KB
                    </p>
                    <div style="display: flex; gap: 8px;">
                        <button class="read-now-btn" data-book-id="${book.id}" style="flex: 1;">
                            <i class="fas fa-book-open"></i> 읽기
                        </button>
                        <button class="delete-book-btn" data-book-id="${book.id}" style="width: 44px; padding: 12px; background: #e53e3e;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async readBook(bookId) {
        try {
            const book = this.books.find(b => b.id === bookId);
            if (!book) return;

            // 현재 책 ID를 localStorage에 저장
            localStorage.setItem('last-book-id', bookId);
            
            // 리더 페이지로 이동
            window.location.href = 'index.html';
        } catch (error) {
            console.error('도서 열기 실패:', error);
            alert('도서를 열 수 없습니다');
        }
    }

    async deleteBook(bookId) {
        if (!confirm('이 도서를 삭제하시겠습니까?')) return;

        try {
            if (window.bookStorage) {
                await window.bookStorage.deleteBook(bookId);
                await this.loadBooks();
                this.updateStats();
                this.renderBooks();
                
                // 간단한 알림
                this.showNotification('도서가 삭제되었습니다');
            }
        } catch (error) {
            console.error('도서 삭제 실패:', error);
            alert('도서 삭제에 실패했습니다');
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: white;
            color: #2d3748;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            font-weight: 600;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    generateCoverColor(title) {
        let hash = 0;
        for (let i = 0; i < title.length; i++) {
            hash = title.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#4facfe', 
            '#43e97b', '#fa709a', '#fee140', '#30cfd0',
            '#a8edea', '#fed6e3', '#c471f5', '#fa7e1e'
        ];
        
        return colors[Math.abs(hash) % colors.length];
    }

    adjustColor(color, amount) {
        const num = parseInt(color.slice(1), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.myShelfController = new MyShelfController();
});
