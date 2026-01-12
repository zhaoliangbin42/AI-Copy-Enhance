import { SiteAdapter } from './base';
import { logger } from '../../utils/logger';
import { Icons } from '../../assets/icons';

/**
 * Claude.ai adapter implementation
 * Based on DOM structure analysis of claude.ai
 */
export class ClaudeAdapter extends SiteAdapter {
    matches(url: string): boolean {
        return url.includes('claude.ai');
    }

    getMessageSelector(): string {
        // Claude.ai: Select the parent container that includes both message and action bar
        // The action bar is a sibling, not a child, so we select the common parent
        return 'div.group[data-is-streaming="false"], div.group[style*="height: auto"]';
    }

    getMessageContentSelector(): string {
        // Main markdown content area inside Claude responses
        return '.standard-markdown, .font-claude-response-body';
    }

    /**
     * Action bar selector for Claude.ai
     * Key insight: For Claude, we want to inject the toolbar AFTER the message content,
     * not after the actual action bar. This is because the toolbar uses absolute
     * positioning (right: 0), and we need it to position relative to the message content width.
     *
     * By returning the message content selector, the injector will place the toolbar
     * after the message content, making it position correctly within the content width.
     */
    getActionBarSelector(): string {
        // Return message content selector instead of actual action bar
        // This makes toolbar inject after message content, positioning correctly
        return '.font-claude-response';
    }

    getCopyButtonSelector(): string {
        // Claude.ai uses data-testid="action-bar-copy" for the copy button
        return 'button[data-testid="action-bar-copy"]';
    }

    extractMessageHTML(element: HTMLElement): string {
        // Try to find specific content container first
        const contentElement = element.querySelector(this.getMessageContentSelector());
        if (contentElement) {
            return contentElement.innerHTML;
        }

        // Try to find .font-claude-response directly
        const claudeResponse = element.querySelector('.font-claude-response');
        if (claudeResponse) {
            return claudeResponse.innerHTML;
        }

        // Fallback: use entire element
        return element.innerHTML;
    }

    isStreamingMessage(element: HTMLElement): boolean {
        // Check if the LAST message is currently streaming
        // Step 1: Check for Stop generating button
        const stopButton = document.querySelector('button[aria-label*="Stop"]');
        if (!stopButton) {
            return false; // No streaming if no Stop button
        }

        // Step 2: Find the last assistant message
        const messages = document.querySelectorAll(this.getMessageSelector());
        if (messages.length === 0) {
            return false;
        }

        const lastMessage = messages[messages.length - 1];

        // Step 3: Check if this is the last message
        if (lastMessage !== element) {
            return false;
        }

        // Step 4: Check if copy button exists (appears after streaming completes)
        const copyButton = element.querySelector(this.getCopyButtonSelector());
        return !copyButton; // No copy button = still streaming
    }

    getMessageId(element: HTMLElement): string | null {
        // Claude.ai doesn't seem to have stable IDs in the initial HTML
        // Use position-based ID as fallback
        const allMessages = document.querySelectorAll(this.getMessageSelector());
        const index = Array.from(allMessages).indexOf(element);
        return index >= 0 ? `claude-message-${index}` : null;
    }

    getObserverContainer(): HTMLElement | null {
        // Try multiple possible containers for Claude.ai
        const selectors = [
            'main',
            '[data-testid="page-header"]',
            'body'
        ];

        for (const selector of selectors) {
            const container = document.querySelector(selector);
            if (container instanceof HTMLElement) {
                logger.debug(`[ClaudeAdapter] Observer container found: ${selector}`);
                return container;
            }
        }

        logger.warn('[ClaudeAdapter] No suitable observer container found');
        return null;
    }

    /**
     * Get user prompts for all messages
     * Extracts from [data-testid="user-message"] elements
     */
    getUserPrompts(): string[] {
        const prompts: string[] = [];

        try {
            const userMessages = document.querySelectorAll('[data-testid="user-message"]');

            userMessages.forEach((userEl, index) => {
                try {
                    const text = userEl.textContent?.trim() || `Message ${index + 1}`;
                    prompts.push(text);
                } catch (err) {
                    logger.warn(`[ClaudeAdapter] Failed to extract prompt ${index}:`, err);
                    prompts.push(`Message ${index + 1}`);
                }
            });
        } catch (err) {
            logger.error('[ClaudeAdapter] getUserPrompts failed:', err);
        }

        return prompts;
    }

    /**
     * Extract user prompt by traversing DOM backwards from the model response
     */
    extractUserPrompt(responseElement: HTMLElement): string | null {
        try {
            let current: Element | null = responseElement;

            // Traverse previous siblings
            while (current) {
                current = current.previousElementSibling;
                if (!current) break;

                // Check if this sibling is a user message
                if (current.getAttribute('data-testid') === 'user-message') {
                    return this.cleanUserContent(current as HTMLElement);
                }
            }

            // Fallback: Check parent's previous sibling (for nested structures)
            const parent = responseElement.parentElement;
            if (parent) {
                const parentPrev = parent.previousElementSibling;
                if (parentPrev && parentPrev.getAttribute('data-testid') === 'user-message') {
                    return this.cleanUserContent(parentPrev as HTMLElement);
                }
            }

            return null;
        } catch (err) {
            logger.warn('[ClaudeAdapter] extractUserPrompt failed:', err);
            return null;
        }
    }

    private cleanUserContent(element: HTMLElement): string {
        return element.textContent?.trim() || '';
    }

    // ========================================
    // Message Sending Support
    // ========================================

    getInputSelector(): string {
        // Claude.ai uses contenteditable div with data-testid="chat-input"
        return 'div[contenteditable="true"][data-testid="chat-input"]';
    }

    getSendButtonSelector(): string {
        // Claude.ai send button - look for button near the input
        return 'button[type="submit"], button[aria-label*="Send"]';
    }

    getIcon(): string {
        return Icons.claude;
    }

    /**
     * Claude-specific toolbar injection
     *
     * Key insight: For Claude.ai, the getActionBarSelector() returns the message
     * content element (.font-claude-response), not the actual action bar. This is
     * because the toolbar uses absolute positioning and needs to position relative
     * to the message content width for proper alignment.
     *
     * Therefore, we inject the toolbar AFTER the message content, not before.
     */
    injectToolbar(messageElement: HTMLElement, toolbarWrapper: HTMLElement): boolean {
        // Find the message content (actionBar selector points to .font-claude-response)
        const messageContent = messageElement.querySelector(this.getActionBarSelector());

        if (!messageContent || !messageContent.parentElement) {
            return false;
        }

        // Insert toolbar AFTER the message content
        // Using nextSibling to insert after instead of before
        if (messageContent.nextSibling) {
            messageContent.parentElement.insertBefore(toolbarWrapper, messageContent.nextSibling);
        } else {
            messageContent.parentElement.appendChild(toolbarWrapper);
        }

        return true;
    }
}
