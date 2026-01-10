/**
 * Storage Queue - Prevents race conditions in chrome.storage.local
 * 
 * All write operations to chrome.storage.local should be executed through this queue
 * to ensure sequential processing and prevent data loss from concurrent writes.
 * 
 * Pattern Reference: Based on Stack Overflow best practices for chrome.storage concurrency
 */

import { logger } from '../../utils/logger';

interface QueueItem<T> {
    operation: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
}

/**
 * Singleton queue for serializing storage write operations
 */
export class StorageQueue {
    private static instance: StorageQueue;
    private queue: QueueItem<unknown>[] = [];
    private processing = false;

    private constructor() {
        logger.debug('[StorageQueue] Initialized');
    }

    /**
     * Get singleton instance
     */
    static getInstance(): StorageQueue {
        if (!StorageQueue.instance) {
            StorageQueue.instance = new StorageQueue();
        }
        return StorageQueue.instance;
    }

    /**
     * Enqueue a storage operation for sequential execution
     * 
     * @param operation - Async function that performs the storage operation
     * @returns Promise that resolves when the operation completes
     */
    async enqueue<T>(operation: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push({
                operation,
                resolve: resolve as (value: unknown) => void,
                reject
            });

            logger.debug(`[StorageQueue] Enqueued operation, queue length: ${this.queue.length}`);
            this.processQueue();
        });
    }

    /**
     * Process queued operations sequentially
     */
    private async processQueue(): Promise<void> {
        if (this.processing) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const item = this.queue.shift();
            if (!item) continue;

            try {
                const result = await item.operation();
                item.resolve(result);
                logger.debug('[StorageQueue] Operation completed successfully');
            } catch (error) {
                logger.error('[StorageQueue] Operation failed:', error);
                item.reject(error instanceof Error ? error : new Error(String(error)));
            }
        }

        this.processing = false;
        logger.debug('[StorageQueue] Queue processing complete');
    }

    /**
     * Get current queue length (for testing/debugging)
     */
    getQueueLength(): number {
        return this.queue.length;
    }

    /**
     * Check if queue is currently processing (for testing/debugging)
     */
    isProcessing(): boolean {
        return this.processing;
    }

    /**
     * Reset the singleton instance (for testing only)
     */
    static resetInstance(): void {
        StorageQueue.instance = undefined as unknown as StorageQueue;
    }
}
