/** OJ phone logic extracted from existing React PhoneInput implementations. */
export const RU_PHONE_PLACEHOLDER = '+7 (___) ___-__-__';

export function digitsOnly(value: string): string {
  return (value || '').replace(/\D/g, '');
}

/** Editing state: fixed country code 7 and at most ten subscriber digits. */
export function toRuPhoneDigits(value: string): string {
  let digits = digitsOnly(value);
  if (!digits) return '';
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (!digits.startsWith('7')) digits = `7${digits}`;
  return digits.slice(0, 11);
}

/** Complete values only. Keep validation separate from the editing mask. */
export function normalizeRuPhone(value: string): string | null {
  if (!/^[+\d\s()\-]+$/.test(value) || value.length > 64) return null;
  let digits = digitsOnly(value);
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith('9')) digits = `7${digits}`;
  return /^7[3-9]\d{9}$/.test(digits) ? digits : null;
}

export function formatRuPhone(digits: string): string {
  if (!digits) return '';
  if (digits === '7') return '+7 (';
  if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
  if (digits.length < 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  if (digits.length < 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

export function digitCountBefore(value: string, caret: number): number {
  return digitsOnly(value.slice(0, Math.max(0, caret))).length;
}

export function caretAfterDigitCount(value: string, count: number): number {
  // The country code is fixed. The first editable position is after "+7 (".
  if (count <= 1) return Math.max(0, value.indexOf('(') + 1);
  let seen = 0;
  for (let i = 0; i < value.length; i++) {
    if (/\d/.test(value[i]) && ++seen >= count) return i + 1;
  }
  return value.length;
}

export interface PhoneEdit { digits: string; caretDigits: number; }

/** Delete actual digits, including when the caret is beside a separator. */
export function deleteRuPhone(value: string, start: number, end: number, direction: 'backward' | 'forward'): PhoneEdit {
  const digits = toRuPhoneDigits(value) || '7';
  const from = Math.max(1, digitCountBefore(value, start));
  const to = Math.max(1, digitCountBefore(value, end));
  if (start !== end) return { digits: digits.slice(0, from) + digits.slice(to), caretDigits: from };
  if (direction === 'backward') {
    if (from <= 1) return { digits, caretDigits: 1 };
    return { digits: digits.slice(0, from - 1) + digits.slice(from), caretDigits: from - 1 };
  }
  return { digits: digits.slice(0, from) + digits.slice(from + 1), caretDigits: from };
}

/** Whole numbers replace the field; short pasted fragments replace the selection. */
export function pasteRuPhone(value: string, pasted: string, start: number, end: number): PhoneEdit {
  const incoming = digitsOnly(pasted);
  if (incoming.length === 10 || (incoming.length >= 11 && /^[78]/.test(incoming))) {
    const digits = toRuPhoneDigits(incoming);
    return { digits, caretDigits: digits.length };
  }
  const current = toRuPhoneDigits(value) || '7';
  const from = Math.max(1, digitCountBefore(value, start));
  const to = Math.max(1, digitCountBefore(value, end));
  const digits = (current.slice(0, from) + incoming + current.slice(to)).slice(0, 11);
  return { digits, caretDigits: Math.min(digits.length, from + incoming.length) };
}

const attached = new WeakMap<HTMLInputElement, () => void>();

/** Vanilla/Astro adapter. Importing the pure helpers on the server is safe. */
export function attachRuPhoneMask(input: HTMLInputElement, options: { onValueChange?: (digits: string) => void } = {}): () => void {
  if (input.disabled || input.readOnly) return () => {};
  const existing = attached.get(input);
  if (existing) return existing;
  let digits = toRuPhoneDigits(input.value);
  let composing = false;
  let pendingDelete: PhoneEdit | null = null;

  function apply(next: string, caretDigits?: number) {
    const changed = digits !== next;
    digits = next;
    // Restore the DOM even when truncation gives the same state as before.
    input.value = formatRuPhone(digits);
    if (caretDigits !== undefined && input.ownerDocument.activeElement === input) {
      const caret = caretAfterDigitCount(input.value, caretDigits);
      input.setSelectionRange(caret, caret);
    }
    if (changed) options.onValueChange?.(digits);
  }

  function selection() {
    return [input.selectionStart ?? input.value.length, input.selectionEnd ?? input.value.length] as const;
  }
  function onFocus() {
    pendingDelete = null;
    apply(toRuPhoneDigits(input.value) || '7', digits ? undefined : 1);
  }
  function onBlur() {
    const next = toRuPhoneDigits(input.value);
    apply(!next || next === '7' ? '' : next);
  }
  function onKeydown(event: KeyboardEvent) {
    if (composing || event.isComposing || event.ctrlKey || event.metaKey || !['Backspace', 'Delete'].includes(event.key)) return;
    event.preventDefault();
    pendingDelete = null;
    const [start, end] = selection();
    const edit = deleteRuPhone(input.value, start, end, event.key === 'Backspace' ? 'backward' : 'forward');
    apply(edit.digits, edit.caretDigits);
  }
  function onBeforeInput(event: InputEvent) {
    if (composing || event.isComposing) return;
    if (!['deleteContentBackward', 'deleteContentForward', 'deleteByCut'].includes(event.inputType)) return;
    const [start, end] = selection();
    const edit = deleteRuPhone(input.value, start, end, event.inputType === 'deleteContentBackward' ? 'backward' : 'forward');
    // Virtual keyboards may omit keydown. Non-cancelable edits are restored on input.
    if (event.cancelable) { event.preventDefault(); apply(edit.digits, edit.caretDigits); }
    else pendingDelete = edit;
  }
  function onInput(event?: Event) {
    if (composing || (event as InputEvent | undefined)?.isComposing) return;
    if (pendingDelete) {
      const edit = pendingDelete;
      pendingDelete = null;
      apply(edit.digits, edit.caretDigits);
      return;
    }
    const caret = input.selectionStart ?? input.value.length;
    const atEnd = caret >= input.value.length;
    const count = digitCountBefore(input.value, caret);
    const next = toRuPhoneDigits(input.value) || '7';
    apply(next, atEnd ? next.length : Math.max(1, Math.min(next.length, count)));
  }
  function onPaste(event: ClipboardEvent) {
    if (!event.clipboardData) return;
    event.preventDefault();
    pendingDelete = null;
    const [start, end] = selection();
    const edit = pasteRuPhone(input.value, event.clipboardData.getData('text'), start, end);
    apply(edit.digits, edit.caretDigits);
  }
  function onCompositionStart() { composing = true; }
  function onCompositionEnd() { composing = false; onInput(); }
  function onReset() {
    // Native reset applies defaultValue after the reset event, before this microtask.
    queueMicrotask(() => { pendingDelete = null; apply(toRuPhoneDigits(input.value)); });
  }

  apply(digits);
  input.addEventListener('focus', onFocus);
  input.addEventListener('blur', onBlur);
  input.addEventListener('keydown', onKeydown);
  input.addEventListener('beforeinput', onBeforeInput);
  input.addEventListener('input', onInput);
  input.addEventListener('paste', onPaste);
  input.addEventListener('compositionstart', onCompositionStart);
  input.addEventListener('compositionend', onCompositionEnd);
  const form = input.form;
  form?.addEventListener('reset', onReset);
  const cleanup = () => {
    input.removeEventListener('focus', onFocus);
    input.removeEventListener('blur', onBlur);
    input.removeEventListener('keydown', onKeydown);
    input.removeEventListener('beforeinput', onBeforeInput);
    input.removeEventListener('input', onInput);
    input.removeEventListener('paste', onPaste);
    input.removeEventListener('compositionstart', onCompositionStart);
    input.removeEventListener('compositionend', onCompositionEnd);
    form?.removeEventListener('reset', onReset);
    attached.delete(input);
  };
  attached.set(input, cleanup);
  return cleanup;
}
