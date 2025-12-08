import { SiteAdapter } from '../adapters/base';
import { debounce } from '../../utils/dom-utils';
import { logger } from '../../utils/logger';

/**
 * Debounce delays for different operations
 */
const DEBOUNCE_DELAYS = {
  MUTATION: 200,
  SCROLL: 150,
  RESIZE: 300
};

/**
 * Message observer that monitors DOM for new messages
 * and triggers toolbar injection
 */
export class MessageObserver {
  private observer: MutationObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private adapter: SiteAdapter;
  private processedMessages = new Set<string>();
  private onMessageDetected: (element: HTMLElement) => void;
  private periodicCheckInterval: number | null = null;

  constructor(
    adapter: SiteAdapter,
    onMessageDetected: (element: HTMLElement) => void
  ) {
    this.adapter = adapter;
    this.onMessageDetected = onMessageDetected;
    this.handleMutations = debounce(this.handleMutations.bind(this), DEBOUNCE_DELAYS.MUTATION);
  }

  /**
   * Start observing the DOM
   */
  start(): void {
    this.startWithRetry(0);
  }

  /**
   * Start with retry mechanism for delayed container loading
   */
  private startWithRetry(attempt: number): void {
    const container = this.adapter.getObserverContainer();
    
    if (!container) {
      if (attempt < 10) {
        logger.debug(`Observer container not found, retrying (${attempt + 1}/10)...`);
        setTimeout(() => this.startWithRetry(attempt + 1), 500);
        return;
      } else {
        logger.warn('Observer container not found after 10 attempts');
        return;
      }
    }

    logger.info('Starting message observer');

    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: false // Performance optimization
    });

    // Process existing messages immediately
    this.processExistingMessages();
    
    // Also process after a short delay to catch late-loading messages
    setTimeout(() => {
      logger.debug('Re-processing messages after delay');
      this.processExistingMessages();
    }, 1000);
    
    // And one more time after longer delay for slow connections
    setTimeout(() => {
      logger.debug('Re-processing messages after extended delay');
      this.processExistingMessages();
    }, 3000);
    
    // Setup IntersectionObserver to catch messages entering viewport
    this.setupIntersectionObserver();
    
    // Setup periodic check for extremely slow loading scenarios (every 2s)
    this.periodicCheckInterval = window.setInterval(() => {
      this.processExistingMessages();
    }, 2000);
    
    logger.debug('Setup complete: MutationObserver + IntersectionObserver + Periodic check');
  }

  /**
   * Setup IntersectionObserver to detect messages entering viewport
   */
  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target instanceof HTMLElement) {
          const messageId = this.adapter.getMessageId(entry.target);
          if (messageId && !this.processedMessages.has(messageId)) {
            logger.debug('Message entered viewport:', messageId);
            this.processedMessages.add(messageId);
            this.onMessageDetected(entry.target);
          }
        }
      });
    }, {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    });
    
    // Observe all current messages
    const messages = document.querySelectorAll(this.adapter.getMessageSelector());
    messages.forEach((msg) => {
      if (msg instanceof HTMLElement) {
        this.intersectionObserver?.observe(msg);
      }
    });
  }

  /**
   * Stop observing
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    
    if (this.periodicCheckInterval) {
      window.clearInterval(this.periodicCheckInterval);
      this.periodicCheckInterval = null;
    }
    
    logger.info('Message observer stopped');
  }

  /**
   * Handle DOM mutations
   */
  private handleMutations(mutations: MutationRecord[]): void {
    logger.debug('Processing mutations:', mutations.length);

    // Check if streaming is in progress
    const isStreaming = this.adapter.isStreamingMessage(document.body);
    if (isStreaming) {
      logger.debug('Streaming in progress, delaying processing');
      return;
    }

    this.processExistingMessages();
  }

  /**
   * Process all existing messages in the DOM
   */
  private processExistingMessages(): void {
    const messages = document.querySelectorAll(this.adapter.getMessageSelector());
    logger.debug(`Found ${messages.length} messages (${this.processedMessages.size} already processed)`);

    let newMessages = 0;
    messages.forEach((message) => {
      if (!(message instanceof HTMLElement)) return;

      const messageId = this.adapter.getMessageId(message);
      if (!messageId) {
        // Generate a fallback ID based on position if no ID attribute
        const fallbackId = `msg-${Array.from(messages).indexOf(message)}`;
        logger.debug('Message has no ID, using fallback:', fallbackId);
        
        if (this.processedMessages.has(fallbackId)) {
          return;
        }
        this.processedMessages.add(fallbackId);
        newMessages++;
        this.onMessageDetected(message);
        return;
      }

      // Check if message is still streaming (missing action bar DOM)
      const isArticle = message.tagName.toLowerCase() === 'article';
      if (isArticle) {
        // For article messages, check if action bar exists
        const hasActionBar = message.querySelector('div.z-0') !== null;
        if (!hasActionBar) {
          logger.debug('Message still streaming (no action bar), skipping:', messageId);
          return; // Wait for streaming to finish
        }
      }
      
      // Skip if already processed
      if (this.processedMessages.has(messageId)) {
        // Still try to inject toolbar if it's missing (handles late-loading action bars)
        const hasToolbar = message.querySelector('.aicopy-toolbar-container');
        if (!hasToolbar) {
          logger.debug('Message processed but toolbar missing, retrying injection:', messageId);
          this.onMessageDetected(message);
        }
        return;
      }

      // Mark as processed
      this.processedMessages.add(messageId);
      newMessages++;

      // Trigger callback
      logger.debug('New message detected:', messageId);
      this.onMessageDetected(message);
      
      // Also observe with IntersectionObserver for future viewport checks
      if (this.intersectionObserver) {
        this.intersectionObserver.observe(message);
      }
    });
    
    if (newMessages > 0) {
      logger.info(`Processed ${newMessages} new message(s)`);
    }
  }

  /**
   * Reset processed messages (useful for testing)
   */
  reset(): void {
    this.processedMessages.clear();
    logger.info('Observer reset');
  }
}
