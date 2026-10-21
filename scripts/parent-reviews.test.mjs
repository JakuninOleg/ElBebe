import test from 'node:test';
import assert from 'node:assert/strict';
import { selectParentReviews } from '../src/lib/parent-reviews.ts';

test('only approved five-star reviews with a source for this kindergarten are selected', () => {
  const review = { id: 'fixture', author: 'Fixture', text: 'Fixture text', rating: 5, approved: true, sourceUrl: 'https://yandex.ru/maps/org/el_bebe/154599785417/reviews/' };
  assert.deepEqual(selectParentReviews([review, {...review, rating:4}, {...review, approved:false}, {...review, sourceUrl:'https://example.com/'}, {...review, sourceUrl:'https://yandex.ru/maps/org/another/123/reviews/'}, {...review, text:''}, {...review, sourceUrl:'javascript:alert(1)'}, review]), [review]);
  assert.deepEqual(selectParentReviews([]), []);
});
