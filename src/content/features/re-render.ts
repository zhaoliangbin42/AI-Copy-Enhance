import { MarkdownRenderer } from '@/renderer/core/MarkdownRenderer';
import { StyleManager } from '@/renderer/styles/StyleManager';
import { LRUCache } from '@/renderer/utils/LRUCache';
import { MessageCollector, MessageRef } from '../utils/MessageCollector';

// ✅ Type for getMarkdown function
type GetMarkdownFn = (element: HTMLElement) => string;

/**
 * Panel overlay styles
 */
const panelStyles = `
.aicopy-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 15, 15, 0.6);
  z-index: 999998;
  backdrop-filter: blur(8px);
}

.aicopy-panel {
  position: fixed;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 900px;
  height: 80vh;
  background: white;
  border-radius: 16px;
  box-shadow: 
    0 0 0 1px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 16px 48px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  z-index: 999999;
  overflow: hidden;
  animation: modalFadeIn 0.2s ease;
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.aicopy-panel-fullscreen {
  top: 0 !important;
  left: 0 !important;
  transform: none !important;
  width: 100vw !important;
  max-width: none !important;
  height: 100vh !important;
  border-radius: 0 !important;
}

.aicopy-panel-header {
  padding: 8px 24px;
  border-bottom: 1px solid #E9E9E7;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  flex-shrink: 0;
}

.aicopy-panel-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.aicopy-panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #37352F;
  margin: 0;
}

.aicopy-panel-fullscreen-btn, .aicopy-panel-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #6B7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.aicopy-panel-fullscreen-btn:hover, .aicopy-panel-close:hover {
  background: #F3F4F6;
  color: #1A1A1A;
}

.aicopy-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0px 32px;
  background: white;
}

.aicopy-panel-body .markdown-body {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}

/* ✅ 新增: 分页器样式 */
.aicopy-pagination {
  padding: 16px 24px;
  border-top: 1px solid #E9E9E7;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  background: white;
  flex-shrink: 0;
}

.aicopy-pagination-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #E9E9E7;
  background: white;
  color: #37352F;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.15s ease;
}

.aicopy-pagination-btn:hover:not(:disabled) {
  background: #F3F4F6;
  border-color: #D1D5DB;
}

.aicopy-pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.aicopy-pagination-info {
  font-size: 14px;
  color: #6B7280;
  min-width: 80px;
  text-align: center;
}

.aicopy-pagination-select {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #E9E9E7;
  background: white;
  color: #37352F;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.aicopy-pagination-select:hover {
  background: #F9FAFB;
  border-color: #D1D5DB;
}

/* Dark mode */
:host([data-theme='dark']) .aicopy-panel-overlay {
  background: rgba(0, 0, 0, 0.8);
}

:host([data-theme='dark']) .aicopy-panel,
:host([data-theme='dark']) .aicopy-panel-header,
:host([data-theme='dark']) .aicopy-panel-body,
:host([data-theme='dark']) .aicopy-pagination {
  background: #1E1E1E;
  border-color: #3F3F46;
}

:host([data-theme='dark']) .aicopy-panel-title,
:host([data-theme='dark']) .aicopy-pagination-info {
  color: #FFFFFF;
}

:host([data-theme='dark']) .aicopy-pagination-btn,
:host([data-theme='dark']) .aicopy-pagination-select {
  background: #27272A;
  border-color: #3F3F46;
  color: #FFFFFF;
}

:host([data-theme='dark']) .aicopy-pagination-btn:hover:not(:disabled),
:host([data-theme='dark']) .aicopy-pagination-select:hover {
  background: #3F3F46;
}
`;

/**
 * Re-render panel with message pagination
 */
export class ReRenderPanel {
    private container: HTMLElement | null = null;
    private currentThemeIsDark: boolean = false;
    private messages: MessageRef[] = [];
    private currentIndex: number = 0;
    private cache: LRUCache<number, string> = new LRUCache(10);
    private getMarkdownFn?: GetMarkdownFn; // ✅ 保存getMarkdown方法

    /**
     * Show panel with message pagination
     * @param messageElement - 被点击的消息元素
     * @param getMarkdown - 获取markdown源码的方法 (来自ContentScript)
     */
    async show(messageElement: HTMLElement, getMarkdown: GetMarkdownFn): Promise<void> {
        const showStartTime = performance.now();
        console.log('[ReRenderPanel] ⏱️  START show');

        this.getMarkdownFn = getMarkdown; // ✅ 保存方法
        this.hide();

        // ✅ 懒加载: 只收集article引用,不解析内容
        const t0 = performance.now();
        this.messages = MessageCollector.collectMessages();
        console.log(`[AI-MarkDone][ReRenderPanel]   collectMessages: ${(performance.now() - t0).toFixed(2)}ms, count: ${this.messages.length}`);

        if (this.messages.length === 0) {
            console.warn('[AI-MarkDone][ReRenderPanel] No messages found');
            return;
        }

        // 找到被点击的消息索引
        this.currentIndex = MessageCollector.findMessageIndex(messageElement, this.messages);
        if (this.currentIndex === -1) {
            this.currentIndex = this.messages.length - 1; // Fallback到最后一条
        }
        console.log(`[AI-MarkDone][ReRenderPanel]   currentIndex: ${this.currentIndex}/${this.messages.length}`);

        await this.createPanel(); // ✅ createPanel内部会调用renderMessage,不需要再调用

        const showEndTime = performance.now();
        console.log(`[AI-MarkDone][ReRenderPanel] ✅ END show: ${(showEndTime - showStartTime).toFixed(2)}ms`);
    }

    /**
     * Hide panel
     */
    hide(): void {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.cache.clear();
    }

    /**
     * Set theme
     */
    setTheme(isDark: boolean): void {
        this.currentThemeIsDark = isDark;
        if (this.container) {
            this.container.dataset.theme = isDark ? 'dark' : 'light';
        }
    }

    /**
     * Create panel with shadow DOM
     */
    private async createPanel(): Promise<void> {
        // Create container
        this.container = document.createElement('div');
        this.container.dataset.theme = this.currentThemeIsDark ? 'dark' : 'light';

        // Attach Shadow DOM
        const shadowRoot = this.container.attachShadow({ mode: 'open' });

        // Inject styles
        await StyleManager.injectStyles(shadowRoot, this.currentThemeIsDark);

        const panelStyleEl = document.createElement('style');
        panelStyleEl.textContent = panelStyles;
        shadowRoot.appendChild(panelStyleEl);

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'aicopy-panel-overlay';
        overlay.addEventListener('click', () => this.hide());

        // Create panel
        const panel = document.createElement('div');
        panel.className = 'aicopy-panel';
        panel.addEventListener('click', (e) => e.stopPropagation());

        // Header
        const header = this.createHeader();

        // Body
        const body = document.createElement('div');
        body.className = 'aicopy-panel-body';
        body.id = 'panel-body';

        // ✅ 分页器
        const pagination = this.createPagination();

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(pagination);

        shadowRoot.appendChild(overlay);
        shadowRoot.appendChild(panel);

        document.body.appendChild(this.container);

        // 渲染当前消息
        await this.renderMessage(this.currentIndex);

        // ESC键关闭
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.hide();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Create header
     */
    private createHeader(): HTMLElement {
        const header = document.createElement('div');
        header.className = 'aicopy-panel-header';
        header.innerHTML = `
      <div class="aicopy-panel-header-left">
        <h2 class="aicopy-panel-title">Rendered Markdown</h2>
        <button class="aicopy-panel-fullscreen-btn" title="Toggle fullscreen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
        </button>
      </div>
      <button class="aicopy-panel-close" title="Close">×</button>
    `;

        header.querySelector('.aicopy-panel-close')?.addEventListener('click', () => this.hide());
        header.querySelector('.aicopy-panel-fullscreen-btn')?.addEventListener('click', () => this.toggleFullscreen());

        return header;
    }

    /**
     * ✅ 创建分页器
     */
    private createPagination(): HTMLElement {
        const pagination = document.createElement('div');
        pagination.className = 'aicopy-pagination';

        pagination.innerHTML = `
      <button class="aicopy-pagination-btn" id="prev-btn" title="Previous (←)">←</button>
      <span class="aicopy-pagination-info" id="page-info">${this.currentIndex + 1} / ${this.messages.length}</span>
      <button class="aicopy-pagination-btn" id="next-btn" title="Next (→)">→</button>
      <select class="aicopy-pagination-select" id="page-select" title="Jump to message">
        ${this.messages.map((_, i) => `<option value="${i}" ${i === this.currentIndex ? 'selected' : ''}>Message ${i + 1}</option>`).join('')}
      </select>
    `;

        // 绑定事件
        pagination.querySelector('#prev-btn')?.addEventListener('click', () => this.navigate(-1));
        pagination.querySelector('#next-btn')?.addEventListener('click', () => this.navigate(1));
        pagination.querySelector('#page-select')?.addEventListener('change', (e) => {
            const select = e.target as HTMLSelectElement;
            this.navigateTo(parseInt(select.value));
        });

        this.updatePaginationState(pagination);

        return pagination;
    }

    /**
     * Navigate by offset
     */
    private async navigate(offset: number): Promise<void> {
        const newIndex = this.currentIndex + offset;
        await this.navigateTo(newIndex);
    }

    /**
     * Navigate to specific index
     */
    private async navigateTo(index: number): Promise<void> {
        if (index < 0 || index >= this.messages.length || index === this.currentIndex) {
            return;
        }

        this.currentIndex = index;
        await this.renderMessage(index);

        // 更新分页器状态
        const shadowRoot = this.container?.shadowRoot;
        if (shadowRoot) {
            const pagination = shadowRoot.querySelector('.aicopy-pagination');
            if (pagination) {
                this.updatePaginationState(pagination as HTMLElement);
            }
        }
    }

    /**
     * Update pagination button states
     */
    private updatePaginationState(pagination: HTMLElement): void {
        const prevBtn = pagination.querySelector('#prev-btn') as HTMLButtonElement;
        const nextBtn = pagination.querySelector('#next-btn') as HTMLButtonElement;
        const pageInfo = pagination.querySelector('#page-info');
        const pageSelect = pagination.querySelector('#page-select') as HTMLSelectElement;

        if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentIndex === this.messages.length - 1;
        if (pageInfo) pageInfo.textContent = `${this.currentIndex + 1} / ${this.messages.length}`;
        if (pageSelect) pageSelect.value = this.currentIndex.toString();
    }

    /**
     * ✅ 懒加载渲染消息
     */
    private async renderMessage(index: number): Promise<void> {
        const messageRef = this.messages[index];

        // 检查缓存
        let html = this.cache.get(index);

        if (!html) {
            // ✅ 只有在需要时才解析内容
            if (!messageRef.parsed && this.getMarkdownFn) {
                try {
                    const t0 = performance.now();
                    // ✅ 正确: 使用ContentScript的getMarkdown (复用复制功能逻辑)
                    messageRef.parsed = this.getMarkdownFn(messageRef.element);
                    console.log(`[AI-MarkDone][ReRenderPanel]   getMarkdown: ${(performance.now() - t0).toFixed(2)}ms`);
                } catch (error) {
                    console.error('[AI-MarkDone][ReRenderPanel] Parse failed:', error);
                    messageRef.parsed = 'Failed to parse message';
                }
            }

            // 渲染 (messageRef.parsed现在一定有值)
            const t1 = performance.now();
            const result = await MarkdownRenderer.render(messageRef.parsed!);
            console.log(`[AI-MarkDone][ReRenderPanel]   MarkdownRenderer.render: ${(performance.now() - t1).toFixed(2)}ms`);
            html = result.success ? result.html! : result.fallback!;

            // 缓存
            this.cache.set(index, html);
        } else {
            console.log(`[AI-MarkDone][ReRenderPanel]   ✅ Using cache for message ${index}`);
        }

        // 更新DOM (带淡入动画)
        const shadowRoot = this.container?.shadowRoot;
        if (shadowRoot) {
            const body = shadowRoot.querySelector('#panel-body');
            if (body) {
                // 淡出
                body.classList.add('fade-out');
                await new Promise(resolve => setTimeout(resolve, 150));

                // 更新内容
                // 淡入
                setTimeout(() => {
                    if (body) {
                        body.classList.remove('fade-out');
                        body.classList.add('fade-in');
                        // ✅ 关键修复:包裹在.markdown-body中使CSS生效
                        body.innerHTML = `<div class="markdown-body">${html!}</div>`;
                        StyleManager.injectStyles(shadowRoot!, false)
                            .then(() => {
                                this.updatePaginationState(shadowRoot.querySelector('.aicopy-pagination')!);
                            });
                    }
                }, 150); // Animation duration
            }
        }
    }

    /**
     * Toggle fullscreen
     */
    private toggleFullscreen(): void {
        if (!this.container) return;
        const panel = this.container.shadowRoot?.querySelector('.aicopy-panel');
        panel?.classList.toggle('aicopy-panel-fullscreen');
    }
}
