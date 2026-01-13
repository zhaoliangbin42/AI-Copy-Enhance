/**
 * Code Block Rule - Convert <pre><code> to ```language\n...\n```
 * 
 * Supports:
 * - Standard: <pre><code class="language-xxx">...</code></pre>
 * - Deepseek: <div class="md-code-block"><pre>...</pre></div>
 * 
 * @see DEVELOPER-REFERENCE-MANUAL.md - Syntax Conversion Quick Reference
 * @see Syntax-Mapping-Spec.md - Code Blocks
 */

import type { Rule } from '../../core/Rule';

/**
 * Creates rule for code blocks (pre > code or .md-code-block > pre)
 * 
 * Priority: 3 (High - after math, before most blocks)
 */
export function createCodeBlockRule(): Rule {
    return {
        name: 'code-block',

        filter: (node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return false;
            const elem = node as Element;

            // Standard structure: <pre> containing <code>
            if (elem.tagName === 'PRE' && elem.querySelector('code') !== null) {
                return true;
            }

            // Deepseek structure: <pre> inside .md-code-block (without <code>)
            if (elem.tagName === 'PRE' &&
                elem.closest('.md-code-block') !== null &&
                elem.querySelector('code') === null) {
                return true;
            }

            return false;
        },

        priority: 3,

        replacement: (_content, node, context) => {
            const preElem = node as HTMLElement;
            const codeElem = preElem.querySelector('code') as HTMLElement;

            // Standard path: pre > code
            if (codeElem) {
                const language = context.adapter.getCodeLanguage(codeElem);
                const code = codeElem.textContent || '';

                if (language) {
                    return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
                }
                return `\`\`\`\n${code}\n\`\`\`\n\n`;
            }

            // Deepseek path: pre without code wrapper
            // Get language from adapter (which reads .d813de27 span)
            const language = context.adapter.getCodeLanguage(preElem);
            const code = preElem.textContent || '';

            if (language) {
                return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
            }
            return `\`\`\`\n${code}\n\`\`\`\n\n`;
        },
    };
}

