// 공개 도서관 관리 (모든 사용자가 볼 수 있는 도서 목록)

class PublicLibrary {
    constructor() {
        this.dbName = 'PublicLibraryDB';
        this.storeName = 'public-books';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('공개 도서관 DB 열기 실패:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('공개 도서관 DB 초기화 완료');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // 인덱스 생성
                    objectStore.createIndex('title', 'title', { unique: false });
                    objectStore.createIndex('author', 'author', { unique: false });
                    objectStore.createIndex('addedAt', 'addedAt', { unique: false });
                    
                    console.log('공개 도서관 DB 스키마 생성 완료');
                }
            };
        });
    }

    async addBook(bookData) {
        if (!this.db) {
            await this.init();
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            
            const book = {
                title: bookData.title,
                author: bookData.author || '작자 미상',
                summary: bookData.summary || '',
                gdriveUrl: bookData.gdriveUrl,
                gdriveId: bookData.gdriveId,
                source: bookData.source, // 'docs', 'sheets', 'file'
                coverUrl: bookData.coverUrl || null,
                category: bookData.category || '일반',
                addedAt: Date.now(),
                views: 0
            };

            return new Promise((resolve, reject) => {
                const request = objectStore.add(book);
                
                request.onsuccess = () => {
                    console.log('도서관에 책 추가 완료:', book.title);
                    resolve(request.result); // 생성된 ID 반환
                };
                
                request.onerror = () => {
                    console.error('책 추가 실패:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('addBook failed:', error);
            throw error;
        }
    }

    async getAllBooks() {
        if (!this.db) {
            await this.init();
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.getAll();

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    resolve(request.result || []);
                };
                
                request.onerror = () => {
                    console.error('getAllBooks error:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('getAllBooks failed:', error);
            return [];
        }
    }

    async getBook(id) {
        if (!this.db) {
            await this.init();
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(id);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('getBook failed:', error);
            return null;
        }
    }

    async updateBook(id, bookData) {
        if (!this.db) {
            await this.init();
        }

        try {
            const book = await this.getBook(id);
            if (!book) {
                throw new Error('책을 찾을 수 없습니다');
            }

            // 업데이트할 필드만 변경
            Object.keys(bookData).forEach(key => {
                if (bookData[key] !== undefined) {
                    book[key] = bookData[key];
                }
            });

            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.put(book);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    console.log('책 정보 업데이트 완료:', book.title);
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('updateBook failed:', error);
            throw error;
        }
    }

    async deleteBook(id) {
        if (!this.db) {
            await this.init();
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.delete(id);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    console.log('도서관에서 책 삭제 완료:', id);
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('deleteBook failed:', error);
            throw error;
        }
    }

    async incrementViews(id) {
        try {
            const book = await this.getBook(id);
            if (book) {
                book.views = (book.views || 0) + 1;
                await this.updateBook(id, { views: book.views });
            }
        } catch (error) {
            console.error('incrementViews failed:', error);
        }
    }

    async searchBooks(query) {
        const allBooks = await this.getAllBooks();
        const lowerQuery = query.toLowerCase();

        return allBooks.filter(book => {
            return book.title.toLowerCase().includes(lowerQuery) ||
                   book.author.toLowerCase().includes(lowerQuery) ||
                   (book.summary && book.summary.toLowerCase().includes(lowerQuery));
        });
    }

    async getBooksByCategory(category) {
        const allBooks = await this.getAllBooks();
        return allBooks.filter(book => book.category === category);
    }

    async getRecentBooks(limit = 10) {
        const allBooks = await this.getAllBooks();
        return allBooks
            .sort((a, b) => b.addedAt - a.addedAt)
            .slice(0, limit);
    }

    async getPopularBooks(limit = 10) {
        const allBooks = await this.getAllBooks();
        return allBooks
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, limit);
    }
}

// 전역 인스턴스 생성
window.publicLibrary = new PublicLibrary();
