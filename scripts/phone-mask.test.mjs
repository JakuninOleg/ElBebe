import assert from 'node:assert/strict';
import test from 'node:test';
import { attachRuPhoneMask, caretAfterDigitCount, deleteRuPhone, digitCountBefore, formatRuPhone, normalizeRuPhone, pasteRuPhone, toRuPhoneDigits } from '../src/lib/ru-phone.ts';

test('Russian prefixes, autofill and completed-number validation', () => {
  for (const raw of ['79123456789', '89123456789', '9123456789', '+7 (912) 345-67-89']) {
    assert.equal(toRuPhoneDigits(raw), '79123456789');
    assert.equal(normalizeRuPhone(raw), '79123456789');
  }
  assert.equal(normalizeRuPhone('+7 (343) 278-37-43'), '73432783743');
  for (const raw of ['', '+7 (', '7912', '791234567890', '+1 234 567 8901', '71234567890', '7abc9123456789']) assert.equal(normalizeRuPhone(raw), null);
});

test('Progressive formatting and bounded editing state', () => {
  const expected = ['', '+7 (', '+7 (9', '+7 (912', '+7 (912) 3', '+7 (912) 345-', '+7 (912) 345-67-', '+7 (912) 345-67-89'];
  ['', '7', '79', '7912', '79123', '7912345', '791234567', '79123456789'].forEach((digits, i) => assert.equal(formatRuPhone(digits), expected[i]));
  assert.equal(toRuPhoneDigits('79123456789099'), '79123456789');
  assert.equal(caretAfterDigitCount('+7 (', 1), 4);
});

test('Backspace and Delete remove digits around separators, preserving country code', () => {
  const full = '+7 (912) 345-67-89';
  const gap = full.indexOf(')') + 2;
  assert.deepEqual(deleteRuPhone(full, gap, gap, 'backward'), { digits: '7913456789', caretDigits: 3 });
  const hyphen = full.indexOf('-');
  assert.deepEqual(deleteRuPhone(full, hyphen, hyphen, 'forward'), { digits: '7912345789', caretDigits: 7 });
  assert.deepEqual(deleteRuPhone(full, 0, full.length, 'backward'), { digits: '7', caretDigits: 1 });
  assert.equal(deleteRuPhone(full, 0, 2, 'forward').digits, '79123456789');
});

test('Whole-number paste replaces a prefocused stub; short paste replaces selected digits', () => {
  assert.deepEqual(pasteRuPhone('+7 (', '8 (912) 345-67-89', 4, 4), { digits: '79123456789', caretDigits: 11 });
  assert.equal(pasteRuPhone('+7 (999) 000-00-00', '9123456789', 8, 8).digits, '79123456789');
  const full = '+7 (912) 345-67-89';
  assert.deepEqual(pasteRuPhone(full, '00', 9, 11), { digits: '79120056789', caretDigits: 6 });
  assert.equal(digitCountBefore(full, caretAfterDigitCount(full, 8)), 8);
});

// Minimal event host for lifecycle/mobile-event contracts. Actual keyboard input is
// additionally checked in the local browser; this host is not a browser substitute.
class InputHost extends EventTarget {
  value = '';
  disabled = false;
  readOnly = false;
  selectionStart = 0;
  selectionEnd = 0;
  ownerDocument = { activeElement: this };
  form = new EventTarget();
  setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }
}
function event(type, fields = {}, cancelable = true) {
  const value = new Event(type, { cancelable });
  Object.assign(value, fields);
  return value;
}

test('Focus stub, blur, incomplete input and form reset lifecycle', async () => {
  const input = new InputHost();
  const cleanup = attachRuPhoneMask(input);
  assert.equal(attachRuPhoneMask(input), cleanup);
  input.dispatchEvent(event('focus'));
  assert.equal(input.value, '+7 (');
  assert.equal(input.selectionStart, 4);
  input.dispatchEvent(event('blur'));
  assert.equal(input.value, '');
  input.value = '7912';
  input.dispatchEvent(event('input'));
  input.dispatchEvent(event('blur'));
  assert.equal(input.value, '+7 (912');
  input.form.dispatchEvent(event('reset'));
  input.value = '';
  await Promise.resolve();
  input.dispatchEvent(event('focus'));
  assert.equal(input.value, '+7 (');
  cleanup();
});

test('Mobile beforeinput deletion works with and without a cancelable event', () => {
  for (const cancelable of [true, false]) {
    const input = new InputHost();
    input.value = '+7 (912) 345-67-89';
    attachRuPhoneMask(input);
    input.setSelectionRange(9, 9);
    input.dispatchEvent(event('beforeinput', { inputType: 'deleteContentBackward' }, cancelable));
    if (!cancelable) {
      input.value = '+7 (912)345-67-89';
      input.dispatchEvent(event('input'));
    }
    assert.equal(input.value, '+7 (913) 456-78-9');
    assert.equal(input.selectionStart, 6);
  }
});

test('Overflow restores the controlled display and does not move a middle caret to the end', () => {
  const input = new InputHost();
  input.value = '79123456789';
  attachRuPhoneMask(input);
  input.value = '+7 (912) 0345-67-89';
  input.setSelectionRange(10, 10);
  input.dispatchEvent(event('input'));
  assert.equal(input.value, '+7 (912) 034-56-78');
  assert.equal(input.selectionStart, 10);
  input.value = '+7 (912) 034-56-789';
  input.setSelectionRange(input.value.length, input.value.length);
  input.dispatchEvent(event('input'));
  assert.equal(input.value, '+7 (912) 034-56-78');
});

test('Disabled showcase fields receive no active mask', () => {
  const input = new InputHost();
  input.disabled = true;
  attachRuPhoneMask(input);
  input.dispatchEvent(event('focus'));
  assert.equal(input.value, '');
});

test('React adapter callback gets canonical digits for focus, paste, deletion and reset', async () => {
  const input = new InputHost();
  const changes = [];
  attachRuPhoneMask(input, { onValueChange: digits => changes.push(digits) });
  input.dispatchEvent(event('focus'));
  assert.equal(changes.at(-1), '7');
  input.dispatchEvent(event('paste', { clipboardData: { getData: () => '8 (912) 345-67-89' } }));
  assert.equal(changes.at(-1), '79123456789');
  input.setSelectionRange(0, input.value.length);
  input.dispatchEvent(event('keydown', { key: 'Backspace' }));
  assert.equal(changes.at(-1), '7');
  input.form.dispatchEvent(event('reset'));
  input.value = '';
  await Promise.resolve();
  assert.equal(changes.at(-1), '');
});
