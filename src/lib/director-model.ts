import { groupCards } from '../data/group-cards.ts';
import { groupPages } from '../data/group-pages.ts';
import scheduleData from '../data/group-schedules.json' with { type: 'json' };
const schedules = scheduleData.groups;
import { normalizeRuPhone } from './ru-phone.ts';

export const directorRole = 40;
export const officePath = '/_emdash/admin/plugins/el-bebe-office';
export const groupChoices = groupCards.map(({ id, title }) => ({ id, title }));
export type EditorSection = 'team' | 'rates' | 'contacts' | 'programs';
export interface EditorField { key: string; label: string; max?: number; type?: 'text' | 'email' | 'phone' | 'url' | 'number' | 'groups' | 'boolean' | 'image'; required?: boolean; help?: string; }
export const contactFields: EditorField[] = [
  { key: 'phone', label: 'Телефон сада', type: 'phone', required: true },
  { key: 'email', label: 'Публичная почта', type: 'email', required: true },
  { key: 'address', label: 'Адрес сада', max: 180, required: true, help: 'Карта привязана к карточке сада. При переезде её нужно обновить с разработчиком.' },
  { key: 'hours', label: 'Режим работы', max: 90, required: true },
  { key: 'entry_hint', label: 'Как найти вход', type: 'text', max: 300 },
  { key: 'whatsapp_phone', label: 'Телефон WhatsApp', type: 'phone', help: 'Оставьте пустым, чтобы использовать телефон сада.' },
  { key: 'telegram_url', label: 'Ссылка Telegram', type: 'url', help: 'Например, https://t.me/имя. Пустое поле оставляет кнопку неактивной.' },
  { key: 'vk_url', label: 'Ссылка ВКонтакте', type: 'url', help: 'Например, https://vk.com/имя.' },
];
export const teamFields: EditorField[] = [
  { key: 'title', label: 'Имя и фамилия', max: 90, required: true },
  { key: 'role', label: 'Должность', max: 100, required: true },
  { key: 'bio', label: 'Образование и опыт', type: 'text', max: 650 },
  { key: 'groups', label: 'В каких группах работает', type: 'groups' },
  { key: 'image', label: 'Фотография', type: 'image' },
  { key: 'sort_order', label: 'Порядок на сайте', type: 'number' },
  { key: 'is_hidden', label: 'Скрыть сотрудника с сайта', type: 'boolean' },
];
export const rateFields: EditorField[] = [
  { key: 'title', label: 'Название режима', max: 90, required: true },
  { key: 'hours', label: 'Дни и часы посещения', max: 100 },
  { key: 'price', label: 'Стоимость и период оплаты', max: 80, required: true },
  { key: 'description', label: 'Пояснение', type: 'text', max: 350 },
];
export function programKey(entry: { id?: string; slug?: string | null; title?: string; program_key?: unknown; data?: Record<string, unknown> }): string | undefined {
  const data = entry.data ?? entry;
  return groupChoices.find(g => g.id === data.program_key || g.id === entry.slug || g.id === entry.id || g.title === data.title)?.id;
}
export function teacherGroups(value: unknown): string[] {
  return Array.isArray(value) ? groupChoices.filter(g => value.includes(g.id) || value.includes(g.title)).map(g => g.id) : [];
}
export function programDefaults(key: string): Record<string, string> {
  const card = groupCards.find(g => g.id === key)!;
  const page = groupPages[key];
  const schedule = schedules.find(g => g.id === key)!;
  return {
    title: card.title, program_key: key, summary: card.summary, intro: page.intro, approach: page.approach,
    note: page.note, question: page.question, answer: page.answer,
    ...Object.fromEntries(card.lessons.map((lesson, i) => [`lesson_${i + 1}`, lesson.label])),
    ...Object.fromEntries(schedule.categories.flatMap((category, i) => [[`category_${i + 1}_title`, category.title], [`category_${i + 1}_items`, category.activities.join('\n')]])),
  };
}
export function programFields(key: string): EditorField[] {
  const schedule = schedules.find(g => g.id === key)!;
  return [
    { key: 'summary', label: 'Короткое описание на карточке', max: 100, required: true },
    { key: 'intro', label: 'Вступление на странице группы', type: 'text', max: 500, required: true },
    { key: 'approach', label: 'Как проходят занятия', type: 'text', max: 900, required: true },
    { key: 'note', label: 'Короткая подпись', max: 90, required: true },
    ...Array.from({ length: 6 }, (_, i) => ({ key: `lesson_${i + 1}`, label: `Занятие ${i + 1} на карточке`, max: 100, required: true })),
    ...schedule.categories.flatMap((_, i): EditorField[] => [
      { key: `category_${i + 1}_title`, label: `Название раздела программы ${i + 1}`, max: 80, required: true },
      { key: `category_${i + 1}_items`, label: `Занятия раздела ${i + 1}`, type: 'text', max: 600, required: true, help: 'Каждое занятие — с новой строки, не больше восьми.' },
    ]),
    { key: 'question', label: 'Вопрос о программе', max: 180, required: true },
    { key: 'answer', label: 'Ответ о программе', type: 'text', max: 1100, required: true },
    { key: 'image', label: 'Фотография группы', type: 'image' },
  ];
}

/** Only these data fields may enter the director's fixed templates. */
export function validateDirectorData(collection: string, input: unknown, key?: string): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Не удалось прочитать поля.');
  const fields = collection === 'el_bebe_site' ? contactFields : collection === 'el_bebe_team' ? teamFields : collection === 'el_bebe_rates' ? rateFields : collection === 'el_bebe_groups' && key ? programFields(key) : null;
  if (!fields) throw new Error('Этот раздел недоступен директору.');
  const output: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(input)) {
    const field = fields.find(f => f.key === name);
    if (!field) throw new Error('Структуру и служебные поля может менять только владелец сайта.');
    if (field.type === 'groups') {
      if (!Array.isArray(value) || value.length > 3 || value.some(v => !groupChoices.some(g => g.id === v || g.title === v))) throw new Error('Выберите группы из списка.');
      output[name] = teacherGroups(value).map(id => groupChoices.find(g => g.id === id)!.title); continue;
    }
    if (field.type === 'boolean') { if (typeof value !== 'boolean') throw new Error('Выберите состояние сотрудника.'); output[name] = value; continue; }
    if (field.type === 'number') { if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 999) throw new Error('Порядок должен быть от 0 до 999.'); output[name] = value; continue; }
    if (field.type === 'image') {
      if (value === null) { output[name] = null; continue; }
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => key !== 'id') || !('id' in value) || typeof value.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.id)) throw new Error('Выберите фотографию из медиатеки.');
      output[name] = { id: value.id }; continue;
    }
    if (typeof value !== 'string') throw new Error(`Заполните поле «${field.label}».`);
    const text = value.trim();
    if ((field.required && !text) || text.length > (field.max ?? 254) || /[<>\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text)) throw new Error(`Проверьте поле «${field.label}» и длину текста.`);
    if (field.type === 'phone' && text && !normalizeRuPhone(text)) throw new Error(`Введите полный российский номер в поле «${field.label}».`);
    if (field.type === 'email' && text && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(text)) throw new Error('Проверьте адрес почты.');
    if (field.type === 'url' && text) {
      let url: URL; try { url = new URL(text); } catch { throw new Error(`Проверьте ссылку «${field.label}».`); }
      const hosts = name === 'telegram_url' ? ['t.me', 'telegram.me'] : ['vk.com', 'www.vk.com', 'vk.ru', 'www.vk.ru'];
      if (url.protocol !== 'https:' || url.username || url.password || url.port || !hosts.includes(url.hostname)) throw new Error(`Используйте HTTPS-ссылку ${field.label}.`);
    }
    if (/^category_\d_items$/.test(name) && (text.split('\n').filter(v => v.trim()).length > 8 || text.split('\n').some(v => v.length > 100))) throw new Error('В разделе допустимо до восьми занятий по 100 символов.');
    output[name] = text;
  }
  return output;
}
