import { describe, test, expect } from 'vitest';
import { CircuitBreaker } from '../CircuitBreaker';

describe('CircuitBreaker', () => {
    test('成功执行', async () => {
        const cb = new CircuitBreaker();
        const result = await cb.execute(
            () => Promise.resolve('success'),
            'fallback'
        );
        expect(result).toBe('success');
    });

    test('3次失败后打开电路', async () => {
        const cb = new CircuitBreaker();

        // 3次失败
        await cb.execute(() => Promise.reject('fail'), 'fallback');
        await cb.execute(() => Promise.reject('fail'), 'fallback');
        await cb.execute(() => Promise.reject('fail'), 'fallback');

        const state = cb.getState();
        expect(state.state).toBe('OPEN');
        expect(state.failures).toBe(3);
    });

    test('OPEN状态直接返回fallback', async () => {
        const cb = new CircuitBreaker();

        // 触发3次失败
        for (let i = 0; i < 3; i++) {
            await cb.execute(() => Promise.reject(), 'fallback');
        }

        // 第4次应该直接fallback,不执行fn
        let executed = false;
        const result = await cb.execute(() => {
            executed = true;
            return Promise.resolve('ok');
        }, 'fallback');

        expect(executed).toBe(false);
        expect(result).toBe('fallback');
    });

    test('reset重置状态', () => {
        const cb = new CircuitBreaker();
        cb.execute(() => Promise.reject(), 'fallback');
        cb.reset();

        const state = cb.getState();
        expect(state.state).toBe('CLOSED');
        expect(state.failures).toBe(0);
    });
});
