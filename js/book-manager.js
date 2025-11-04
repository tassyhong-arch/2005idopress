// 도서 관리 UI
(function() {
    'use strict';

    // DOM 요소
    const elements = {
        bookManagerBtn: document.getElementById('bookManagerBtn'),
        bookModal: document.getElementById('bookModal'),
        closeBookModal: document.getElementById('closeBookModal'),
        downloadBookBtn: document.getElementById('downloadBookBtn'),
        addTextBookBtn: document.getElementById('addTextBookBtn'),
        storageStatsBtn: document.getElementById('storageStatsBtn'),
        bookList: document.getElementById('bookList'),
        storageUsed: document.getElementById('storageUsed'),
        storageText: document.getElementById('storageText')
    };

    // 도서 목록 렌더링
    async function renderBookList() {
        try {
            const books = await window.EbookStorage.getAllBooks();
            
            if (!elements.bookList) return;

            if (books.length === 0) {
                elements.bookList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book" aria-hidden="true"></i>
                        <p>저장된 도서가 없습니다.</p>
                        <small>온라인 상태에서 도서를 다운로드하세요.</small>
                    </div>
                `;
                return;
            }

            let html = '<div class="book-items">';
            
            books.forEach(book => {
                const addedDate = new Date(book.addedDate).toLocaleDateString('ko-KR');
                const contentPreview = book.content.substring(0, 100) + '...';
                
                html += `
                    <div class="book-item" data-id="${book.id}">
                        <div class="book-info">
                            <h3 class="book-item-title">${escapeHtml(book.title)}</h3>
                            <p class="book-author">${escapeHtml(book.author)}</p>
                            <p class="book-date">추가일: ${addedDate}</p>
                            <p class="book-preview">${escapeHtml(contentPreview)}</p>
                        </div>
                        <div class="book-actions">
                            <button class="btn-read" data-id="${book.id}" title="읽기">
                                <i class="fas fa-book-open" aria-hidden="true"></i> 읽기
                            </button>
                            <button class="btn-export" data-id="${book.id}" title="내보내기">
                                <i class="fas fa-download" aria-hidden="true"></i>
                            </button>
                            <button class="btn-delete" data-id="${book.id}" title="삭제">
                                <i class="fas fa-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            elements.bookList.innerHTML = html;

            // 버튼 이벤트 리스너 등록
            attachBookItemListeners();

        } catch (error) {
            console.error('도서 목록 렌더링 실패:', error);
            window.EbookApp.showNotification('도서 목록을 불러오는데 실패했습니다.', 'error');
        }
    }

    // HTML 이스케이프 (XSS 방지)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 도서 항목 버튼 이벤트 리스너
    function attachBookItemListeners() {
        // 읽기 버튼
        document.querySelectorAll('.btn-read').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                await loadBook(id);
            });
        });

        // 내보내기 버튼
        document.querySelectorAll('.btn-export').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                await exportBook(id);
            });
        });

        // 삭제 버튼
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                await deleteBook(id);
            });
        });
    }

    // 도서 불러오기
    async function loadBook(id) {
        try {
            const book = await window.EbookStorage.getBook(id);
            
            if (!book) {
                throw new Error('도서를 찾을 수 없습니다.');
            }

            // 콘텐츠 표시
            const bookContent = document.getElementById('bookContent');
            if (bookContent) {
                // 마크다운 스타일 텍스트를 HTML로 변환
                const html = book.content
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/^\d+\.\s+(.*$)/gim, '<li>$1</li>');
                
                bookContent.innerHTML = `<p>${html}</p>`;
            }

            // 제목 업데이트
            const bookTitle = document.querySelector('.book-title');
            if (bookTitle) {
                bookTitle.textContent = book.title;
            }

            // 현재 도서 설정
            window.EbookApp.currentBook = book;

            // 마지막 읽은 시간 업데이트
            await window.EbookStorage.updateBook(id, {
                lastRead: new Date().toISOString()
            });

            // 모달 닫기
            closeBookManager();

            window.EbookApp.showNotification(`"${book.title}"을(를) 불러왔습니다.`, 'success');

        } catch (error) {
            console.error('도서 불러오기 실패:', error);
            window.EbookApp.showNotification('도서를 불러오는데 실패했습니다.', 'error');
        }
    }

    // 도서 내보내기
    async function exportBook(id) {
        try {
            const book = await window.EbookStorage.getBook(id);
            
            if (!book) {
                throw new Error('도서를 찾을 수 없습니다.');
            }

            window.EbookDownload.exportBook(book);

        } catch (error) {
            console.error('도서 내보내기 실패:', error);
            window.EbookApp.showNotification('도서 내보내기에 실패했습니다.', 'error');
        }
    }

    // 도서 삭제
    async function deleteBook(id) {
        if (!confirm('정말로 이 도서를 삭제하시겠습니까?')) {
            return;
        }

        try {
            await window.EbookStorage.deleteBook(id);
            window.EbookApp.showNotification('도서가 삭제되었습니다.', 'success');
            
            // 목록 새로고침
            await renderBookList();
            await updateStorageInfo();

        } catch (error) {
            console.error('도서 삭제 실패:', error);
            window.EbookApp.showNotification('도서 삭제에 실패했습니다.', 'error');
        }
    }

    // 도서 관리 모달 열기
    function openBookManager() {
        if (elements.bookModal) {
            elements.bookModal.style.display = 'flex';
            renderBookList();
            updateStorageInfo();
        }
    }

    // 도서 관리 모달 닫기
    function closeBookManager() {
        if (elements.bookModal) {
            elements.bookModal.style.display = 'none';
        }
    }

    // URL에서 도서 다운로드
    async function downloadBook() {
        const url = prompt('다운로드할 텍스트 파일의 URL을 입력하세요:');
        
        if (!url) return;

        try {
            const bookData = await window.EbookDownload.downloadFromURL(url);
            const id = await window.EbookStorage.saveBook(bookData);
            
            window.EbookApp.showNotification('도서가 저장되었습니다.', 'success');
            
            // 목록 새로고침
            await renderBookList();
            await updateStorageInfo();

        } catch (error) {
            console.error('도서 다운로드 실패:', error);
            window.EbookApp.showNotification(`다운로드 실패: ${error.message}`, 'error');
        }
    }

    // 텍스트로 도서 추가
    async function addTextBook() {
        const title = prompt('도서 제목을 입력하세요:');
        if (!title) return;

        const content = prompt('도서 내용을 입력하세요:');
        if (!content) return;

        try {
            const bookData = window.EbookDownload.addTextBook(title, content);
            const id = await window.EbookStorage.saveBook(bookData);
            
            window.EbookApp.showNotification('도서가 추가되었습니다.', 'success');
            
            // 목록 새로고침
            await renderBookList();
            await updateStorageInfo();

        } catch (error) {
            console.error('도서 추가 실패:', error);
            window.EbookApp.showNotification(`추가 실패: ${error.message}`, 'error');
        }
    }

    // 저장소 정보 업데이트
    async function updateStorageInfo() {
        try {
            const usage = await window.EbookStorage.getStorageUsage();
            
            if (!usage || !elements.storageUsed || !elements.storageText) return;

            const usedMB = (usage.usage / (1024 * 1024)).toFixed(2);
            const quotaMB = (usage.quota / (1024 * 1024)).toFixed(2);
            
            elements.storageUsed.style.width = `${usage.percent}%`;
            elements.storageText.textContent = `${usedMB}MB / ${quotaMB}MB (${usage.percent}%)`;

        } catch (error) {
            console.error('저장소 정보 업데이트 실패:', error);
        }
    }

    // 저장소 통계 표시
    async function showStorageStats() {
        try {
            const usage = await window.EbookStorage.getStorageUsage();
            const books = await window.EbookStorage.getAllBooks();
            
            if (!usage) {
                alert('저장소 정보를 가져올 수 없습니다.');
                return;
            }

            const usedMB = (usage.usage / (1024 * 1024)).toFixed(2);
            const quotaMB = (usage.quota / (1024 * 1024)).toFixed(2);
            
            const message = `
저장소 통계:
- 사용 중: ${usedMB}MB
- 전체 용량: ${quotaMB}MB
- 사용률: ${usage.percent}%
- 저장된 도서: ${books.length}권
            `.trim();

            alert(message);

        } catch (error) {
            console.error('저장소 통계 표시 실패:', error);
            window.EbookApp.showNotification('저장소 정보를 가져오는데 실패했습니다.', 'error');
        }
    }

    // 이벤트 리스너 등록
    function initEventListeners() {
        if (elements.bookManagerBtn) {
            elements.bookManagerBtn.addEventListener('click', openBookManager);
        }

        if (elements.closeBookModal) {
            elements.closeBookModal.addEventListener('click', closeBookManager);
        }

        if (elements.bookModal) {
            elements.bookModal.addEventListener('click', (e) => {
                if (e.target === elements.bookModal) {
                    closeBookManager();
                }
            });
        }

        if (elements.downloadBookBtn) {
            elements.downloadBookBtn.addEventListener('click', downloadBook);
        }

        if (elements.addTextBookBtn) {
            elements.addTextBookBtn.addEventListener('click', addTextBook);
        }

        if (elements.storageStatsBtn) {
            elements.storageStatsBtn.addEventListener('click', showStorageStats);
        }
    }

    // 초기화
    function init() {
        initEventListeners();
        console.log('도서 관리 모듈 초기화 완료');
    }

    // DOM 로드 완료 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
