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

        // 파일 선택 버튼
        const selectFileBtn = document.getElementById('selectFileBtn');
        const fileInput = document.getElementById('fileInput');
        
        selectFileBtn?.addEventListener('click', () => {
            fileInput?.click();
        });

        // 파일 선택
        fileInput?.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        // 드래그 앤 드롭
        const dropZone = document.getElementById('dropZone');
        
        dropZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone?.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
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

    async handleFileSelect(files) {
        if (!files || files.length === 0) return;

        const progressSection = document.getElementById('uploadProgressSection');
        const progressList = document.getElementById('uploadProgressList');
        
        progressSection.style.display = 'block';
        progressList.innerHTML = '';

        for (const file of files) {
            await this.uploadFile(file, progressList);
        }

        // 완료 후 2초 뒤 숨김
        setTimeout(() => {
            progressSection.style.display = 'none';
        }, 2000);

        // 데이터 새로고침
        await this.loadData();
        
        // 파일 입력 초기화
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
    }

    async uploadFile(file, progressList) {
        // 파일 크기 체크 (50MB)
        if (file.size > 50 * 1024 * 1024) {
            this.showNotification(`파일이 너무 큽니다: ${file.name} (최대 50MB)`, 'error');
            return;
        }

        // 지원 형식 체크
        const validExtensions = ['.pdf', '.epub', '.txt'];
        const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
        
        if (!validExtensions.includes(fileExt)) {
            this.showNotification(`지원하지 않는 형식입니다: ${file.name}`, 'error');
            return;
        }

        // 진행 UI 추가
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        progressItem.innerHTML = `
            <div class="progress-icon">
                <i class="fas fa-file-${fileExt === '.pdf' ? 'pdf' : 'alt'}"></i>
            </div>
            <div class="progress-info">
                <div class="progress-name">${file.name}</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
                <div class="progress-status">업로드 중...</div>
            </div>
        `;
        progressList.appendChild(progressItem);

        const progressBar = progressItem.querySelector('.progress-bar');
        const progressStatus = progressItem.querySelector('.progress-status');

        try {
            // 파일 읽기
            const content = await this.readFile(file);
            
            // 진행 표시
            progressBar.style.width = '50%';

            // 저장
            const bookId = await window.bookStorage.saveBook({
                title: file.name.replace(/\.[^/.]+$/, ''),
                content: content,
                type: fileExt.substring(1),
                size: file.size,
                uploadedAt: Date.now()
            });

            // 완료
            progressBar.style.width = '100%';
            progressStatus.textContent = '완료!';
            progressStatus.style.color = '#28a745';

            this.showNotification(`업로드 완료: ${file.name}`, 'success');

        } catch (error) {
            console.error('Upload error:', error);
            progressBar.style.width = '100%';
            progressBar.style.background = '#dc3545';
            progressStatus.textContent = '실패: ' + error.message;
            progressStatus.style.color = '#dc3545';
            
            this.showNotification(`업로드 실패: ${file.name}`, 'error');
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = (e) => {
                reject(new Error('파일 읽기 실패'));
            };

            const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
            
            if (fileExt === '.pdf' || fileExt === '.epub') {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
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
                    <p>최근 업로드된 도서가 없습니다</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.recentUploads.map(book => {
            const uploadTime = book.uploadedAt || book.addedAt || Date.now();
            const timeAgo = this.getTimeAgo(uploadTime);
            const fileSize = this.formatFileSize(book.size || 0);
            const fileType = book.type || 'txt';
            
            let icon = 'fa-file-alt';
            if (fileType === 'pdf') icon = 'fa-file-pdf';
            else if (fileType === 'epub') icon = 'fa-book';

            return `
                <div class="upload-item" data-book-id="${book.id}">
                    <div class="upload-item-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="upload-item-info">
                        <div class="upload-item-title">${book.title}</div>
                        <div class="upload-item-meta">
                            <span><i class="fas fa-clock"></i> ${timeAgo}</span>
                            <span><i class="fas fa-hdd"></i> ${fileSize}</span>
                            <span><i class="fas fa-file"></i> ${fileType.toUpperCase()}</span>
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
            
            // 총 사용량 계산
            let totalSize = 0;
            let pdfCount = 0;
            let otherCount = 0;

            books.forEach(book => {
                totalSize += book.size || 0;
                if (book.type === 'pdf') {
                    pdfCount++;
                } else {
                    otherCount++;
                }
            });

            const maxSize = 100 * 1024 * 1024; // 100MB
            const usedMB = (totalSize / (1024 * 1024)).toFixed(2);
            const percentage = Math.min(100, (totalSize / maxSize) * 100).toFixed(1);

            // UI 업데이트
            document.getElementById('storageBarFill').style.width = `${percentage}%`;
            document.getElementById('storageUsedText').textContent = `${usedMB} MB`;
            document.getElementById('storagePercentText').textContent = `${percentage}%`;
            document.getElementById('totalBooksCount').textContent = totalBooks;
            document.getElementById('pdfCount').textContent = pdfCount;
            document.getElementById('epubCount').textContent = otherCount;

            // 저장소 부족 경고
            if (percentage > 90) {
                this.showNotification('저장소가 거의 찼습니다! (90% 이상)', 'warning');
            }

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
