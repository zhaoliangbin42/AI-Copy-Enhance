import { describe, test, expect } from 'vitest';
import { InputValidator } from '../InputValidator';

describe('InputValidator', () => {
    test('正常输入通过验证', () => {
        const result = InputValidator.validate('# Hello\n\nThis is **markdown**.');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
    });

    test('检测javascript: URL', () => {
        const result = InputValidator.validate('[Click](javascript:alert("XSS"))');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('DANGEROUS_CONTENT');
        expect(result.sanitized).not.toContain('javascript:');
    });

    test('检测<script>标签', () => {
        const result = InputValidator.validate('Hello<script>alert(1)</script>World');
        expect(result.valid).toBe(false);
        expect(result.sanitized).not.toContain('<script>');
    });

    test('超大内容被截断', () => {
        const huge = 'x'.repeat(2_000_000);
        const result = InputValidator.validate(huge, 1_000_000);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('CONTENT_TOO_LARGE');
        expect(result.sanitized.length).toBeLessThanOrEqual(1_000_050);
    });

    test('过深嵌套被展平', () => {
        const deep = '['.repeat(100) + 'text' + ']'.repeat(100);
        const result = InputValidator.validate(deep);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NESTING_TOO_DEEP');
    });
});
