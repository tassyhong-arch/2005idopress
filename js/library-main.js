// 도서관 메인 페이지 컨트롤러
class LibraryController {
    constructor() {
        this.init();
    }

    async init() {
        this.setupUI();
        this.setupEventListeners();
        this.updateUIForUser();
        await this.loadPublicLibraryBooks();
    }

    setupUI() {
        // 최근 사용자 표시
        this.showRecentUsers();
    }

    setupEventListeners() {
        // 로그인 버튼
        const loginBtn = document.getElementById('loginBtn');
        loginBtn?.addEventListener('click', () => this.showLoginModal());

        // 로그아웃 버튼
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', () => this.logout());

        // 로그인 모달 닫기
        const closeLoginModal = document.getElementById('closeLoginModal');
        closeLoginModal?.addEventListener('click', () => this.hideLoginModal());

        const loginModal = document.getElementById('loginModal');
        loginModal?.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                this.hideLoginModal();
            }
        });

        // 로그인 제출
        const loginSubmitBtn = document.getElementById('loginSubmitBtn');
        loginSubmitBtn?.addEventListener('click', () => this.submitLogin());

        const usernameInput = document.getElementById('usernameInput');
        usernameInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitLogin();
            }
        });

        // 내 책장 버튼
        const myShelfBtn = document.getElementById('myShelfBtn');
        myShelfBtn?.addEventListener('click', () => {
            if (window.authManager.isLoggedIn()) {
                window.location.href = 'my-shelf.html';
            } else {
                this.showLoginModal();
            }
        });

        // 도서 추가 버튼
        const uploadBookBtn = document.getElementById('uploadBookBtn');
        uploadBookBtn?.addEventListener('click', () => {
            if (window.authManager.isLoggedIn()) {
                window.location.href = 'upload-admin.html';
            } else {
                this.showLoginModal();
            }
        });
    }

    updateUIForUser() {
        const isLoggedIn = window.authManager.isLoggedIn();
        const user = window.authManager.getCurrentUser();

        const loginBtn = document.getElementById('loginBtn');
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        const myShelfBtn = document.getElementById('myShelfBtn');
        const uploadBookBtn = document.getElementById('uploadBookBtn');

        if (isLoggedIn && user) {
            // 로그인 상태
            loginBtn.style.display = 'none';
            userInfo.style.display = 'flex';
            userName.textContent = user.displayName;
            userAvatar.style.backgroundColor = user.avatar;
            userAvatar.textContent = user.username.charAt(0).toUpperCase();

            // 버튼 활성화
            myShelfBtn.disabled = false;
            uploadBookBtn.disabled = false;

            // 로그인 필요 문구 제거
            const loginRequiredSpans = document.querySelectorAll('.login-required');
            loginRequiredSpans.forEach(span => span.style.display = 'none');
        } else {
            // 로그아웃 상태
            loginBtn.style.display = 'flex';
            userInfo.style.display = 'none';

            // 버튼 비활성화
            myShelfBtn.disabled = true;
            uploadBookBtn.disabled = true;

            // 로그인 필요 문구 표시
            const loginRequiredSpans = document.querySelectorAll('.login-required');
            loginRequiredSpans.forEach(span => span.style.display = 'block');
        }
    }

    showLoginModal() {
        const modal = document.getElementById('loginModal');
        const usernameInput = document.getElementById('usernameInput');
        
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            usernameInput?.focus();
        }
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }

    submitLogin() {
        const usernameInput = document.getElementById('usernameInput');
        const username = usernameInput?.value.trim();

        if (!username) {
            alert('사용자명을 입력해주세요');
            usernameInput?.focus();
            return;
        }

        try {
            const user = window.authManager.login(username);
            window.authManager.saveUserProfile();
            
            this.hideLoginModal();
            this.updateUIForUser();
            
            // 환영 메시지
            this.showWelcomeMessage(user.displayName);
        } catch (error) {
            alert(error.message);
        }
    }

    logout() {
        if (confirm('로그아웃 하시겠습니까?')) {
            window.authManager.logout();
            this.updateUIForUser();
            alert('로그아웃되었습니다');
        }
    }

    showRecentUsers() {
        const recentUsers = window.authManager.getAllUsers();
        const recentUsersContainer = document.getElementById('recentUsers');
        const recentUsersList = document.getElementById('recentUsersList');

        if (recentUsers.length > 0 && recentUsersList) {
            recentUsersContainer.style.display = 'block';
            
            recentUsersList.innerHTML = recentUsers.slice(0, 3).map(user => `
                <div class="recent-user-item" data-username="${user.username}">
                    <div class="recent-user-avatar" style="background-color: ${user.avatar};">
                        ${user.username.charAt(0).toUpperCase()}
                    </div>
                    <span class="recent-user-name">${user.displayName}</span>
                </div>
            `).join('');

            // 최근 사용자 클릭 이벤트
            recentUsersList.querySelectorAll('.recent-user-item').forEach(item => {
                item.addEventListener('click', () => {
                    const username = item.dataset.username;
                    document.getElementById('usernameInput').value = username;
                    this.submitLogin();
                });
            });
        }
    }

    showWelcomeMessage(username) {
        // 간단한 알림 (나중에 토스트로 변경 가능)
        const message = `환영합니다, ${username}님! 🎉`;
        
        // 커스텀 알림 생성
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
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
        }, 3000);
    }

    async loadPublicLibraryBooks() {
        const container = document.getElementById('publicLibraryBooks');
        if (!container) return;

        try {
            // 공개 도서관 초기화
            console.log('Initializing public library...');
            await window.publicLibrary.init();
            console.log('Public library initialized');
            
            // 모든 도서 가져오기
            const books = await window.publicLibrary.getAllBooks();
            console.log('Books loaded:', books.length);

            if (books.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book"></i>
                        <p>아직 등록된 도서가 없습니다</p>
                        <small>관리자가 도서를 추가하면 여기에 표시됩니다</small>
                    </div>
                `;
                return;
            }

            // 도서 카드 렌더링
            container.innerHTML = books.map(book => `
                <div class="featured-book-card" data-book-id="${book.id}">
                    <div class="book-cover-placeholder">
                        <i class="fab fa-google-drive"></i>
                    </div>
                    <div class="book-info">
                        <h3>${book.title}</h3>
                        <p class="book-author">${book.author}</p>
                        <p class="book-desc">${book.summary || '설명 없음'}</p>
                        <div class="book-meta">
                            <span><i class="fas fa-tag"></i> ${book.category || '일반'}</span>
                            <span><i class="fas fa-eye"></i> ${book.views || 0}</span>
                        </div>
                        <button class="read-now-btn add-to-shelf-btn" data-book-id="${book.id}">
                            <i class="fas fa-plus-circle"></i> 내 서재에 추가
                        </button>
                    </div>
                </div>
            `).join('');

            // 버튼 이벤트 리스너 추가
            container.querySelectorAll('.add-to-shelf-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const bookId = parseInt(e.currentTarget.getAttribute('data-book-id'));
                    this.addToMyShelf(bookId);
                });
            });

        } catch (error) {
            console.error('Load public library error:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>도서 목록을 불러올 수 없습니다</p>
                </div>
            `;
        }
    }

    async addToMyShelf(bookId) {
        console.log('addToMyShelf called with bookId:', bookId);
        
        // 로그인 확인
        if (!window.authManager.isLoggedIn()) {
            console.log('User not logged in');
            this.showNotification('로그인이 필요합니다', 'warning');
            this.showLoginModal();
            return;
        }

        try {
            console.log('Fetching book from public library, ID:', bookId);
            
            // 공개 도서관에서 책 정보 가져오기
            const book = await window.publicLibrary.getBook(bookId);
            console.log('Book fetched:', book);
            
            if (!book) {
                console.error('Book not found');
                this.showNotification('책을 찾을 수 없습니다', 'error');
                return;
            }

            this.showNotification('📥 구글 드라이브에서 내용을 불러오는 중...', 'info');

            // 구글 드라이브에서 실제 텍스트 내용 가져오기
            console.log('Fetching content from:', book.gdriveUrl);
            const content = await this.fetchGDriveContent(book.gdriveUrl, book.source);
            console.log('Content fetched, length:', content ? content.length : 0);
            
            if (!content) {
                throw new Error('문서 내용을 불러올 수 없습니다');
            }

            // 내 서재에 저장 (텍스트로 저장)
            console.log('Initializing bookStorage...');
            await window.bookStorage.init();
            
            console.log('Saving to my shelf...');
            const myBookId = await window.bookStorage.saveBook({
                title: book.title,
                content: content,
                type: 'txt',
                source: 'public-library',
                publicLibraryId: bookId,
                size: new Blob([content]).size,
                uploadedAt: Date.now()
            });
            console.log('Book saved with ID:', myBookId);

            // 조회수 증가
            await window.publicLibrary.incrementViews(bookId);

            this.showNotification('✅ 내 서재에 추가되었습니다! (오프라인에서도 읽을 수 있습니다)', 'success');

        } catch (error) {
            console.error('Add to shelf error:', error);
            this.showNotification('추가 실패: ' + error.message, 'error');
        }
    }

    async fetchGDriveContent(url, source) {
        try {
            // 구글 문서 ID 추출
            const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (!match) {
                throw new Error('유효하지 않은 구글 드라이브 링크입니다');
            }
            
            const docId = match[1];
            
            // 텍스트로 내보내기 URL 생성
            let exportUrl;
            if (source === 'docs') {
                exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
            } else if (source === 'sheets') {
                exportUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`;
            } else {
                exportUrl = `https://drive.google.com/uc?id=${docId}&export=download`;
            }

            const response = await fetch(exportUrl, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit'
            });

            if (!response.ok) {
                throw new Error(`문서를 불러올 수 없습니다 (${response.status}). 문서가 "링크가 있는 모든 사용자"로 공개 설정되어 있는지 확인하세요.`);
            }

            const content = await response.text();
            
            if (!content || content.trim().length === 0) {
                throw new Error('문서 내용이 비어있습니다');
            }

            return content;

        } catch (error) {
            console.error('GDrive fetch error:', error);
            throw error;
        }
    }
}

// 샘플 도서 로드 함수
function loadSampleBook(bookName) {
    if (bookName === 'jusaengjeon') {
        window.location.href = 'index.html#sample';
    }
}

// 리더로 이동
function goToReader() {
    window.location.href = 'index.html';
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.libraryController = new LibraryController();
});

// 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
