import { normalizeRuPhone } from '../lib/ru-phone';

function setState(panel: HTMLElement, state: 'form' | 'pending' | 'success') {
  const stack = panel.querySelector<HTMLElement>('[data-visit-stack]')!;
  stack.dataset.state = state;
  const content = stack.querySelector<HTMLElement>('[data-visit-content]')!;
  content.inert = state !== 'form';
  if (state === 'form') content.removeAttribute('aria-hidden'); else content.setAttribute('aria-hidden', 'true');
  stack.querySelector<HTMLElement>('[data-visit-loading]')!.hidden = state !== 'pending';
  stack.querySelector<HTMLElement>('[data-visit-success]')!.hidden = state !== 'success';
  panel.querySelector('form')?.setAttribute('aria-busy', String(state === 'pending'));
}

export function resetVisitPanel(panel: HTMLElement) {
  if (panel.querySelector('[aria-busy="true"]')) return;
  setState(panel, 'form');
  panel.setAttribute('aria-labelledby', 'visit-title');
}

export function initializeVisitForms() {
  document.querySelectorAll<HTMLFormElement>('[data-visit-form]').forEach(form => {
    let submitting = false;
    let previousPayload = '', requestKey = '';
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitting) return;
      const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
      const status = form.querySelector<HTMLElement>('[data-form-status]')!;
      const contact = form.querySelector<HTMLElement>('[data-form-contact]')!;
      const panel = form.closest<HTMLElement>('[data-visit-panel]')!;
      status.textContent = ''; contact.hidden = true;
      form.querySelectorAll<HTMLElement>('[data-error]').forEach(el => { el.textContent = ''; });
      form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim().replace(/\s+/g, ' ');
      const phone = normalizeRuPhone(String(data.get('phone') || ''));
      const errors: Record<string, string> = {};
      if (name.length < 2 || name.length > 80 || !/^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u.test(name)) errors.name = 'Напишите ваше имя: от 2 до 80 символов.';
      if (!phone) errors.phone = 'Введите российский номер, например +7 (900) 000-00-00.';
      if (!data.get('consent')) errors.consent = 'Чтобы связаться с вами, нужно согласие на обработку данных.';
      const showErrors = (items: Record<string, string>) => {
        for (const field of ['name', 'phone', 'consent']) {
          const message = items[field]; if (typeof message !== 'string') continue;
          const target = form.querySelector<HTMLElement>(`[data-error="${field}"]`);
          if (target) target.textContent = message;
          const input = form.elements.namedItem(field);
          if (input instanceof HTMLElement) input.setAttribute('aria-invalid', 'true');
        }
      };
      if (Object.keys(errors).length) { showErrors(errors); form.querySelector<HTMLElement>('[aria-invalid]')?.focus(); return; }
      // Static showcase accepts typing, but never collects contacts or reports a fabricated success.
      if (form.dataset.visitAvailable === 'false') {
        status.textContent = 'Сейчас не удалось отправить заявку. Свяжитесь с садиком — поможем выбрать время встречи.';
        contact.hidden = false; return;
      }
      const payload = JSON.stringify({ name, phone: `+${phone}`, consent: true, website: data.get('website') || '' });
      if (previousPayload !== payload) { requestKey = crypto.randomUUID(); previousPayload = payload; }
      submitting = true; button.disabled = true;
      setState(panel, 'pending');
      panel.querySelector<HTMLElement>('[data-visit-loading]')?.focus({ preventScroll: true });
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await fetch(form.action, { method: 'POST', signal: controller.signal,
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey }, body: payload });
        const result = await response.json().catch(() => { throw new Error('Не удалось получить ответ. Попробуйте ещё раз или свяжитесь с садиком.'); });
        if (!response.ok || result.ok !== true) {
          if (result.errors && typeof result.errors === 'object') showErrors(result.errors);
          throw new Error(typeof result.message === 'string' ? result.message : 'Не удалось отправить. Попробуйте ещё раз.');
        }
        setState(panel, 'success');
        if (panel instanceof HTMLDialogElement) panel.setAttribute('aria-labelledby', 'visit-success-title');
        panel.querySelector<HTMLElement>('[data-visit-success] h2, [data-visit-success] h3')?.focus({ preventScroll: true });
        form.reset(); previousPayload = ''; requestKey = '';
      } catch (error) {
        setState(panel, 'form');
        status.textContent = error instanceof Error && error.name !== 'AbortError' && !(error instanceof TypeError)
          ? error.message : 'Не удалось получить ответ. Проверьте соединение и попробуйте ещё раз.';
        contact.hidden = false;
        const invalid = form.querySelector<HTMLElement>('[aria-invalid]');
        if (invalid) invalid.focus(); else { status.tabIndex = -1; status.focus({ preventScroll: true }); }
      } finally { window.clearTimeout(timeout); submitting = false; button.disabled = false; }
    });
  });
}
