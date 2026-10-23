import test from 'node:test';
import assert from 'node:assert/strict';
import { imageSource } from '../src/lib/image-source.ts';

const fallback = '/images/el-bebe/real-group-middle-v1.webp';

test('a native CMS photo without a URL never selects derivatives of the fallback photo', () => {
  assert.equal(imageSource({ id: 'native-media-id', meta: { storageKey: 'new-photo.jpg' } }, fallback), undefined);
  assert.equal(imageSource({ id: 'native-media-id' }, fallback), undefined);
});

test('explicit photo URLs and an absent CMS photo retain their matching source', () => {
  const uploaded = '/_emdash/api/media/file/new-photo.jpg';
  assert.equal(imageSource({ id: 'media-id', src: uploaded }, fallback), uploaded);
  assert.equal(imageSource(fallback, '/images/el-bebe/other.webp'), fallback);
  assert.equal(imageSource(null, fallback), fallback);
  assert.equal(imageSource(undefined, fallback), fallback);
});
