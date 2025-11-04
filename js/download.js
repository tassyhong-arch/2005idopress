// 도서 다운로드 기능
(function() {
    'use strict';

    // URL에서 텍스트 다운로드
    async function downloadFromURL(url) {
        try {
            // URL 유효성 검사
            let validUrl;
            try {
                validUrl = new URL(url);
            } catch (e) {
                throw new Error('유효하지 않은 URL입니다.');
            }

            // HTTPS만 허용 (보안)
            if (validUrl.protocol !== 'https:' && validUrl.protocol !== 'http:') {
                throw new Error('HTTP 또는 HTTPS URL만 지원됩니다.');
            }

            window.EbookApp.showNotification('도서를 다운로드하는 중...', 'info');

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`다운로드 실패: ${response.status} ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            
            // 텍스트 파일만 허용
            if (!contentType || !contentType.includes('text')) {
                throw new Error('텍스트 파일만 다운로드할 수 있습니다.');
            }

            const text = await response.text();
            
            if (!text || text.trim().length === 0) {
                throw new Error('빈 파일입니다.');
            }

            // 파일명 추출
            const urlPath = validUrl.pathname;
            const fileName = urlPath.substring(urlPath.lastIndexOf('/') + 1) || 'downloaded_book.txt';
            const title = fileName.replace(/\.[^/.]+$/, ''); // 확장자 제거

            return {
                title: title,
                content: text,
                author: '다운로드',
                source: url
            };

        } catch (error) {
            console.error('다운로드 오류:', error);
            throw error;
        }
    }

    // 텍스트 직접 추가
    function addTextBook(title, content, author = '직접 입력') {
        // 입력 검증
        if (!title || title.trim().length === 0) {
            throw new Error('제목을 입력해주세요.');
        }

        if (!content || content.trim().length === 0) {
            throw new Error('내용을 입력해주세요.');
        }

        // XSS 방지를 위한 기본 sanitization
        const sanitizedTitle = sanitizeText(title);
        const sanitizedContent = sanitizeText(content);
        const sanitizedAuthor = sanitizeText(author);

        return {
            title: sanitizedTitle,
            content: sanitizedContent,
            author: sanitizedAuthor,
            source: 'manual'
        };
    }

    // 텍스트 sanitization (XSS 방지)
    function sanitizeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 파일에서 도서 가져오기
    async function importFromFile(file) {
        try {
            // 파일 유효성 검사
            if (!file) {
                throw new Error('파일을 선택해주세요.');
            }

            // 파일 크기 제한 (10MB)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error('파일 크기는 10MB 이하여야 합니다.');
            }

            // 텍스트 파일만 허용
            const allowedTypes = ['text/plain', 'text/markdown', 'text/html'];
            if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|md|html)$/i)) {
                throw new Error('txt, md, html 파일만 지원됩니다.');
            }

            window.EbookApp.showNotification('파일을 읽는 중...', 'info');

            return new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = (e) => {
                    const content = e.target.result;
                    
                    if (!content || content.trim().length === 0) {
                        reject(new Error('빈 파일입니다.'));
                        return;
                    }

                    const title = file.name.replace(/\.[^/.]+$/, '');

                    resolve({
                        title: title,
                        content: content,
                        author: '파일 가져오기',
                        source: 'file'
                    });
                };

                reader.onerror = () => {
                    reject(new Error('파일 읽기 실패'));
                };

                reader.readAsText(file);
            });

        } catch (error) {
            console.error('파일 가져오기 오류:', error);
            throw error;
        }
    }

    // 도서 내보내기 (다운로드)
    function exportBook(book) {
        try {
            if (!book || !book.content) {
                throw new Error('내보낼 도서가 없습니다.');
            }

            const title = book.title || 'untitled';
            const content = book.content;

            // Blob 생성
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            
            // 다운로드 링크 생성
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.txt`;
            
            // 다운로드 트리거
            document.body.appendChild(a);
            a.click();
            
            // 정리
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            window.EbookApp.showNotification('도서를 내보냈습니다.', 'success');

        } catch (error) {
            console.error('도서 내보내기 오류:', error);
            window.EbookApp.showNotification('도서 내보내기에 실패했습니다.', 'error');
            throw error;
        }
    }

    // 전역 함수 노출
    window.EbookDownload = {
        downloadFromURL,
        addTextBook,
        importFromFile,
        exportBook
    };

    console.log('다운로드 모듈 로드 완료');
})();
