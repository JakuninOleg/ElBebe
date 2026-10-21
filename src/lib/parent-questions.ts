import { parentQuestions } from '../data/el-bebe';

interface Question { id: string; question: string; answer: string; link?: { href: string; label: string }; }
const aliases: Record<string, string> = {
  'first-visit': 'visit', 'elbebe-faq-visit': 'visit',
  'current-conditions': 'price', 'elbebe-faq-price': 'price',
  'maternity-capital': 'capital', 'elbebe-faq-capital': 'capital',
};
const oldQuestions: Record<string, string> = {
  'Как познакомиться с садиком?': 'visit',
  'Есть ли в саду видеонаблюдение?': 'cameras',
  'Как проходит адаптация?': 'adaptation',
  'Как организовано питание?': 'food',
  'С какого возраста принимаете детей?': 'age',
  'Сколько стоит посещение и какой режим выбрать?': 'price',
  'Как узнать стоимость и подходящий режим?': 'price',
  'Можно ли оплатить материнским капиталом?': 'capital',
};
const legacyAnswers: Record<string, string[]> = {
  "price": [
    "Уточните действующие условия при обращении: формат посещения, часы, стоимость и состав оплаты.",
    "Режимы посещения, часы и цены опубликованы на странице стоимости. При знакомстве уточним свободные места в группе, состав услуг и условия договора."
  ],
  "visit": [
    "Оставьте имя и телефон в форме. Обсудим ваши вопросы и удобное время знакомства.",
    "Да. Оставьте заявку — договоримся об удобном времени, покажем садик и ответим на вопросы."
  ],
  "capital": [
    "Да, такая возможность есть. Условия договора и порядок оформления обсудим до оплаты.",
    "Да, такая возможность есть. До оформления проверяем, какие услуги по договору можно оплатить средствами материнского капитала. Решение о распоряжении средствами принимает Социальный фонд России."
  ],
  "food": [
    "На встрече покажем актуальное меню. Если у ребёнка есть аллергия или ограничения в питании, обязательно расскажите об этом до начала посещений.",
    "В стоимость полного дня включены четыре приёма пищи: завтрак, обед, полдник и ужин. На встрече покажем меню и обсудим питание для выбранного режима. Если у ребёнка есть аллергия или ограничения в питании, расскажите об этом до начала посещений."
  ],
  "cameras": [
    "Да, в Эльбэби установлены камеры. При знакомстве расскажем, как организовано видеонаблюдение и какие правила действуют в саду."
  ],
  "adaptation": [
    "Знакомство начинаем с экскурсии. Обсуждаем привычки ребёнка, его опыт общения и то, что помогает ему чувствовать себя спокойно. Порядок первых посещений согласуем с родителями."
  ],
  "age": [
    "Расскажите, сколько лет ребёнку, — при знакомстве уточним подходящую группу и наличие мест."
  ]
};
const links: Record<string, Question['link']> = {
  price: { href: '/stoimost/', label: 'Режимы и цены' },
  capital: { href: '/stoimost/#matkapital', label: 'Как оформить оплату маткапиталом' },
  lessons: { href: '/gruppy/', label: 'Программы и занятия по группам' },
  hours: { href: '/stoimost/#rezhimy', label: 'Посмотреть режимы' },
  food: { href: '/den-v-sadu/', label: 'Питание и распорядок дня' },
  adaptation: { href: '/gruppy/#adaptaciya', label: 'О первых днях в саду' },
};
const order = ['price', 'lessons', 'cameras', 'hours', 'food', 'adaptation', 'capital', 'visit', 'age'];

/** One answer per topic. Preserve edited CMS answers; replace only known starter copy. */
export function getParentQuestions(cms: Question[]): Question[] {
  const defaults = new Map<string, Question>(parentQuestions.map(q => [q.id, q]));
  const selected = new Map<string, Question>();
  for (const item of cms) {
    const topic = aliases[item.id] ?? oldQuestions[item.question] ?? parentQuestions.find(q => q.question === item.question)?.id ?? item.id;
    if (selected.has(topic)) continue;
    const fallback = defaults.get(topic);
    const question = fallback && (legacyAnswers[topic] ?? []).includes(item.answer) ? fallback : item;
    selected.set(topic, { ...question, id: topic, link: links[topic] });
  }
  for (const item of parentQuestions) if (!selected.has(item.id)) selected.set(item.id, { ...item, link: links[item.id] });
  // Newly added CMS questions remain visible ahead of the standard fallback topics.
  return [...[...selected].filter(([id]) => !order.includes(id)).map(([, value]) => value), ...order.flatMap(id => selected.has(id) ? [selected.get(id)!] : [])];
}
