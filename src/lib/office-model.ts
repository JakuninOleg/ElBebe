/** Private office documents. Never import saved documents into the public site. */
export type PrintKind = 'week' | 'birthdays' | 'prices';
export type PrintRow = { label: string; detail: string; time: string; day: number; age: string };
export type PrintDraft = { kind: PrintKind; title: string; group: string; period: string; rows: PrintRow[] };
export type SavedPrint = PrintDraft & { id: string; revision: number; updatedAt: string };
export type VisitStatus = 'new' | 'contacted' | 'closed';
export const weekdays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
export const printKinds: Record<PrintKind, string> = { week: 'Расписание занятий', birthdays: 'Дни рождения', prices: 'Стоимость посещения' };
export const blankRow = (): PrintRow => ({ label: '', detail: '', time: '', day: 0, age: '' });

function text(value: unknown, max: number, label: string, required = false): string {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b-\u001f]/.test(value)) throw new Error(`Проверьте поле «${label}» (до ${max} символов).`);
  const result = value.trim();
  if (required && !result) throw new Error(`Заполните поле «${label}».`);
  return result;
}

export function validatePrintDraft(input: unknown): PrintDraft {
  if (!input || typeof input !== 'object') throw new Error('Не удалось прочитать документ.');
  const value = input as Record<string, unknown>;
  if (!['week', 'birthdays', 'prices'].includes(String(value.kind))) throw new Error('Выберите шаблон.');
  const kind = value.kind as PrintKind;
  const title = text(value.title, 80, 'Название документа', true);
  const group = text(value.group, 50, 'Группа');
  const period = text(value.period, 60, 'Период');
  if (kind === 'birthdays' && !/^20\d{2}-(0[1-9]|1[0-2])$/.test(period)) throw new Error('Выберите месяц и год.');
  if (!Array.isArray(value.rows) || value.rows.length < 1 || value.rows.length > 40) throw new Error('В документе должно быть от 1 до 40 строк.');
  const maxDay = kind === 'birthdays' ? new Date(Number(period.slice(0, 4)), Number(period.slice(5)), 0).getDate() : 5;
  const rows = value.rows.map((raw): PrintRow => {
    if (!raw || typeof raw !== 'object') throw new Error('Проверьте строки документа.');
    const row = raw as Record<string, unknown>;
    const label = text(row.label, 80, kind === 'birthdays' ? 'Имя ребёнка' : 'Название', true);
    const detail = text(row.detail, 120, kind === 'prices' ? 'Цена и период оплаты' : 'Примечание', kind === 'prices');
    const time = text(row.time, 5, 'Время');
    const age = text(row.age, 2, 'Возраст');
    const day = Number(row.day);
    if (kind === 'week' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Укажите время занятий в формате 09:30.');
    if (kind !== 'prices' && (!Number.isInteger(day) || day < (kind === 'week' ? 0 : 1) || day > maxDay)) throw new Error(kind === 'week' ? 'Выберите день недели.' : 'Такого дня нет в выбранном месяце.');
    if (kind === 'birthdays' && age && (!/^\d{1,2}$/.test(age) || Number(age) > 18)) throw new Error('Укажите возраст от 0 до 18 лет или оставьте поле пустым.');
    return { label, detail, time, day: kind === 'prices' ? 0 : day, age };
  });
  if (kind !== 'prices') rows.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  return { kind, title, group, period, rows };
}

export function yearsLabel(age: string): string {
  if (!age) return '';
  const value = Number(age), last = value % 10;
  return `${value} ${value % 100 >= 11 && value % 100 <= 14 ? 'лет' : last === 1 ? 'год' : last >= 2 && last <= 4 ? 'года' : 'лет'}`;
}
