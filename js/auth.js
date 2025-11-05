// 간단한 인증 시스템
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // 저장된 사용자 정보 로드
        const savedUser = localStorage.getItem('current-user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                console.log('사용자 자동 로그인:', this.currentUser.username);
            } catch (error) {
                console.error('사용자 정보 로드 실패:', error);
                localStorage.removeItem('current-user');
            }
        }
    }

    // 현재 로그인된 사용자 확인
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // 현재 사용자 정보 가져오기
    getCurrentUser() {
        return this.currentUser;
    }

    // 사용자명으로 로그인 (비밀번호 없음)
    login(username) {
        if (!username || username.trim() === '') {
            throw new Error('사용자명을 입력해주세요');
        }

        const cleanUsername = username.trim();
        
        // 사용자 정보 생성
        this.currentUser = {
            username: cleanUsername,
            displayName: cleanUsername,
            loginTime: Date.now(),
            avatar: this.generateAvatar(cleanUsername)
        };

        // localStorage에 저장
        localStorage.setItem('current-user', JSON.stringify(this.currentUser));
        
        console.log('로그인 성공:', this.currentUser);
        return this.currentUser;
    }

    // 로그아웃
    logout() {
        this.currentUser = null;
        localStorage.removeItem('current-user');
        console.log('로그아웃 완료');
    }

    // 사용자명으로 아바타 색상 생성
    generateAvatar(username) {
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#4facfe', 
            '#43e97b', '#fa709a', '#fee140', '#30cfd0',
            '#a8edea', '#fed6e3', '#c471f5', '#fa7e1e'
        ];
        
        return colors[Math.abs(hash) % colors.length];
    }

    // 사용자별 데이터 키 생성
    getUserDataKey(baseKey) {
        if (!this.isLoggedIn()) {
            return baseKey; // 로그인하지 않은 경우 기본 키
        }
        return `${this.currentUser.username}-${baseKey}`;
    }

    // 모든 사용자 목록 (최근 로그인 순)
    getAllUsers() {
        const users = [];
        const keys = Object.keys(localStorage);
        
        for (const key of keys) {
            if (key.startsWith('user-profile-')) {
                try {
                    const user = JSON.parse(localStorage.getItem(key));
                    users.push(user);
                } catch (error) {
                    console.error('사용자 정보 파싱 실패:', error);
                }
            }
        }
        
        // 최근 로그인 순 정렬
        users.sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0));
        return users;
    }

    // 사용자 프로필 저장
    saveUserProfile() {
        if (!this.isLoggedIn()) return;
        
        const profile = {
            username: this.currentUser.username,
            displayName: this.currentUser.displayName,
            avatar: this.currentUser.avatar,
            lastLogin: Date.now()
        };
        
        localStorage.setItem(`user-profile-${this.currentUser.username}`, JSON.stringify(profile));
    }
}

// 전역 인스턴스
window.authManager = new AuthManager();
