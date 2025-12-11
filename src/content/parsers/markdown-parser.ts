import TurndownService from 'turndown';
import { tables } from 'turndown-plugin-gfm';
import { logger } from '../../utils/logger';

/**
 * 方案C：双路径提取 + 按序合并
 * - 数学公式：直接从 annotation 提取，不经过任何转换
 * - 文本内容：移除数学后用 Turndown 转换
 * - 合并：按 DOM 遍历顺序自然保持位置
 * 
 * 优势：
 * 1. 数学公式完全不被 Turndown/postProcess 干扰
 * 2. 逻辑清晰，类似单公式复制的成功实现
 * 3. 鲁棒性强，位置关系天然正确
 */
export class MarkdownParser {
    private turndownService: TurndownService;

    constructor() {
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            hr: '---',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-',  // Use - for unordered lists
            emDelimiter: '*',       // Use * for emphasis
            strongDelimiter: '**',  // Use ** for strong
        });

        // CRITICAL: Override default 4-space indentation to 2 spaces
        // This prevents nested list items from being interpreted as code blocks
        (this.turndownService as any).options.listIndent = '  '; // 2 spaces

        // 使用 GFM 表格插件
        this.turndownService.use(tables);

        // 禁用转义（防止 \*, \_, \- 等）
        this.turndownService.escape = (text: string) => text;

        // 移除超链接和citation pills（包括整个span结构）
        this.turndownService.addRule('removeLinks', {
            filter: (node) => {
                // 移除 <a> 标签，只保留文本
                if (node.nodeName === 'A') return true;
                // 移除 citation pill 整个结构（包含 <span data-testid="webpage-citation-pill">）
                if (node.nodeName === 'SPAN' &&
                    (node.getAttribute('data-testid') === 'webpage-citation-pill' ||
                        node.classList?.contains('ms-1'))) {
                    return true;
                }
                return false;
            },
            replacement: (content: string, node: any) => {
                // citation pill 整个删除（包括内部链接文本）
                if (node.getAttribute?.('data-testid') === 'webpage-citation-pill' ||
                    node.classList?.contains('ms-1')) {
                    return '';
                }
                // 普通链接只保留文本
                return content;
            }
        });

        // 代码块处理:提取语言和代码内容,忽略Copy code按钮等UI元素
        this.turndownService.addRule('codeBlocks', {
            filter: (node) => {
                const hasCode = node.nodeName === 'PRE' && node.querySelector('code') !== null;
                if (hasCode) {
                    logger.debug(`[CodeBlock] Found PRE with code: ${node.textContent?.substring(0, 50)}...`);
                }
                return hasCode;
            },
            replacement: (content, node) => {
                const pre = node as HTMLElement;

                logger.debug(`[CodeBlock] Processing PRE element`);

                // 查找语言标签(通常在第一层div中,或者从code元素的class提取)
                // 1. 尝试从UI标签div获取(如 "bash", "python" 等)
                const langDiv = pre.querySelector('.flex.items-center');
                let language = langDiv?.textContent?.trim() || '';

                logger.debug(`[CodeBlock] Language from UI: "${language}"`);

                // 2. 如果UI标签为空,尝试从code元素的class获取(如 language-bash)
                const codeEl = pre.querySelector('code');
                if (!codeEl) {
                    logger.warn(`[CodeBlock] No code element found in PRE`);
                    return content;
                }

                if (!language && codeEl.className) {
                    const langMatch = codeEl.className.match(/language-(\w+)/);
                    if (langMatch) {
                        language = langMatch[1];
                        logger.debug(`[CodeBlock] Language from class: "${language}"`);
                    }
                }

                // 提取代码文本
                const codeText = codeEl.textContent || '';
                logger.debug(`[CodeBlock] Code length: ${codeText.length} chars`);

                // 返回标准Markdown代码块格式
                return `\n\n\`\`\`${language}\n${codeText.trimEnd()}\n\`\`\`\n\n`;
            }
        });

        // 处理 Gemini 的 .math-inline 和 .math-block 容器
        // IMPORTANT: 这个规则必须在 katexFormulas 之前,因为 Turndown 按添加顺序处理
        // Gemini 的结构是: <span class="math-inline" data-latex-source="..."><span class="katex">...</span></span>
        this.turndownService.addRule('geminiMathContainers', {
            filter: (node) => {
                return node.nodeName === 'SPAN' &&
                    (node.classList.contains('math-inline') || node.classList.contains('math-block')) ||
                    (node.nodeName === 'DIV' && node.classList.contains('math-block'));
            },
            replacement: (content, node) => {
                const element = node as HTMLElement;

                // 尝试从容器元素的 data-latex-source 属性提取
                let latex = element.getAttribute('data-latex-source');

                // Fallback: Gemini 的 .math-block 有时使用 data-math 而不是 data-latex-source
                if (!latex) {
                    latex = element.getAttribute('data-math');
                }

                // 如果容器没有,尝试从内部 .katex 元素提取
                if (!latex) {
                    const katexEl = element.querySelector('.katex, .katex-display');
                    if (katexEl) {
                        latex = this.extractLatex(katexEl as HTMLElement);
                    }
                }

                if (latex) {
                    // 块级公式 (.math-block 或 .katex-display)
                    if (element.classList.contains('math-block') ||
                        element.querySelector('.katex-display')) {
                        return `\n\n$$\n${latex}\n$$\n\n`;
                    }
                    // 行内公式 (.math-inline)
                    return `$${latex}$`;
                }

                // 如果没有找到 LaTeX,返回原内容而不是空字符串
                // 这样可以避免破坏其他平台(如 ChatGPT)的公式提取
                return content;
            }
        });

        // 处理 .katex 元素：从 annotation 提取 LaTeX，避免重复
        this.turndownService.addRule('katexFormulas', {
            filter: (node) => {
                return node.nodeName === 'SPAN' &&
                    (node.classList.contains('katex') || node.classList.contains('katex-display'));
            },
            replacement: (content, node) => {
                // 提取 LaTeX 源码
                const annotation = (node as HTMLElement).querySelector('annotation[encoding="application/x-tex"]');
                if (annotation && annotation.textContent) {
                    const latex = annotation.textContent.trim();
                    // 块级公式
                    if ((node as HTMLElement).classList.contains('katex-display')) {
                        return `\n\n$$\n${latex}\n$$\n\n`;
                    }
                    // 行内公式
                    return `$${latex}$`;
                }
                // 无 annotation，返回原内容（避免丢失）
                return content;
            }
        });

        // 处理 ChatGPT 表格容器：确保表格前后有换行（修复标题行丢失问题）
        this.turndownService.addRule('tableContainer', {
            filter: (node) => {
                return node.nodeName === 'DIV' &&
                    (node as HTMLElement).classList.contains('TyagGW_tableContainer');
            },
            replacement: (content) => {
                // 确保表格内容前后有双换行
                return `\n\n${content.trim()}\n\n`;
            }
        });
    }

    /**
     * 主解析方法
     */
    parse(element: HTMLElement): string {
        logger.debug('[MarkdownParser] Starting parse (Method C)');
        logger.debug(`[MarkdownParser] Input element: tag=${element.tagName}, textLength=${element.textContent?.length || 0}`);

        // 检测 Deep Research 格式
        const deepResearchDivs = element.querySelectorAll('.deep-research-result');

        if (deepResearchDivs.length > 0) {
            logger.debug(`[Deep Research] Found ${deepResearchDivs.length} deep-research-result divs`);
            deepResearchDivs.forEach((div, idx) => {
                logger.debug(`[Deep Research] Div ${idx}: textLength=${div.textContent?.length || 0}`);
            });
            return this.parseDeepResearch(deepResearchDivs);
        }

        // 核心：按 DOM 顺序提取内容块
        const contentBlocks = this.extractContentBlocks(element);

        // 转换为 Markdown
        const markdown = this.blocksToMarkdown(contentBlocks);

        // 后处理
        const result = this.postProcess(markdown);

        logger.debug('[MarkdownParser] Parse complete');
        return result;
    }

    /**
     * Deep Research 专用解析
     * 处理 .deep-research-result 容器中的 katex-error 元素
     * 关键：Deep Research 的内容主要在 katex-error 中（渲染失败的大段LaTeX）
     */
    private parseDeepResearch(deepResearchDivs: NodeListOf<Element>): string {
        const parts: string[] = [];

        deepResearchDivs.forEach((div, idx) => {
            logger.debug(`[Deep Research] Processing div ${idx + 1}/${deepResearchDivs.length}, textLength=${div.textContent?.length || 0}`);

            // 克隆以避免修改原始 DOM
            const clone = div.cloneNode(true) as HTMLElement;

            // 提取所有 katex-error 元素（包含未渲染的LaTeX）
            const katexErrors = clone.querySelectorAll('.katex-error');
            const errorBlocks: Array<{ placeholder: string, latex: string }> = [];

            logger.debug(`[Deep Research] Div ${idx + 1}: Found ${katexErrors.length} katex-error elements`);

            // 替换 katex-error 为占位符
            katexErrors.forEach((errorEl, i) => {
                const latex = errorEl.textContent?.trim() || '';
                if (latex) {
                    const charCount = latex.length;
                    logger.debug(`[Deep Research] katex-error ${i}: ${charCount} chars`);

                    const placeholder = `__KATEX_ERROR_${i}__`;
                    errorBlocks.push({ placeholder, latex });

                    const textNode = document.createTextNode(placeholder);
                    errorEl.replaceWith(textNode);
                }
            });

            // 转换整个 div 为 Markdown（此时 katex-error 已替换为占位符）
            const htmlBefore = clone.outerHTML.length;
            let markdown = this.turndownService.turndown(clone.outerHTML);
            logger.debug(`[Deep Research] Div ${idx + 1}: Turndown ${htmlBefore} -> ${markdown.length} chars`);

            // 恢复 katex-error 为纯 LaTeX（不用代码块包裹）
            errorBlocks.forEach(({ placeholder, latex }) => {
                // 直接输出 LaTeX，进行基本的 Markdown 格式化
                const formatted = latex
                    .replace(/\\\[/g, '$$\n')  // \[ -> $$
                    .replace(/\\\]/g, '\n$$')  // \] -> $$
                    .replace(/\\\(/g, '$')     // \( -> $
                    .replace(/\\\)/g, '$');    // \) -> $
                markdown = markdown.split(placeholder).join(formatted);
            });

            logger.debug(`[Deep Research] Div ${idx + 1}: After restore ${markdown.length} chars`);

            // 后处理
            markdown = this.postProcess(markdown);
            logger.debug(`[Deep Research] Div ${idx + 1}: After postProcess ${markdown.length} chars`);

            parts.push(markdown);
        });

        const result = parts.join('\n\n---\n\n');
        logger.debug(`[Deep Research] Final result: ${result.length} chars`);
        return result;
    }

    /**
     * 提取内容块：递归遍历 DOM，识别数学公式和文本块
     */
    private extractContentBlocks(container: HTMLElement): ContentBlock[] {
        const blocks: ContentBlock[] = [];
        let blockMathCount = 0;
        let inlineMathCount = 0;

        // 方案C：先找到所有块公式，用 WeakSet 跟踪已处理的
        const allDisplays = container.querySelectorAll('.katex-display');
        const processedDisplays = new WeakSet<Element>();

        logger.debug(`[Analysis] Found ${allDisplays.length} block formulas`);

        // 递归处理节点
        const processNode = (node: HTMLElement) => {
            // 跳过非元素节点
            if (node.nodeType !== 1) return;

            // 1. 块级数学公式 (.katex-display)
            if (node.classList.contains('katex-display')) {
                const latex = this.extractLatex(node);
                if (latex) {
                    blocks.push({
                        type: 'block-math',
                        content: `$$\n${latex}\n$$`
                    });
                    blockMathCount++;
                    logger.debug(`[Extract] Block math ${blockMathCount}: ${latex.substring(0, 40)}...`);
                }
                return; // 处理完，不继续遍历子节点
            }

            // 2. 代码块 (pre > code)
            if (node.tagName.toLowerCase() === 'pre' && node.querySelector('code')) {
                logger.debug(`[Extract] Found PRE element with code`);

                // 查找语言标签
                const langDiv = node.querySelector('.flex.items-center');
                let language = langDiv?.textContent?.trim() || '';

                // 从code元素的class获取语言
                const codeEl = node.querySelector('code');
                if (!language && codeEl?.className) {
                    const langMatch = codeEl.className.match(/language-(\w+)/);
                    if (langMatch) {
                        language = langMatch[1];
                    }
                }

                const codeText = codeEl?.textContent || '';
                logger.debug(`[Extract] Code block: language="${language}", length=${codeText.length}`);

                if (codeText.trim()) {
                    blocks.push({
                        type: 'text',
                        content: `\n\n\`\`\`${language}\n${codeText.trimEnd()}\n\`\`\`\n\n`
                    });
                }
                return; // 代码块已处理完，不继续遍历子节点
            }

            // 3. 表格（table 或 ChatGPT 表格容器）
            if (node.tagName.toLowerCase() === 'table' ||
                node.classList.contains('TyagGW_tableContainer')) {
                // 克隆表格节点
                const clone = node.cloneNode(true) as HTMLElement;

                // 提取表格中的数学公式并替换为 Markdown 格式
                const tableMathMap: Map<string, string> = new Map();
                let tableMathCounter = 0;

                // 处理块公式（显示模式）
                clone.querySelectorAll('.katex-display').forEach(display => {
                    const latex = this.extractLatex(display as HTMLElement);
                    if (latex) {
                        const placeholder = `__TABLEMATH_DISPLAY_${tableMathCounter++}__`;
                        tableMathMap.set(placeholder, `$$${latex}$$`);
                        const textNode = document.createTextNode(placeholder);
                        display.replaceWith(textNode);
                        logger.debug(`[Extract-Table] Block math: ${latex.substring(0, 40)}...`);
                    }
                });

                // 处理行内公式
                clone.querySelectorAll('.katex').forEach(katex => {
                    // 跳过已处理的块公式容器内的元素
                    if (katex.closest('.katex-display')) return;

                    const latex = this.extractLatex(katex as HTMLElement);
                    if (latex) {
                        const placeholder = `__TABLEMATH_INLINE_${tableMathCounter++}__`;
                        tableMathMap.set(placeholder, `$${latex}$`);
                        const textNode = document.createTextNode(placeholder);
                        katex.replaceWith(textNode);
                        logger.debug(`[Extract-Table] Inline math: ${latex.substring(0, 40)}...`);
                    }
                });

                // 使用 Turndown 转换表格
                let markdown = this.turndownService.turndown(clone.outerHTML);

                // 恢复数学公式占位符
                tableMathMap.forEach((formula, placeholder) => {
                    markdown = markdown.split(placeholder).join(formula);
                });

                if (markdown.trim()) {
                    blocks.push({ type: 'text', content: markdown });
                    logger.debug(`[Extract] Table with ${tableMathMap.size} math formulas: ${markdown.substring(0, 80)}...`);
                }
                return; // 表格已处理完，不继续遍历子节点
            }

            // 3. 列表（ul/ol）：整体处理，但提取块级公式到顶格
            if (node.tagName.toLowerCase() === 'ul' || node.tagName.toLowerCase() === 'ol') {
                const clone = node.cloneNode(true) as HTMLElement;

                // 先提取所有块级公式，用占位符替换
                const listMathMap: Map<string, string> = new Map();
                let listMathCounter = 0;

                clone.querySelectorAll('.katex-display').forEach(display => {
                    const latex = this.extractLatex(display as HTMLElement);
                    if (latex) {
                        const placeholder = `__LISTBLOCKMATH_${listMathCounter++}__`;
                        listMathMap.set(placeholder, latex);
                        const textNode = document.createTextNode(placeholder);
                        display.replaceWith(textNode);
                        blockMathCount++;
                        logger.debug(`[Extract-List] Block math ${blockMathCount}: ${latex.substring(0, 40)}...`);
                    }
                });

                // 转换列表
                let markdown = this.turndownService.turndown(clone.outerHTML);

                // 恢复块级公式：去除缩进，顶格显示
                listMathMap.forEach((latex, placeholder) => {
                    // 替换占位符为顶格的块级公式
                    // 使用正则匹配占位符所在行，去除前面的空白
                    const regex = new RegExp(`^[ \\t]*${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[ \\t]*$`, 'gm');
                    // 使用函数形式避免 $$ 在替换字符串中被解释为特殊字符
                    markdown = markdown.replace(regex, () => {
                        return '\n\n$$\n' + latex + '\n$$\n\n';
                    });
                });

                if (markdown.trim()) {
                    blocks.push({ type: 'text', content: markdown });
                    logger.debug(`[Extract] List (${node.tagName}) with ${listMathMap.size} block formulas`);
                }
                return; // 列表已处理完，不继续遍历子节点
            }

            // 4. 文本容器（段落、标题等）
            if (this.isTextContainer(node)) {
                // 克隆节点处理文本
                const clone = node.cloneNode(true) as HTMLElement;

                // 先提取块公式（移除不处理）
                const childDisplays = clone.querySelectorAll(':scope > .katex-display');
                childDisplays.forEach(display => {
                    const latex = this.extractLatex(display as HTMLElement);
                    if (latex && !processedDisplays.has(display as HTMLElement)) {
                        processedDisplays.add(display as HTMLElement);
                        blocks.push({ type: 'block-math', content: `$$\n${latex}\n$$` });
                        blockMathCount++;
                        logger.debug(`[Extract-Container] Block math ${blockMathCount}: ${latex.substring(0, 40)}...`);
                    }
                });
                clone.querySelectorAll('.katex-display').forEach(d => d.remove());

                // 继续处理内联公式
                const inlineMaths: InlineMath[] = [];
                clone.querySelectorAll('.katex').forEach((katex) => {
                    if (katex.closest('.katex-display')) return; // 跳过块公式内的

                    const latex = this.extractLatex(katex as HTMLElement);
                    if (latex) {
                        const placeholder = `__INLINE${inlineMathCount}__`;
                        inlineMaths.push({ placeholder, latex });
                        const textNode = document.createTextNode(placeholder);
                        katex.replaceWith(textNode);
                        inlineMathCount++;
                        logger.debug(`[Extract] Inline math ${inlineMathCount}: ${latex.substring(0, 30)}...`);
                    }
                });

                // 转换为 Markdown
                let markdown = this.turndownService.turndown(clone.outerHTML);

                // 恢复行内数学
                inlineMaths.forEach(({ placeholder, latex }) => {
                    markdown = markdown.split(placeholder).join(`$${latex}$`);
                });

                if (markdown.trim()) {
                    blocks.push({
                        type: 'text',
                        content: markdown
                    });
                }

                return; // 已处理此子树
            }

            // 5. 递归处理子节点
            Array.from(node.children).forEach(child => processNode(child as HTMLElement));
        };

        // 从容器开始遍历
        processNode(container);

        logger.debug(`[Extract] Total: ${blockMathCount} block formulas, ${inlineMathCount} inline formulas`);
        return blocks;
    }

    /**
     * 从 KaTeX 元素提取 LaTeX 源码
     */
    private extractLatex(element: HTMLElement): string | null {
        const annotation = element.querySelector('annotation[encoding="application/x-tex"]');
        if (!annotation?.textContent) return null;

        // 基本清理：合并空白字符（ChatGPT 的 annotation 内容有换行）
        return annotation.textContent
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * 判断是否为文本容器（段落、标题、列表项等）
     * 注意：不包含 ul/ol/li，因为列表需要整体交给 Turndown 处理（包含列表中的公式）
     */
    private isTextContainer(node: HTMLElement): boolean {
        const tag = node.tagName.toLowerCase();
        // 段落、标题、引用等（移除了 'ul', 'ol', 'li'）
        return ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'td', 'th'].includes(tag);
    }

    /**
     * 将内容块转换为最终 Markdown
     * 块公式前后各空一行
     */
    private blocksToMarkdown(blocks: ContentBlock[]): string {
        const parts: string[] = [];

        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];

            // 块公式需要前后空行
            if (block.type === 'block-math') {
                // 如果不是第一个块，且前面不是块公式，添加空行
                if (i > 0 && blocks[i - 1].type !== 'block-math') {
                    parts.push('\n');
                }
                parts.push(block.content);
                // 如果不是最后一个块，且后面不是块公式，添加空行
                if (i < blocks.length - 1 && blocks[i + 1].type !== 'block-math') {
                    parts.push('\n');
                }
            } else {
                // 文本块
                parts.push(block.content);
            }

            // 块之间的基本间距
            if (i < blocks.length - 1) {
                parts.push('\n\n');
            }
        }

        return parts.join('');
    }

    /**
     * 后处理：清理格式（不处理数学公式，它们已是最终格式）
     */
    private postProcess(markdown: string): string {
        let result = markdown;

        // 0. CRITICAL: Replace all 4-space indentation with 2-space
        // This must be done FIRST before any other processing
        // Match lines that start with multiples of 4 spaces followed by list markers or text
        result = result.replace(/^(    )+/gm, (match) => {
            const spaceCount = match.length;
            const level = spaceCount / 4;
            return '  '.repeat(level); // Convert 4n spaces to 2n spaces
        });

        // 1. 规范化列表缩进（统一为 2 的倍数）
        // 使用 2 空格缩进以避免被解析为代码块（4空格会触发代码块）
        const lines = result.split('\n');
        const fixedLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 检测列表项：以任意空格开头，后跟列表标记
            const listMatch = line.match(/^( *)([*-]|\d+\.)\s/);
            if (listMatch) {
                const currentIndent = listMatch[1].length;
                const marker = listMatch[2];
                const restOfLine = line.slice(listMatch[0].length);

                // 计算标准化后的缩进级别（每级 2 空格）
                // 1 空格 → 2 空格（一级嵌套）
                // 2-3 空格 → 2 空格（保持）
                // 4-5 空格 → 4 空格（二级）
                // 6+ 空格 → 对应级别
                let normalizedIndent: string;
                if (currentIndent === 0) {
                    normalizedIndent = ''; // 顶级列表
                } else if (currentIndent <= 1) {
                    normalizedIndent = '  '; // 1 空格统一为 2 空格
                    logger.debug(`[PostProcess] Normalizing indent: ${currentIndent} → 2 spaces`);
                } else if (currentIndent <= 3) {
                    normalizedIndent = '  '; // 2-3 空格统一为 2 空格
                    if (currentIndent > 2) {
                        logger.debug(`[PostProcess] Normalizing indent: ${currentIndent} → 2 spaces`);
                    }
                } else {
                    // 4+ 空格:保持为 2 的倍数
                    const level = Math.round(currentIndent / 2);
                    normalizedIndent = '  '.repeat(level);
                    if (currentIndent !== level * 2) {
                        logger.debug(`[PostProcess] Normalizing indent: ${currentIndent} → ${level * 2} spaces`);
                    }
                }

                fixedLines.push(`${normalizedIndent}${marker} ${restOfLine}`);
            } else {
                fixedLines.push(line);
            }
        }

        result = fixedLines.join('\n');

        // 2. 清理每行末尾空格
        result = result.split('\n').map(line => line.trimEnd()).join('\n');

        // 3. 移除 ChatGPT 引用标记（如 :contentReference[oaicite:223]{index=223}）
        result = result.replace(/:contentReference\[oaicite:\d+\]\{index=\d+\}/g, '');

        // 4. 移除超链接引用标记和残留的域名文本
        // 只移除明显的域名引用（包含多个点的长域名）
        result = result.replace(/\b[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\b/g, '');
        // 移除域名+数字的格式（如 Nature+2）
        result = result.replace(/\b[a-zA-Z0-9._-]+\+\d+\b/g, '');
        // 移除常见的学术来源名称（可能单独残留）
        result = result.replace(/\b(OUP Academic|OUP|developers)\s*/g, '');
        // 清理多余的空格（但不影响行首缩进）
        // 只清理非行首的多个连续空格
        result = result.split('\n').map(line => {
            // 保留行首空格，只处理行首空格之后的内容
            const match = line.match(/^(\s*)(.*)/);
            if (match) {
                const indent = match[1]; // 保留原始缩进
                const content = match[2].replace(/ {2,}/g, ' '); // 清理内容中的多余空格
                return indent + content;
            }
            return line;
        }).join('\n');
        result = result.replace(/\.{2,}/g, '.');
        // 清理句子中间的孤立点（两侧有空格）
        result = result.replace(/ \. /g, ' ');

        // 5. 规范化空行（最多 2 个连续换行）
        result = result.replace(/\n{3,}/g, '\n\n');

        // 6. 确保标题前有空行（除非是文件开头或前面是块公式）
        result = result.replace(/([^\n$])\n(#{1,6} )/g, '$1\n\n$2');

        // 7. 最后清理多余空行
        result = result.replace(/\n{3,}/g, '\n\n');

        // 8. 文件末尾单换行
        result = result.trim() + '\n';

        return result;
    }
}

// ============================================================================
// 类型定义
// ============================================================================

interface ContentBlock {
    type: 'text' | 'block-math';
    content: string;
}

interface InlineMath {
    placeholder: string;
    latex: string;
}
