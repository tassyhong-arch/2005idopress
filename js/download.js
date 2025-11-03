// 도서 다운로드 관리
class BookDownloader {
    constructor() {
        this.downloadQueue = [];
        this.isDownloading = false;
    }

    async downloadFromUrl(url, title = null) {
        if (this.isDownloading) {
            if (window.app) {
                window.app.showNotification('이미 다운로드가 진행 중입니다', 'warning');
            }
            return;
        }

        this.isDownloading = true;

        try {
            // 온라인 상태 확인
            if (!navigator.onLine) {
                throw new Error('인터넷 연결이 필요합니다');
            }

            if (window.app) {
                window.app.showNotification('도서 다운로드 중... ⏳');
            }

            // Google Docs URL인 경우 특별 처리
            if (url.includes('docs.google.com')) {
                console.log('Google Docs URL 감지:', url);
            }

            // URL에서 텍스트 가져오기
            const response = await fetch(url, {
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'omit'
            });

            if (!response.ok) {
                throw new Error(`HTTP 오류: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            let content;

            if (contentType && contentType.includes('application/json')) {
                const json = await response.json();
                content = JSON.stringify(json, null, 2);
            } else {
                content = await response.text();
            }

            if (!content || content.trim().length === 0) {
                throw new Error('빈 콘텐츠입니다');
            }

            // 제목 추출 (URL에서 또는 사용자 입력)
            const bookTitle = title || this.extractTitleFromUrl(url) || '제목 없는 도서';

            // IndexedDB에 저장
            if (window.bookStorage) {
                await window.bookStorage.saveBook(bookTitle, content, {
                    source: url,
                    downloadedAt: Date.now()
                });

                // 도서 목록 새로고침
                if (window.bookManager) {
                    await window.bookManager.refreshBookList();
                }
            }

        } catch (error) {
            console.error('다운로드 실패:', error);
            
            let errorMessage = error.message;
            
            // Google Docs 특정 에러 메시지
            if (url.includes('docs.google.com')) {
                if (error.message.includes('CORS') || error.message.includes('fetch')) {
                    errorMessage = 'Google Docs 접근 실패: 문서가 "링크가 있는 모든 사용자"로 공개되어 있는지 확인하세요';
                } else if (error.message.includes('404') || error.message.includes('403')) {
                    errorMessage = 'Google Docs 접근 권한 없음: 문서 공유 설정을 확인하세요';
                }
            }
            
            if (window.app) {
                window.app.showNotification(`다운로드 실패: ${errorMessage}`, 'error');
            }
            
            // 콘솔에 자세한 정보 출력
            console.error('URL:', url);
            console.error('Error details:', error);
        } finally {
            this.isDownloading = false;
        }
    }

    async addTextContent(content, title) {
        try {
            if (!content || content.trim().length === 0) {
                throw new Error('내용이 비어있습니다');
            }

            const bookTitle = title || '새 도서 ' + new Date().toLocaleString();

            if (window.bookStorage) {
                await window.bookStorage.saveBook(bookTitle, content, {
                    source: 'manual',
                    addedAt: Date.now()
                });

                // 도서 목록 새로고침
                if (window.bookManager) {
                    await window.bookManager.refreshBookList();
                }
            }
        } catch (error) {
            console.error('텍스트 추가 실패:', error);
            if (window.app) {
                window.app.showNotification(`추가 실패: ${error.message}`, 'error');
            }
        }
    }

    extractTitleFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop();
            
            // 파일명에서 확장자 제거
            return filename.replace(/\.[^/.]+$/, '') || '다운로드된 도서';
        } catch (error) {
            return '다운로드된 도서';
        }
    }

    async promptDownloadUrl() {
        const url = prompt('도서 URL을 입력하세요:\n(텍스트 파일 또는 Google Docs 공개 링크)');
        
        if (!url) return;

        // Google Docs URL 변환
        let finalUrl = url;
        if (url.includes('docs.google.com/document')) {
            finalUrl = this.convertGoogleDocsUrl(url);
        }

        const title = prompt('도서 제목을 입력하세요 (선택사항):', '');
        
        await this.downloadFromUrl(finalUrl, title);
    }

    convertGoogleDocsUrl(url) {
        // Google Docs URL을 텍스트 내보내기 URL로 변환
        const docIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (docIdMatch) {
            const docId = docIdMatch[1];
            return `https://docs.google.com/document/d/${docId}/export?format=txt`;
        }
        return url;
    }

    async promptAddText() {
        const title = prompt('도서 제목을 입력하세요:');
        if (!title) return;

        const content = prompt('도서 내용을 입력하거나 붙여넣으세요:\n(긴 텍스트는 클립보드에서 붙여넣기 하세요)');
        if (!content) return;

        await this.addTextContent(content, title);
    }

    // 파일 업로드 기능
    async uploadFile(file) {
        try {
            if (!file) {
                throw new Error('파일이 선택되지 않았습니다');
            }

            // 파일 타입 체크
            const allowedTypes = ['text/plain', 'text/html', 'application/json'];
            if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
                throw new Error('지원하지 않는 파일 형식입니다. (.txt, .html, .json만 가능)');
            }

            // 파일 크기 체크 (10MB)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error('파일 크기가 너무 큽니다. (최대 10MB)');
            }

            if (window.app) {
                window.app.showNotification('파일 업로드 중... ⏳');
            }

            const content = await this.readFileAsText(file);
            const title = file.name.replace(/\.[^/.]+$/, '');

            if (window.bookStorage) {
                await window.bookStorage.saveBook(title, content, {
                    source: 'file',
                    filename: file.name,
                    uploadedAt: Date.now()
                });

                // 도서 목록 새로고침
                if (window.bookManager) {
                    await window.bookManager.refreshBookList();
                }
            }
        } catch (error) {
            console.error('파일 업로드 실패:', error);
            if (window.app) {
                window.app.showNotification(`업로드 실패: ${error.message}`, 'error');
            }
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('파일 읽기 실패'));
            reader.readAsText(file, 'UTF-8');
        });
    }
}

// 다운로더 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.bookDownloader = new BookDownloader();
});
