import { adapterRegistry } from './adapters/registry';
import { MessageObserver } from './observers/mutation-observer';
import { ToolbarInjector } from './injectors/toolbar-injector';
import { Toolbar, ToolbarCallbacks } from './components/toolbar';
import { Modal } from './components/modal';
import { MarkdownParser } from './parsers/markdown-parser';
import { MathClickHandler } from './features/math-click';
import { ReRenderPanel } from './features/re-render';
import { logger, LogLevel } from '../utils/logger';

/**
 * Main content script controller
 */
class ContentScript {
    private observer: MessageObserver | null = null;
    private injector: ToolbarInjector | null = null;
    private markdownParser: MarkdownParser;
    private mathClickHandler: MathClickHandler;
    private reRenderPanel: ReRenderPanel;

    constructor() {
        // Set log level (change to DEBUG for development)
        logger.setLevel(LogLevel.ERROR);

        // Initialize components
        this.markdownParser = new MarkdownParser();
        this.mathClickHandler = new MathClickHandler();
        this.reRenderPanel = new ReRenderPanel();

        logger.info('AI Copy Enhance initialized');
    }

    /**
     * Start the extension
     */
    start(): void {
        // Check if current page is supported
        if (!adapterRegistry.isSupported()) {
            logger.warn('Current page is not supported');
            return;
        }

        const adapter = adapterRegistry.getAdapter();
        if (!adapter) {
            logger.error('Failed to get adapter');
            return;
        }

        logger.info('Starting extension on supported page');

        // Initialize injector
        this.injector = new ToolbarInjector(adapter);

        // Initialize observer
        this.observer = new MessageObserver(adapter, (messageElement) => {
            this.handleNewMessage(messageElement);
        });

        // Start observing
        this.observer.start();
    }

    /**
     * Handle new message detected
     */
    private handleNewMessage(messageElement: HTMLElement): void {
        logger.debug('Handling new message');

        // CRITICAL: Check if toolbar already exists BEFORE creating new one
        // This prevents creating orphaned toolbar objects with wrong messageElement bindings
        if (messageElement.querySelector('.aicopy-toolbar-container')) {
            logger.debug('Toolbar already exists, skipping');
            return;
        }

        // Create toolbar with callbacks
        const callbacks: ToolbarCallbacks = {
            onCopyMarkdown: async () => {
                return this.getMarkdown(messageElement);
            },
            onViewSource: () => {
                this.showSourceModal(messageElement);
            },
            onReRender: () => {
                this.showReRenderPanel(messageElement);
            }
        };

        const toolbar = new Toolbar(callbacks);

        // Inject toolbar
        if (this.injector) {
            this.injector.inject(messageElement, toolbar.getElement());
        }

        // Enable click-to-copy for math elements
        this.mathClickHandler.enable(messageElement);
    }

    /**
     * Get Markdown from message element
     */
    private getMarkdown(messageElement: HTMLElement): string {
        const adapter = adapterRegistry.getAdapter();
        if (!adapter) return '';

        // For Deep Research (article elements), parse the entire article
        // because it contains multiple .deep-research-result divs
        if (messageElement.tagName.toLowerCase() === 'article') {
            logger.debug('[getMarkdown] Article element detected, parsing entire article');
            return this.markdownParser.parse(messageElement);
        }

        // For regular messages, find the content element
        const contentSelector = adapter.getMessageContentSelector();
        if (!contentSelector) return '';

        const contentElement = messageElement.querySelector(contentSelector);
        if (!contentElement || !(contentElement instanceof HTMLElement)) {
            logger.debug('[getMarkdown] Content element not found');
            return '';
        }
        return this.markdownParser.parse(contentElement);
    }

    /**
     * Show source code modal
     */
    private showSourceModal(messageElement: HTMLElement): void {
        const markdown = this.getMarkdown(messageElement);
        const modal = new Modal();
        modal.show(markdown, 'Markdown Source Code');
    }

    /**
     * Show re-render preview panel
     */
    private showReRenderPanel(messageElement: HTMLElement): void {
        const markdown = this.getMarkdown(messageElement);
        this.reRenderPanel.show(markdown);
    }

    /**
     * Stop the extension
     */
    stop(): void {
        if (this.observer) {
            this.observer.stop();
            this.observer = null;
        }
        logger.info('Extension stopped');
    }
}

// Initialize and start when DOM is ready
function initExtension() {
    logger.info('Initializing AI Copy Enhance extension');
    logger.debug('Document readyState:', document.readyState);
    logger.debug('Current URL:', window.location.href);

    const contentScript = new ContentScript();
    contentScript.start();

    // Also listen for URL changes (for SPA navigation)
    let lastUrl = window.location.href;
    new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            logger.info('URL changed, reinitializing:', currentUrl);
            // Small delay to let the new page render
            setTimeout(() => {
                const newScript = new ContentScript();
                newScript.start();
            }, 500);
        }
    }).observe(document.body, { subtree: true, childList: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExtension);
} else {
    // DOM already loaded, start immediately
    initExtension();
}
