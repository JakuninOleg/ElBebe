import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { primaryNavigation } from '../src/data/navigation.ts';

test('every navigation destination exists in the published site, including section anchors', async () => {
  const links = primaryNavigation.flatMap(item => 'children' in item ? item.children : [item]);
  assert.equal(new Set(primaryNavigation.map(item => item.id)).size, primaryNavigation.length);
  assert.equal(new Set(links.map(link => link.href)).size, links.length);
  for (const link of links) {
    const [path, anchor] = link.href.split('#');
    const file = new URL(`../dist-showcase${path}index.html`, import.meta.url);
    await access(file);
    if (anchor) assert.ok((await readFile(file, 'utf8')).includes(`id="${anchor}"`), link.href);
  }
  for (const href of ['/prostranstvo/', '/stoimost/', '/kontakty/']) {
    assert.ok(primaryNavigation.some(item => 'href' in item && item.href === href));
  }
});
