import { SiteAdapter } from './base';
import { ChatGPTAdapter } from './chatgpt';
import { GeminiAdapter } from './gemini';

/**
 * Adapter registry for managing multiple platform adapters
 */
class AdapterRegistry {
    private adapters: SiteAdapter[] = [];
    private currentAdapter: SiteAdapter | null = null;

    constructor() {
        // Register all available adapters
        this.register(new ChatGPTAdapter());
        this.register(new GeminiAdapter());
    }

    /**
     * Register a new adapter
     */
    register(adapter: SiteAdapter): void {
        this.adapters.push(adapter);
    }

    /**
     * Get the appropriate adapter for current URL
     */
    getAdapter(url: string = window.location.href): SiteAdapter | null {
        if (this.currentAdapter && this.currentAdapter.matches(url)) {
            return this.currentAdapter;
        }

        for (const adapter of this.adapters) {
            if (adapter.matches(url)) {
                this.currentAdapter = adapter;
                return adapter;
            }
        }

        return null;
    }

    /**
     * Check if current page is supported
     */
    isSupported(url: string = window.location.href): boolean {
        return this.getAdapter(url) !== null;
    }
}

// Export singleton instance
export const adapterRegistry = new AdapterRegistry();
