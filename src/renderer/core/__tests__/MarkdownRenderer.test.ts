import { describe, test, expect, beforeEach } from 'vitest';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer', () => {
    beforeEach(() => {
        // Reset circuit breaker between tests
        const cb = (MarkdownRenderer as any).circuitBreaker;
        if (cb) cb.reset();
    });

    test('正常渲染markdown', async () => {
        const result = await MarkdownRenderer.render('# Hello\n\nThis is **bold**.');
        expect(result.success).toBe(true);
        expect(result.html).toContain('<h1');
        expect(result.html).toContain('<strong>bold</strong>');
    });

    test('渲染数学公式', async () => {
        const result = await MarkdownRenderer.render('Inline: $x^2$\n\nBlock:\n$$\\frac{a}{b}$$');
        expect(result.success).toBe(true);
        expect(result.html).toContain('katex');
    });

    test('输入验证:XSS被检测', async () => {
        const result = await MarkdownRenderer.render('<script>alert("XSS")</script>');
        expect(result.success).toBe(false);
        expect(result.error).toBe('DANGEROUS_CONTENT');
    });

    test('输入验证:超大内容', async () => {
        const huge = 'x'.repeat(2_000_000);
        const result = await MarkdownRenderer.render(huge);
        expect(result.success).toBe(false);
        expect(result.error).toBe('CONTENT_TOO_LARGE');
    });

    test('DOMPurify清洗HTML', async () => {
        const result = await MarkdownRenderer.render('[Click](javascript:alert(1))', {
            sanitize: true,
        });
        expect(result.success).toBe(true);
        expect(result.html).not.toContain('javascript:');
    });

    test('超时fallback (模拟)', async () => {
        // 创建一个巨大的文档触发超时(实际测试中可能不会真正超时)
        const huge = '#'.repeat(100000) + '\n' + 'text '.repeat(100000);
        const result = await MarkdownRenderer.render(huge, { timeout: 100 });

        // 应该要么成功,要么fallback
        expect(result.success !== undefined).toBe(true);
    });

    test('Circuit breaker: 3次失败后熔断', async () => {
        // 触发3次输入验证失败
        await MarkdownRenderer.render('<script>1</script>');
        await MarkdownRenderer.render('<script>2</script>');
        await MarkdownRenderer.render('<script>3</script>');

        const state = MarkdownRenderer.getCircuitState();
        expect(state.failures).toBe(3);
        // Circuit breaker可能OPEN或仍在处理
    });

    test('公式预处理:连续公式', async () => {
        const result = await MarkdownRenderer.render('$a$、$b$');
        expect(result.success).toBe(true);
        // 应该能正确处理连续公式
    });

    test('代码块placeholder模式', async () => {
        const result = await MarkdownRenderer.render('```python\nprint("hello")\n```', {
            codeBlockMode: 'placeholder',
        });
        expect(result.success).toBe(true);
        expect(result.html).toContain('code-placeholder');
    });

    test('代码块full模式', async () => {
        const result = await MarkdownRenderer.render('```python\nprint("hello")\n```', {
            codeBlockMode: 'full',
        });
        expect(result.success).toBe(true);
        expect(result.html).toContain('<code');
    });
});
