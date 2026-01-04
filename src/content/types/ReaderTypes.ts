/**
 * ReaderPanel 标准化数据类型
 * 
 * 设计原则：
 * - ReaderPanel 只关心"显示什么"，不关心"数据从哪来"
 * - 支持懒加载（性能优化）
 * - 与数据源完全解耦
 */

/**
 * 内容提供者类型
 * - 直接字符串：用于书签等静态数据
 * - 函数：用于实时页面的懒加载
 */
export type ContentProvider = string | (() => string) | (() => Promise<string>);

/**
 * 阅读器单元数据
 * 包含渲染一页所需的所有信息
 */
export interface ReaderItem {
    /** 唯一标识（用于缓存 key） */
    id: string | number;

    /** 用户提问（通常较短，直接提供） */
    userPrompt: string;

    /** AI 回答内容（支持懒加载） */
    content: ContentProvider;

    /** 元数据（用于 UI 展示） */
    meta?: ReaderItemMeta;
}

/**
 * 阅读器单元元数据
 */
export interface ReaderItemMeta {
    /** 平台名称 (ChatGPT, Gemini) */
    platform?: string;

    /** 平台图标 (SVG 字符串) */
    platformIcon?: string;

    /** 模型名称 */
    modelName?: string;

    /** 时间戳 */
    timestamp?: number;
}

/**
 * 解析内容提供者，获取实际的 Markdown 字符串
 * 统一处理 string | function | async function
 */
export async function resolveContent(provider: ContentProvider): Promise<string> {
    if (typeof provider === 'string') {
        return provider;
    }

    const result = provider();
    if (result instanceof Promise) {
        return await result;
    }
    return result;
}
