import { Marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { InputValidator } from '../utils/InputValidator';
import { CircuitBreaker } from '../resilience/CircuitBreaker';
import { DOMPurifySanitizer } from '../sanitizer/DOMPurifySanitizer';
import { ISanitizer } from '../sanitizer/ISanitizer';

export interface RenderOptions {
    maxInputSize?: number;
    maxOutputSize?: number;
    timeout?: number;
    sanitize?: boolean;
    codeBlockMode?: 'full' | 'placeholder';
    onProgress?: (percent: number) => void;  // ✅ 新增进度回调
}

export interface RenderResult {
    success: boolean;
    html?: string;
    error?: string;
    fallback?: string;
}

/**
 * Battle-hardened Markdown renderer
 * Features: circuit breaker, chunked rendering, input validation, XSS protection
 */
export class MarkdownRenderer {
    private static circuitBreaker = new CircuitBreaker();
    private static sanitizer: ISanitizer = new DOMPurifySanitizer();
    private static renderLock = new Map<string, Promise<RenderResult>>();

    private static readonly DEFAULT_OPTIONS: Required<RenderOptions> = {
        maxInputSize: 1_000_000,
        maxOutputSize: 5_000_000,
        timeout: 3000,
        sanitize: true,
        codeBlockMode: 'full',
        onProgress: undefined as any,  // ✅ 可选参数默认undefined
    };

    /**
     * Create marked instance (per-render isolation)
     */
    private static createMarkedInstance(): Marked {
        const t0 = performance.now();
        const instance = new Marked();
        instance.setOptions({
            breaks: true,
            gfm: true,
            async: true,
        });
        instance.use(markedKatex({
            throwOnError: false,
            output: 'html',
            nonStandard: true,
        }));
        const t1 = performance.now();
        console.log(`[AI-MarkDone][Renderer] createMarkedInstance: ${(t1 - t0).toFixed(2)}ms`);
        return instance;
    }

    /**
     * Render markdown (with circuit breaker + dedup)
     */
    static async render(
        markdown: string,
        options: RenderOptions = {}
    ): Promise<RenderResult> {
        const renderStartTime = performance.now();
        console.log(`[AI-MarkDone][Renderer] ⏱️ START render, length: ${markdown.length} chars`);

        const key = markdown.slice(0, 100);

        if (this.renderLock.has(key)) {
            console.log('[Renderer] 🔄 Reusing in-flight render (dedup)');
            return this.renderLock.get(key)!;
        }

        const markedInstance = this.createMarkedInstance();
        const promise = this.circuitBreaker.execute(
            () => this.renderUnsafe(markdown, options, markedInstance),
            {
                success: false,
                error: 'CIRCUIT_OPEN',
                fallback: this.renderPlainText(markdown),
            }
        );

        this.renderLock.set(key, promise);

        try {
            const result = await promise;
            const renderEndTime = performance.now();
            console.log(`[AI-MarkDone][Renderer] ✅ END render: ${(renderEndTime - renderStartTime).toFixed(2)}ms, success: ${result.success}`);
            return result;
        } finally {
            this.renderLock.delete(key);
        }
    }

    /**
     * Unsafe render (protected by circuit breaker)
     */
    private static async renderUnsafe(
        markdown: string,
        options: RenderOptions = {},
        markedInstance: Marked
    ): Promise<RenderResult> {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };

        // 1. Input validation
        const t0 = performance.now();
        const validation = InputValidator.validate(markdown, opts.maxInputSize);
        console.log(`[AI-MarkDone][Renderer]   validate: ${(performance.now() - t0).toFixed(2)}ms`);

        if (!validation.valid) {
            console.warn(`[Renderer] ❌ Validation failed: ${validation.error}`);
            return {
                success: false,
                error: validation.error,
                fallback: this.renderPlainText(validation.sanitized),
            };
        }

        // 2. Render with timeout (chunked, interruptible)
        try {
            const t1 = performance.now();
            const html = await this.renderWithTimeout(
                validation.sanitized,
                opts.timeout,
                markedInstance,
                opts.onProgress  // ✅ 传递进度回调
            );
            console.log(`[AI-MarkDone][Renderer]   renderWithTimeout: ${(performance.now() - t1).toFixed(2)}ms`);


            // 3. Output size check
            if (html.length > opts.maxOutputSize) {
                console.error(`[Renderer] ❌ OUTPUT_TOO_LARGE: ${html.length} > ${opts.maxOutputSize}`);
                throw new Error('OUTPUT_TOO_LARGE');
            }

            // 4. XSS sanitization
            const t2 = performance.now();
            const safeHtml = opts.sanitize
                ? this.sanitizer.sanitize(html)
                : html;
            if (opts.sanitize) {
                console.log(`[AI-MarkDone][Renderer]   sanitize: ${(performance.now() - t2).toFixed(2)}ms`);
            }

            return { success: true, html: safeHtml };

        } catch (error) {
            throw error; // Circuit breaker will catch
        }
    }

    /**
     * Render with timeout (chunked, interruptible)
     */
    private static renderWithTimeout(
        markdown: string,
        timeout: number,
        markedInstance: Marked,
        onProgress?: (percent: number) => void
    ): Promise<string> {
        const startTime = performance.now();
        const overallStart = Date.now();

        return new Promise((resolve, reject) => {
            const t0 = performance.now();
            const processed = this.preprocessFormulas(markdown);
            console.log(`[AI-MarkDone][Renderer]     preprocessFormulas: ${(performance.now() - t0).toFixed(2)}ms`);

            const t1 = performance.now();
            const chunks = this.chunkMarkdown(processed, 20000);
            console.log(`[AI-MarkDone][Renderer]     chunkMarkdown: ${(performance.now() - t1).toFixed(2)}ms, chunks: ${chunks.length}`);

            let result = '';
            let currentIndex = 0;

            const processChunk = async () => {
                try {
                    if (currentIndex >= chunks.length) {
                        resolve(result);
                        return;
                    }

                    if (Date.now() - overallStart > timeout) {
                        console.error(`[Renderer] ❌ RENDER_TIMEOUT after ${Date.now() - overallStart}ms`);
                        reject(new Error('RENDER_TIMEOUT'));
                        return;
                    }

                    const chunkStart = performance.now();
                    result += await markedInstance.parse(chunks[currentIndex]);
                    const chunkTime = performance.now() - chunkStart;
                    console.log(`[AI-MarkDone][Renderer]     chunk ${currentIndex + 1}/${chunks.length}: ${chunkTime.toFixed(2)}ms (${chunks[currentIndex].length} chars)`);

                    currentIndex++;

                    // ✅ 进度回调(如果提供)
                    if (onProgress && currentIndex <= chunks.length) {
                        try {
                            onProgress((currentIndex / chunks.length) * 100);
                        } catch (e) {
                            console.warn('[Render] Progress callback error:', e);
                        }
                    }

                    if (currentIndex < chunks.length) {
                        await new Promise<void>(r => { queueMicrotask(() => r()); });
                        processChunk();
                    } else {
                        console.log(`[AI-MarkDone][Renderer]     ✅ All chunks done, total: ${(performance.now() - startTime).toFixed(2)}ms`);
                        resolve(result);
                    }
                } catch (error) {
                    console.error('[AI-MarkDone][Renderer] ❌ Chunk processing error:', error);
                    reject(error);
                }
            };

            processChunk();
        });
    }

    /**
     * Chunk markdown by lines (avoid breaking structure)
     */
    private static chunkMarkdown(markdown: string, chunkSize: number): string[] {
        if (markdown.length <= chunkSize) {
            return [markdown];
        }

        const lines = markdown.split('\n');
        const chunks: string[] = [];
        let currentChunk = '';

        for (const line of lines) {
            if (currentChunk.length + line.length > chunkSize) {
                chunks.push(currentChunk);
                currentChunk = line + '\n';
            } else {
                currentChunk += line + '\n';
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    /**
     * Preprocess formulas (fix consecutive formulas)
     */
    private static preprocessFormulas(markdown: string): string {
        return markdown
            .replace(/\$([^$]+)\$([\u3001\uff0c\u3002\uff1b\uff1a\uff01\uff1f])\$([^$]+)\$/g,
                '$$$1$$ $2 $$$3$$')
            .replace(/\$([^$]+)\$(\u2014\u2014)\$([^$]+)\$/g,
                '$$$1$$ $2 $$$3$$');
    }

    /**
     * Fallback: render as plain text
     */
    private static renderPlainText(markdown: string): string {
        const escaped = markdown
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return `<pre class="markdown-fallback">${escaped}</pre>`;
    }

    /**
     * Set custom sanitizer (for testing)
     */
    static setSanitizer(sanitizer: ISanitizer): void {
        this.sanitizer = sanitizer;
    }

    /**
     * Get circuit breaker state (health check)
     */
    static getCircuitState(): { state: string; failures: number } {
        return this.circuitBreaker.getState();
    }
}
