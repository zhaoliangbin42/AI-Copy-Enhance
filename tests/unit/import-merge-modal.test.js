import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(
    new URL('../../src/bookmarks/components/SimpleBookmarkPanel.ts', import.meta.url),
    'utf8'
);

test('merge modal includes import status labels', () => {
    assert.match(source, /正常导入/);
    assert.match(source, /重命名合并/);
    assert.match(source, /合并到 import 文件夹/);
});

test('merge modal provides rename preview text', () => {
    assert.match(source, /重命名为：/);
});
