import test from 'node:test';
import assert from 'node:assert/strict';
import { updateScrollHeader } from '../src/lib/scroll-header.ts';

const initial = { y: 0, travel: 0, sticky: false, hidden: false };
test('scrolling down hides the compact header; reversing upward reveals it', () => {
  const down = updateScrollHeader(initial, 600, 152);
  assert.equal(down.sticky, true);
  assert.equal(down.hidden, true);
  assert.equal(updateScrollHeader(down, 580, 152).hidden, false);
});
test('small direction changes do not flicker the compact header', () => {
  let state = updateScrollHeader(initial, 600, 152);
  state = updateScrollHeader(state, 597, 152);
  assert.equal(state.hidden, true);
  state = updateScrollHeader(state, 592, 152);
  assert.equal(state.hidden, true);
  state = updateScrollHeader(state, 590, 152);
  assert.equal(state.hidden, false);
});
test('an open menu or focused header stays visible while scrolling', () => {
  const down = updateScrollHeader(initial, 600, 152);
  assert.equal(updateScrollHeader(down, 900, 152, true).hidden, false);
});
test('returning to the top restores the original header, including overscroll', () => {
  const down = updateScrollHeader(initial, 600, 152);
  assert.deepEqual(updateScrollHeader(down, -20, 152), initial);
});
