// 하이라이트 기능
class HighlightManager {
    constructor() {
        this.highlights = [];
        this.currentBookTitle = '';
        this.colors = [
            { name: '노랑', value: '#ffeb3b', textColor: '#000' },
            { name: '초록', value: '#4caf50', textColor: '#fff' },
            { name: '분홍', value: '#e91e63', textColor: '#fff' },
            { name: '파랑', value: '#2196f3', textColor: '#fff' },
            { name: '주황', value: '#ff9800', textColor: '#000' }
        ];
        this.selectedColor = this.colors[0];
        this.init();
    }

    init() {
        this.createHighlightUI();
        this.setupEventListeners();
        this.loadHighlights();
    }

    createHighlightUI() {
        // 하이라이트 버튼을 헤더에 추가
        const controls = document.querySelector('.controls');
        if (controls) {
            const highlightBtn = document.createElement('button');
            highlightBtn.id = 'highlightBtn';
            highlightBtn.className = 'control-btn highlight-btn';
            highlightBtn.title = '하이라이트 관리';
            highlightBtn.innerHTML = `
                <i class="fas fa-highlighter"></i>
                <span class="btn-text">하이라이트</span>
            `;
            
            // 북마크 버튼 다음에 삽입
            const bookmarkBtn = document.getElementById('bookmarkBtn');
            if (bookmarkBtn && bookmarkBtn.nextSibling) {
                controls.insertBefore(highlightBtn, bookmarkBtn.nextSibling);
            } else {
                controls.appendChild(highlightBtn);
            }
        }

        // 텍스트 선택 시 나타나는 툴팁
        const selectionTooltip = document.createElement('div');
        selectionTooltip.id = 'selectionTooltip';
        selectionTooltip.className = 'selection-tooltip';
        selectionTooltip.innerHTML = `
            <div class="tooltip-colors">
                ${this.colors.map((color, index) => `
                    <button class="tooltip-color-btn ${index === 0 ? 'active' : ''}" 
                            data-color="${color.value}" 
                            data-index="${index}"
                            style="background-color: ${color.value};"
                            title="${color.name}">
                    </button>
                `).join('')}
            </div>
            <button class="tooltip-highlight-btn">
                <i class="fas fa-highlighter"></i> 하이라이트
            </button>
        `;
        document.body.appendChild(selectionTooltip);

        // 하이라이트 관리 오버레이
        const highlightOverlay = document.createElement('div');
        highlightOverlay.id = 'highlightOverlay';
        highlightOverlay.className = 'highlight-overlay';
        highlightOverlay.innerHTML = `
            <div class="highlight-container">
                <div class="highlight-header">
                    <h2>
                        <i class="fas fa-highlighter"></i> 하이라이트
                    </h2>
                    <button id="closeHighlightBtn" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="highlight-stats">
                    <div class="highlight-stat-item">
                        <i class="fas fa-highlighter"></i>
                        <span id="highlightCount">0</span>개
                    </div>
                    ${this.colors.map(color => `
                        <div class="highlight-stat-color" style="background-color: ${color.value};"></div>
                    `).join('')}
                </div>

                <div class="highlight-list-container">
                    <div id="highlightList" class="highlight-list"></div>
                    <div id="emptyHighlightState" class="empty-highlight-state" style="display: none;">
                        <i class="fas fa-highlighter"></i>
                        <p>하이라이트가 없습니다</p>
                        <small>텍스트를 선택하여 하이라이트를 추가하세요</small>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(highlightOverlay);

        // 하이라이트 편집 모달
        const editHighlightModal = document.createElement('div');
        editHighlightModal.id = 'editHighlightModal';
        editHighlightModal.className = 'highlight-modal';
        editHighlightModal.innerHTML = `
            <div class="highlight-modal-content">
                <div class="highlight-modal-header">
                    <h3>하이라이트 편집</h3>
                    <button id="closeEditHighlightModal" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="highlight-modal-body">
                    <div class="highlight-form-group">
                        <label>선택된 텍스트</label>
                        <div id="editHighlightText" class="highlight-text-preview"></div>
                    </div>
                    <div class="highlight-form-group">
                        <label>색상</label>
                        <div class="highlight-color-picker">
                            ${this.colors.map((color, index) => `
                                <button class="highlight-color-option" 
                                        data-color="${color.value}"
                                        data-index="${index}"
                                        style="background-color: ${color.value};"
                                        title="${color.name}">
                                    <i class="fas fa-check"></i>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="highlight-form-group">
                        <label>메모 (선택사항)</label>
                        <textarea 
                            id="editHighlightNote" 
                            class="highlight-textarea" 
                            placeholder="하이라이트에 대한 메모를 입력하세요..."
                            rows="4"
                            maxlength="500"
                        ></textarea>
                    </div>
                </div>
                <div class="highlight-modal-footer">
                    <button id="cancelEditHighlight" class="highlight-modal-btn secondary">취소</button>
                    <button id="saveEditHighlight" class="highlight-modal-btn primary">저장</button>
                </div>
            </div>
        `;
        document.body.appendChild(editHighlightModal);
    }

    setupEventListeners() {
        // 하이라이트 버튼
        const highlightBtn = document.getElementById('highlightBtn');
        highlightBtn?.addEventListener('click', () => this.showHighlights());

        // 하이라이트 오버레이 닫기
        const closeHighlightBtn = document.getElementById('closeHighlightBtn');
        closeHighlightBtn?.addEventListener('click', () => this.hideHighlights());

        const highlightOverlay = document.getElementById('highlightOverlay');
        highlightOverlay?.addEventListener('click', (e) => {
            if (e.target === highlightOverlay) {
                this.hideHighlights();
            }
        });

        // 텍스트 선택 감지
        document.addEventListener('mouseup', (e) => this.handleTextSelection(e));
        document.addEventListener('touchend', (e) => this.handleTextSelection(e));

        // 선택 툴팁 색상 버튼
        document.querySelectorAll('.tooltip-color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.tooltip-color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const index = parseInt(btn.dataset.index);
                this.selectedColor = this.colors[index];
            });
        });

        // 선택 툴팁 하이라이트 버튼
        const tooltipHighlightBtn = document.querySelector('.tooltip-highlight-btn');
        tooltipHighlightBtn?.addEventListener('click', () => {
            this.createHighlight();
        });

        // 편집 모달
        const closeEditHighlightModal = document.getElementById('closeEditHighlightModal');
        const cancelEditHighlight = document.getElementById('cancelEditHighlight');
        const saveEditHighlight = document.getElementById('saveEditHighlight');

        closeEditHighlightModal?.addEventListener('click', () => this.hideEditModal());
        cancelEditHighlight?.addEventListener('click', () => this.hideEditModal());
        saveEditHighlight?.addEventListener('click', () => this.saveEditedHighlight());

        // 편집 모달 색상 선택
        document.querySelectorAll('.highlight-color-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.highlight-color-option').forEach(b => 
                    b.classList.remove('active')
                );
                btn.classList.add('active');
            });
        });
    }

    handleTextSelection(e) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length > 0) {
            // 도서 콘텐츠 내에서만 작동
            const bookContent = document.getElementById('bookContent');
            if (!bookContent?.contains(selection.anchorNode)) {
                return;
            }

            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            const tooltip = document.getElementById('selectionTooltip');
            if (tooltip) {
                tooltip.style.display = 'flex';
                tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
                tooltip.style.top = `${rect.top - 60}px`;
            }
        } else {
            this.hideSelectionTooltip();
        }
    }

    hideSelectionTooltip() {
        const tooltip = document.getElementById('selectionTooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    createHighlight() {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (!selectedText || !window.reader) {
            return;
        }

        const range = selection.getRangeAt(0);
        const bookContent = document.getElementById('bookContent');
        
        if (!bookContent?.contains(range.commonAncestorContainer)) {
            return;
        }

        // 하이라이트 데이터 생성
        const highlight = {
            id: Date.now(),
            text: selectedText,
            color: this.selectedColor.value,
            page: window.reader.currentPage,
            note: '',
            createdAt: Date.now(),
            bookTitle: window.reader.bookTitle
        };

        this.highlights.push(highlight);
        this.saveHighlights();
        this.applyHighlights();
        this.hideSelectionTooltip();
        selection.removeAllRanges();

        if (window.app) {
            window.app.showNotification('✨ 하이라이트가 추가되었습니다!');
        }
    }

    applyHighlights() {
        if (!window.reader) return;

        const bookContent = document.getElementById('bookContent');
        if (!bookContent) return;

        // 현재 페이지의 하이라이트만 적용
        const pageHighlights = this.highlights.filter(h => h.page === window.reader.currentPage);
        
        if (pageHighlights.length === 0) return;

        // 텍스트 노드를 찾아서 하이라이트 적용
        pageHighlights.forEach(highlight => {
            this.highlightTextInPage(highlight);
        });
    }

    highlightTextInPage(highlight) {
        const bookContent = document.getElementById('bookContent');
        if (!bookContent) return;

        const walker = document.createTreeWalker(
            bookContent,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            const index = text.indexOf(highlight.text);
            
            if (index !== -1) {
                const span = document.createElement('span');
                const beforeText = text.substring(0, index);
                const highlightedText = text.substring(index, index + highlight.text.length);
                const afterText = text.substring(index + highlight.text.length);

                span.innerHTML = beforeText;
                
                const mark = document.createElement('mark');
                mark.className = 'user-highlight';
                mark.style.backgroundColor = highlight.color;
                mark.style.cursor = 'pointer';
                mark.dataset.highlightId = highlight.id;
                mark.textContent = highlightedText;
                
                mark.addEventListener('click', () => {
                    this.showEditModal(highlight.id);
                });

                span.appendChild(mark);
                span.innerHTML += afterText;
                
                textNode.parentNode.replaceChild(span, textNode);
            }
        });
    }

    showHighlights() {
        this.loadHighlights();
        this.renderHighlightList();
        
        const highlightOverlay = document.getElementById('highlightOverlay');
        if (highlightOverlay) {
            highlightOverlay.style.display = 'flex';
        }
    }

    hideHighlights() {
        const highlightOverlay = document.getElementById('highlightOverlay');
        if (highlightOverlay) {
            highlightOverlay.style.display = 'none';
        }
    }

    renderHighlightList() {
        const highlightList = document.getElementById('highlightList');
        const emptyState = document.getElementById('emptyHighlightState');
        const highlightCount = document.getElementById('highlightCount');

        if (!highlightList || !emptyState) return;

        if (highlightCount) {
            highlightCount.textContent = this.highlights.length;
        }

        if (this.highlights.length === 0) {
            highlightList.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        // 페이지 순으로 정렬
        const sortedHighlights = [...this.highlights].sort((a, b) => a.page - b.page);

        highlightList.innerHTML = sortedHighlights.map(highlight => {
            const date = new Date(highlight.createdAt).toLocaleDateString();
            const colorName = this.colors.find(c => c.value === highlight.color)?.name || '색상';

            return `
                <div class="highlight-item" data-id="${highlight.id}">
                    <div class="highlight-item-header">
                        <div class="highlight-item-color" 
                             style="background-color: ${highlight.color};"
                             title="${colorName}">
                        </div>
                        <div class="highlight-item-actions">
                            <button class="highlight-edit-btn" data-id="${highlight.id}" title="편집">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="highlight-delete-btn" data-id="${highlight.id}" title="삭제">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="highlight-item-body">
                        <div class="highlight-item-text" style="border-left-color: ${highlight.color};">
                            "${this.escapeHtml(highlight.text)}"
                        </div>
                        ${highlight.note ? `
                            <div class="highlight-item-note">
                                <i class="fas fa-sticky-note"></i>
                                ${this.escapeHtml(highlight.note)}
                            </div>
                        ` : ''}
                        <div class="highlight-item-meta">
                            <span><i class="fas fa-file-alt"></i> 페이지 ${highlight.page + 1}</span>
                            <span><i class="fas fa-clock"></i> ${date}</span>
                        </div>
                    </div>
                    <button class="highlight-goto-btn" data-id="${highlight.id}">
                        <i class="fas fa-arrow-right"></i> 이동
                    </button>
                </div>
            `;
        }).join('');

        // 이벤트 리스너
        highlightList.querySelectorAll('.highlight-goto-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.goToHighlight(id);
            });
        });

        highlightList.querySelectorAll('.highlight-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.showEditModal(id);
            });
        });

        highlightList.querySelectorAll('.highlight-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.deleteHighlight(id);
            });
        });
    }

    showEditModal(highlightId) {
        const highlight = this.highlights.find(h => h.id === highlightId);
        if (!highlight) return;

        const modal = document.getElementById('editHighlightModal');
        const textPreview = document.getElementById('editHighlightText');
        const noteInput = document.getElementById('editHighlightNote');

        if (textPreview) {
            textPreview.textContent = `"${highlight.text}"`;
            textPreview.style.borderLeftColor = highlight.color;
        }

        if (noteInput) {
            noteInput.value = highlight.note;
        }

        // 색상 선택
        document.querySelectorAll('.highlight-color-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.color === highlight.color) {
                btn.classList.add('active');
            }
        });

        if (modal) {
            modal.style.display = 'flex';
            modal.dataset.editingId = highlightId;
        }

        // 하이라이트 오버레이 닫기
        this.hideHighlights();
    }

    hideEditModal() {
        const modal = document.getElementById('editHighlightModal');
        if (modal) {
            modal.style.display = 'none';
            delete modal.dataset.editingId;
        }
    }

    saveEditedHighlight() {
        const modal = document.getElementById('editHighlightModal');
        const highlightId = parseInt(modal?.dataset.editingId);
        
        if (!highlightId) return;

        const highlight = this.highlights.find(h => h.id === highlightId);
        if (!highlight) return;

        const noteInput = document.getElementById('editHighlightNote');
        const activeColorBtn = document.querySelector('.highlight-color-option.active');

        if (noteInput) {
            highlight.note = noteInput.value.trim();
        }

        if (activeColorBtn) {
            highlight.color = activeColorBtn.dataset.color;
        }

        highlight.updatedAt = Date.now();

        this.saveHighlights();
        this.applyHighlights();
        this.hideEditModal();

        if (window.app) {
            window.app.showNotification('✅ 하이라이트가 수정되었습니다!');
        }
    }

    deleteHighlight(highlightId) {
        const highlight = this.highlights.find(h => h.id === highlightId);
        if (!highlight) return;

        const confirmed = confirm('이 하이라이트를 삭제하시겠습니까?');
        if (!confirmed) return;

        this.highlights = this.highlights.filter(h => h.id !== highlightId);
        this.saveHighlights();
        this.renderHighlightList();
        this.applyHighlights();

        if (window.app) {
            window.app.showNotification('🗑️ 하이라이트가 삭제되었습니다');
        }
    }

    goToHighlight(highlightId) {
        const highlight = this.highlights.find(h => h.id === highlightId);
        if (!highlight || !window.reader) return;

        window.reader.goToPage(highlight.page);
        this.hideHighlights();

        setTimeout(() => {
            this.applyHighlights();
            
            // 하이라이트된 요소로 스크롤
            const mark = document.querySelector(`[data-highlight-id="${highlightId}"]`);
            if (mark) {
                mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // 깜빡임 효과
                mark.style.animation = 'highlightPulse 1s ease';
                setTimeout(() => {
                    mark.style.animation = '';
                }, 1000);
            }
        }, 400);

        if (window.app) {
            window.app.showNotification('📍 하이라이트로 이동했습니다');
        }
    }

    loadHighlights() {
        if (!window.reader || !window.reader.bookTitle) return;
        
        this.currentBookTitle = window.reader.bookTitle;
        const saved = localStorage.getItem(`highlights-${this.currentBookTitle}`);
        
        if (saved) {
            try {
                this.highlights = JSON.parse(saved);
            } catch (error) {
                console.error('하이라이트 로드 실패:', error);
                this.highlights = [];
            }
        }
    }

    saveHighlights() {
        if (!this.currentBookTitle) return;
        localStorage.setItem(`highlights-${this.currentBookTitle}`, JSON.stringify(this.highlights));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 하이라이트 관리자 초기화
document.addEventListener('DOMContentLoaded', () => {
    const initHighlightManager = () => {
        if (window.reader) {
            window.highlightManager = new HighlightManager();
            
            // 페이지 변경 시 하이라이트 재적용
            const originalGoToPage = window.reader.goToPage;
            window.reader.goToPage = function(pageNumber) {
                originalGoToPage.call(this, pageNumber);
                setTimeout(() => {
                    if (window.highlightManager) {
                        window.highlightManager.applyHighlights();
                    }
                }, 200);
            };
        } else {
            setTimeout(initHighlightManager, 100);
        }
    };
    initHighlightManager();
});
