/**
 * Settings Manager
 * 
 * Singleton class for managing application settings with:
 * - chrome.storage.sync persistence (syncs across devices)
 * - In-memory caching for performance
 * - Event-driven updates (subscribe pattern)
 * - Type-safe settings access
 * 
 * @module SettingsManager
 */

import { logger } from '../utils/logger';

/**
 * Application settings schema
 */
export interface AppSettings {
    version: 1;
    behavior: {
        renderCodeInReader: boolean;  // default: true
        enableClickToCopy: boolean;   // default: true
    };
    storage: {
        saveContextOnly: boolean;     // default: false
        _contextOnlyConfirmed: boolean; // internal flag for destructive action confirmation
    };
}

/**
 * Default settings
 */
const DEFAULT_SETTINGS: AppSettings = {
    version: 1,
    behavior: {
        renderCodeInReader: true,
        enableClickToCopy: true,
    },
    storage: {
        saveContextOnly: false,
        _contextOnlyConfirmed: false,
    },
};

/**
 * Storage key for settings
 */
const STORAGE_KEY = 'app_settings';

/**
 * Settings change listener callback
 */
type SettingsListener = (settings: AppSettings) => void;

/**
 * Settings categories (excludes 'version')
 */
export type SettingsCategory = Exclude<keyof AppSettings, 'version'>;

/**
 * SettingsManager - Singleton class for managing application settings
 * 
 * @example
 * ```typescript
 * const manager = SettingsManager.getInstance();
 * 
 * // Get settings
 * const behavior = await manager.get('behavior');
 * console.log(behavior.renderCodeInReader);
 * 
 * // Update settings
 * await manager.set('behavior', {
 *     ...behavior,
 *     renderCodeInReader: false
 * });
 * 
 * // Subscribe to changes
 * const unsubscribe = manager.subscribe((settings) => {
 *     console.log('Settings updated:', settings);
 * });
 * ```
 */
export class SettingsManager {
    private static instance: SettingsManager;
    private cache: AppSettings | null = null;
    private listeners: Set<SettingsListener> = new Set();
    private initPromise: Promise<void> | null = null;

    /**
     * Private constructor (Singleton pattern)
     */
    private constructor() {
        // Listen for storage changes from other tabs/windows
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'sync' && changes[STORAGE_KEY]) {
                const newSettings = changes[STORAGE_KEY].newValue as AppSettings;
                if (newSettings) {
                    this.cache = newSettings;
                    this.notifyListeners();
                    logger.info('[SettingsManager] Settings updated from external source');
                }
            }
        });
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    /**
     * Initialize settings (load from storage)
     * This is called automatically on first access
     */
    private async init(): Promise<void> {
        if (this.cache !== null) {
            return; // Already initialized
        }

        if (this.initPromise) {
            return this.initPromise; // Initialization in progress
        }

        this.initPromise = (async () => {
            try {
                const result = await chrome.storage.sync.get(STORAGE_KEY);
                const stored = result[STORAGE_KEY] as AppSettings | undefined;

                if (stored && stored.version === DEFAULT_SETTINGS.version) {
                    // Merge with defaults to handle new settings
                    this.cache = this.mergeWithDefaults(stored);
                } else {
                    // No settings or version mismatch - use defaults
                    this.cache = { ...DEFAULT_SETTINGS };
                    await this.persist();
                }

                logger.info('[SettingsManager] Initialized', this.cache);
            } catch (error) {
                logger.error('[SettingsManager] Failed to initialize', error);
                this.cache = { ...DEFAULT_SETTINGS };
            }
        })();

        await this.initPromise;
        this.initPromise = null;
    }

    /**
     * Merge stored settings with defaults (handles new settings)
     */
    private mergeWithDefaults(stored: AppSettings): AppSettings {
        return {
            version: DEFAULT_SETTINGS.version,
            behavior: {
                ...DEFAULT_SETTINGS.behavior,
                ...stored.behavior,
            },
            storage: {
                ...DEFAULT_SETTINGS.storage,
                ...stored.storage,
            },
        };
    }

    /**
     * Persist settings to chrome.storage.sync
     */
    private async persist(): Promise<void> {
        if (!this.cache) return;

        try {
            await chrome.storage.sync.set({ [STORAGE_KEY]: this.cache });
            logger.debug('[SettingsManager] Persisted to storage');
        } catch (error) {
            logger.error('[SettingsManager] Failed to persist', error);
            throw error;
        }
    }

    /**
     * Notify all listeners of settings change
     */
    private notifyListeners(): void {
        if (!this.cache) return;

        this.listeners.forEach(listener => {
            try {
                listener(this.cache!);
            } catch (error) {
                logger.error('[SettingsManager] Listener error', error);
            }
        });
    }

    /**
     * Get a settings category
     * 
     * @param key - Settings category key
     * @returns Settings category value
     */
    public async get<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
        await this.init();
        return this.cache![key];
    }

    /**
     * Get all settings
     * 
     * @returns Complete settings object
     */
    public async getAll(): Promise<AppSettings> {
        await this.init();
        return { ...this.cache! };
    }

    /**
     * Update a settings category
     * 
     * @param key - Settings category key
     * @param value - New value for the category
     */
    public async set<K extends keyof AppSettings>(
        key: K,
        value: AppSettings[K]
    ): Promise<void> {
        await this.init();

        this.cache = {
            ...this.cache!,
            [key]: value,
        };

        await this.persist();
        this.notifyListeners();

        logger.info(`[SettingsManager] Updated ${key}`, value);
    }

    /**
     * Reset all settings to defaults
     */
    public async reset(): Promise<void> {
        this.cache = { ...DEFAULT_SETTINGS };
        await this.persist();
        this.notifyListeners();
        logger.info('[SettingsManager] Reset to defaults');
    }

    /**
     * Subscribe to settings changes
     * 
     * @param listener - Callback function to be called when settings change
     * @returns Unsubscribe function
     */
    public subscribe(listener: SettingsListener): () => void {
        this.listeners.add(listener);

        // Immediately call with current settings if available
        if (this.cache) {
            try {
                listener(this.cache);
            } catch (error) {
                logger.error('[SettingsManager] Initial listener call error', error);
            }
        }

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Get number of active listeners (for debugging)
     */
    public getListenerCount(): number {
        return this.listeners.size;
    }
}
