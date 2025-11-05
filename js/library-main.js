// 도서관 메인 페이지 컨트롤러
class LibraryController {
    constructor() {
        this.init();
    }

    init() {
        this.setupUI();
        this.setupEventListeners();
        this.updateUIForUser();
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
