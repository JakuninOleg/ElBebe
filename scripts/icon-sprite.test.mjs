import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { illustratedIcons, illustratedIconAliases } from '../src/data/illustrated-icons.ts';

test('shared SVG contains every approved illustration and all aliases resolve', async () => {
  const sprite = await readFile(new URL('../src/assets/el-bebe-illustrations.svg', import.meta.url), 'utf8');
  for (const [id, art] of Object.entries(illustratedIcons)) {
    assert.ok(sprite.includes(`<symbol id="${id}" viewBox="0 0 120 110">${art}</symbol>`), `Regenerate the sprite for ${id}`);
  }
  for (const target of Object.values(illustratedIconAliases)) assert.ok(target in illustratedIcons, target);
});
