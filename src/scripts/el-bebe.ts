import { attachRuPhoneMask, normalizeRuPhone } from '../lib/ru-phone';
import { updateScrollHeader, type ScrollHeaderState } from '../lib/scroll-header';

document.querySelectorAll<HTMLInputElement>('[data-phone-mask]:not(:disabled)').forEach(input => attachRuPhoneMask(input));

const dialog = document.querySelector<HTMLDialogElement>('#visit-dialog');
const menuToggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const menu = document.querySelector<HTMLElement>('#mobile-menu');
const navGroups = Array.from(document.querySelectorAll<HTMLDetailsElement>('[data-nav-group]'));
let lastFocused: HTMLElement | null = null;

function closeNavGroups(except?: HTMLDetailsElement) { navGroups.forEach(group => { if (group !== except) group.open = false; }); }
function closeMenu(restoreFocus = false) { closeNavGroups(); if (menu && menuToggle) { menu.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Открыть меню'); if (restoreFocus) menuToggle.focus(); } }
navGroups.forEach(group => {
  group.addEventListener('toggle', () => { if (group.open) closeNavGroups(group); });
  group.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeNavGroups()));
  group.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !group.open) return;
    event.preventDefault(); event.stopPropagation();
    group.open = false; group.querySelector('summary')?.focus();
  });
});
menuToggle?.addEventListener('click', () => {
  if (!menu) return;
  const open = menu.hidden;
  menu.hidden = !open;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  if (open && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    menu.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 170, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
});
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu && !menu.hidden) closeMenu(true); });
document.addEventListener('click', event => {
  if (!(event.target instanceof Node)) return;
  closeNavGroups(navGroups.find(group => group.contains(event.target as Node)));
  if (menu && !menu.hidden && !menu.contains(event.target) && !menuToggle?.contains(event.target)) closeMenu();
});
document.addEventListener('focusin', event => {
  if (event.target instanceof Node) closeNavGroups(navGroups.find(group => group.contains(event.target as Node)));
});
matchMedia('(min-width: 1101px)').addEventListener('change', () => closeMenu());

const scrollHeader = document.querySelector<HTMLElement>('[data-scroll-header]');
if (scrollHeader) {
  let state: ScrollHeaderState | undefined;
  let frame = 0;
  let stickyThreshold = 152;
  const update = () => {
    frame = 0;
    const y = window.scrollY;
    state ??= { y, travel: 0, sticky: false, hidden: false };
    const wasSticky = state.sticky;
    state = updateScrollHeader(state, y, stickyThreshold, !!menu && !menu.hidden || navGroups.some(group => group.open) || scrollHeader.contains(document.activeElement));
    if (wasSticky !== state.sticky) navGroups.forEach(group => { if (group.closest('.desktop-nav')) group.open = false; });
    scrollHeader.toggleAttribute('data-sticky', state.sticky);
    scrollHeader.toggleAttribute('data-hidden', state.hidden);
  };
  const scheduleUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  scrollHeader.addEventListener('focusin', scheduleUpdate);
  // Observe the natural header height after layout instead of forcing layout
  // during startup and on every scroll event.
  if (scrollHeader.parentElement) new ResizeObserver(entries => {
    const entry = entries[0];
    stickyThreshold = (entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height) + 24;
    scheduleUpdate();
  }).observe(scrollHeader.parentElement);
}

const footerSections = document.querySelectorAll<HTMLDetailsElement>('[data-footer-section]');
const narrowFooter = matchMedia('(max-width: 760px)');
function adaptFooter() {
  footerSections.forEach(section => {
    section.open = !narrowFooter.matches;
    section.querySelector('summary')?.setAttribute('tabindex', narrowFooter.matches ? '0' : '-1');
  });
}
narrowFooter.addEventListener('change', adaptFooter);
adaptFooter();

// Keep native details usable without JS. Animate the actual measured height in
// both directions, including a reversal while the previous animation is running.
document.querySelectorAll<HTMLDetailsElement>('[data-faq]').forEach(details => {
  const summary = details.querySelector('summary')!;
  const answer = details.querySelector<HTMLElement>('.faq-answer')!;
  let expanded = details.open;
  let heightAnimation: Animation | null = null;
  let fadeAnimation: Animation | null = null;
  details.dataset.expanded = String(expanded);

  summary.addEventListener('click', event => {
    event.preventDefault();
    const startHeight = details.getBoundingClientRect().height;
    const startOpacity = details.open ? getComputedStyle(answer).opacity : '0';
    if (heightAnimation) { heightAnimation.onfinish = null; heightAnimation.cancel(); }
    fadeAnimation?.cancel();
    expanded = !expanded;
    details.dataset.expanded = String(expanded);
    summary.setAttribute('aria-expanded', String(expanded));
    answer.inert = !expanded;
    const instant = matchMedia('(prefers-reduced-motion: reduce)').matches || event.detail === 0;
    if (instant) { details.open = expanded; heightAnimation = null; return; }

    details.open = true;
    const styles = getComputedStyle(details);
    const borders = parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);
    const closedHeight = summary.getBoundingClientRect().height + borders;
    const targetHeight = closedHeight + (expanded ? answer.scrollHeight : 0);
    heightAnimation = details.animate([{ height: `${startHeight}px` }, { height: `${targetHeight}px` }], {
      duration: expanded ? 250 : 210, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both',
    });
    fadeAnimation = answer.animate([{ opacity: startOpacity }, { opacity: expanded ? 1 : 0 }], {
      duration: expanded ? 190 : 150, easing: 'ease-out', fill: 'both',
    });
    heightAnimation.onfinish = () => {
      details.open = expanded;
      heightAnimation?.cancel(); heightAnimation = null;
      fadeAnimation?.cancel(); fadeAnimation = null;
    };
  });
});
document.querySelectorAll<HTMLButtonElement>('[data-open-visit]').forEach(button => button.addEventListener('click', () => {
  lastFocused = button.closest('#mobile-menu') ? menuToggle : button;
  closeMenu();
  const content = dialog?.querySelector<HTMLElement>('[data-visit-content]');
  const success = dialog?.querySelector<HTMLElement>('[data-visit-success]');
  if (content) content.hidden = false;
  if (success) success.hidden = true;
  dialog?.setAttribute('aria-labelledby', 'visit-title');
  dialog?.showModal(); document.body.classList.add('dialog-open');
}));
document.querySelectorAll('[data-close-visit]').forEach(button => button.addEventListener('click', () => dialog?.close()));
dialog?.addEventListener('close', () => { document.body.classList.remove('dialog-open'); lastFocused?.focus(); });
dialog?.addEventListener('click', event => { const box = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close(); });

document.querySelectorAll<HTMLFormElement>('[data-visit-form]').forEach(form => form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  if (button.disabled) return;
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const panel = form.closest<HTMLElement>('[data-visit-panel]')!;
  form.querySelectorAll<HTMLElement>('[data-error]').forEach(el => { el.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const phone = normalizeRuPhone(String(data.get('phone') || '').trim());
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = 'Напишите ваше имя, хотя бы два символа.';
  if (!phone) errors.phone = 'Введите российский номер, например +7 (900) 000-00-00.';
  if (!data.get('consent')) errors.consent = 'Чтобы связаться с вами, нужно согласие на обработку данных.';
  const showErrors = (items: Record<string, string>) => { for (const [key, message] of Object.entries(items)) { const target = form.querySelector<HTMLElement>(`[data-error="${key}"]`); if (target) target.textContent = message; const input = form.elements.namedItem(key); if (input instanceof HTMLElement) input.setAttribute('aria-invalid', 'true'); } };
  if (Object.keys(errors).length) { showErrors(errors); form.querySelector<HTMLElement>('[aria-invalid]')?.focus(); return; }
  button.disabled = true; status.textContent = 'Отправляем заявку…';
  try {
    const response = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone: `+${phone}`, consent: true, website: data.get('website') || '' }) });
    const result = await response.json();
    if (!response.ok || !result.ok) { if (result.errors) showErrors(result.errors); throw new Error(result.message || 'Не удалось отправить. Попробуйте ещё раз.'); }
    panel.querySelector<HTMLElement>('[data-visit-content]')!.hidden = true;
    const success = panel.querySelector<HTMLElement>('[data-visit-success]')!; success.hidden = false;
    if (panel === dialog) dialog.setAttribute('aria-labelledby', 'visit-success-title');
    success.querySelector<HTMLElement>('button, [tabindex="-1"]')?.focus(); form.reset(); status.textContent = '';
  } catch (error) { status.textContent = error instanceof Error ? error.message : 'Не удалось отправить. Проверьте соединение и попробуйте снова.'; }
  finally { button.disabled = false; }
}));

document.querySelectorAll<HTMLElement>('[data-gallery]').forEach(gallery => {
  const track = gallery.querySelector<HTMLElement>('[data-gallery-track]')!;
  const slides = Array.from(track.querySelectorAll<HTMLElement>('[data-gallery-slide]'));
  const dots = Array.from(gallery.querySelectorAll<HTMLButtonElement>('[data-gallery-dot]'));
  function activeIndex() { return slides.reduce((best, slide, i) => Math.abs(slide.offsetLeft - track.offsetLeft - track.scrollLeft) < Math.abs(slides[best].offsetLeft - track.offsetLeft - track.scrollLeft) ? i : best, 0); }
  function go(index: number) { const next = (index + slides.length) % slides.length; track.scrollTo({ left: slides[next].offsetLeft - track.offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
  gallery.querySelector('[data-gallery-prev]')?.addEventListener('click', () => go(activeIndex() - 1));
  gallery.querySelector('[data-gallery-next]')?.addEventListener('click', () => go(activeIndex() + 1));
  dots.forEach((dot, index) => dot.addEventListener('click', () => go(index)));
  track.addEventListener('scroll', () => { const index = activeIndex(); dots.forEach((dot, i) => { dot.setAttribute('aria-current', String(i === index)); }); }, { passive: true });
});
