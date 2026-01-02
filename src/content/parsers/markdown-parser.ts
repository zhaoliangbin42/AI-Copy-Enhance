import { logger } from '../../utils/logger';
import { createMarkdownParser } from '../../parser-example';
import { adapterRegistry } from '../adapters/registry';

/**
 * MarkdownParser - Uses new v3 high-performance parser
 * 
 * Old unified pipeline has been removed to reduce bundle size (~1.5MB savings)
 */
export class MarkdownParser {
    private parser = createMarkdownParser({
        enablePerformanceLogging: true,
    });

    /**
     * Parse HTML element to Markdown with noise filtering
     * 
     * Pre-processes DOM to remove platform-specific noise before markdown conversion
     * @param element - HTML element to parse
     * @returns Markdown string
     */
    parse(element: HTMLElement): string {
        logger.debug('[MarkdownParser] Using v3 parser with noise filtering');
        const startTime = performance.now();

        // Step 1: Clone element to avoid mutating original DOM
        const clone = element.cloneNode(true) as HTMLElement;

        // Step 2: Remove noise nodes (platform-specific metadata)
        this.removeNoiseNodes(clone);

        // Step 3: Parse cleaned DOM to markdown
        const markdown = this.parser.parse(clone);
        const elapsed = performance.now() - startTime;

        logger.debug(`[Markdown Parser] Parsed in ${elapsed.toFixed(2)}ms`);
        return markdown;
    }

    /**
     * Remove platform-specific noise nodes from DOM tree
     * Uses adapter's isNoiseNode() method with structural markers
     * 
     * @param root - Root element to clean (will be mutated)
     */
    private removeNoiseNodes(root: HTMLElement): void {
        const adapter = adapterRegistry.getAdapter();
        if (!adapter) {
            logger.warn('[MarkdownParser] No adapter found, skipping noise filtering');
            return;
        }

        // TreeWalker for efficient DOM traversal
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_ELEMENT
        );

        const nodesToRemove: Node[] = [];
        let node: Node | null;

        // Collect nodes to remove (can't remove during traversal)
        while ((node = walker.nextNode())) {
            try {
                const nextSibling = (node as Element).nextElementSibling;
                if (adapter.isNoiseNode(node, { nextSibling })) {
                    nodesToRemove.push(node);
                }
            } catch (error) {
                // Graceful degradation: log error and continue with next node
                logger.warn('[MarkdownParser] Noise detection error, skipping node:', error);
            }
        }

        // Remove in reverse order (children before parents prevents orphans)
        nodesToRemove.reverse().forEach(n => {
            logger.debug('[MarkdownParser] Removing noise node:', n);
            n.parentNode?.removeChild(n);
        });

        if (nodesToRemove.length > 0) {
            logger.debug(`[MarkdownParser] Removed ${nodesToRemove.length} noise nodes`);
        }
    }
}
