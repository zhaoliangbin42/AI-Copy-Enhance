import { SiteAdapter } from './base';
import { logger } from '../../utils/logger';

/**
 * Gemini adapter implementation
 * Based on DOM structure from Gemini-Sample.html
 */
export class GeminiAdapter extends SiteAdapter {
    matches(url: string): boolean {
        return url.includes('gemini.google.com');
    }

    getMessageSelector(): string {
        // Gemini uses custom element 'model-response' for AI responses
        return 'model-response';
    }

    getMessageContentSelector(): string {
        // Main content area inside response
        return '.model-response-text';
    }

    getActionBarSelector(): string {
        // Action buttons are in the footer
        // IMPORTANT: This is INSIDE the model-response element
        return '.response-container-footer';
    }

    extractMessageHTML(element: HTMLElement): string {
        // Try to get content from .model-response-text
        const contentElement = element.querySelector(this.getMessageContentSelector());
        if (contentElement) {
            return contentElement.innerHTML;
        }

        // Fallback: use entire element
        return element.innerHTML;
    }

    isStreamingMessage(element: HTMLElement): boolean {
        // Check if response footer has 'complete' class
        const footer = element.querySelector('.response-footer');
        if (!footer) {
            return true; // No footer = still streaming
        }

        // If footer exists but doesn't have 'complete' class, it's streaming
        return !footer.classList.contains('complete');
    }

    getMessageId(element: HTMLElement): string | null {
        // Gemini uses data-test-draft-id for response identification
        const draftElement = element.querySelector('[data-test-draft-id]');
        if (draftElement) {
            return draftElement.getAttribute('data-test-draft-id');
        }

        // Fallback: try to generate ID from element position
        const allMessages = document.querySelectorAll(this.getMessageSelector());
        const index = Array.from(allMessages).indexOf(element);
        return index >= 0 ? `gemini-message-${index}` : null;
    }

    getObserverContainer(): HTMLElement | null {
        // Try multiple possible containers for Gemini
        const selectors = [
            'main',
            '[data-test-id="chat-history-container"]',
            '.chat-history',
            'body'
        ];

        for (const selector of selectors) {
            const container = document.querySelector(selector);
            if (container instanceof HTMLElement) {
                logger.debug(`Observer container found: ${selector}`);
                return container;
            }
        }

        logger.warn('No observer container found for Gemini, falling back to body');
        return document.body;
    }

    /**
     * Get all math elements in the message
     * Gemini uses KaTeX just like ChatGPT
     */
    getMathElements(element: HTMLElement): NodeListOf<Element> {
        return element.querySelectorAll('.katex');
    }

    /**
     * Get all code blocks in the message
     * Gemini uses custom <code-block> element
     */
    getCodeBlocks(element: HTMLElement): NodeListOf<Element> {
        return element.querySelectorAll('code-block code, pre code');
    }

    /**
     * Get all tables in the message
     */
    getTables(element: HTMLElement): NodeListOf<HTMLTableElement> {
        return element.querySelectorAll('table');
    }

    /**
     * Gemini-specific: Check if this is a Gemini page
     * Used to apply platform-specific styling
     */
    isGemini(): boolean {
        return true;
    }
}
