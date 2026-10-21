import test from 'node:test';
import assert from 'node:assert/strict';
import { selectParentReviews } from '../src/lib/parent-reviews.ts';

test('only approved five-star reviews with a source for this kindergarten are selected', () => {
  const review = { id: 'fixture', author: 'Fixture', text: 'Fixture text', rating: 5, approved: true, sourceUrl: 'https://yandex.ru/maps/org/el_bebe/154599785417/reviews/' };
  assert.deepEqual(selectParentReviews([review, {...review, rating:4}, {...review, approved:false}, {...review, sourceUrl:'https://example.com/'}, {...review, sourceUrl:'https://yandex.ru/maps/org/another/123/reviews/'}, {...review, text:''}, {...review, sourceUrl:'javascript:alert(1)'}, review]), [review]);
  assert.deepEqual(selectParentReviews([]), []);
});

test('2GIS reviews are restricted to the verified kindergarten and the matching platform', () => {
  const review = { id: '2gis-fixture', author: 'Fixture', text: 'Fixture text', rating: 5, approved: true, source: '2gis', sourceUrl: 'https://2gis.ru/sochi/firm/70000001044912349/tab/reviews' };
  assert.deepEqual(selectParentReviews([review]), [review]);
  for (const sourceUrl of ['https://2gis.ru/sochi/firm/123/tab/reviews', 'https://2gis.ru.example.com/sochi/firm/70000001044912349/tab/reviews', 'https://user:pass@2gis.ru/sochi/firm/70000001044912349/tab/reviews']) {
    assert.deepEqual(selectParentReviews([{...review, sourceUrl}]), []);
  }
  assert.deepEqual(selectParentReviews([{...review, source:'yandex'}]), []);
});

test('published excerpts carry real author, date and checked source, without duplicate records', async () => {
  const { parentReviews } = await import('../src/data/parent-reviews.ts');
  assert.equal(selectParentReviews(parentReviews).length, parentReviews.length);
  assert.ok(parentReviews.length >= 2);
  assert.deepEqual(new Set(parentReviews.map(review => review.source)), new Set(['yandex','2gis']));
  for (const review of parentReviews) {
    assert.match(review.published, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(review.date && review.topic);
  }
});
