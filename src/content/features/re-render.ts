import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';

/**
 * Panel overlay styles - Notion-inspired, using design tokens
 */
const panelStyles = `
.aicopy-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 15, 15, 0.6);
  z-index: 999998;
  backdrop-filter: blur(8px);
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
  border-radius: 16px;
  box-shadow: 
    0 0 0 1px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 16px 48px rgba(0, 0, 0, 0.18),
    0 24px 80px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  z-index: 999999;
  overflow: hidden;
  animation: modalFadeIn 0.2s ease;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
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
  padding: 8px 24px;
  border-bottom: 1px solid #E9E9E7;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  flex-shrink: 0;
}

.aicopy-panel-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.aicopy-panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #37352F;
  margin: 0;
  letter-spacing: -0.01em;
}

.aicopy-panel-fullscreen-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #6B7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.aicopy-panel-fullscreen-btn:hover {
  background: #F3F4F6;
  color: #1A1A1A;
}

.aicopy-panel-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #9B9A97;
  cursor: pointer;
  padding: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.aicopy-panel-close:hover {
  background: #EBEBEB;
  color: #37352F;
}

.aicopy-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0px 32px;
  background: white;
}

.aicopy-panel-body .markdown-content {
  max-width: 1000px;
  margin: 0 auto;
}
`;


/**
 * Notion-inspired Markdown styles - Clean, Modern, Elegant
 */
const markdownStyles = `
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #37352F;
  background: #fff;
}

.markdown-content {
  padding: 12px 16px;
  max-width: 100%;
}

/* Limit content width in fullscreen mode for better readability */
.aicopy-panel-fullscreen .markdown-content {
  max-width: 720px;
  margin: 0 auto;
}

/* Headings - Notion style: clean, no borders */
h1, h2, h3, h4, h5, h6 {
  margin-top: 2em;
  margin-bottom: 4px;
  font-weight: 600;
  line-height: 1.3;
  color: #37352F;
}

h1 { 
  font-size: 2.25em;
  margin-top: 0;
  margin-bottom: 0.5em;
  font-weight: 700;
}

h2 { 
  font-size: 1.75em;
  margin-bottom: 0.5em;
}

h3 { 
  font-size: 1.25em; 
}

h4, h5, h6 { 
  font-size: 1.125em; 
}

/* Paragraphs - generous spacing */
p { 
  margin: 0.75em 0 0.75em 0;
  line-height: 1.7;
}

/* Blockquotes - Notion style: subtle left border, no background */
blockquote {
  padding: 3px 0 3px 16px;
  margin: 1em 0;
  color: #37352F;
  border-left: 3px solid #E9E9E7;
  font-size: 1em;
}

blockquote p {
  margin: 0.5em 0;
}

/* Inline code - Notion style: vibrant red background */
code {
  padding: 4px 8px;
  margin: 0 2px;
  font-size: 0.9em;
  background-color: #FFF3F3;
  border-radius: 4px;
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
  color: #E03E3E;
  font-weight: 500;
  border: 1px solid #FFE0E0;
}

/* Code blocks - Notion style: warm background with border */
pre {
  padding: 20px;
  margin: 1.5em 0;
  overflow: auto;
  font-size: 0.875em;
  line-height: 1.7;
  background-color: #FAFAF9;
  border-radius: 8px;
  border: 1px solid #E7E5E4;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

pre code {
  background: transparent;
  padding: 0;
  margin: 0;
  font-size: 1em;
  color: #37352F;
  border-radius: 0;
}

/* Tables - Notion style: clean borders */
table {
  border-spacing: 0;
  border-collapse: collapse;
  margin: 1.5em 0;
  width: 100%;
  font-size: 0.9375em;
}

th, td {
  padding: 8px 12px;
  border: 1px solid #E9E9E7;
  text-align: left;
}

th {
  font-weight: 600;
  background-color: #F7F6F3;
  color: #37352F;
}

tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* Lists - Notion style: comfortable spacing */
ul, ol {
  padding-left: 1.625em;
  margin: 0.75em 0;
}

ul {
  list-style-type: disc;
}

ol {
  list-style-type: decimal;
}

li {
  margin: 0.25em 0;
  line-height: 1.7;
}

li:first-child {
  margin-top: 0;
}

li > p {
  margin: 0.5em 0;
}

li > p:first-child {
  margin-top: 0;
}

ul ul, 
ul ol, 
ol ul, 
ol ol {
  margin: 0.25em 0;
}

/* Horizontal rule - Notion style: subtle */
hr {
  height: 1px;
  padding: 0;
  margin: 2em 0;
  background-color: #E9E9E7;
  border: 0;
}

/* Links - Notion style: subtle underline on hover */
a {
  color: #0B6E99;
  text-decoration: none;
  border-bottom: 0.05em solid transparent;
  transition: border-bottom-color 0.2s ease;
}

a:hover {
  border-bottom-color: #0B6E99;
}

/* Images */
img {
  max-width: 100%;
  border-radius: 3px;
  margin: 1em 0;
}

/* Strong and emphasis */
strong {
  font-weight: 600;
  color: #37352F;
}

em {
  font-style: italic;
  color: #37352F;
}

/* KaTeX styles - inline to avoid loading issues */
.katex { 
  font-size: 1.1em; 
}

.katex-display {
  display: block;
  margin: 1.5em 0;
  text-align: center;
  overflow-x: auto;
  overflow-y: hidden;
}

/* Task lists - Notion style */
input[type="checkbox"] {
  margin-right: 0.5em;
}

/* Selection color - Notion style */
::selection {
  background-color: rgba(45, 170, 219, 0.3);
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
     * Create panel with Shadow DOM for style isolation
     */
    private createPanel(markdown: string): void {
        // Pre-process: Fix consecutive inline math formulas
        let processedMarkdown = markdown
            .replace(/\$([^$]+)\$([\u3001\uff0c\u3002\uff1b\uff1a\uff01\uff1f])\$([^$]+)\$/g, '$$$1$$ $2 $$$3$$')
            .replace(/\$([^$]+)\$(\u2014\u2014)\$([^$]+)\$/g, '$$$1$$ $2 $$$3$$');

        // Render Markdown to HTML
        const html = marked.parse(processedMarkdown) as string;

        // Create container
        this.container = document.createElement('div');

        // Attach Shadow DOM for style isolation
        const shadowRoot = this.container.attachShadow({ mode: 'open' });

        // Inject panel styles into Shadow DOM
        const panelStyleEl = document.createElement('style');
        panelStyleEl.textContent = panelStyles;
        shadowRoot.appendChild(panelStyleEl);

        // Inject markdown styles into Shadow DOM using MarkdownRenderer
        const mdStyleEl = document.createElement('style');
        mdStyleEl.textContent = markdownStyles;
        shadowRoot.appendChild(mdStyleEl);

        // Inject KaTeX CSS into Shadow DOM
        const katexLink = document.createElement('link');
        katexLink.rel = 'stylesheet';
        katexLink.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        katexLink.crossOrigin = 'anonymous';
        shadowRoot.appendChild(katexLink);

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
        <button class="aicopy-panel-fullscreen-btn" aria-label="Toggle fullscreen" title="Toggle fullscreen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
        </button>
      </div>
      <button class="aicopy-panel-close" aria-label="Close" title="Close">×</button>
    `;

        // Bind event listeners
        const closeBtn = header.querySelector('.aicopy-panel-close');
        closeBtn?.addEventListener('click', () => this.hide());

        const fullscreenBtn = header.querySelector('.aicopy-panel-fullscreen-btn');
        fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());

        // Body
        const body = document.createElement('div');
        body.className = 'aicopy-panel-body';

        // Create content div
        const content = document.createElement('div');
        content.className = 'markdown-content';
        content.innerHTML = html;

        body.appendChild(content);

        panel.appendChild(header);
        panel.appendChild(body);

        // Assemble in Shadow DOM
        shadowRoot.appendChild(overlay);
        shadowRoot.appendChild(panel);

        // Add container to body
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

        const shadowRoot = this.container.shadowRoot;
        if (!shadowRoot) return;

        const panel = shadowRoot.querySelector('.aicopy-panel');
        if (panel) {
            panel.classList.toggle('aicopy-panel-fullscreen');
        }
    }
}
