import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';

/**
 * Panel overlay styles
 */
const panelStyles = `
.aicopy-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999998;
  backdrop-filter: blur(2px);
}

.aicopy-panel {
  position: fixed;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 900px;
  height: 80vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  z-index: 999999;
  overflow: hidden;
}

.aicopy-panel-fullscreen {
  top: 0 !important;
  left: 0 !important;
  transform: none !important;
  width: 100vw !important;
  max-width: none !important;
  height: 100vh !important;
  border-radius: 0 !important;
}

.aicopy-panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
}

.aicopy-panel-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.aicopy-panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.aicopy-panel-fullscreen-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.aicopy-panel-fullscreen-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
}

.aicopy-panel-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.aicopy-panel-close:hover {
  background: #e5e7eb;
  color: #111827;
}

.aicopy-panel-body {
  flex: 1;
  overflow: auto;
  background: white;
  padding: 24px;
}
`;

/**
 * GitHub Markdown styles - inline KaTeX styles
 */
const markdownStyles = `
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #24292f;
  background: #fff;
}

.markdown-content {
  padding: 24px;
  max-width: 100%;
}

/* Limit content width in fullscreen mode for better readability */
.aicopy-panel-fullscreen .markdown-content {
  max-width: 800px;
  margin: 0 auto;
}


h1, h2 {
  padding-bottom: 0.3em;
  border-bottom: 1px solid #d0d7de;
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
}

h1 { font-size: 2em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.25em; font-weight: 600; margin: 24px 0 16px; }
h4, h5, h6 { font-weight: 600; margin: 24px 0 16px; }

p { margin: 0 0 16px; }

blockquote {
  padding: 0 1em;
  color: #57606a;
  border-left: 0.25em solid #d0d7de;
  margin: 0 0 16px;
}

code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(175, 184, 193, 0.2);
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 6px;
  margin: 0 0 16px;
}

pre code {
  background: transparent;
  padding: 0;
  margin: 0;
  font-size: 100%;
}

table {
  border-spacing: 0;
  border-collapse: collapse;
  margin: 0 0 16px;
  width: 100%;
}

th, td {
  padding: 6px 13px;
  border: 1px solid #d0d7de;
}

th {
  font-weight: 600;
  background-color: #f6f8fa;
}

tr:nth-child(2n) {
  background-color: #f6f8fa;
}

ul, ol {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

ul {
  list-style-type: disc;
}

ol {
  list-style-type: decimal;
}

li {
  margin-top: 0.25em;
}

li:first-child {
  margin-top: 0;
}

li > p {
  margin-top: 16px;
  margin-bottom: 0;
}

li > p:first-child {
  margin-top: 0;
}

li + li {
  margin-top: 0.25em;
}

ul ul, 
ul ol, 
ol ul, 
ol ol {
  margin-top: 0;
  margin-bottom: 0;
}

hr {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #d0d7de;
  border: 0;
}

a {
  color: #0969da;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

img {
  max-width: 100%;
}

/* KaTeX styles - inline to avoid loading issues */
.katex { font-size: 1.1em; }
.katex-display {
  display: block;
  margin: 1em 0;
  text-align: center;
}
`;

/**
 * Re-render panel - direct DOM rendering, no iframe
 */
export class ReRenderPanel {
    private container: HTMLElement | null = null;

    constructor() {
        // Configure marked with GitHub Flavored Markdown
        marked.setOptions({
            breaks: true,   // Convert \n to <br>
            gfm: true,      // GitHub Flavored Markdown
        });

        // Add KaTeX support with non-greedy matching
        marked.use(markedKatex({
            throwOnError: false,
            output: 'html',
            nonStandard: true  // Allow non-standard syntax
        }));
    }

    /**
     * Show panel with rendered Markdown
     */
    show(markdown: string): void {
        this.hide();

        // Inject panel styles
        if (!document.querySelector('#aicopy-panel-styles')) {
            const style = document.createElement('style');
            style.id = 'aicopy-panel-styles';
            style.textContent = panelStyles;
            document.head.appendChild(style);
        }

        this.createPanel(markdown);
    }

    /**
     * Hide panel
     */
    hide(): void {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }

    /**
     * Create panel with direct DOM rendering
     */
    private createPanel(markdown: string): void {
        // Pre-process: Fix consecutive inline math formulas
        // Pattern: $...$、$...$  or  $...$——$...$
        // Replace with space between formulas to prevent KaTeX parsing errors
        let processedMarkdown = markdown
            .replace(/\$([^$]+)\$([、，。；：！？])\$([^$]+)\$/g, '$$$1$$ $2 $$$3$$')  // Chinese punctuation between formulas
            .replace(/\$([^$]+)\$(——)\$([^$]+)\$/g, '$$$1$$ $2 $$$3$$');  // Em dash between formulas

        // Render Markdown to HTML
        const html = marked.parse(processedMarkdown) as string;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'aicopy-panel-overlay';
        overlay.addEventListener('click', () => this.hide());

        // Create panel
        const panel = document.createElement('div');
        panel.className = 'aicopy-panel';
        panel.addEventListener('click', (e) => e.stopPropagation());

        // Header
        const header = document.createElement('div');
        header.className = 'aicopy-panel-header';
        header.innerHTML = `
      <div class="aicopy-panel-header-left">
        <h2 class="aicopy-panel-title">Rendered Markdown</h2>
        <button class="aicopy-panel-fullscreen-btn" aria-label="Toggle fullscreen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
          Fullscreen
        </button>
      </div>
      <button class="aicopy-panel-close" aria-label="Close">×</button>
    `;

        // Bind event listeners
        const closeBtn = header.querySelector('.aicopy-panel-close');
        closeBtn?.addEventListener('click', () => this.hide());

        const fullscreenBtn = header.querySelector('.aicopy-panel-fullscreen-btn');
        fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());

        // Body with inline styles
        const body = document.createElement('div');
        body.className = 'aicopy-panel-body';

        // Create style element for markdown
        const styleEl = document.createElement('style');
        styleEl.textContent = markdownStyles;

        // Create content div
        const content = document.createElement('div');
        content.className = 'markdown-content';
        content.innerHTML = html;

        body.appendChild(styleEl);
        body.appendChild(content);

        panel.appendChild(header);
        panel.appendChild(body);

        // Assemble
        this.container = document.createElement('div');
        this.container.appendChild(overlay);
        this.container.appendChild(panel);
        document.body.appendChild(this.container);

        // ESC key to close
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.hide();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Toggle fullscreen mode
     */
    private toggleFullscreen(): void {
        if (!this.container) return;

        const panel = this.container.querySelector('.aicopy-panel');
        if (panel) {
            panel.classList.toggle('aicopy-panel-fullscreen');
        }
    }
}
