import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';

/**
 * Markdown Renderer Utility
 * CRITICAL: Uses exact same logic as re-render panel for consistency
 */
export class MarkdownRenderer {
    private static markedInitialized = false;

    /**
     * Initialize marked with KaTeX support (same as re-render)
     */
    private static initializeMarked(): void {
        if (this.markedInitialized) return;

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

        this.markedInitialized = true;
    }

    /**
     * Render markdown to HTML (same as re-render)
     */
    static render(markdown: string): string {
        this.initializeMarked();

        // Pre-process: Fix consecutive inline math formulas
        // Pattern: $...$、$...$  or  $...$——$...$
        const processedMarkdown = markdown
            .replace(/\$([^$]+)\$([、，。；：！？])\$([^$]+)\$/g, '$$$1$$ $2 $$$3$$')  // Chinese punctuation
            .replace(/\$([^$]+)\$(——)\$([^$]+)\$/g, '$$$1$$ $2 $$$3$$');  // Em dash

        return marked.parse(processedMarkdown) as string;
    }

    /**
     * Inject markdown styles to document head (same as re-render)
     */
    /**
     * Inject styles into Shadow DOM
     * Use this for components that use Shadow DOM (like modals)
     */
    static injectShadowStyles(shadowRoot: ShadowRoot): void {
        // Check if styles already injected
        if (shadowRoot.querySelector('#aicopy-markdown-styles')) {
            return;
        }

        // Inject markdown styles
        const mdStyle = document.createElement('style');
        mdStyle.id = 'aicopy-markdown-styles';
        mdStyle.textContent = this.getMarkdownStyles();
        shadowRoot.appendChild(mdStyle);

        // Inject KaTeX CSS link
        const katexLink = document.createElement('link');
        katexLink.id = 'katex-styles';
        katexLink.rel = 'stylesheet';
        katexLink.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        katexLink.crossOrigin = 'anonymous';
        shadowRoot.appendChild(katexLink);
    }

    /**
     * Inject markdown styles to document head (for non-Shadow DOM components)
     */
    static injectStyles(): void {
        // Inject markdown styles (CRITICAL: same as re-render)
        if (!document.querySelector('#aicopy-markdown-styles')) {
            const mdStyle = document.createElement('style');
            mdStyle.id = 'aicopy-markdown-styles';
            mdStyle.textContent = this.getMarkdownStyles();
            document.head.appendChild(mdStyle);
        }

        // Inject KaTeX CSS for math formula rendering
        if (!document.querySelector('#katex-styles')) {
            const link = document.createElement('link');
            link.id = 'katex-styles';
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        }
    }

    /**
     * Get markdown styles as string (for Shadow DOM injection)
     * Public method to allow external components to inject styles
     */
    static getMarkdownStyles(): string {
        return `
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
    }
}
