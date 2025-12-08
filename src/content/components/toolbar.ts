import { toolbarStyles } from '../../styles/toolbar.css';
import { copyToClipboard } from '../../utils/dom-utils';
import { logger } from '../../utils/logger';
import { WordCounter } from '../parsers/word-counter';

export interface ToolbarCallbacks {
  onCopyMarkdown: () => Promise<string>;
  onViewSource: () => void;
  onReRender: () => void;
}

/**
 * Shadow DOM toolbar component
 * Provides Copy MD, Source, and Word Count buttons
 */
export class Toolbar {
  private shadowRoot: ShadowRoot;
  private container: HTMLElement;
  private callbacks: ToolbarCallbacks;
  private wordCounter: WordCounter;

  constructor(callbacks: ToolbarCallbacks) {
    this.callbacks = callbacks;
    this.wordCounter = new WordCounter();
    
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'aicopy-toolbar-container';
    
    // Attach shadow DOM for style isolation
    this.shadowRoot = this.container.attachShadow({ mode: 'open' });
    
    // Inject styles
    const styleElement = document.createElement('style');
    styleElement.textContent = toolbarStyles;
    this.shadowRoot.appendChild(styleElement);
    
    // Create UI
    this.createUI();
  }

  /**
   * Create toolbar UI
   */
  private createUI(): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'aicopy-toolbar';
    
    // Copy Markdown button (clipboard icon)
    const copyBtn = this.createIconButton(
      'copy-md-btn',
      this.getClipboardIcon(),
      'Copy Markdown',
      () => this.handleCopyMarkdown()
    );
    
    // View Source button (code icon)
    const sourceBtn = this.createIconButton(
      'source-btn',
      this.getCodeIcon(),
      'View Source',
      () => this.handleViewSource()
    );
    
    // Re-render button (eye icon)
    const reRenderBtn = this.createIconButton(
      're-render-btn',
      this.getEyeIcon(),
      'Preview Markdown',
      () => this.handleReRender()
    );
    
    // Word count stats (right side)
    const stats = document.createElement('span');
    stats.className = 'aicopy-stats';
    stats.id = 'word-stats';
    stats.textContent = 'Loading...';
    
    // Button group for left-aligned buttons
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'aicopy-button-group';
    buttonGroup.appendChild(copyBtn);
    buttonGroup.appendChild(sourceBtn);
    buttonGroup.appendChild(reRenderBtn);
    
    wrapper.appendChild(buttonGroup);
    wrapper.appendChild(stats);
    
    this.shadowRoot.appendChild(wrapper);
    
    // Update stats
    this.updateWordCount();
  }

  /**
   * Create an icon button with tooltip
   */
  private createIconButton(
    id: string,
    iconSvg: string,
    tooltipText: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'aicopy-button';
    button.id = id;
    button.setAttribute('aria-label', tooltipText);
    button.innerHTML = iconSvg;
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    
    return button;
  }

  /**
   * Get clipboard icon SVG
   */
  private getClipboardIcon(): string {
    return `
      <svg class="aicopy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
  }

  /**
   * Get code icon SVG
   */
  private getCodeIcon(): string {
    return `
      <svg class="aicopy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    `;
  }

  /**
   * Get eye icon SVG (for preview)
   */
  private getEyeIcon(): string {
    return `
      <svg class="aicopy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
  }

  /**
   * Get checkmark icon SVG
   */
  private getCheckIcon(): string {
    return `
      <svg class="aicopy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
  }

  /**
   * Update word count statistics
   */
  private async updateWordCount(): Promise<void> {
    try {
      const markdown = await this.callbacks.onCopyMarkdown();
      const stats = this.shadowRoot.querySelector('#word-stats');
      if (!stats) return;

      // Use WordCounter for accurate counting
      const result = this.wordCounter.count(markdown);
      stats.textContent = this.wordCounter.format(result);
    } catch (error) {
      const stats = this.shadowRoot.querySelector('#word-stats');
      if (stats) stats.textContent = '';
    }
  }

  /**
   * Handle Copy Markdown button click
   */
  private async handleCopyMarkdown(): Promise<void> {
    const btn = this.shadowRoot.querySelector('#copy-md-btn') as HTMLButtonElement;
    if (!btn) return;

    try {
      // Disable button
      btn.disabled = true;
      
      // Get Markdown from callback
      const markdown = await this.callbacks.onCopyMarkdown();
      
      // Copy to clipboard
      const success = await copyToClipboard(markdown);
      
      if (success) {
        // Change icon to checkmark
        const originalIcon = btn.innerHTML;
        btn.innerHTML = this.getCheckIcon();
        btn.style.color = 'var(--theme-color)';
        
        logger.info('Markdown copied to clipboard');
        
        // Reset after 2 seconds
        setTimeout(() => {
          btn.innerHTML = originalIcon;
          btn.style.color = '';
          btn.disabled = false;
        }, 2000);
      } else {
        throw new Error('Failed to copy');
      }
    } catch (error) {
      logger.error('Copy failed:', error);
      btn.disabled = false;
    }
  }

  /**
   * Handle Re-render button click
   */
  private handleReRender(): void {
    logger.debug('Re-render clicked');
    this.callbacks.onReRender();
    
    const btn = this.shadowRoot.querySelector('#re-render-btn') as HTMLButtonElement;
    if (btn) this.showFeedback(btn, 'Opening Preview...');
  }

  /**
   * Handle View Source button click
   */
  private handleViewSource(): void {
    logger.debug('View Source clicked');
    this.callbacks.onViewSource();
    
    const btn = this.shadowRoot.querySelector('#source-btn') as HTMLButtonElement;
    if (btn) this.showFeedback(btn, 'Source Opened');
  }
  
  /**
   * Show floating feedback tooltip on button click
   */
  private showFeedback(button: HTMLButtonElement, message: string): void {
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = 'aicopy-button-feedback';
    feedback.textContent = message;
    
    // Position relative to button
    button.style.position = 'relative';
    button.appendChild(feedback);
    
    // Remove after animation completes
    setTimeout(() => {
      feedback.remove();
    }, 1500);
  }

  /**
   * Get the toolbar container element
   */
  getElement(): HTMLElement {
    return this.container;
  }

  /**
   * Destroy the toolbar
   */
  destroy(): void {
    this.container.remove();
  }
}
