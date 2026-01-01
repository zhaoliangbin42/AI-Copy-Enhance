import { MarkdownRenderer } from '@/renderer/core/MarkdownRenderer';
import { StyleManager } from '@/renderer/styles/StyleManager';

/**
 * Markdown Renderer Utility - Refactored v3.0
 * Now uses battle-hardened MarkdownRenderer with circuit breaker protection
 */
export class MarkdownRenderer_Legacy {
    /**
     * Render markdown to HTML
     */
    static async render(markdown: string): Promise<string> {
        const result = await MarkdownRenderer.render(markdown);
        return result.success ? result.html! : result.fallback!;
    }

    /**
     * Inject styles into Shadow DOM
     */
    static async injectShadowStyles(shadowRoot: ShadowRoot): Promise<void> {
        const isDark = this.detectDarkMode();
        await StyleManager.injectStyles(shadowRoot, isDark);
    }

    /**
     * Inject markdown styles to document head
     */
    static async injectStyles(): Promise<void> {
        const isDark = this.detectDarkMode();
        await StyleManager.injectStyles(document, isDark);
    }

    /**
     * Get markdown styles as string (for backward compatibility)
     */
    static getMarkdownStyles(): string {
        return StyleManager.getMarkdownStyles(false);
    }

    /**
     * Detect dark mode
     */
    private static detectDarkMode(): boolean {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ||
            document.documentElement.getAttribute('data-theme') === 'dark';
    }
}

// Export alias for backward compatibility
export { MarkdownRenderer_Legacy as MarkdownRenderer };
