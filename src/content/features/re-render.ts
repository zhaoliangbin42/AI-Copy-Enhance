import { MarkdownRenderer } from '@/renderer/core/MarkdownRenderer';
import { StyleManager } from '@/renderer/styles/StyleManager';
import { LRUCache } from '@/renderer/utils/LRUCache';
import { MessageCollector } from '../utils/MessageCollector';
import { TooltipManager, tooltipStyles } from '../utils/TooltipManager';
import { DotPaginationController } from '../utils/DotPaginationController';
import { NavigationButtonsController } from '../utils/NavigationButtonsController';
import { readerPanelStyles } from '../utils/ReaderPanelStyles';
import { DesignTokens } from '../../utils/design-tokens';
import { logger } from '../../utils/logger';
import { ReaderItem, resolveContent } from '../types/ReaderTypes';
import { collectFromLivePage, getMessageRefs } from '../datasource/LivePageDataSource';

type GetMarkdownFn = (element: HTMLElement) => string;

/**
 * Reader Panel - 通用 Markdown 阅读器
 * 
 * 设计原则（重构后）：
 * - 数据驱动：通过 ReaderItem[] 接收数据
 * - 与数据源解耦：不关心数据来自 DOM 还是存储
 * - 支持懒加载：ContentProvider 可以是函数
 * 
 * 协调模块：
 * - DotPaginationController: 分页 UI
 * - TooltipManager: 提示框
 * - MarkdownRenderer: 内容渲染
 */
export class ReaderPanel {
    private container: HTMLElement | null = null;
    private shadowRoot: ShadowRoot | null = null;
    private currentThemeIsDark: boolean = false;
    private items: ReaderItem[] = [];
    private currentIndex: number = 0;
    private cache: LRUCache<number, string> = new LRUCache(10);

    // Modular components
    private tooltipManager: TooltipManager | null = null;
    private paginationController: DotPaginationController | null = null;
    private navButtonsController: NavigationButtonsController | null = null;
    private keyHandler: ((e: KeyboardEvent) => void) | null = null;

    /**
     * 【新方法】通用入口：接受标准化的 ReaderItem[]
     * 
     * @param items - 阅读器数据项数组
     * @param startIndex - 初始显示的索引
     */
    async showWithData(items: ReaderItem[], startIndex: number = 0): Promise<void> {
        const startTime = performance.now();
        logger.debug('[ReaderPanel] START showWithData');

        this.hide();
        this.items = items;

        if (this.items.length === 0) {
            logger.warn('[ReaderPanel] No items to display');
            return;
        }

        // 验证并设置起始索引
        this.currentIndex = Math.max(0, Math.min(startIndex, this.items.length - 1));
        logger.debug(`[ReaderPanel] currentIndex: ${this.currentIndex}/${this.items.length}`);

        // 创建面板 UI
        await this.createPanel();

        logger.debug(`[ReaderPanel] END showWithData: ${(performance.now() - startTime).toFixed(2)}ms`);
    }

    /**
     * 【兼容层】保留旧签名，供现有调用方使用
     * 
     * @deprecated 建议使用 showWithData()
     */
    async show(messageElement: HTMLElement, getMarkdown: GetMarkdownFn): Promise<void> {
        const startTime = performance.now();
        logger.debug('[ReaderPanel] START show (compat layer)');

        // 使用新的数据源适配器收集数据
        const items = collectFromLivePage(getMarkdown);

        if (items.length === 0) {
            logger.warn('[ReaderPanel] No messages found');
            return;
        }

        // 查找当前消息索引
        const messageRefs = getMessageRefs();
        let startIndex = MessageCollector.findMessageIndex(messageElement, messageRefs);
        if (startIndex === -1) {
            startIndex = items.length - 1;
        }

        logger.debug(`[ReaderPanel] Compat layer prepared ${items.length} items in ${(performance.now() - startTime).toFixed(2)}ms`);

        // 委托给新方法
        return this.showWithData(items, startIndex);
    }

    /**
     * 隐藏面板并清理
     */
    hide(): void {
        this.container?.remove();
        this.container = null;
        this.shadowRoot = null;
        this.cache.clear();

        // 清理子组件
        this.tooltipManager?.destroy();
        this.tooltipManager = null;

        this.paginationController?.destroy();
        this.paginationController = null;

        this.navButtonsController?.destroy();
        this.navButtonsController = null;

        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
    }

    /**
     * 设置主题
     */
    setTheme(isDark: boolean): void {
        this.currentThemeIsDark = isDark;
        if (this.container) {
            this.container.dataset.theme = isDark ? 'dark' : 'light';
        }
    }

    /**
     * 创建面板 (Shadow DOM)
     */
    private async createPanel(): Promise<void> {
        // 创建容器
        this.container = document.createElement('div');
        this.container.dataset.theme = this.currentThemeIsDark ? 'dark' : 'light';

        // 挂载 Shadow DOM
        this.shadowRoot = this.container.attachShadow({ mode: 'open' });

        // 注入样式
        await StyleManager.injectStyles(this.shadowRoot);

        // 注入 Design Tokens
        const tokenStyle = document.createElement('style');
        tokenStyle.id = 'design-tokens';
        tokenStyle.textContent = `:host { ${DesignTokens.getCompleteTokens(this.currentThemeIsDark)} }`;
        this.shadowRoot.insertBefore(tokenStyle, this.shadowRoot.firstChild);

        const styleEl = document.createElement('style');
        styleEl.textContent = readerPanelStyles + tooltipStyles;
        this.shadowRoot.appendChild(styleEl);

        // 创建 UI 结构
        const overlay = this.createOverlay();
        const panel = this.createPanelElement();

        this.shadowRoot.appendChild(overlay);
        this.shadowRoot.appendChild(panel);
        document.body.appendChild(this.container);

        // 渲染当前消息
        await this.renderMessage(this.currentIndex);

        // 设置键盘导航
        this.setupKeyboardNavigation(panel);

        // 聚焦面板
        panel.focus();
    }

    /**
     * 创建遮罩层
     */
    private createOverlay(): HTMLElement {
        const overlay = document.createElement('div');
        overlay.className = 'aicopy-panel-overlay';
        overlay.addEventListener('click', () => this.hide());
        return overlay;
    }

    /**
     * 创建主面板
     */
    private createPanelElement(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = 'aicopy-panel';
        panel.setAttribute('tabindex', '0');
        panel.addEventListener('click', (e) => e.stopPropagation());

        // Header
        panel.appendChild(this.createHeader());

        // Body
        const body = document.createElement('div');
        body.className = 'aicopy-panel-body';
        body.id = 'panel-body';
        panel.appendChild(body);

        // Pagination
        panel.appendChild(this.createPagination());

        return panel;
    }

    /**
     * 创建头部
     */
    private createHeader(): HTMLElement {
        const header = document.createElement('div');
        header.className = 'aicopy-panel-header';
        header.innerHTML = `
            <div class="aicopy-panel-header-left">
                <h2 class="aicopy-panel-title">Reader</h2>
                <button class="aicopy-panel-btn" id="fullscreen-btn" title="Toggle fullscreen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                    </svg>
                </button>
            </div>
            <button class="aicopy-panel-btn" id="close-btn" title="Close">×</button>
        `;

        header.querySelector('#close-btn')?.addEventListener('click', () => this.hide());
        header.querySelector('#fullscreen-btn')?.addEventListener('click', () => this.toggleFullscreen());

        return header;
    }

    /**
     * 创建分页控件
     */
    private createPagination(): HTMLElement {
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'aicopy-pagination';

        logger.debug(`[ReaderPanel] Creating pagination for ${this.items.length} items`);

        // 初始化分页控制器
        this.paginationController = new DotPaginationController(paginationContainer, {
            totalItems: this.items.length,
            currentIndex: this.currentIndex,
            onNavigate: (index) => this.navigateTo(index)
        });

        this.paginationController.render();

        logger.debug(`[ReaderPanel] Pagination rendered, container has ${this.paginationController.getDots().length} dots`);

        // 创建导航按钮控制器
        this.navButtonsController = new NavigationButtonsController(
            paginationContainer,
            {
                onPrevious: () => {
                    if (this.currentIndex > 0) {
                        this.navigateTo(this.currentIndex - 1);
                    }
                },
                onNext: () => {
                    if (this.currentIndex < this.items.length - 1) {
                        this.navigateTo(this.currentIndex + 1);
                    }
                },
                canGoPrevious: this.currentIndex > 0,
                canGoNext: this.currentIndex < this.items.length - 1
            }
        );
        this.navButtonsController.render();

        // 初始化提示管理器
        if (this.shadowRoot) {
            this.tooltipManager = new TooltipManager(this.shadowRoot);
            const dots = this.paginationController.getDots();

            dots.forEach((dot, index) => {
                this.tooltipManager!.attach(dot, {
                    index,
                    text: this.items[index].userPrompt || `Message ${index + 1}`,
                    maxLength: 100
                });
            });
        }

        // 添加键盘提示
        const hint = document.createElement('span');
        hint.className = 'aicopy-keyboard-hint';
        hint.textContent = '"← →" to navigate';
        paginationContainer.appendChild(hint);

        return paginationContainer;
    }

    /**
     * 设置键盘导航
     */
    private setupKeyboardNavigation(panel: HTMLElement): void {
        // ESC 关闭
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.hide();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // 方向键导航
        this.keyHandler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.paginationController?.previous();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.paginationController?.next();
            }
        };

        panel.addEventListener('keydown', this.keyHandler);
    }

    /**
     * 导航到指定索引
     */
    private async navigateTo(index: number): Promise<void> {
        if (index < 0 || index >= this.items.length) return;

        this.currentIndex = index;
        this.paginationController?.setActiveIndex(index);

        // 更新导航按钮状态
        this.navButtonsController?.updateConfig({
            canGoPrevious: index > 0,
            canGoNext: index < this.items.length - 1
        });

        // 重置滚动位置
        if (this.shadowRoot) {
            const body = this.shadowRoot.querySelector('#panel-body');
            body?.scrollTo(0, 0);
        }

        await this.renderMessage(index);
    }

    /**
     * 懒加载并渲染消息内容
     */
    private async renderMessage(index: number): Promise<void> {
        const item = this.items[index];

        // 检查缓存
        let html = this.cache.get(index);

        if (!html) {
            try {
                // 解析内容（支持懒加载）
                const t0 = performance.now();
                const markdown = await resolveContent(item.content);
                logger.debug(`[ReaderPanel] resolveContent: ${(performance.now() - t0).toFixed(2)}ms`);

                // 渲染 Markdown
                const t1 = performance.now();
                const result = await MarkdownRenderer.render(markdown);
                logger.debug(`[ReaderPanel] MarkdownRenderer.render: ${(performance.now() - t1).toFixed(2)}ms`);
                html = result.success ? result.html! : result.fallback!;

                // 清理空白
                html = html.replace(/^\s+/, '').trim();

                // 缓存
                this.cache.set(index, html);
            } catch (error) {
                logger.error('[ReaderPanel] Render failed:', error);
                html = '<div class="markdown-fallback">Failed to render content</div>';
            }
        } else {
            logger.debug(`[ReaderPanel] Using cache for item ${index}`);
        }

        // 更新 DOM
        if (this.shadowRoot) {
            const body = this.shadowRoot.querySelector('#panel-body');
            if (body) {
                // 截断用户提示
                const rawPrompt = item.userPrompt || '';
                const normalizedPrompt = rawPrompt.replace(/\n{2,}/g, '\n').trim();
                const displayPrompt = normalizedPrompt.length > 200
                    ? normalizedPrompt.slice(0, 200) + '...'
                    : normalizedPrompt;

                // 图标
                const userIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;

                // 从 meta 获取平台图标，或使用默认值
                const modelIcon = item.meta?.platformIcon || `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>`;

                body.innerHTML = `
                    <div class="message-user-header">
                        <div class="user-icon">${userIcon}</div>
                        <div class="user-content">${this.escapeHtml(displayPrompt)}</div>
                    </div>
                    
                    <div class="message-model-container">
                        <div class="model-icon">${modelIcon}</div>
                        <div class="markdown-body">${html}</div>
                    </div>
                `;
            }
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 切换全屏模式
     */
    private toggleFullscreen(): void {
        if (!this.shadowRoot) return;
        const panel = this.shadowRoot.querySelector('.aicopy-panel');
        panel?.classList.toggle('aicopy-panel-fullscreen');
    }
}
