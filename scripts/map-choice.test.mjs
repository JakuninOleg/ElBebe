import assert from 'node:assert/strict';
import test from 'node:test';
import { MAP_CHOICE_LIFETIME, parseMapChoice } from '../src/lib/map-choice.ts';
const now = 1_800_000_000_000;
test('accepts explicit allow and deny choices for 180 days', () => {
  for (const maps of [true, false]) {
    const choice = { version: 1, maps, savedAt: now - 1000 };
    assert.deepEqual(parseMapChoice(JSON.stringify(choice), now), choice);
  }
});
test('unknown, expired, future and malformed choices never enable maps', () => {
  for (const raw of [null, '', 'broken', 'null', '[]', 'true', '{}',
    JSON.stringify({ version: 1, maps: 'true', savedAt: now }),
    JSON.stringify({ version: 2, maps: true, savedAt: now }),
    JSON.stringify({ version: 1, maps: true, savedAt: now + 1 }),
    JSON.stringify({ version: 1, maps: true, savedAt: now - MAP_CHOICE_LIFETIME }),
  ]) assert.equal(parseMapChoice(raw, now), null);
});
