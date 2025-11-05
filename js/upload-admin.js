// 도서 업로드 관리자 컨트롤러

class UploadAdminController {
    constructor() {
        this.recentUploads = [];
        this.init();
    }

    async init() {
        // 모듈 로드 대기
        await this.waitForModules();
        
        // 사용자 정보 표시
        this.displayUserInfo();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 초기 데이터 로드
        await this.loadData();
        
        console.log('Upload Admin initialized');
    }

    async waitForModules() {
        const maxWait = 5000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            if (window.bookStorage && window.authManager) {
                await window.bookStorage.init();
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    displayUserInfo() {
        const user = window.authManager?.currentUser;
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        if (user) {
            if (userAvatar) {
                userAvatar.style.background = user.avatar;
                userAvatar.textContent = user.username.charAt(0).toUpperCase();
            }
            if (userName) {
                userName.textContent = user.displayName;
            }
        }
    }

    setupEventListeners() {
        // 뒤로가기
        const backBtn = document.getElementById('backToLibrary');
        backBtn?.addEventListener('click', () => {
            window.location.href = 'library.html';
        });

        // 구글 드라이브 링크 추가
        const addLinkBtn = document.getElementById('addLinkBtn');
        const gdriveLinkInput = document.getElementById('gdriveLinkInput');
        
        addLinkBtn?.addEventListener('click', () => {
            this.handleGDriveLink();
        });

        // Enter 키로도 추가 가능
        gdriveLinkInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleGDriveLink();
            }
        });

        // 텍스트 직접 입력
        const addTextBtn = document.getElementById('addTextBtn');
        addTextBtn?.addEventListener('click', () => {
            this.showTextInputModal();
        });

        // 텍스트 모달 컨트롤
        const closeTextModal = document.getElementById('closeTextModal');
        const cancelTextBtn = document.getElementById('cancelTextBtn');
        const saveTextBtn = document.getElementById('saveTextBtn');
        const textModal = document.getElementById('textInputModal');

        closeTextModal?.addEventListener('click', () => {
            this.hideTextInputModal();
        });

        cancelTextBtn?.addEventListener('click', () => {
            this.hideTextInputModal();
        });

        saveTextBtn?.addEventListener('click', () => {
            this.saveTextBook();
        });

        // 모달 외부 클릭
        textModal?.addEventListener('click', (e) => {
            if (e.target === textModal) {
                this.hideTextInputModal();
            }
        });

        // 새로고침 버튼
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn?.addEventListener('click', () => {
            this.loadData();
        });
    }

    async handleGDriveLink() {
        const input = document.getElementById('gdriveLinkInput');
        const url = input.value.trim();

        if (!url) {
            this.showNotification('링크를 입력하세요', 'warning');
            input.focus();
            return;
        }

        // 구글 드라이브 링크 검증
        if (!this.isValidGDriveLink(url)) {
            this.showNotification('올바른 구글 드라이브 링크가 아닙니다', 'error');
            input.focus();
            return;
        }

        try {
            // 문서 정보 추출
            const docInfo = this.extractGDriveInfo(url);
            
            this.showNotification('📥 구글 드라이브에서 불러오는 중...', 'info');
            
            // 구글 드라이브에서 실제 텍스트 내용 가져오기
            const content = await this.fetchGDriveContent(url, docInfo.type);
            
            if (!content) {
                throw new Error('문서 내용을 불러올 수 없습니다');
            }

            // 텍스트로 저장 (오프라인에서도 읽을 수 있도록)
            const bookId = await window.bookStorage.saveBook({
                title: docInfo.title,
                content: content, // 실제 텍스트 내용 저장
                type: 'txt', // 텍스트 타입으로 저장
                source: 'gdrive', // 원본이 구글 드라이브임을 표시
                gdriveUrl: url, // 원본 링크 보관 (나중에 업데이트 가능)
                gdriveId: docInfo.id,
                size: new Blob([content]).size,
                uploadedAt: Date.now()
            });

            this.showNotification('✅ 도서가 추가되었습니다! (오프라인에서도 읽을 수 있습니다)', 'success');
            
            // 입력 초기화
            input.value = '';
            
            // 데이터 새로고침
            await this.loadData();

        } catch (error) {
            console.error('Add link error:', error);
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
                // 구글 문서: 텍스트로 내보내기
                exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
            } else if (source === 'sheets') {
                // 구글 시트: CSV로 내보내기
                exportUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`;
            } else {
                // 일반 파일: 직접 다운로드
                exportUrl = `https://drive.google.com/uc?id=${docId}&export=download`;
            }

            // 문서 가져오기
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

    isValidGDriveLink(url) {
        // 구글 문서 또는 시트 링크 체크
        const patterns = [
            /docs\.google\.com\/document\/d\//,
            /docs\.google\.com\/spreadsheets\/d\//,
            /drive\.google\.com\/file\/d\//
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }

    extractGDriveInfo(url) {
        let type = 'docs';
        let id = '';
        let title = '제목 없는 문서';

        // 문서 타입 판별
        if (url.includes('/document/')) {
            type = 'docs';
            const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
            id = match ? match[1] : '';
        } else if (url.includes('/spreadsheets/')) {
            type = 'sheets';
            const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
            id = match ? match[1] : '';
        } else if (url.includes('/file/')) {
            type = 'file';
            const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
            id = match ? match[1] : '';
        }

        // URL에서 제목 추출 시도
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            if (pathParts.length > 3) {
                title = decodeURIComponent(pathParts[pathParts.length - 2] || title);
            }
        } catch (e) {
            // URL 파싱 실패 시 기본 제목 사용
        }

        // 제목이 ID인 경우 (일반적인 공유 링크)
        if (title === id || title.length > 50) {
            const now = new Date();
            title = `구글 ${type === 'docs' ? '문서' : '시트'} ${now.toLocaleDateString('ko-KR')}`;
        }

        return { type, id, title };
    }

    showTextInputModal() {
        const modal = document.getElementById('textInputModal');
        const titleInput = document.getElementById('bookTitleInput');
        const contentInput = document.getElementById('bookContentInput');
        
        // 초기화
        titleInput.value = '';
        contentInput.value = '';
        
        modal.style.display = 'flex';
        modal.classList.add('show');
        titleInput.focus();
    }

    hideTextInputModal() {
        const modal = document.getElementById('textInputModal');
        modal.style.display = 'none';
        modal.classList.remove('show');
    }

    async saveTextBook() {
        const titleInput = document.getElementById('bookTitleInput');
        const contentInput = document.getElementById('bookContentInput');
        
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title) {
            this.showNotification('제목을 입력하세요', 'warning');
            titleInput.focus();
            return;
        }

        if (!content) {
            this.showNotification('내용을 입력하세요', 'warning');
            contentInput.focus();
            return;
        }

        try {
            const bookId = await window.bookStorage.saveBook({
                title: title,
                content: content,
                type: 'txt',
                size: new Blob([content]).size,
                uploadedAt: Date.now()
            });

            this.showNotification(`도서가 저장되었습니다: ${title}`, 'success');
            this.hideTextInputModal();
            await this.loadData();

        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('저장 실패: ' + error.message, 'error');
        }
    }

    async loadData() {
        await this.loadRecentUploads();
        await this.updateStorageStats();
    }

    async loadRecentUploads() {
        try {
            const books = await window.bookStorage.getAllBooks();
            
            // 업로드 시간 기준으로 정렬 (최신순)
            this.recentUploads = books.sort((a, b) => {
                const timeA = a.uploadedAt || a.addedAt || 0;
                const timeB = b.uploadedAt || b.addedAt || 0;
                return timeB - timeA;
            }).slice(0, 10); // 최근 10개

            this.renderRecentUploads();

        } catch (error) {
            console.error('Load uploads error:', error);
        }
    }

    renderRecentUploads() {
        const list = document.getElementById('recentUploadsList');
        
        if (this.recentUploads.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>최근 추가된 도서가 없습니다</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.recentUploads.map(book => {
            const uploadTime = book.uploadedAt || book.addedAt || Date.now();
            const timeAgo = this.getTimeAgo(uploadTime);
            const source = book.source || '';
            
            let icon = 'fas fa-file-alt';
            let typeLabel = '텍스트';
            let iconClass = '';
            
            // 구글 드라이브에서 가져온 도서인지 확인
            if (source === 'gdrive') {
                icon = 'fab fa-google-drive';
                iconClass = 'gdrive-icon';
                typeLabel = '구글 드라이브 → 텍스트';
            }

            return `
                <div class="upload-item" data-book-id="${book.id}">
                    <div class="upload-item-icon ${iconClass}">
                        <i class="${icon}"></i>
                    </div>
                    <div class="upload-item-info">
                        <div class="upload-item-title">${book.title}</div>
                        <div class="upload-item-meta">
                            <span><i class="fas fa-clock"></i> ${timeAgo}</span>
                            <span><i class="fas fa-tag"></i> ${typeLabel}</span>
                            ${source === 'gdrive' ? '<span><i class="fas fa-wifi-slash"></i> 오프라인 가능</span>' : ''}
                        </div>
                    </div>
                    <div class="upload-item-actions">
                        <button class="view-btn" title="보기" onclick="uploadAdmin.viewBook('${book.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="delete-btn" title="삭제" onclick="uploadAdmin.deleteBook('${book.id}', '${book.title}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async updateStorageStats() {
        try {
            const books = await window.bookStorage.getAllBooks();
            const totalBooks = books.length;
            
            // 소스별 개수 계산
            let gdriveCount = 0;
            let textCount = 0;
            let totalSize = 0;

            books.forEach(book => {
                totalSize += book.size || 0;
                // 구글 드라이브에서 가져온 것인지 확인
                if (book.source === 'gdrive') {
                    gdriveCount++;
                } else {
                    textCount++;
                }
            });

            // 용량 표시
            let sizeText;
            if (totalSize < 1024) {
                sizeText = `${totalSize} B`;
            } else if (totalSize < 1024 * 1024) {
                sizeText = `${(totalSize / 1024).toFixed(1)} KB`;
            } else {
                sizeText = `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
            }

            // UI 업데이트
            document.getElementById('totalBooksCount').textContent = totalBooks;
            document.getElementById('gdriveCount').textContent = gdriveCount;
            document.getElementById('textCount').textContent = textCount;
            document.getElementById('storageSizeText').textContent = sizeText;

        } catch (error) {
            console.error('Storage stats error:', error);
        }
    }

    async viewBook(bookId) {
        // 리더로 이동
        localStorage.setItem('last-book-id', bookId);
        window.location.href = 'index.html';
    }

    async deleteBook(bookId, bookTitle) {
        const confirmed = confirm(`"${bookTitle}" 도서를 삭제하시겠습니까?`);
        
        if (!confirmed) return;

        try {
            await window.bookStorage.deleteBook(bookId);
            this.showNotification(`삭제되었습니다: ${bookTitle}`, 'success');
            await this.loadData();

        } catch (error) {
            console.error('Delete error:', error);
            this.showNotification('삭제 실패: ' + error.message, 'error');
        }
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        
        const date = new Date(timestamp);
        return date.toLocaleDateString('ko-KR');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        if (notification && notificationText) {
            notificationText.textContent = message;
            notification.className = `notification ${type} show`;
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    }
}

// 전역 인스턴스
let uploadAdmin;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    uploadAdmin = new UploadAdminController();
});
