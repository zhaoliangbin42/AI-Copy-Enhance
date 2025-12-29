import { SiteAdapter } from '../adapters/base';
import { logger } from '../../utils/logger';

/**
 * Toolbar injector with strict, event-driven reconciliation.
 * Replaces legacy polling with "Reconcile on Signal" architecture.
 */
export class ToolbarInjector {
    private adapter: SiteAdapter;
    private injectedElements = new WeakSet<HTMLElement>();
    /**
     * Stores toolbars that are instantiated but waiting for the Action Bar to appear.
     * key: Message Element, value: Toolbar Element
     */
    private pendingToolbars = new WeakMap<HTMLElement, HTMLElement>();

    constructor(adapter: SiteAdapter) {
        this.adapter = adapter;
    }

    /**
     * Entry point to inject a toolbar.
     * Effectively registers the toolbar and attempts an immediate reconciliation.
     */
    inject(messageElement: HTMLElement, toolbar: HTMLElement): boolean {
        // If already fully injected and tracked, ignore
        if (this.injectedElements.has(messageElement)) {
            return false;
        }

        // Attempt reconciliation (which handles "Pending" logic internally)
        this.reconcileToolbarPosition(messageElement, toolbar);
        return true;
    }

    /**
     * Core Logic: Ensures toolbar is positioned immediately before the action bar.
     * - If Wrapper exists: Moves it if misplaced.
     * - If Wrapper missing: Injects it ONLY if Action Bar exists.
     * - If Action Bar missing: Stores toolbar in pending map and waits (DOES NOT INJECT).
     */
    public reconcileToolbarPosition(message: HTMLElement, newToolbar?: HTMLElement): void {
        const selector = this.adapter.getActionBarSelector();
        const actionBar = message.querySelector(selector);
        const wrapper = message.querySelector('.aicopy-toolbar-wrapper');

        // 1. Wrapper Exists: Enforce Position
        if (wrapper) {
            if (actionBar && actionBar.parentElement) {
                // Performance: Only move if order is wrong [Wrapper] -> [Action Bar]
                if (wrapper.nextElementSibling !== actionBar) {
                    // Use requestAnimationFrame to avoid layout thrashing
                    requestAnimationFrame(() => {
                        if (wrapper.isConnected && actionBar.isConnected) {
                            actionBar.parentElement?.insertBefore(wrapper, actionBar);
                        }
                    });
                }
            }
            return;
        }

        // 2. Wrapper Missing: Attempt Injection

        // Store the toolbar if provided (so we can inject it later if Action Bar is missing now)
        if (newToolbar) {
            this.pendingToolbars.set(message, newToolbar);
        }

        // Only inject if Action Bar is present
        if (actionBar && actionBar.parentElement) {
            const toolbarToInject = this.pendingToolbars.get(message);

            if (toolbarToInject) {
                const isGemini = message.tagName.toLowerCase() === 'model-response';
                const newWrapper = this.createWrapper(toolbarToInject, isGemini);

                actionBar.parentElement.insertBefore(newWrapper, actionBar);

                this.injectedElements.add(message);
                this.pendingToolbars.delete(message); // No longer pending
                logger.debug('Toolbar injected (strict mode)');
            }
        }
        // If no Action Bar, we do nothing. The toolbar sits in `pendingToolbars` waiting for a mutation.
    }

    private createWrapper(toolbar: HTMLElement, isGemini: boolean): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'aicopy-toolbar-wrapper';

        if (isGemini) {
            // Gemini: match official toolbar padding (60px left), no fixed width
            wrapper.style.cssText = 'margin-bottom: 8px; padding-left: 60px;';
        } else {
            // ChatGPT: no extra padding
            wrapper.style.cssText = 'margin-bottom: 0px; margin-top: 10px;';
        }

        wrapper.appendChild(toolbar);
        return wrapper;
    }

    /**
     * Remove toolbar from a message element
     */
    remove(messageElement: HTMLElement): boolean {
        const wrapper = messageElement.querySelector('.aicopy-toolbar-wrapper');
        if (wrapper) {
            wrapper.remove();
            this.injectedElements.delete(messageElement);
            this.pendingToolbars.delete(messageElement);
            logger.debug('Toolbar removed');
            return true;
        }
        return false;
    }

    /**
     * Check if toolbar is already injected
     */
    isInjected(messageElement: HTMLElement): boolean {
        return this.injectedElements.has(messageElement);
    }

    /**
     * Cleanup state
     */
    cleanup(): void {
        this.injectedElements = new WeakSet<HTMLElement>();
        this.pendingToolbars = new WeakMap<HTMLElement, HTMLElement>();
        logger.info('[Injector] Cleaned up state');
    }
}
