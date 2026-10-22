import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { buildLifeAlbum } from '../src/data/life-album.ts';

test('every supplied photo appears once, including photos outside the curated themes', async () => {
  const source = JSON.parse(await readFile(new URL('../src/data/showcase.json', import.meta.url), 'utf8'));
  const photos = source.spaces;
  assert.equal(photos.length, 32);
  const album = buildLifeAlbum(photos);
  const shown = [...album.opening, ...album.sections.flatMap(section => section.photos)];
  assert.equal(shown.length, photos.length);
  assert.equal(new Set(shown.map(photo => photo.id)).size, photos.length);
  assert.deepEqual(new Set(shown.map(photo => photo.id)), new Set(photos.map(photo => photo.id)));
  assert.equal(album.sections.length, 3);

  const custom = { id: 'cms-photo', title: 'Новое фото', image: '/images/el-bebe/new.webp' };
  const customAlbum = buildLifeAlbum([...photos, custom]);
  assert.equal(customAlbum.sections.at(-1).photos[0].id, custom.id);
});

test('empty or small CMS albums retain every valid photo', () => {
  assert.deepEqual(buildLifeAlbum([]), { opening: [], sections: [] });
  const photos = Array.from({ length: 5 }, (_, i) => ({ id: `cms-${i}`, title: 'Фото', image: '/images/el-bebe/photo.webp' }));
  const album = buildLifeAlbum([...photos, { id: 'empty', title: 'Без фото', image: null }]);
  assert.equal(album.opening.length, 3);
  assert.equal(album.sections[0].photos.length, 2);
});
