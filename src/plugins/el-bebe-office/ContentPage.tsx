import { useEffect, useRef, useState } from 'react';
import { createContent, fetchContent, fetchContentList, updateContent, publishContent, MediaPickerModal, type ContentItem } from '@emdash-cms/admin';
import { contactFields, groupChoices, officePath, programDefaults, programFields, programKey, rateFields, teacherGroups, teamFields, validateDirectorData, type EditorField, type EditorSection } from '../../lib/director-model';
import { resolveContacts } from '../../data/site-contacts';
import { RuPhoneInput } from '../../lib/RuPhoneInput';
import { officeApi } from './api';

export const officeLinks = [
  ['home', 'Кабинет директора'], ['team', 'Воспитатели'], ['rates', 'Стоимость'], ['contacts', 'Контакты'],
  ['programs', 'Программы групп'], ['requests', 'Заявки родителей'], ['print', 'Документы для печати'],
];
export function OfficeNav() {
  return <nav className="office-nav" aria-label="Работа садика">{officeLinks.map(([path, label]) => <a key={path} href={`${officePath}/${path}`} aria-current={window.location.pathname.endsWith('/' + path) ? 'page' : undefined}>{label}</a>)}</nav>;
}
export function DirectorHome() {
  return <section className="elb-office"><OfficeNav/><header className="office-heading"><div><h1>Кабинет директора</h1><p>Выберите, что нужно обновить. Оформление страниц уже настроено.</p></div></header><div className="office-home-links">{officeLinks.slice(1).map(([path, label]) => <a href={`${officePath}/${path}`} key={path}>{label}<span>Открыть</span></a>)}</div><p className="office-note">Изменения можно сохранить как черновик или опубликовать на сайте. Расписание в документах для печати обновляется отдельно от расписания сайта.</p></section>;
}

function RequestEmail() {
  const [record, setRecord] = useState<{ email: string; revision: number } | null>(null);
  const [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { officeApi<{ email: string; revision: number }>('/request-email').then(setRecord).catch(e => setError(e.message)); }, []);
  return <section className="office-private-contact"><h2>Почта для заявок</h2><p>Этот адрес виден только в CMS. Уведомления пока не отправляются; заявки сохраняются в разделе «Заявки родителей».</p>{error && <p role="alert" className="office-error">{error}</p>}{record && <form onSubmit={async event => {
    event.preventDefault(); setBusy(true); setNotice(''); setError('');
    try { setRecord(await officeApi('/request-email-save', record)); setNotice('Адрес для будущих уведомлений сохранён.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось сохранить почту.'); } finally { setBusy(false); }
  }}><label htmlFor="request-email">Адрес для уведомлений<input id="request-email" type="email" maxLength={254} value={record.email} onChange={event => setRecord({ ...record, email: event.target.value })} disabled={busy}/></label><button disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить почту для заявок'}</button></form>}<p role="status">{notice}</p></section>;
}

const collections: Record<EditorSection, string> = { team: 'el_bebe_team', rates: 'el_bebe_rates', contacts: 'el_bebe_site', programs: 'el_bebe_groups' };
const headings: Record<EditorSection, string> = { team: 'Воспитатели', rates: 'Стоимость', contacts: 'Контакты', programs: 'Программы групп' };
export function ContentPage({ section }: { section: EditorSection }) {
  const [items, setItems] = useState<ContentItem[]>([]), [entry, setEntry] = useState<ContentItem | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null), [fields, setFields] = useState<EditorField[]>([]);
  const [busy, setBusy] = useState(true), [dirty, setDirty] = useState(false), [notice, setNotice] = useState(''), [error, setError] = useState('');
  const [picker, setPicker] = useState<string | null>(null), [preview, setPreview] = useState<Record<string, string>>({});
  const collection = collections[section], form = useRef<HTMLFormElement>(null);
  async function list() {
    const rows: ContentItem[] = []; let cursor: string | undefined;
    do { const result = await fetchContentList(collection, { limit: 100, cursor }); rows.push(...result.items); cursor = result.nextCursor ?? undefined; } while (cursor);
    setItems(rows.sort((a, b) => Number(a.data.sort_order ?? 0) - Number(b.data.sort_order ?? 0)));
    return rows;
  }
  const leave = () => !dirty || window.confirm('Есть несохранённые изменения. Выйти без сохранения?');
  async function open(item: ContentItem) {
    if (!leave()) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const current = await fetchContent(collection, item.id);
      const key = programKey(current);
      const nextFields = section === 'contacts' ? contactFields : section === 'programs' && key ? programFields(key) : section === 'team' ? teamFields : rateFields;
      const base = section === 'contacts' ? resolveContacts(current.data) : section === 'programs' && key ? { ...programDefaults(key), ...current.data } : current.data;
      setEntry(current); setDraft({ ...base, groups: teacherGroups(current.data.groups) }); setFields(nextFields); setDirty(false); setPreview({});
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось открыть запись.'); } finally { setBusy(false); }
  }
  useEffect(() => { setBusy(true); list().then(async rows => { if (section === 'contacts' && rows[0]) await open(rows.find(row => row.slug === 'main') ?? rows[0]); }).catch(e => setError(e.message)).finally(() => setBusy(false)); }, [section]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    const navigate = (event: MouseEvent) => {
      if (!dirty || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (link && link.target !== '_blank' && !leave()) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    window.addEventListener('beforeunload', unload); document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', navigate, true); };
  }, [dirty]);
  function change(key: string, value: unknown) { setDraft(data => ({ ...data, [key]: value })); setDirty(true); setNotice(''); }
  function addTeacher() {
    if (!leave()) return;
    setEntry(null); setDraft({ title: '', role: '', bio: '', groups: [], image: null, sort_order: (items.length + 1) * 10, is_hidden: false }); setFields(teamFields); setDirty(false); setNotice(''); setError(''); setPreview({});
  }
  async function save(publish: boolean) {
    if (!draft || !form.current?.reportValidity()) return;
    setBusy(true); setError(''); setNotice('');
    let saved: ContentItem | undefined;
    try {
      // Keep existing native image metadata intact when only text is edited.
      const input = Object.fromEntries(fields.filter(field => field.type !== 'image' || !entry || field.key in preview).map(field => [field.key, draft[field.key] ?? (field.type === 'boolean' ? false : field.type === 'number' ? 0 : field.type === 'groups' ? [] : field.type === 'image' ? null : '')]));
      const data = validateDirectorData(collection, input, section === 'programs' ? programKey(entry ?? {}) : undefined);
      saved = entry ? await updateContent(collection, entry.id, { data, _rev: entry._rev }) : await createContent(collection, { data, slug: crypto.randomUUID(), status: 'draft' });
      setEntry(saved); setDirty(false);
      if (publish) { await publishContent(collection, saved.id, { _rev: saved._rev }); setEntry(await fetchContent(collection, saved.id)); }
      await list(); setNotice(publish ? 'Изменения опубликованы на сайте.' : 'Черновик сохранён. На сайте пока прежняя версия.');
    } catch (e) { setError((saved ? 'Черновик сохранён, но публикация не завершена. ' : '') + (e instanceof Error ? e.message : 'Не удалось сохранить. Попробуйте ещё раз.')); } finally { setBusy(false); }
  }
  return <section className="elb-office"><OfficeNav/><header className="office-heading"><div><h1>{headings[section]}</h1><p>{section === 'programs' ? 'Тексты занимают готовые места на страницах трёх групп. Расписание меняется отдельно.' : section === 'contacts' ? 'Общие контакты для всего сайта. Настройки карты и доставки уведомлений обслуживает разработчик.' : section === 'team' ? 'Обновляйте карточки сотрудников и выбирайте группы, в которых они работают.' : 'Меняйте цену и условия существующих режимов. Компоновка прайса сохраняется.'}</p></div>{section === 'team' && <button disabled={busy} onClick={addTeacher}>Добавить воспитателя</button>}</header>
    <p role="status" className="office-status">{busy ? 'Загружаем или сохраняем…' : notice}</p>{error && <p className="office-error" role="alert">{error}</p>}
    <div className={section === 'contacts' ? '' : 'office-content-workspace'}>
      {section !== 'contacts' && <div className="office-record-list" aria-label="Записи">{items.filter(item => section !== 'programs' || programKey(item)).map(item => <button type="button" key={item.id} aria-pressed={entry?.id === item.id} disabled={busy} onClick={() => void open(item)}><strong>{String(item.data.title)}</strong><small>{item.status === 'published' ? 'Опубликовано' : 'Черновик'}{item.data.is_hidden === true ? ' · Скрыт' : ''}</small></button>)}{!busy && !items.length && <p>Записей пока нет.{section === 'team' ? ' Добавьте первого воспитателя.' : ' Владелец должен выполнить настройку CMS.'}</p>}</div>}
      {draft && <form className="office-content-form" ref={form} onSubmit={event => { event.preventDefault(); void save(true); }} key={entry?.id ?? 'new'}>
        {section !== 'contacts' && <h2>{entry ? String(entry.data.title) : 'Новый воспитатель'}</h2>}
        {fields.map(field => {
          const value = draft[field.key], id = `office-${field.key}`, help = field.help ? id + '-help' : undefined;
          return <div className="office-content-field" key={field.key}>
            {field.type === 'groups' ? <fieldset><legend>{field.label}</legend>{groupChoices.map(group => <label className="office-check" key={group.id}><input type="checkbox" checked={teacherGroups(value).includes(group.id)} disabled={busy} onChange={event => change(field.key, event.target.checked ? [...teacherGroups(value), group.id] : teacherGroups(value).filter(id => id !== group.id))}/>{group.title}</label>)}</fieldset>
            : field.type === 'boolean' ? <label className="office-check"><input type="checkbox" checked={value === true} disabled={busy} onChange={event => change(field.key, event.target.checked)}/>{field.label}</label>
            : field.type === 'image' ? <div><span className="office-field-label">{field.label}</span>{preview[field.key] && <img className="office-image-preview" src={preview[field.key]} alt="Выбранная фотография"/>}<p>{value && typeof value === 'object' && 'id' in value ? 'Фотография выбрана из медиатеки.' : 'Фотография пока не выбрана.'}</p><button type="button" disabled={busy} onClick={() => setPicker(field.key)}>Выбрать фотографию</button></div>
            : <><label htmlFor={id}>{field.label}{field.required ? ' *' : ''}</label>{field.type === 'phone' ? <RuPhoneInput id={id} defaultValue={String(value ?? '')} required={field.required} disabled={busy} aria-describedby={help} onValueChange={digits => change(field.key, digits)}/>
              : field.type === 'text' ? <textarea id={id} value={String(value ?? '')} maxLength={field.max} required={field.required} rows={4} disabled={busy} aria-describedby={help} onChange={event => change(field.key, event.target.value)}/>
              : <input id={id} value={String(value ?? '')} type={field.type === 'email' || field.type === 'url' || field.type === 'number' ? field.type : 'text'} maxLength={field.max ?? 254} min={field.type === 'number' ? 0 : undefined} max={field.type === 'number' ? 999 : undefined} required={field.required} disabled={busy} aria-describedby={help} onChange={event => change(field.key, field.type === 'number' ? Number(event.target.value) : event.target.value)}/>}</>}
            {field.help && <p id={help} className="office-field-help">{field.help}</p>}
          </div>;
        })}
        <div className="office-document-actions"><button className="office-primary" disabled={busy} type="submit">Сохранить и опубликовать</button><button disabled={busy} type="button" onClick={() => void save(false)}>Сохранить черновик</button>{entry && <a href={section === 'programs' ? '/gruppy/' : section === 'rates' ? '/stoimost/' : section === 'team' ? '/komanda/' : '/kontakty/'} target="_blank" rel="noopener noreferrer">Открыть сайт</a>}</div>
      </form>}
    </div>
    {section === 'contacts' && <RequestEmail/>}
    <MediaPickerModal open={!!picker} onOpenChange={open => { if (!open) setPicker(null); }} mediaKind="image" localOnly hideUrlInput title="Фотография для сайта" onSelect={item => { if (picker) { change(picker, { id: item.id }); setPreview(previous => ({ ...previous, [picker]: item.url })); } setPicker(null); }}/>
  </section>;
}
