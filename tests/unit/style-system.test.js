import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const readText = (relativePath) =>
  readFileSync(path.join(repoRoot, relativePath), 'utf8');
const sliceBetween = (text, startMarker, endMarker) => {
  const startIndex = text.indexOf(startMarker);
  const endIndex = text.indexOf(endMarker, startIndex);

  assert.ok(startIndex !== -1, `Missing start marker: ${startMarker}`);
  assert.ok(endIndex !== -1, `Missing end marker: ${endMarker}`);

  return text.slice(startIndex, endIndex);
};

test('design-tokens includes base and dark theme blocks', () => {
  const css = readText('src/styles/design-tokens.css');

  assert.match(css, /:root\s*\{/);
  assert.match(css, /html\.dark\s*\{/);

  const requiredTokens = [
    '--gray-50',
    '--primary-500',
    '--md-surface',
    '--z-modal',
  ];

  for (const token of requiredTokens) {
    assert.ok(css.includes(token), `Missing token: ${token}`);
  }
});

test('design token manager covers key token groups', () => {
  const source = readText('src/utils/design-token-manager.ts');

  assert.match(source, /generateRange\('gray',\s*\[\s*50,\s*100/);
  assert.match(source, /generateRange\('primary',\s*\[\s*50,\s*100/);

  const requiredTokens = [
    'md-surface',
    'font-sans',
    'shadow-md',
    'z-modal',
  ];

  for (const token of requiredTokens) {
    assert.match(source, new RegExp(`['"]${token}['"]`));
  }
});

test('content entrypoint avoids global design token injection', () => {
  const source = readText('src/content/index.ts');
  assert.ok(!source.includes('design-tokens.css?raw'));
  assert.ok(!source.includes('aicopy-design-tokens'));
});

test('component styles do not import design tokens directly', () => {
  const toolbarStyles = readText('src/styles/toolbar.css.ts');
  const modalStyles = readText('src/styles/modal.css.ts');

  assert.ok(!/import\s+['"]\.\/design-tokens\.css['"]/.test(toolbarStyles));
  assert.ok(!/import\s+['"]\.\/design-tokens\.css['"]/.test(modalStyles));
});

test('toolbar and modal styles avoid per-component dark selectors', () => {
  const toolbarStyles = readText('src/styles/toolbar.css.ts');
  const modalStyles = readText('src/styles/modal.css.ts');

  assert.ok(!toolbarStyles.includes(':host-context(html.dark)'));
  assert.ok(!modalStyles.includes(':host-context(html.dark)'));
});

test('toolbar and modal components apply design token helpers', () => {
  const modalComponent = readText('src/content/components/modal.ts');
  const toolbarComponent = readText('src/content/components/toolbar.ts');

  assert.ok(modalComponent.includes('DesignTokens.getCompleteTokens'));
  assert.ok(toolbarComponent.includes('DesignTokens.getCompleteTokens'));
});

test('bookmark panel dialogs avoid inline style overrides', () => {
  const source = readText('src/bookmarks/components/SimpleBookmarkPanel.ts');

  const exportDialog = sliceBetween(source, 'private async showExportOptionsDialog', 'private async handleExport');
  const mergeDialog = sliceBetween(source, 'private async showMergeDialog', 'private async importBookmarks');

  assert.ok(!exportDialog.includes('style.cssText'), 'Export dialog still uses inline cssText');
  assert.ok(!mergeDialog.includes('style.cssText'), 'Merge dialog still uses inline cssText');
});
