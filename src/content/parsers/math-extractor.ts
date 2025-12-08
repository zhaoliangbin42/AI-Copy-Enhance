import { logger } from '../../utils/logger';

/**
 * Math formula extractor that handles three scenarios:
 * 1. Successfully rendered KaTeX (with <annotation encoding="application/x-tex">)
 * 2. Failed KaTeX rendering (<span class="katex-error">)
 * 3. Raw LaTeX in text nodes (\[...\], \(...\))
 */
export class MathExtractor {
  private placeholderMap: Map<string, string> = new Map();
  private placeholderCounter = 0;

  /**
   * Extract all math formulas from HTML and replace with placeholders
   * Returns modified HTML with placeholders
   */
  extract(html: string): string {
    this.placeholderMap.clear();
    this.placeholderCounter = 0;

    // Clone to avoid modifying original
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Process in order of priority
    // 1. Successfully rendered KaTeX (block display)
    this.extractKatexDisplay(tempDiv);

    // 2. Successfully rendered KaTeX (inline)
    this.extractKatexInline(tempDiv);

    // 3. Failed KaTeX rendering
    this.extractKatexErrors(tempDiv);

    // 4. Raw LaTeX patterns in text nodes
    let result = tempDiv.innerHTML;
    result = this.extractRawLatex(result);

    return result;
  }

  /**
   * Restore placeholders with formatted Markdown math
   */
  restore(markdown: string): string {
    let result = markdown;
    
    logger.debug('[MathExtractor] Restoring placeholders, map size:', this.placeholderMap.size);
    
    this.placeholderMap.forEach((latex, placeholder) => {
      const count = (result.match(new RegExp(placeholder, 'g')) || []).length;
      logger.debug(`[MathExtractor] Replacing ${placeholder} (found ${count} times)`);
      result = result.split(placeholder).join(latex);
    });

    return result;
  }

  /**
   * Extract block-level KaTeX (.katex-display)
   */
  private extractKatexDisplay(container: HTMLElement): void {
    const displays = container.querySelectorAll('.katex-display');
    
    displays.forEach((display) => {
      const katexSpan = display.querySelector('.katex');
      if (!katexSpan) return;

      const annotation = katexSpan.querySelector('annotation[encoding="application/x-tex"]');
      if (!annotation) return;

      const latex = this.cleanLatex(annotation.textContent || '');
      if (!latex) return;

      // Format as block math with proper newlines
      const formatted = `\n\n$$\n${latex}\n$$\n\n`;
      const placeholder = this.generatePlaceholder(formatted);

      // Replace entire .katex-display element
      const span = document.createElement('span');
      span.textContent = placeholder;
      display.replaceWith(span);

      logger.debug('[MathExtractor] Extracted block math:', latex.substring(0, 50));
    });
  }

  /**
   * Extract inline KaTeX (not inside .katex-display)
   */
  private extractKatexInline(container: HTMLElement): void {
    // Find all .katex that are NOT inside .katex-display
    const allKatex = container.querySelectorAll('.katex');
    
    allKatex.forEach((katex) => {
      // Skip if inside .katex-display (already processed)
      if (katex.closest('.katex-display')) return;

      const annotation = katex.querySelector('annotation[encoding="application/x-tex"]');
      if (!annotation) return;

      const latex = this.cleanLatex(annotation.textContent || '');
      if (!latex) return;

      // Format as inline math
      const formatted = `$${latex}$`;
      const placeholder = this.generatePlaceholder(formatted);

      // Replace the .katex element
      const span = document.createElement('span');
      span.textContent = placeholder;
      katex.replaceWith(span);

      logger.debug('[MathExtractor] Extracted inline math:', latex.substring(0, 30));
    });
  }

  /**
   * Extract failed KaTeX rendering (.katex-error)
   */
  private extractKatexErrors(container: HTMLElement): void {
    const errors = container.querySelectorAll('.katex-error');
    
    errors.forEach((error) => {
      const latex = this.cleanLatex(error.textContent || '');
      if (!latex) return;

      // Heuristic: determine if block or inline
      // Block indicators: starts with \[ or contains display-mode commands
      const isBlock = latex.startsWith('\\[') || 
                      latex.includes('\\begin{') ||
                      latex.includes('\\displaystyle');

      let formatted: string;
      if (isBlock) {
        // Remove \[ \] if present
        const cleaned = latex.replace(/^\\\[/, '').replace(/\\\]$/, '').trim();
        formatted = `\n\n$$\n${cleaned}\n$$\n\n`;
      } else {
        // Remove \( \) if present
        const cleaned = latex.replace(/^\\\(/, '').replace(/\\\)$/, '').trim();
        formatted = `$${cleaned}$`;
      }

      const placeholder = this.generatePlaceholder(formatted);

      const span = document.createElement('span');
      span.textContent = placeholder;
      error.replaceWith(span);

      logger.debug('[MathExtractor] Extracted error math:', latex.substring(0, 30));
    });
  }

  /**
   * Extract raw LaTeX patterns from text
   */
  private extractRawLatex(html: string): string {
    let result = html;

    // Block math: \[ ... \]
    result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_match, latex) => {
      const cleaned = this.cleanLatex(latex);
      const formatted = `\n\n$$\n${cleaned}\n$$\n\n`;
      return this.generatePlaceholder(formatted);
    });

    // Inline math: \( ... \)
    result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_match, latex) => {
      const cleaned = this.cleanLatex(latex);
      const formatted = `$${cleaned}$`;
      return this.generatePlaceholder(formatted);
    });

    return result;
  }

  /**
   * Clean LaTeX content (whitespace normalization only)
   * CRITICAL: Do NOT escape or modify LaTeX commands
   */
  private cleanLatex(latex: string): string {
    return latex
      .replace(/\s+/g, ' ')  // Merge whitespace
      .trim();               // Remove leading/trailing spaces
  }

  /**
   * Generate unique placeholder
   */
  generatePlaceholder(formatted: string): string {
    const id = `{{MATH-${this.placeholderCounter++}}}`;
    this.placeholderMap.set(id, formatted);
    return id;
  }

  /**
   * Get placeholder map for debugging
   */
  getPlaceholderMap(): Map<string, string> {
    return this.placeholderMap;
  }
}
