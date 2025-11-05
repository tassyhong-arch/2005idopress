// IndexedDB를 사용한 도서 저장소 관리
class BookStorage {
    constructor() {
        this.dbName = 'EbookReaderDB';
        this.dbVersion = 1;
        this.storeName = 'books';
        this.db = null;
        this.maxStorageSize = 100 * 1024 * 1024; // 100MB
        this.init();
    }

    async init() {
        try {
            this.db = await this.openDatabase();
            console.log('IndexedDB 초기화 완료');
            this.updateStorageStats();
        } catch (error) {
            console.error('IndexedDB 초기화 실패:', error);
            if (window.app) {
                window.app.showNotification('저장소 초기화에 실패했습니다', 'error');
            }
        }
    }

    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    objectStore.createIndex('title', 'title', { unique: false });
                    objectStore.createIndex('addedAt', 'addedAt', { unique: false });
                }
            };
        });
    }

    async saveBook(titleOrObject, content, metadata = {}) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        try {
            let book;
            
            // 객체로 전달된 경우 (새로운 방식)
            if (typeof titleOrObject === 'object' && titleOrObject !== null) {
                const data = titleOrObject;
                book = {
                    title: data.title,
                    content: data.content,
                    type: data.type || 'txt',
                    source: data.source || 'manual',
                    size: data.size || new Blob([data.content]).size,
                    uploadedAt: data.uploadedAt || Date.now(),
                    publicLibraryId: data.publicLibraryId,
                    gdriveUrl: data.gdriveUrl,
                    gdriveId: data.gdriveId,
                    metadata: {
                        addedAt: data.uploadedAt || Date.now(),
                        lastRead: Date.now(),
                        ...data.metadata
                    }
                };
            } else {
                // 기존 방식 (title, content, metadata)
                book = {
                    title: titleOrObject,
                    content,
                    metadata: {
                        ...metadata,
                        size: new Blob([content]).size,
                        addedAt: Date.now(),
                        lastRead: Date.now()
                    }
                };
            }

            // 저장소 용량 체크
            const currentSize = await this.getUsedStorage();
            if (currentSize + book.metadata.size > this.maxStorageSize) {
                throw new Error('저장소 용량이 부족합니다');
            }

            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.add(book);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    console.log('도서 저장 완료:', title);
                    this.updateStorageStats();
                    if (window.app) {
                        window.app.showNotification(`"${title}" 저장 완료! 📚`);
                    }
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error);
                transaction.onerror = () => reject(transaction.error);
            });
        } catch (error) {
            console.error('도서 저장 실패:', error);
            if (window.app) {
                window.app.showNotification(`저장 실패: ${error.message}`, 'error');
            }
            throw error;
        }
    }

    async getBook(id) {
        if (!this.db) {
            console.warn('Database not initialized');
            return null;
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(id);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                transaction.onerror = () => reject(transaction.error);
            });
        } catch (error) {
            console.error('getBook failed:', error);
            return null;
        }
    }

    async getAllBooks() {
        if (!this.db) {
            console.warn('Database not initialized');
            return [];
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.getAll();

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => {
                    console.error('getAllBooks error:', request.error);
                    reject(request.error);
                };
                transaction.onerror = () => {
                    console.error('transaction error:', transaction.error);
                    reject(transaction.error);
                };
            });
        } catch (error) {
            console.error('getAllBooks failed:', error);
            return [];
        }
    }

    async deleteBook(id) {
        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.delete(id);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    console.log('도서 삭제 완료:', id);
                    this.updateStorageStats();
                    if (window.app) {
                        window.app.showNotification('도서가 삭제되었습니다');
                    }
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('도서 삭제 실패:', error);
            if (window.app) {
                window.app.showNotification('삭제에 실패했습니다', 'error');
            }
            throw error;
        }
    }

    async updateLastRead(id) {
        try {
            const book = await this.getBook(id);
            if (book) {
                book.metadata.lastRead = Date.now();
                
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const objectStore = transaction.objectStore(this.storeName);
                const request = objectStore.put(book);

                return new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }
        } catch (error) {
            console.error('읽기 시간 업데이트 실패:', error);
        }
    }

    async loadBook(id) {
        try {
            const book = await this.getBook(id);
            if (book && window.reader) {
                // 모든 도서는 이미 텍스트로 저장되어 있음
                window.reader.loadContent(book.content, book.title);
                await this.updateLastRead(id);
                localStorage.setItem('last-book-id', id);
            }
        } catch (error) {
            console.error('도서 로드 실패:', error);
            if (window.app) {
                window.app.showNotification('도서를 불러올 수 없습니다', 'error');
            }
        }
    }

    async getUsedStorage() {
        try {
            const books = await this.getAllBooks();
            return books.reduce((total, book) => total + (book.metadata?.size || 0), 0);
        } catch (error) {
            console.error('저장소 크기 계산 실패:', error);
            return 0;
        }
    }

    async updateStorageStats() {
        try {
            const usedBytes = await this.getUsedStorage();
            const usedMB = (usedBytes / (1024 * 1024)).toFixed(2);
            const maxMB = (this.maxStorageSize / (1024 * 1024)).toFixed(0);
            const percentage = ((usedBytes / this.maxStorageSize) * 100).toFixed(1);

            const storageText = document.getElementById('storageText');
            const storageUsed = document.getElementById('storageUsed');

            if (storageText) {
                storageText.textContent = `${usedMB}MB / ${maxMB}MB (${percentage}%)`;
            }

            if (storageUsed) {
                storageUsed.style.width = `${percentage}%`;
                
                // 색상 변경 (80% 이상이면 경고)
                if (percentage >= 80) {
                    storageUsed.style.background = 'linear-gradient(90deg, #ff6b6b, #ee5a6f)';
                } else if (percentage >= 60) {
                    storageUsed.style.background = 'linear-gradient(90deg, #ffa94d, #ff8c42)';
                } else {
                    storageUsed.style.background = 'linear-gradient(90deg, var(--color-accent), #0056b3)';
                }
            }
        } catch (error) {
            console.error('저장소 통계 업데이트 실패:', error);
        }
    }

    async clearAllBooks() {
        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.clear();

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    console.log('모든 도서 삭제 완료');
                    this.updateStorageStats();
                    if (window.app) {
                        window.app.showNotification('모든 도서가 삭제되었습니다');
                    }
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('도서 전체 삭제 실패:', error);
            throw error;
        }
    }
}

// 저장소 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.bookStorage = new BookStorage();
});
