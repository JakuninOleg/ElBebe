import { MAP_CHOICE_KEY, parseMapChoice, type MapChoice } from '../lib/map-choice';

const banner = document.querySelector<HTMLElement>('[data-privacy-banner]');
const dialog = document.querySelector<HTMLDialogElement>('[data-privacy-dialog]');
let choice: MapChoice | null = null;
try { choice = parseMapChoice(localStorage.getItem(MAP_CHOICE_KEY)); } catch { /* Storage may be disabled. Default to no external map. */ }

function applyChoice() {
  const allowed = choice?.maps === true;
  document.querySelectorAll<HTMLElement>('[data-external-map]').forEach(map => {
    const frame = map.querySelector<HTMLIFrameElement>('[data-map-frame]');
    const placeholder = map.querySelector<HTMLElement>('[data-map-placeholder]');
    if (!frame || !placeholder) return;
    // Return focus before hiding the button that enabled this map.
    if (allowed && placeholder.contains(document.activeElement)) {
      frame.hidden = false;
      frame.focus();
    }
    placeholder.hidden = allowed;
    frame.hidden = !allowed;
    if (allowed && frame.dataset.src && !frame.hasAttribute('src')) frame.src = frame.dataset.src;
    if (!allowed) frame.removeAttribute('src');
  });
  if (banner) banner.hidden = choice !== null;
  const status = dialog?.querySelector<HTMLElement>('[data-privacy-current]');
  if (status) status.textContent = choice ? `Сейчас: карта ${allowed ? 'разрешена' : 'выключена'}.` : 'Карта выключена. Выбор ещё не сохранён.';
}

document.querySelectorAll<HTMLButtonElement>('[data-maps-choice]').forEach(button => {
  button.addEventListener('click', () => {
    choice = { version: 1, maps: button.dataset.mapsChoice === 'allow', savedAt: Date.now() };
    try { localStorage.setItem(MAP_CHOICE_KEY, JSON.stringify(choice)); } catch { /* Keep the choice for this page if storage is unavailable. */ }
    dialog?.close();
    applyChoice();
  });
});
document.querySelectorAll<HTMLButtonElement>('[data-open-privacy]').forEach(button => button.addEventListener('click', () => dialog?.showModal()));
dialog?.querySelector('[data-close-privacy]')?.addEventListener('click', () => dialog.close());
window.addEventListener('storage', event => {
  if (event.key === MAP_CHOICE_KEY || event.key === null) {
    choice = parseMapChoice(event.key === null ? null : event.newValue);
    applyChoice();
  }
});
applyChoice();
