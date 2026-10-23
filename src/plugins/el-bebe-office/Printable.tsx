import type { PrintDraft, PrintRow } from '../../lib/office-model';
import { weekdays, yearsLabel } from '../../lib/office-model';

function chunks<T>(values: T[], size: number): T[][] {
  return Array.from({ length: Math.max(1, Math.ceil(values.length / size)) }, (_, i) => values.slice(i * size, (i + 1) * size));
}
function Head({ document, page, count }: { document: PrintDraft; page: number; count: number }) {
  const period = document.kind === 'birthdays' && /^\d{4}-\d{2}$/.test(document.period)
    ? new Date(`${document.period}-01T12:00:00`).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) : document.period;
  return <header className="print-head"><div><h1>{document.title}</h1>{document.group && <p className="print-group">{document.group}</p>}{period && <p className="print-period">{period}</p>}</div><img src="/images/el-bebe/logo-ru-approved.svg" width="205" height="125" alt="Детский сад Эльбэби, Сочи"/>{count > 1 && <span className="print-page-number">{page + 1} / {count}</span>}</header>;
}
export function Printable({ document }: { document: PrintDraft }) {
  if (document.kind === 'week') {
    const days = weekdays.map((_, i) => document.rows.filter(row => row.day === i).sort((a, b) => a.time.localeCompare(b.time)));
    const common = document.rows.filter(row => row.day === 5).sort((a, b) => a.time.localeCompare(b.time));
    const count = Math.max(1, Math.ceil(common.length / 10), ...days.map(day => Math.ceil(day.length / 4)));
    return <>{Array.from({ length: count }, (_, page) => <section className="print-paper print-week" key={page}>
      <Head document={document} page={page} count={count}/><div className="print-week-grid">{weekdays.map((day, i) => <section className={`print-day tone-${i}`} key={day}><h2>{day}</h2><div>{days[i].slice(page * 4, page * 4 + 4).map((row, j) => <div className="print-lesson" key={j}><time>{row.time}</time><h3>{row.label}</h3>{row.detail && <p>{row.detail}</p>}</div>)}{!days[i].slice(page * 4, page * 4 + 4).length && <p className="print-no-lessons">—</p>}</div></section>)}</div>
      {!!common.slice(page * 10, page * 10 + 10).length && <section className="print-common"><h2>Общий распорядок на каждый будний день</h2><div>{common.slice(page * 10, page * 10 + 10).map((row, i) => <section key={i}><time>{row.time}</time><p>{row.label}</p>{row.detail && <p>{row.detail}</p>}</section>)}</div></section>}
      <footer className="print-footer">Играем, дружим и открываем мир.</footer>
    </section>)}</>;
  }
  const pages = chunks<PrintRow>(document.rows, document.kind === 'birthdays' ? 9 : 8);
  return <>{pages.map((rows, page) => <section className={`print-paper print-${document.kind}`} key={page}>
    <Head document={document} page={page} count={pages.length}/>
    {document.kind === 'birthdays' ? <><p className="print-intro">Поздравляем наших ребят!</p><ol className="print-birthday-list">{rows.map((row, i) => <li key={i}><span className={`print-birthday-date tone-${i % 5}`}>{row.day || '—'}</span><strong>{row.label || 'Имя ребёнка'}</strong><span className="print-age">{yearsLabel(row.age)}</span></li>)}</ol><footer className="print-birthday-footer"><p>С днём<br/>рождения!</p><img src="/images/el-bebe/bunny-guide.webp" width="100" height="155" alt=""/></footer></>
    : <><div className="print-price-list">{rows.map((row, i) => <section key={i} className={`print-price-row tone-${i % 5}`}><h2>{row.label || 'Название режима'}</h2><p>{row.detail || 'Цена и период оплаты'}</p></section>)}</div><footer className="print-footer">Эльбэби · Детский сад в Сочи</footer></>}
  </section>)}</>;
}
