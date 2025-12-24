import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkStringify from 'remark-stringify';
import remarkGfm from 'remark-gfm';

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

const getProp = (node: HastNode, key: string): string | null => {
  const props = node.properties || {};
  const raw = props[key];
  if (typeof raw === 'string') {
    return raw;
  }
  if (Array.isArray(raw)) {
    const joined = raw.filter((value) => typeof value === 'string').join(' ');
    return joined || null;
  }
  return null;
};

const getDataProp = (node: HastNode, key: string): string | null => {
  const direct = getProp(node, key);
  if (direct) {
    return direct;
  }
  const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  return getProp(node, camelKey);
};

const getClassList = (node: HastNode): string[] => {
  const className = getProp(node, 'className') || getProp(node, 'class') || '';
  return className ? className.split(/\s+/) : [];
};

const extractText = (node: HastNode): string => {
  if (node.type === 'text') {
    return node.value || '';
  }
  if (!node.children) {
    return '';
  }
  return node.children.map(extractText).join('');
};

const findFirst = (node: HastNode, predicate: (candidate: HastNode) => boolean): HastNode | null => {
  if (predicate(node)) {
    return node;
  }
  if (!node.children) {
    return null;
  }
  for (const child of node.children) {
    const found = findFirst(child, predicate);
    if (found) {
      return found;
    }
  }
  return null;
};

const extractExplicitMathFromText = (text: string): string | null => {
  const blockMatch = text.match(/\$\$([\s\S]+?)\$\$/);
  if (blockMatch?.[1]) {
    return blockMatch[1].trim();
  }

  const inlineMatch = text.match(/\$([^$]+?)\$/);
  if (inlineMatch?.[1]) {
    return inlineMatch[1].trim();
  }

  return null;
};

const normalizeLatexFromText = (text: string): string => {
  return text
    .replace(/&amp;/g, '&')
    .replace(/\\\\/g, '\\')
    .replace(/\\_/g, '_')
    .replace(/\\\|/g, '|')
    .trim();
};

const looksLikeLatex = (text: string): boolean => {
  return /\\[a-zA-Z]+/.test(text) || /[{}]/.test(text);
};

const extractKatexErrorLatex = (text: string): string | null => {
  const envMatch = text.match(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/);
  if (envMatch) {
    return envMatch[0];
  }
  const closeIndex = text.lastIndexOf('\\]');
  if (closeIndex !== -1) {
    const start = text.search(/\\[a-zA-Z]+/);
    if (start !== -1 && start < closeIndex) {
      return text.slice(start, closeIndex);
    }
  }
  const explicit = extractExplicitMathFromText(text);
  if (explicit) {
    return explicit;
  }
  if (looksLikeLatex(text)) {
    return text;
  }
  return null;
};

const normalizeMathEscapes = (markdown: string): string => {
  const fix = (body: string) =>
    body
      .replace(/\\\\/g, '\\')
      .replace(/\\_/g, '_')
      .replace(/\\\|/g, '|');
  const withBlocks = markdown.replace(/\$\$([\s\S]+?)\$\$/g, (_m, body) => {
    return `$$${fix(body)}$$`;
  });
  return withBlocks.replace(/\$([^$]+?)\$/g, (_m, body) => {
    return `$${fix(body)}$`;
  });
};

const stripBracketMathDelims = (text: string): string => {
  return text.replace(/\\\[/g, '').replace(/\\\]/g, '').trim();
};

const normalizeKatexErrorLatex = (latex: string): string => {
  let next = latex;
  if (next.includes('\\end{aligned}') && !next.includes('\\begin{aligned}')) {
    next = `\\begin{aligned}\n${next}`;
  }
  next = next.replace(/\\\r?\n/g, '\\\\\n');
  return next;
};

const extractLatexSource = (node: HastNode): string | null => {
  const annotation = findFirst(node, (candidate) => {
    if (candidate.type !== 'element') return false;
    if (candidate.tagName !== 'annotation') return false;
    const encoding = getProp(candidate, 'encoding');
    return encoding === 'application/x-tex';
  });
  if (annotation) {
    const text = extractText(annotation).trim();
    if (text) {
      return text;
    }
  }

  let current: HastNode | null = node;
  while (current) {
    const dataLatex = getDataProp(current, 'data-latex-source');
    if (dataLatex?.trim()) {
      return dataLatex.trim();
    }
    const dataMath = getDataProp(current, 'data-math');
    if (dataMath?.trim()) {
      return dataMath.trim();
    }
    current = null;
  }

  const katexError = findFirst(node, (candidate) => {
    if (candidate.type !== 'element') return false;
    const classList = getClassList(candidate);
    return classList.includes('katex-error');
  });

  if (katexError) {
    const rawText = normalizeLatexFromText(extractText(katexError));
    const latex = extractKatexErrorLatex(rawText);
    if (!latex) {
      return rawText || null;
    }
    return normalizeKatexErrorLatex(stripBracketMathDelims(normalizeLatexFromText(latex)));
  }

  return null;
};

const isBlockMathNode = (node: HastNode): boolean => {
  const classList = getClassList(node);
  return classList.includes('katex-display') || classList.includes('math-block');
};

const isSingleOperatorLine = (line: string): boolean => {
  const trimmed = line.trim();
  return trimmed.length === 1 && ['=', '+', '-', '*', '/'].includes(trimmed);
};

const normalizeMathValue = (latex: string, isBlock: boolean): string | null => {
  const trimmed = latex.trim();
  if (!trimmed) {
    return null;
  }
  if (isBlock) {
    const lines = trimmed.split(/\r?\n/);
    if (lines.some(isSingleOperatorLine)) {
      return null;
    }
  }
  return trimmed;
};

const isMathNode = (node: HastNode): boolean => {
  if (node.type !== 'element') {
    return false;
  }
  const classList = getClassList(node);
  if (classList.includes('katex') || classList.includes('katex-display')) {
    return true;
  }
  if (classList.includes('math-inline') || classList.includes('math-block')) {
    return true;
  }
  if (classList.includes('katex-error')) {
    return true;
  }
  return false;
};

const isLikelyBlockLatex = (latex: string): boolean => {
  return /\\begin|\\\\|\\\[|\\\]|\n/.test(latex);
};

const rehypeMathExtract = () => {
  return (tree: HastNode) => {
    const walk = (node: HastNode, parent?: HastNode, index?: number) => {
      if (isMathNode(node)) {
        const latex = extractLatexSource(node);
        if (latex) {
          const isBlock = isBlockMathNode(node) || isLikelyBlockLatex(latex);
          const value = normalizeMathValue(latex, isBlock);
          if (value && parent && parent.children && typeof index === 'number') {
            parent.children[index] = {
              type: 'element',
              tagName: isBlock ? 'math-block' : 'math-inline',
              properties: { value },
              children: []
            };
            return;
          }
        }
      }
      if (node.children) {
        node.children.forEach((child, childIndex) => walk(child, node, childIndex));
      }
    };
    walk(tree);
  };
};

const removeHtmlNode = (node: any, parent?: any) => {
  if (!parent?.children) {
    return;
  }
  const index = parent.children.indexOf(node);
  if (index >= 0) {
    parent.children.splice(index, 1);
  }
};

const remarkNormalize = () => {
  return (tree: any) => {
    const visit = (node: any, parent?: any) => {
      if (node.type === 'html') {
        const text = String(node.value || '').replace(/<[^>]+>/g, '').trim();
        if (text && parent?.children) {
          const index = parent.children.indexOf(node);
          if (index >= 0) {
            parent.children.splice(index, 1, { type: 'text', value: text });
          }
        } else {
          removeHtmlNode(node, parent);
        }
        return;
      }
      node.children?.forEach((child: any) => visit(child, node));
    };
    visit(tree);
  };
};

const isSkippableTag = (tagName?: string): boolean => {
  return tagName === 'div' || tagName === 'span' || tagName === 'p';
};

const hasStructuredTags = (node: HastNode): boolean => {
  if (node.type === 'element' && node.tagName) {
    if (!isSkippableTag(node.tagName) && node.tagName !== 'br') {
      return true;
    }
  }
  if (node.children) {
    return node.children.some((child) => hasStructuredTags(child));
  }
  return false;
};

const collectPlainText = (node: HastNode): string => {
  if (node.type === 'text') {
    return node.value || '';
  }
  if (node.type === 'element' && node.tagName === 'br') {
    return '\n';
  }
  if (!node.children) {
    return '';
  }
  return node.children.map(collectPlainText).join('');
};

const normalizePlainText = (text: string): string => {
  let next = text;
  if (next.startsWith('请对以下内容原封不动进行输出：')) {
    next = next.replace(/^请对以下内容原封不动进行输出：\\s*/, '');
  }
  next = next.replace(/```\\n([A-Za-z0-9_-]+)\\n/g, '```$1\\n');
  return next;
};

type HtmlToMarkdownOptions = {
  postProcess?: (markdown: string) => string;
};

export const htmlToMarkdown = (html: string, options: HtmlToMarkdownOptions = {}): string => {
  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeMathExtract);

  const tree = processor.parse(html) as HastNode;
  processor.runSync(tree);

  const plainText = collectPlainText(tree);
  if (!hasStructuredTags(tree)) {
    const text = normalizePlainText(plainText);
    return options.postProcess ? options.postProcess(text) : text;
  }

  const markdown = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeMathExtract)
    .use(rehypeRemark, {
      handlers: {
        'math-inline': (_state: any, node: any) => ({
          type: 'inlineMath',
          value: node.properties?.value || ''
        }),
        'math-block': (_state: any, node: any) => ({
          type: 'math',
          value: node.properties?.value || ''
        })
      }
    } as any)
    .use(remarkGfm as unknown as any)
    .use(remarkNormalize)
    .use(remarkStringify as unknown as any, {
      handlers: {
        inlineMath: (node: any) => `$${node.value || ''}$`,
        math: (node: any) => `$$\n${node.value || ''}\n$$`
      }
    })
    .processSync(html)
    .toString();

  const normalized = normalizeMathEscapes(markdown);
  return options.postProcess ? options.postProcess(normalized) : normalized;
};
