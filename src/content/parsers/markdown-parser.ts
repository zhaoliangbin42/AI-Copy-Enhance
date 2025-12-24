import { logger } from '../../utils/logger';
import { htmlToMarkdown } from '../../utils/markdown';

export class MarkdownParser {
    parse(element: HTMLElement): string {
        const html = element.innerHTML;
        logger.debug('[MarkdownParser] AST pipeline parse');
        return htmlToMarkdown(html);
    }
}
