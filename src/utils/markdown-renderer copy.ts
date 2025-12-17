import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';

/**
 * Markdown Renderer Utility
 * Shared markdown rendering logic for rerender and detail modal
 */
export class MarkdownRenderer {
    private static initialized = false;

    /**
     * Initialize marked with KaTeX support
     */
    static initialize(): void {
        if (this.initialized) return;

        // Configure marked with GitHub Flavored Markdown
        marked.setOptions({
            breaks: true,   // Convert \n to <br>
            gfm: true,      // GitHub Flavored Markdown
        });

        // Add KaTeX support
        marked.use(markedKatex({
            throwOnError: false,
            output: 'html',
            nonStandard: true  // Allow non-standard syntax
        }));

        this.initialized = true;
    }

    /**
     * Render markdown to HTML
     */
    static render(markdown: string): string {
        this.initialize();

        // Pre-process: Fix consecutive inline math formulas
        const processedMarkdown = markdown
            .replace(/\$([^$]+)\$([、，。；：！？])\$([^$]+)\$/g, '$$1$$ $2 $$$3$$')
            .replace(/\$([^$]+)\$(——)\$([^$]+)\$/g, '$$1$$ $2 $$$3$$');

        return marked.parse(processedMarkdown) as string;
    }

    /**
     * Inject markdown styles to document head
     */
    static injectStyles(): void {
        // Inject custom markdown styles
        if (!document.querySelector('#aicopy-markdown-styles')) {
            const style = document.createElement('style');
            style.id = 'aicopy-markdown-styles';
            style.textContent = this.getStyles();
            document.head.appendChild(style);
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
     * Get markdown styles
     */
    private static getStyles(): string {
        return `
/* Notion-inspired Markdown styles */
.markdown-content {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #37352F;
}

.markdown-content h1, 
.markdown-content h2, 
.markdown-content h3, 
.markdown-content h4, 
.markdown-content h5, 
.markdown-content h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.3;
  color: #37352F;
}

.markdown-content h1 { 
  font-size: 2em;
  margin-top: 0;
  font-weight: 700;
}

.markdown-content h2 { font-size: 1.5em; }
.markdown-content h3 { font-size: 1.25em; }
.markdown-content h4, 
.markdown-content h5, 
.markdown-content h6 { font-size: 1.125em; }

.markdown-content p { 
  margin: 0.75em 0;
  line-height: 1.7;
}

.markdown-content blockquote {
  padding: 3px 0 3px 16px;
  margin: 1em 0;
  color: #37352F;
  border-left: 3px solid #E9E9E7;
}

.markdown-content code {
  padding: 4px 8px;
  margin: 0 2px;
  font-size: 0.9em;
  background-color: #FFF3F3;
  border-radius: 4px;
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;
  color: #E03E3E;
  font-weight: 500;
  border: 1px solid #FFE0E0;
}

.markdown-content pre {
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

.markdown-content pre code {
  background: transparent;
  padding: 0;
  margin: 0;
  font-size: 1em;
  color: #37352F;
  border: none;
}

.markdown-content table {
  border-spacing: 0;
  border-collapse: collapse;
  margin: 1.5em 0;
  width: 100%;
  font-size: 0.9375em;
}

.markdown-content th, 
.markdown-content td {
  padding: 8px 12px;
  border: 1px solid #E9E9E7;
  text-align: left;
}

.markdown-content th {
  font-weight: 600;
  background-color: #F7F6F3;
}

.markdown-content tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.markdown-content ul, 
.markdown-content ol {
  padding-left: 1.625em;
  margin: 0.75em 0;
}

.markdown-content li {
  margin: 0.25em 0;
  line-height: 1.7;
}

.markdown-content a {
  color: #0B6E99;
  text-decoration: none;
  border-bottom: 0.05em solid transparent;
  transition: border-bottom-color 0.2s ease;
}

.markdown-content a:hover {
  border-bottom-color: #0B6E99;
}

.markdown-content img {
  max-width: 100%;
  border-radius: 3px;
  margin: 1em 0;
}

.markdown-content .katex { 
  font-size: 1.1em; 
}

.markdown-content .katex-display {
  display: block;
  margin: 1.5em 0;
  text-align: center;
  overflow-x: auto;
}
        `;
    }
}
