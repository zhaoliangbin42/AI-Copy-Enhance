/**
 * Custom tooltip helper for Gemini-style tooltips
 * Creates and manages tooltip elements with show/hide logic
 */
export class TooltipHelper {
    private static tooltipContainer: HTMLElement | null = null;
    private static activeTooltip: HTMLElement | null = null;
    private static hideTimeout: number | null = null;

    /**
     * Initialize tooltip container (call once)
     */
    static init(): void {
        if (this.tooltipContainer) return;

        this.tooltipContainer = document.createElement('div');
        this.tooltipContainer.className = 'aicopy-tooltip-container';
        this.tooltipContainer.style.cssText = `
      position: fixed;
      z-index: 10000;
      pointer-events: none;
    `;
        document.body.appendChild(this.tooltipContainer);
    }

    /**
     * Attach tooltip to a button
     */
    static attach(button: HTMLElement, text: string): void {
        this.init();

        button.addEventListener('mouseenter', () => {
            this.show(button, text);
        });

        button.addEventListener('mouseleave', () => {
            this.hide();
        });
    }

    /**
     * Show tooltip
     */
    private static show(anchor: HTMLElement, text: string): void {
        // Cancel any pending hide timeout
        if (this.hideTimeout !== null) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        // Remove existing tooltip immediately (no fade out)
        if (this.activeTooltip) {
            this.activeTooltip.remove();
            this.activeTooltip = null;
        }

        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'aicopy-tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
      position: absolute;
      background: rgba(60, 64, 67, 0.9);
      color: white;
      padding: 6px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-family: 'Google Sans', Roboto, Arial, sans-serif;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.15s ease-in-out;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;

        // Add to container
        this.tooltipContainer!.appendChild(tooltip);

        // Position tooltip below button
        const rect = anchor.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.bottom + 8}px`;
        tooltip.style.transform = 'translateX(-50%)';

        // Fade in
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
        });

        this.activeTooltip = tooltip;
    }

    /**
     * Hide tooltip
     */
    private static hide(): void {
        if (this.activeTooltip) {
            const tooltip = this.activeTooltip;
            tooltip.style.opacity = '0';

            // Clear any existing timeout
            if (this.hideTimeout !== null) {
                clearTimeout(this.hideTimeout);
            }

            // Set new timeout to remove after fade out
            this.hideTimeout = window.setTimeout(() => {
                tooltip.remove();
                if (this.activeTooltip === tooltip) {
                    this.activeTooltip = null;
                }
                this.hideTimeout = null;
            }, 150);
        }
    }
}
