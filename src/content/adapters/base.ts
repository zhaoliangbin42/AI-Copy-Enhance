/**
 * Base adapter interface for LLM platforms
 * Defines common methods that each platform must implement
 */
export abstract class SiteAdapter {
    /**
     * Check if current URL matches this adapter
     */
    abstract matches(url: string): boolean;

    /**
     * Get selector for message containers
     */
    abstract getMessageSelector(): string;

    /**
     * Get selector for message content area
     */
    abstract getMessageContentSelector(): string;

    /**
     * Get selector for action bar (where toolbar will be injected)
     */
    abstract getActionBarSelector(): string;

    /**
     * Get the copy button selector for streaming completion detection
     * Different platforms may use different aria-labels or attributes
     */
    abstract getCopyButtonSelector(): string;

    /**
     * Extract raw HTML content from message element
     */
    abstract extractMessageHTML(element: HTMLElement): string;

    /**
     * Check if message is currently being streamed
     */
    abstract isStreamingMessage(element: HTMLElement): boolean;

    /**
     * Get unique identifier for a message
     */
    abstract getMessageId(element: HTMLElement): string | null;

    /**
     * Get the main container to observe for mutations
     */
    abstract getObserverContainer(): HTMLElement | null;

    /**
     * Get user prompts for all messages (for pagination tooltips)
     * Returns array of user prompts, indexed by message position
     * Returns fallback text if extraction fails
     */
    abstract getUserPrompts(): string[];

    /**
     * Extract the user prompt associated with a specific model response
     * Uses reverse DOM traversal to find the corresponding user message
     */
    abstract extractUserPrompt(responseElement: HTMLElement): string | null;

    /**
     * Determines if a DOM node is platform-specific metadata noise
     * that should be filtered out during markdown extraction.
     * 
     * Uses ONLY structural markers (classes, tags, positions) - no text patterns.
     * 
     * @param node - DOM node to check
     * @param context - Optional context for position-based detection
     * @returns true if node should be filtered out
     * @default false - by default, no filtering (safe for existing implementations)
     * 
     * @example
     * // ChatGPT: Filter screen-reader-only headers
     * if (node.classList.contains('sr-only')) return true;
     * 
     * @example
     * // Gemini: Filter thought containers
     * if (node.tagName.toLowerCase() === 'model-thoughts') return true;
     */
    isNoiseNode(_node: Node, _context?: { nextSibling?: Element | null }): boolean {
        return false;  // Default: no filtering
    }

    // ========================================
    // Message Sending Support (Phase 3)
    // ========================================

    /**
     * Get CSS selector for the native input element
     * Used to locate the platform's text input for synchronization
     */
    abstract getInputSelector(): string;

    /**
     * Get CSS selector for the native send button
     * Used to trigger message submission
     */
    abstract getSendButtonSelector(): string;

    /**
     * Get the native input element instance
     * @returns The input element or null if not found
     */
    getInputElement(): HTMLElement | null {
        const selector = this.getInputSelector();
        return document.querySelector(selector);
    }

    /**
     * Get the native send button element instance
     * @returns The send button or null if not found
     */
    getSendButton(): HTMLElement | null {
        const selector = this.getSendButtonSelector();
        return document.querySelector(selector);
    }

    /**
     * Get platform-specific icon (SVG string)
     */
    abstract getIcon(): string;
}
