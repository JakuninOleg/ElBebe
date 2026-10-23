import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import cyrillicUrl from '@fontsource-variable/nunito-sans/files/nunito-sans-cyrillic-wght-normal.woff2?url';
import printCss from './print.css?inline';
import './office.css';
import { blankRow, printKinds, validatePrintDraft, weekdays, type PrintDraft, type PrintKind, type PrintRow, type SavedPrint, type VisitStatus } from '../../lib/office-model';
import type { StoredVisit } from '../../lib/office-store';
import { officeApi } from './api';
import { Printable } from './Printable';

const message = (error: unknown) => error instanceof Error ? error.message : 'Не удалось выполнить действие. Попробуйте ещё раз.';
const date = (value: string) => new Date(value).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const statusLabels: Record<VisitStatus, string> = { new: 'Новая', contacted: 'Связались', closed: 'Завершена' };

function RequestsPage() {
  const [items, setItems] = useState<StoredVisit[]>([]), [page, setPage] = useState(0), [more, setMore] = useState(false);
  const [busy, setBusy] = useState(true), [notice, setNotice] = useState('');
  async function load(current = page) {
    setBusy(true); setNotice('');
    try { const result = await officeApi<{ items: StoredVisit[]; more: boolean }>(`/visits?page=${current}`); setItems(result.items); setMore(result.more); setPage(current); }
    catch (error) { setNotice(message(error)); } finally { setBusy(false); }
  }
  useEffect(() => { void load(0); }, []);
  async function update(item: StoredVisit, status: VisitStatus) {
    setBusy(true); setNotice('');
    try { await officeApi('/visit-status', { id: item.id, status }); setItems(previous => previous.map(row => row.id === item.id ? { ...row, status } : row)); setNotice('Статус сохранён.'); }
    catch (error) { setNotice(message(error)); } finally { setBusy(false); }
  }
  async function remove(item: StoredVisit) {
    if (!window.confirm(`Удалить заявку «${item.name}» и номер телефона? Восстановить её будет нельзя.`)) return;
    setBusy(true); setNotice('');
    try { await officeApi('/visit-delete', { id: item.id }); await load(page); setNotice('Заявка удалена.'); }
    catch (error) { setNotice(message(error)); } finally { setBusy(false); }
  }
  return <section className="elb-office" aria-labelledby="office-requests-title">
    <header className="office-heading"><div><h1 id="office-requests-title">Заявки родителей</h1><p>Откройте номер, свяжитесь с родителем и отметьте результат.</p></div><button type="button" onClick={() => void load()} disabled={busy}>Обновить список</button></header>
    <p className="office-note">Заявки сохраняются здесь. Уведомления на почту и в мессенджеры пока не подключены.</p>
    <p role="status" className="office-status">{busy ? 'Загружаем…' : notice}</p>
    {!busy && !notice && !items.length && <div className="office-empty"><h2>Пока нет заявок</h2><p>Здесь появятся обращения, отправленные через форму сайта.</p></div>}
    <div className="office-requests" aria-busy={busy}>{items.map(item => <article className="office-request" key={item.id}>
      <div><span className={`office-badge office-badge--${item.status}`}>{statusLabels[item.status]}</span><h2>{item.name}</h2><a className="office-phone" href={`tel:${item.phone}`}>{item.phone}</a><p>Получена {date(item.received_at)} · МСК</p></div>
      <div className="office-request-actions"><label>Результат обращения<select value={item.status} onChange={event => void update(item, event.target.value as VisitStatus)} disabled={busy}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button type="button" className="office-danger" disabled={busy} onClick={() => void remove(item)}>Удалить заявку</button></div>
    </article>)}</div>
    <nav className="office-pager" aria-label="Страницы заявок"><button type="button" disabled={busy || page === 0} onClick={() => void load(page - 1)}>Назад</button><span>Страница {page + 1}</span><button type="button" disabled={busy || !more} onClick={() => void load(page + 1)}>Далее</button></nav>
  </section>;
}

function fresh(kind: PrintKind): PrintDraft {
  return { kind, title: printKinds[kind], group: '', period: kind === 'birthdays' ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` : '', rows: [{ ...blankRow(), day: kind === 'birthdays' ? 1 : 0 }] };
}
function html(document: PrintDraft): string {
  const css = `@font-face{font-family:ElBebe;font-weight:200 1000;src:url('${cyrillicUrl}');unicode-range:U+0400-052F}` + printCss;
  return '<!doctype html>' + renderToStaticMarkup(<html lang="ru"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="referrer" content="no-referrer"/><meta httpEquiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; font-src 'self'; style-src 'unsafe-inline';"/><title>{document.title}</title><style>{css + `@page { size: A4 ${document.kind === 'week' ? 'landscape' : 'portrait'}; margin: 0; }`}</style></head><body><Printable document={document}/></body></html>);
}
type DocumentSummary = Pick<SavedPrint, 'id' | 'title' | 'kind' | 'revision' | 'updatedAt'>;

function PrintPage() {
  const [list, setList] = useState<DocumentSummary[]>([]), [draft, setDraft] = useState<PrintDraft | null>(null);
  const [saved, setSaved] = useState<{ id: string; revision: number } | null>(null), [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [error, setError] = useState('');
  const frame = useRef<HTMLIFrameElement>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const previewHtml = useMemo(() => draft ? html(draft) : '', [draft]);
  function fitPreview() {
    const iframe = frame.current;
    if (iframe?.contentDocument) iframe.contentDocument.documentElement.style.setProperty('--preview-zoom', String(Math.min(1, (iframe.clientWidth - 2) / (draft?.kind === 'week' ? 1123 : 794))));
  }
  async function refresh() { const data = await officeApi<{ items: DocumentSummary[] }>('/documents'); setList(data.items); }
  useEffect(() => { setBusy(true); refresh().catch(error => setError(message(error))).finally(() => setBusy(false)); }, []);
  useEffect(() => { setPreviewReady(false); }, [previewHtml]);
  useEffect(() => { if (!frame.current) return; const observer = new ResizeObserver(fitPreview); observer.observe(frame.current); return () => observer.disconnect(); }, [!!draft, draft?.kind]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    const beforeNavigation = (event: MouseEvent) => {
      if (!dirty || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!link || link.target === '_blank' || link.hasAttribute('download') || link.href === window.location.href) return;
      if (!window.confirm('Есть несохранённые изменения. Выйти из документа без сохранения?')) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    window.addEventListener('beforeunload', beforeUnload); document.addEventListener('click', beforeNavigation, true);
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', beforeNavigation, true); };
  }, [dirty]);
  function leave() { return !dirty || window.confirm('Есть несохранённые изменения. Перейти к другому документу без сохранения?'); }
  function begin(kind: PrintKind) { if (!leave()) return; setDraft(fresh(kind)); setSaved(null); setDirty(false); setNotice(''); setError(''); }
  function change(values: Partial<PrintDraft>) { setDraft(current => current ? { ...current, ...values } : null); setDirty(true); setNotice(''); setError(''); }
  function rowChange(index: number, values: Partial<PrintRow>) { if (draft) change({ rows: draft.rows.map((row, i) => i === index ? { ...row, ...values } : row) }); }
  async function open(item: DocumentSummary) {
    if (!leave()) return;
    setBusy(true); setNotice(''); setError('');
    try { const document = await officeApi<SavedPrint>(`/document?id=${item.id}`); setDraft(document); setSaved({ id: document.id, revision: document.revision }); setDirty(false); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function save() {
    if (!draft) return;
    setBusy(true); setNotice(''); setError('');
    try {
      const document = validatePrintDraft(draft);
      const result = await officeApi<SavedPrint>('/document-save', { document, ...saved });
      setDraft(result); setSaved({ id: result.id, revision: result.revision }); setDirty(false); setNotice('Документ сохранён. Его можно открыть позже.');
      await refresh();
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function remove(item: DocumentSummary) {
    if (!window.confirm(`Удалить документ «${item.title}»? Восстановить его будет нельзя.`)) return;
    setBusy(true); setError(''); setNotice('');
    try { await officeApi('/document-delete', { id: item.id, revision: item.revision }); if (saved?.id === item.id) { setDraft(null); setSaved(null); setDirty(false); } await refresh(); setNotice('Документ удалён.'); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function sourcePrices() {
    if (!draft || !window.confirm('Заменить строки текущими опубликованными ценами сайта?')) return;
    setBusy(true); setError('');
    try { const result = await officeApi<{ rows: PrintRow[] }>('/price-source'); if (!result.rows.length) throw new Error('На сайте пока нет опубликованных цен. Можно заполнить их вручную.'); change({ rows: result.rows }); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function print() {
    if (!draft || !frame.current?.contentWindow) return;
    setError('');
    try {
      validatePrintDraft(draft);
      const doc = frame.current.contentDocument;
      if (!doc) throw new Error('Предпросмотр ещё загружается. Повторите печать через несколько секунд.');
      await doc.fonts.ready;
      await Promise.all(Array.from(doc.images).map(image => image.decode().catch(() => {})));
      const overflow = Array.from(doc.querySelectorAll<HTMLElement>('.print-paper')).some(paper => paper.offsetHeight > (draft.kind === 'week' ? 795 : 1124));
      if (overflow) throw new Error('В листе слишком много текста. Сократите названия или разделите документ на два. Печать остановлена, чтобы строки не обрезались.');
      frame.current.contentWindow.focus(); frame.current.contentWindow.print();
    } catch (error) { setError(message(error)); }
  }
  return <section className="elb-office" aria-labelledby="office-print-title">
    <header className="office-heading"><div><h1 id="office-print-title">Документы для печати</h1><p>Выберите шаблон, заполните поля и распечатайте готовый лист.</p></div></header>
    <p className="office-note">Макет уже настроен. Эти документы доступны только в CMS и не публикуются на сайте. В дни рождения достаточно внести имя, число и возраст.</p>
    <div className="office-template-choices">{(Object.entries(printKinds) as Array<[PrintKind, string]>).map(([kind, label]) => <button key={kind} type="button" disabled={busy} onClick={() => begin(kind)}><span>{label}</span><small>{kind === 'week' ? 'А4 · альбомный лист' : 'А4 · книжный лист'}</small></button>)}</div>
    <p className="office-status" role="status">{busy ? 'Сохраняем или загружаем…' : notice}</p>{error && <p role="alert" className="office-error">{error}</p>}
    {draft && <div className="office-document-workspace">
      <div className="office-document-editor"><div className="office-editor-heading"><h2>{saved ? 'Редактирование документа' : 'Новый документ'}</h2><span>{dirty ? 'Есть изменения' : saved ? 'Сохранён' : 'Ещё не сохранён'}</span></div>
        <div className="office-document-actions"><button type="button" className="office-primary" disabled={busy} onClick={() => void save()}>Сохранить документ</button><button type="button" disabled={busy || !previewReady} onClick={() => void print()}>Распечатать / сохранить PDF</button>{saved && <button type="button" disabled={busy} onClick={() => { setSaved(null); change({ title: `${draft.title.slice(0, 70)} — копия` }); }}>Создать копию</button>}</div>
        <fieldset disabled={busy}><legend className="office-sr-only">Содержание документа</legend>
          <label>Название документа<input value={draft.title} maxLength={80} onChange={event => change({ title: event.target.value })}/></label>
          <div className="office-field-pair"><label>Группа <span>(необязательно)</span><input value={draft.group} maxLength={50} placeholder="Например, средняя группа" onChange={event => change({ group: event.target.value })}/></label><label>{draft.kind === 'birthdays' ? 'Месяц и год' : 'Период или дата'}<input type={draft.kind === 'birthdays' ? 'month' : 'text'} value={draft.period} maxLength={60} onChange={event => change({ period: event.target.value })}/></label></div>
          {draft.kind === 'prices' && <><button type="button" onClick={() => void sourcePrices()}>Подставить цены с сайта</button><p className="office-help">Изменения этого листа не меняют цены на сайте.</p></>}
          <div className="office-edit-rows">{draft.rows.map((row, i) => <div className="office-edit-row" key={i}>
            <div className="office-row-heading"><h3>{draft.kind === 'birthdays' ? `Ребёнок ${i + 1}` : `Строка ${i + 1}`}</h3><button type="button" className="office-text-button" disabled={draft.rows.length === 1} onClick={() => change({ rows: draft.rows.filter((_, index) => index !== i) })} aria-label={`Удалить строку ${i + 1}`}>Убрать</button></div>
            {draft.kind === 'week' && <div className="office-field-pair"><label>День недели<select value={row.day} onChange={event => rowChange(i, { day: Number(event.target.value) })}>{[...weekdays, 'Каждый будний день'].map((day, j) => <option key={day} value={j}>{day}</option>)}</select></label><label>Время<input type="time" value={row.time} onChange={event => rowChange(i, { time: event.target.value })}/></label></div>}
            <label>{draft.kind === 'birthdays' ? 'Имя ребёнка' : draft.kind === 'prices' ? 'Режим посещения' : 'Занятие'}<input value={row.label} maxLength={80} onChange={event => rowChange(i, { label: event.target.value })}/></label>
            {draft.kind === 'birthdays' ? <div className="office-field-pair"><label>Число месяца<input type="number" min="1" max="31" value={row.day || ''} onChange={event => rowChange(i, { day: Number(event.target.value) })}/></label><label>Исполняется лет <span>(необязательно)</span><input type="number" min="0" max="18" value={row.age} onChange={event => rowChange(i, { age: event.target.value })}/></label></div> : <label>{draft.kind === 'prices' ? 'Цена и период оплаты' : 'Примечание (необязательно)'}<input value={row.detail} maxLength={120} placeholder={draft.kind === 'prices' ? 'Например, 47 000 ₽/мес.' : ''} onChange={event => rowChange(i, { detail: event.target.value })}/></label>}
          </div>)}</div>
          <button type="button" disabled={draft.rows.length >= 40} onClick={() => change({ rows: [...draft.rows, { ...blankRow(), day: draft.kind === 'birthdays' ? 1 : 0 }] })}>Добавить {draft.kind === 'birthdays' ? 'ребёнка' : 'строку'}</button>
        </fieldset>

      </div>
      <aside className="office-preview"><h2>Так будет выглядеть лист</h2><p>Макет можно прокрутить. При печати выберите масштаб 100% и отключите колонтитулы браузера.</p><iframe ref={frame} title="Предпросмотр печатного документа" srcDoc={previewHtml} sandbox="allow-same-origin allow-modals" referrerPolicy="no-referrer" onLoad={() => { fitPreview(); setPreviewReady(true); }}/></aside>
    </div>}
    <section className="office-saved-documents"><h2>Сохранённые документы</h2>{!list.length && !busy ? <p>Сохраните первый документ — он появится здесь.</p> : <ul>{list.map(item => <li key={item.id}><button type="button" className="office-document-link" disabled={busy} onClick={() => void open(item)}><strong>{item.title}</strong><span>{printKinds[item.kind]} · {date(item.updatedAt)}</span></button><button type="button" className="office-danger" disabled={busy} onClick={() => void remove(item)} aria-label={`Удалить документ «${item.title}»`}>Удалить</button></li>)}</ul>}</section>
  </section>;
}

export const pages = { '/requests': RequestsPage, '/print': PrintPage };
