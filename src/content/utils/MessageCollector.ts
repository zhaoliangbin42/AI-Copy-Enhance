import { adapterRegistry } from '../adapters/registry';
import { MessageDeduplicator } from './message-deduplicator';

/**
 * Message collector for pagination
 * Collects article references WITHOUT parsing content (lazy loading)
 */
export interface MessageRef {
    index: number;
    element: HTMLElement;
    parsed?: string; // Cached parsed content
    userPrompt?: string; //  <--- ATOMIC PAIRING: Extracted directly from relative DOM position
}


export class MessageCollector {
    /**
     * Collect all message articles (lazy - only get DOM refs)
     */
    static collectMessages(): MessageRef[] {
        const adapter = adapterRegistry.getAdapter();
        if (!adapter) return [];

        const selector = adapter.getMessageSelector();
        const rawElements = document.querySelectorAll<HTMLElement>(selector);

        // Apply deduplication to remove nested duplicates
        const elements = MessageDeduplicator.deduplicate(Array.from(rawElements));

        const messages: MessageRef[] = [];

        elements.forEach((element, index) => {
            // ATOMIC DISCOVERY: Ask adapter to find the user prompt for THIS model element
            const userPrompt = adapter.extractUserPrompt(element as HTMLElement);

            messages.push({
                index,
                element: element as HTMLElement,
                userPrompt: userPrompt || `Message ${index + 1}`
            });
        });

        return messages;
    }

    /**
     * Find initial message index by element
     */
    static findMessageIndex(target: HTMLElement, messages: MessageRef[]): number {
        return messages.findIndex(msg => msg.element === target || msg.element.contains(target));
    }
}
