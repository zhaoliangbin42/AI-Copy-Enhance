import { describe, test, expect } from 'vitest';
import { LRUCache } from '../LRUCache';

describe('LRUCache', () => {
    test('基本get/set操作', () => {
        const cache = new LRUCache<string, number>(3);
        cache.set('a', 1);
        cache.set('b', 2);

        expect(cache.get('a')).toBe(1);
        expect(cache.get('b')).toBe(2);
        expect(cache.get('c')).toBeUndefined();
    });

    test('LRU淘汰策略', () => {
        const cache = new LRUCache<string, number>(2);
        cache.set('a', 1);
        cache.set('b', 2);
        cache.get('a'); // a变为最近使用
        cache.set('c', 3); // 淘汰b

        expect(cache.get('a')).toBe(1);
        expect(cache.get('b')).toBeUndefined();
        expect(cache.get('c')).toBe(3);
    });

    test('更新现有key', () => {
        const cache = new LRUCache<string, number>(2);
        cache.set('a', 1);
        cache.set('a', 10); // 更新

        expect(cache.get('a')).toBe(10);
        expect(cache.size()).toBe(1);
    });

    test('clear操作', () => {
        const cache = new LRUCache<string, number>(3);
        cache.set('a', 1);
        cache.set('b', 2);
        cache.clear();

        expect(cache.size()).toBe(0);
        expect(cache.get('a')).toBeUndefined();
    });

    test('全局统计', () => {
        const cache1 = new LRUCache<string, number>(2);
        const cache2 = new LRUCache<string, number>(2);

        cache1.set('a', 1);
        cache2.set('b', 2);

        expect(LRUCache.getTotalSize()).toBeGreaterThanOrEqual(2);

        cache1.destroy();
        cache2.destroy();
    });
});
