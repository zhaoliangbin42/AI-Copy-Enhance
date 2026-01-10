/**
 * MessageSender - Core Logic for Message Sending Feature
 * 
 * Handles synchronization between FloatingInput and native platform input,
 * and programmatic triggering of the send button.
 * 
 * Key Features:
 * - Read from native input
 * - Write to native input (3-layer fallback strategy)
 * - Wait for send button ready state
 * - Trigger send button click
 */

import { SiteAdapter } from '../adapters/base';
import { logger } from '../../utils/logger';

export interface MessageSenderOptions {
    /** Adapter for current platform */
    adapter: SiteAdapter;
    /** Debounce delay for input sync (ms) */
    debounceMs?: number;
}

export class MessageSender {
    private adapter: SiteAdapter;
    private debounceMs: number;
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(options: MessageSenderOptions) {
        this.adapter = options.adapter;
        this.debounceMs = options.debounceMs ?? 500;  // Default 500ms for trailing debounce
    }

    /**
     * Read current content from native input
     */
    readFromNative(): string {
        const input = this.adapter.getInputElement();
        logger.info('[MessageSender] readFromNative called', {
            hasInput: !!input,
            inputTag: input?.tagName,
            inputClass: input?.className
        });
        if (!input) {
            logger.warn('[MessageSender] Native input not found');
            return '';
        }

        // Handle different input types
        if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
            const value = input.value;
            logger.info('[MessageSender] Read from textarea/input', { length: value.length, preview: value.substring(0, 50) });
            return value;
        }

        // Contenteditable element
        if (input.getAttribute('contenteditable') === 'true') {
            const text = input.textContent || '';
            logger.info('[MessageSender] Read from contenteditable', { length: text.length, preview: text.substring(0, 50) });
            return text;
        }

        logger.warn('[MessageSender] Unknown input type');
        return '';
    }

    /**
     * Sync content to native input using 3-layer fallback strategy
     * @param text - Text to write to native input
     * @param focusInput - Whether to focus the input (default: true, set false for background sync)
     * @returns true if successful
     */
    async syncToNative(text: string, focusInput: boolean = true): Promise<boolean> {
        const input = this.adapter.getInputElement();
        if (!input) {
            logger.warn('[MessageSender] Native input not found');
            return false;
        }

        // Only focus if explicitly requested (not during background debounced sync)
        if (focusInput) {
            input.focus();
        }

        // Clear existing content
        await this.clearInput(input, focusInput);

        // Try 3-layer fallback strategy
        const success =
            this.tryExecCommand(input, text, focusInput) ||
            this.tryInputEvent(input, text) ||
            this.tryDirectDOM(input, text);

        if (success) {
            logger.debug('[MessageSender] Synced to native input:', text.substring(0, 30));
        } else {
            logger.error('[MessageSender] All sync strategies failed');
        }

        return success;
    }

    /**
     * Debounced sync to native input (background sync, no focus stealing)
     * Uses silentSync for background updates
     */
    syncToNativeDebounced(text: string): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.silentSync(text);
            this.debounceTimer = null;
        }, this.debounceMs);
    }

    /**
     * Sync to native input using input event simulation
     * Triggers beforeinput + input events to notify framework of changes
     */
    silentSync(text: string): boolean {
        logger.info('[MessageSender] silentSync called', { textLength: text.length, preview: text.substring(0, 30) });
        const input = this.adapter.getInputElement();
        if (!input) {
            logger.warn('[MessageSender] Native input not found for silentSync');
            return false;
        }

        try {
            // 1. Set content
            if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
                input.value = text;
                logger.info('[MessageSender] Set textarea/input value');
            } else {
                input.textContent = text;
                logger.info('[MessageSender] Set contenteditable textContent');
            }

            // 2. Dispatch input events to trigger framework state update
            input.dispatchEvent(new InputEvent('beforeinput', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: text
            }));
            logger.info('[MessageSender] Dispatched beforeinput event');

            input.dispatchEvent(new InputEvent('input', {
                bubbles: true,
                cancelable: false,
                inputType: 'insertText',
                data: text
            }));
            logger.info('[MessageSender] Dispatched input event');

            logger.info('[MessageSender] silentSync completed successfully');
            return true;
        } catch (e) {
            logger.error('[MessageSender] silentSync failed:', e);
            return false;
        }
    }

    /**
     * Force sync (cancel debounce and sync immediately, no focus stealing)
     */
    forceSyncToNative(text: string): boolean {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        return this.silentSync(text);
    }

    /**
     * Wait for send button to become ready (enabled)
     * @param timeoutMs - Maximum wait time
     * @returns true if button is ready, false if timeout
     */
    async waitForSendButtonReady(timeoutMs: number = 3000): Promise<boolean> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            const sendBtn = this.adapter.getSendButton();

            if (sendBtn && !sendBtn.hasAttribute('disabled')) {
                logger.debug('[MessageSender] Send button ready');
                return true;
            }

            // Wait and check again
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        logger.warn('[MessageSender] Send button ready timeout');
        return false;
    }

    /**
     * Trigger the native send button
     * @returns true if triggered successfully
     */
    async triggerSend(): Promise<boolean> {
        const sendBtn = this.adapter.getSendButton();

        if (!sendBtn) {
            logger.warn('[MessageSender] Send button not found');
            return false;
        }

        if (sendBtn.hasAttribute('disabled')) {
            logger.warn('[MessageSender] Send button is disabled');
            return false;
        }

        // Simulate click
        sendBtn.click();
        logger.debug('[MessageSender] Send button clicked');

        return true;
    }

    /**
     * Full send flow: sync content + trigger send
     */
    async send(text: string): Promise<boolean> {
        // Step 1: Force sync (with focus this time, since we're about to send)
        const synced = await this.syncToNative(text, true);
        if (!synced) {
            return false;
        }

        // Step 2: Wait for send button
        const ready = await this.waitForSendButtonReady();
        if (!ready) {
            return false;
        }

        // Step 3: Trigger send
        return this.triggerSend();
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }

    /**
     * Watch send button state changes using MutationObserver
     * @param onChange - Callback when loading state changes
     * @returns Cleanup function to disconnect observer
     */
    watchSendButtonState(onChange: (isLoading: boolean) => void): () => void {
        const sendBtn = this.adapter.getSendButton();
        logger.info('[MessageSender] watchSendButtonState called', {
            hasSendBtn: !!sendBtn,
            sendBtnTag: sendBtn?.tagName,
            sendBtnDisabled: sendBtn?.hasAttribute('disabled'),
            sendBtnAriaDisabled: sendBtn?.getAttribute('aria-disabled')
        });

        if (!sendBtn) {
            logger.warn('[MessageSender] Send button not found for watching');
            return () => { };
        }

        const checkState = () => {
            const isDisabled = sendBtn.hasAttribute('disabled');
            const ariaDisabled = sendBtn.getAttribute('aria-disabled');
            logger.info('[MessageSender] Button state changed', {
                isDisabled,
                ariaDisabled,
                className: sendBtn.className
            });
            onChange(isDisabled);
        };

        const observer = new MutationObserver((mutations) => {
            logger.info('[MessageSender] MutationObserver triggered', {
                mutationsCount: mutations.length,
                types: mutations.map(m => m.attributeName)
            });
            checkState();
        });

        observer.observe(sendBtn, {
            attributes: true,
            attributeFilter: ['disabled', 'aria-disabled']
        });

        logger.info('[MessageSender] MutationObserver started on send button');

        return () => {
            logger.info('[MessageSender] MutationObserver disconnected');
            observer.disconnect();
        };
    }

    // ========================================
    // Private: Input Strategies
    // ========================================

    /**
     * Clear input content
     */
    private async clearInput(input: HTMLElement, focusInput: boolean = true): Promise<void> {
        if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
            input.value = '';
        } else if (input.getAttribute('contenteditable') === 'true') {
            // Select all and delete - only if we can focus
            if (focusInput) {
                input.focus();
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(input);
                selection?.removeAllRanges();
                selection?.addRange(range);

                // Try execCommand first
                if (!document.execCommand('delete')) {
                    input.innerHTML = '';
                }
            } else {
                // Direct clear without focus
                input.innerHTML = '';
            }
        }
    }

    /**
     * Strategy 1: execCommand (best compatibility with React/Vue)
     */
    private tryExecCommand(input: HTMLElement, text: string, focusInput: boolean = true): boolean {
        try {
            if (focusInput) {
                input.focus();
            }

            // Use insertText command
            const success = document.execCommand('insertText', false, text);

            if (success) {
                logger.debug('[MessageSender] execCommand succeeded');
                return true;
            }
        } catch (e) {
            logger.debug('[MessageSender] execCommand failed:', e);
        }
        return false;
    }

    /**
     * Strategy 2: InputEvent dispatch
     */
    private tryInputEvent(input: HTMLElement, text: string): boolean {
        try {
            // Set content first
            if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
                input.value = text;
            } else {
                input.textContent = text;
            }

            // Dispatch input event
            const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: text
            });

            input.dispatchEvent(inputEvent);
            logger.debug('[MessageSender] InputEvent succeeded');
            return true;
        } catch (e) {
            logger.debug('[MessageSender] InputEvent failed:', e);
        }
        return false;
    }

    /**
     * Strategy 3: Direct DOM manipulation (last resort)
     */
    private tryDirectDOM(input: HTMLElement, text: string): boolean {
        try {
            if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
                input.value = text;
            } else {
                input.textContent = text;
            }

            // Dispatch change event as fallback
            input.dispatchEvent(new Event('change', { bubbles: true }));

            logger.debug('[MessageSender] Direct DOM succeeded');
            return true;
        } catch (e) {
            logger.debug('[MessageSender] Direct DOM failed:', e);
        }
        return false;
    }
}
