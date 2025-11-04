// 로컬 저장소 관리 (IndexedDB)
(function() {
    'use strict';

    const DB_NAME = 'EbookReaderDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'books';
    let db = null;

    // IndexedDB 초기화
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('데이터베이스 열기 실패:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                db = request.result;
                console.log('데이터베이스 열기 성공');
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                db = event.target.result;
                
                // books 스토어 생성
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    objectStore.createIndex('title', 'title', { unique: false });
                    objectStore.createIndex('addedDate', 'addedDate', { unique: false });
                    console.log('객체 스토어 생성 완료');
                }
            };
        });
    }

    // 도서 저장
    async function saveBook(book) {
        try {
            if (!db) {
                await initDB();
            }

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                
                const bookData = {
                    title: book.title || '제목 없음',
                    content: book.content || '',
                    author: book.author || '저자 미상',
                    addedDate: new Date().toISOString(),
                    lastRead: null,
                    progress: 0
                };

                const request = objectStore.add(bookData);

                request.onsuccess = () => {
                    console.log('도서 저장 성공:', bookData.title);
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error('도서 저장 실패:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('도서 저장 중 오류:', error);
            throw error;
        }
    }

    // 모든 도서 가져오기
    async function getAllBooks() {
        try {
            if (!db) {
                await initDB();
            }

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const objectStore = transaction.objectStore(STORE_NAME);
                const request = objectStore.getAll();

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error('도서 목록 가져오기 실패:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('도서 목록 가져오기 중 오류:', error);
            throw error;
        }
    }

    // 특정 도서 가져오기
    async function getBook(id) {
        try {
            if (!db) {
                await initDB();
            }

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const objectStore = transaction.objectStore(STORE_NAME);
                const request = objectStore.get(id);

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error('도서 가져오기 실패:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('도서 가져오기 중 오류:', error);
            throw error;
        }
    }

    // 도서 업데이트
    async function updateBook(id, updates) {
        try {
            if (!db) {
                await initDB();
            }

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                const getRequest = objectStore.get(id);

                getRequest.onsuccess = () => {
                    const book = getRequest.result;
                    if (!book) {
                        reject(new Error('도서를 찾을 수 없습니다.'));
                        return;
                    }

                    // 업데이트 적용
                    Object.assign(book, updates);

                    const updateRequest = objectStore.put(book);

                    updateRequest.onsuccess = () => {
                        console.log('도서 업데이트 성공:', book.title);
                        resolve(updateRequest.result);
                    };

                    updateRequest.onerror = () => {
                        console.error('도서 업데이트 실패:', updateRequest.error);
                        reject(updateRequest.error);
                    };
                };

                getRequest.onerror = () => {
                    console.error('도서 조회 실패:', getRequest.error);
                    reject(getRequest.error);
                };
            });
        } catch (error) {
            console.error('도서 업데이트 중 오류:', error);
            throw error;
        }
    }

    // 도서 삭제
    async function deleteBook(id) {
        try {
            if (!db) {
                await initDB();
            }

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                const request = objectStore.delete(id);

                request.onsuccess = () => {
                    console.log('도서 삭제 성공');
                    resolve();
                };

                request.onerror = () => {
                    console.error('도서 삭제 실패:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('도서 삭제 중 오류:', error);
            throw error;
        }
    }

    // 저장소 사용량 확인
    async function getStorageUsage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    usage: estimate.usage,
                    quota: estimate.quota,
                    percent: (estimate.usage / estimate.quota * 100).toFixed(2)
                };
            } catch (error) {
                console.error('저장소 정보 가져오기 실패:', error);
                return null;
            }
        }
        return null;
    }

    // 전역 함수 노출
    window.EbookStorage = {
        initDB,
        saveBook,
        getAllBooks,
        getBook,
        updateBook,
        deleteBook,
        getStorageUsage
    };

    // 초기화
    initDB().catch(error => {
        console.error('IndexedDB 초기화 실패:', error);
    });

    console.log('저장소 관리 모듈 로드 완료');
})();
