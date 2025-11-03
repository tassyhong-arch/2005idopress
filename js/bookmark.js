// 북마크 기능
class BookmarkManager {
    constructor() {
        this.bookmarks = [];
        this.currentBookTitle = '';
        this.init();
    }

    init() {
        this.createBookmarkUI();
        this.setupEventListeners();
        this.loadBookmarks();
    }

    createBookmarkUI() {
        // 북마크 버튼을 헤더에 추가
        const controls = document.querySelector('.controls');
        if (controls) {
            const bookmarkBtn = document.createElement('button');
            bookmarkBtn.id = 'bookmarkBtn';
            bookmarkBtn.className = 'control-btn bookmark-btn';
            bookmarkBtn.title = '북마크 (Ctrl+D)';
            bookmarkBtn.innerHTML = `
                <i class="fas fa-bookmark"></i>
                <span class="btn-text">북마크</span>
            `;
            
            // 검색 버튼 다음에 삽입
            const searchBtn = document.getElementById('searchBtn');
            if (searchBtn && searchBtn.nextSibling) {
                controls.insertBefore(bookmarkBtn, searchBtn.nextSibling);
            } else {
                controls.insertBefore(bookmarkBtn, controls.firstChild);
            }
        }

        // 북마크 오버레이 생성
        const bookmarkOverlay = document.createElement('div');
        bookmarkOverlay.id = 'bookmarkOverlay';
        bookmarkOverlay.className = 'bookmark-overlay';
        bookmarkOverlay.innerHTML = `
            <div class="bookmark-container">
                <div class="bookmark-header">
                    <h2>
                        <i class="fas fa-bookmark"></i> 북마크
                    </h2>
                    <button id="closeBookmarkBtn" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="bookmark-actions">
                    <button id="addBookmarkBtn" class="bookmark-action-btn primary">
                        <i class="fas fa-plus"></i> 현재 페이지 북마크
                    </button>
                </div>

                <div class="bookmark-list-container">
                    <div id="bookmarkList" class="bookmark-list"></div>
                    <div id="emptyBookmarkState" class="empty-bookmark-state" style="display: none;">
                        <i class="fas fa-bookmark"></i>
                        <p>저장된 북마크가 없습니다</p>
                        <small>현재 페이지를 북마크하려면 위의 버튼을 클릭하세요</small>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(bookmarkOverlay);

        // 북마크 추가 모달
        const addBookmarkModal = document.createElement('div');
        addBookmarkModal.id = 'addBookmarkModal';
        addBookmarkModal.className = 'bookmark-modal';
        addBookmarkModal.innerHTML = `
            <div class="bookmark-modal-content">
                <div class="bookmark-modal-header">
                    <h3>북마크 추가</h3>
                    <button id="closeAddBookmarkModal" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="bookmark-modal-body">
                    <div class="bookmark-form-group">
                        <label>페이지</label>
                        <input type="text" id="bookmarkPageInput" readonly class="bookmark-input" />
                    </div>
                    <div class="bookmark-form-group">
                        <label>제목 (선택사항)</label>
                        <input 
                            type="text" 
                            id="bookmarkTitleInput" 
                            class="bookmark-input" 
                            placeholder="북마크 제목을 입력하세요..."
                            maxlength="100"
                        />
                    </div>
                    <div class="bookmark-form-group">
                        <label>메모 (선택사항)</label>
                        <textarea 
                            id="bookmarkNoteInput" 
                            class="bookmark-textarea" 
                            placeholder="메모를 입력하세요..."
                            rows="4"
                            maxlength="500"
                        ></textarea>
                    </div>
                </div>
                <div class="bookmark-modal-footer">
                    <button id="cancelAddBookmark" class="bookmark-modal-btn secondary">취소</button>
                    <button id="saveBookmark" class="bookmark-modal-btn primary">저장</button>
                </div>
            </div>
        `;
        document.body.appendChild(addBookmarkModal);

        // 북마크 편집 모달
        const editBookmarkModal = document.createElement('div');
        editBookmarkModal.id = 'editBookmarkModal';
        editBookmarkModal.className = 'bookmark-modal';
        editBookmarkModal.innerHTML = `
            <div class="bookmark-modal-content">
                <div class="bookmark-modal-header">
                    <h3>북마크 편집</h3>
                    <button id="closeEditBookmarkModal" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="bookmark-modal-body">
                    <div class="bookmark-form-group">
                        <label>페이지</label>
                        <input type="text" id="editBookmarkPageInput" readonly class="bookmark-input" />
                    </div>
                    <div class="bookmark-form-group">
                        <label>제목</label>
                        <input 
                            type="text" 
                            id="editBookmarkTitleInput" 
                            class="bookmark-input" 
                            maxlength="100"
                        />
                    </div>
                    <div class="bookmark-form-group">
                        <label>메모</label>
                        <textarea 
                            id="editBookmarkNoteInput" 
                            class="bookmark-textarea" 
                            rows="4"
                            maxlength="500"
                        ></textarea>
                    </div>
                </div>
                <div class="bookmark-modal-footer">
                    <button id="cancelEditBookmark" class="bookmark-modal-btn secondary">취소</button>
                    <button id="saveEditBookmark" class="bookmark-modal-btn primary">저장</button>
                </div>
            </div>
        `;
        document.body.appendChild(editBookmarkModal);
    }

    setupEventListeners() {
        // 북마크 버튼
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        bookmarkBtn?.addEventListener('click', () => this.showBookmarks());

        // 북마크 오버레이 닫기
        const closeBookmarkBtn = document.getElementById('closeBookmarkBtn');
        closeBookmarkBtn?.addEventListener('click', () => this.hideBookmarks());

        // 오버레이 외부 클릭
        const bookmarkOverlay = document.getElementById('bookmarkOverlay');
        bookmarkOverlay?.addEventListener('click', (e) => {
            if (e.target === bookmarkOverlay) {
                this.hideBookmarks();
            }
        });

        // 북마크 추가 버튼
        const addBookmarkBtn = document.getElementById('addBookmarkBtn');
        addBookmarkBtn?.addEventListener('click', () => this.showAddBookmarkModal());

        // 북마크 추가 모달
        const closeAddBookmarkModal = document.getElementById('closeAddBookmarkModal');
        const cancelAddBookmark = document.getElementById('cancelAddBookmark');
        const saveBookmark = document.getElementById('saveBookmark');

        closeAddBookmarkModal?.addEventListener('click', () => this.hideAddBookmarkModal());
        cancelAddBookmark?.addEventListener('click', () => this.hideAddBookmarkModal());
        saveBookmark?.addEventListener('click', () => this.saveNewBookmark());

        // 북마크 편집 모달
        const closeEditBookmarkModal = document.getElementById('closeEditBookmarkModal');
        const cancelEditBookmark = document.getElementById('cancelEditBookmark');
        const saveEditBookmark = document.getElementById('saveEditBookmark');

        closeEditBookmarkModal?.addEventListener('click', () => this.hideEditBookmarkModal());
        cancelEditBookmark?.addEventListener('click', () => this.hideEditBookmarkModal());
        saveEditBookmark?.addEventListener('click', () => this.saveEditedBookmark());

        // 키보드 단축키 (Ctrl+D)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.showAddBookmarkModal();
            }
        });
    }

    loadBookmarks() {
        if (!window.reader || !window.reader.bookTitle) return;
        
        this.currentBookTitle = window.reader.bookTitle;
        const saved = localStorage.getItem(`bookmarks-${this.currentBookTitle}`);
        
        if (saved) {
            try {
                this.bookmarks = JSON.parse(saved);
                // 페이지 번호로 정렬
                this.bookmarks.sort((a, b) => a.page - b.page);
            } catch (error) {
                console.error('북마크 로드 실패:', error);
                this.bookmarks = [];
            }
        }
    }

    saveBookmarks() {
        if (!this.currentBookTitle) return;
        localStorage.setItem(`bookmarks-${this.currentBookTitle}`, JSON.stringify(this.bookmarks));
    }

    showBookmarks() {
        this.loadBookmarks();
        this.renderBookmarkList();
        
        const bookmarkOverlay = document.getElementById('bookmarkOverlay');
        if (bookmarkOverlay) {
            bookmarkOverlay.style.display = 'flex';
        }
    }

    hideBookmarks() {
        const bookmarkOverlay = document.getElementById('bookmarkOverlay');
        if (bookmarkOverlay) {
            bookmarkOverlay.style.display = 'none';
        }
    }

    showAddBookmarkModal() {
        if (!window.reader) return;

        const modal = document.getElementById('addBookmarkModal');
        const pageInput = document.getElementById('bookmarkPageInput');
        const titleInput = document.getElementById('bookmarkTitleInput');
        const noteInput = document.getElementById('bookmarkNoteInput');

        if (pageInput) {
            pageInput.value = `페이지 ${window.reader.currentPage + 1} / ${window.reader.totalPages}`;
        }
        
        if (titleInput) titleInput.value = '';
        if (noteInput) noteInput.value = '';

        if (modal) {
            modal.style.display = 'flex';
        }

        setTimeout(() => titleInput?.focus(), 100);
    }

    hideAddBookmarkModal() {
        const modal = document.getElementById('addBookmarkModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    saveNewBookmark() {
        if (!window.reader) return;

        const titleInput = document.getElementById('bookmarkTitleInput');
        const noteInput = document.getElementById('bookmarkNoteInput');

        const bookmark = {
            id: Date.now(),
            page: window.reader.currentPage,
            title: titleInput?.value.trim() || `페이지 ${window.reader.currentPage + 1}`,
            note: noteInput?.value.trim() || '',
            createdAt: Date.now(),
            bookTitle: window.reader.bookTitle
        };

        this.bookmarks.push(bookmark);
        this.bookmarks.sort((a, b) => a.page - b.page);
        this.saveBookmarks();
        this.hideAddBookmarkModal();
        this.renderBookmarkList();

        if (window.app) {
            window.app.showNotification('✅ 북마크가 추가되었습니다!');
        }
    }

    showEditBookmarkModal(bookmarkId) {
        const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
        if (!bookmark) return;

        const modal = document.getElementById('editBookmarkModal');
        const pageInput = document.getElementById('editBookmarkPageInput');
        const titleInput = document.getElementById('editBookmarkTitleInput');
        const noteInput = document.getElementById('editBookmarkNoteInput');

        if (pageInput) {
            pageInput.value = `페이지 ${bookmark.page + 1}`;
        }
        if (titleInput) {
            titleInput.value = bookmark.title;
        }
        if (noteInput) {
            noteInput.value = bookmark.note;
        }

        if (modal) {
            modal.style.display = 'flex';
            modal.dataset.editingId = bookmarkId;
        }

        setTimeout(() => titleInput?.focus(), 100);
    }

    hideEditBookmarkModal() {
        const modal = document.getElementById('editBookmarkModal');
        if (modal) {
            modal.style.display = 'none';
            delete modal.dataset.editingId;
        }
    }

    saveEditedBookmark() {
        const modal = document.getElementById('editBookmarkModal');
        const bookmarkId = parseInt(modal?.dataset.editingId);
        
        if (!bookmarkId) return;

        const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
        if (!bookmark) return;

        const titleInput = document.getElementById('editBookmarkTitleInput');
        const noteInput = document.getElementById('editBookmarkNoteInput');

        bookmark.title = titleInput?.value.trim() || bookmark.title;
        bookmark.note = noteInput?.value.trim() || '';
        bookmark.updatedAt = Date.now();

        this.saveBookmarks();
        this.hideEditBookmarkModal();
        this.renderBookmarkList();

        if (window.app) {
            window.app.showNotification('✅ 북마크가 수정되었습니다!');
        }
    }

    deleteBookmark(bookmarkId) {
        const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
        if (!bookmark) return;

        const confirmed = confirm(`"${bookmark.title}" 북마크를 삭제하시겠습니까?`);
        if (!confirmed) return;

        this.bookmarks = this.bookmarks.filter(b => b.id !== bookmarkId);
        this.saveBookmarks();
        this.renderBookmarkList();

        if (window.app) {
            window.app.showNotification('🗑️ 북마크가 삭제되었습니다');
        }
    }

    goToBookmark(bookmarkId) {
        const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
        if (!bookmark || !window.reader) return;

        window.reader.goToPage(bookmark.page);
        this.hideBookmarks();

        if (window.app) {
            window.app.showNotification(`📖 "${bookmark.title}"로 이동했습니다`);
        }
    }

    renderBookmarkList() {
        const bookmarkList = document.getElementById('bookmarkList');
        const emptyState = document.getElementById('emptyBookmarkState');

        if (!bookmarkList || !emptyState) return;

        if (this.bookmarks.length === 0) {
            bookmarkList.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        bookmarkList.innerHTML = this.bookmarks.map(bookmark => {
            const date = new Date(bookmark.createdAt).toLocaleDateString();
            const time = new Date(bookmark.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            return `
                <div class="bookmark-item" data-id="${bookmark.id}">
                    <div class="bookmark-item-header">
                        <div class="bookmark-item-title">
                            <i class="fas fa-bookmark"></i>
                            <span>${this.escapeHtml(bookmark.title)}</span>
                        </div>
                        <div class="bookmark-item-actions">
                            <button class="bookmark-edit-btn" data-id="${bookmark.id}" title="편집">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="bookmark-delete-btn" data-id="${bookmark.id}" title="삭제">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="bookmark-item-body">
                        <div class="bookmark-item-page">
                            <i class="fas fa-file-alt"></i> 페이지 ${bookmark.page + 1}
                        </div>
                        ${bookmark.note ? `
                            <div class="bookmark-item-note">
                                <i class="fas fa-sticky-note"></i>
                                ${this.escapeHtml(bookmark.note)}
                            </div>
                        ` : ''}
                        <div class="bookmark-item-date">
                            <i class="fas fa-clock"></i> ${date} ${time}
                        </div>
                    </div>
                    <button class="bookmark-goto-btn" data-id="${bookmark.id}">
                        <i class="fas fa-arrow-right"></i> 이동
                    </button>
                </div>
            `;
        }).join('');

        // 이벤트 리스너 추가
        bookmarkList.querySelectorAll('.bookmark-goto-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.goToBookmark(id);
            });
        });

        bookmarkList.querySelectorAll('.bookmark-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showEditBookmarkModal(id);
            });
        });

        bookmarkList.querySelectorAll('.bookmark-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.deleteBookmark(id);
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 현재 페이지에 북마크가 있는지 확인
    hasBookmarkOnCurrentPage() {
        if (!window.reader) return false;
        return this.bookmarks.some(b => b.page === window.reader.currentPage);
    }
}

// 북마크 관리자 초기화
document.addEventListener('DOMContentLoaded', () => {
    // reader가 초기화된 후 북마크 관리자 초기화
    const initBookmarkManager = () => {
        if (window.reader) {
            window.bookmarkManager = new BookmarkManager();
        } else {
            setTimeout(initBookmarkManager, 100);
        }
    };
    initBookmarkManager();
});
