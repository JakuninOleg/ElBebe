import { parentQuestions } from '../data/el-bebe';

interface Question { id: string; question: string; answer: string; link?: { href: string; label: string }; }
const aliases: Record<string, string> = {
  'first-visit': 'visit', 'elbebe-faq-visit': 'visit',
  'current-conditions': 'price', 'elbebe-faq-price': 'price',
  'maternity-capital': 'capital', 'elbebe-faq-capital': 'capital',
};
const oldQuestions: Record<string, string> = {
  'Как познакомиться с садиком?': 'visit',
  'Как узнать стоимость и подходящий режим?': 'price',
  'Можно ли оплатить материнским капиталом?': 'capital',
};
const legacyAnswers: Record<string, string> = {
  price: 'Уточните действующие условия при обращении: формат посещения, часы, стоимость и состав оплаты.',
  capital: 'Да, такая возможность есть. Условия договора и порядок оформления обсудим до оплаты.',
};
const links: Record<string, Question['link']> = {
  price: { href: '/stoimost/', label: 'Режимы и цены' },
  capital: { href: '/stoimost/#matkapital', label: 'Как оформить оплату маткапиталом' },
  adaptation: { href: '/gruppy/#adaptaciya', label: 'О первых днях в саду' },
};
const order = ['visit', 'price', 'capital', 'cameras', 'adaptation', 'food', 'age'];

/** One answer per topic. Preserve edited CMS answers; replace only known starter copy. */
export function getParentQuestions(cms: Question[]): Question[] {
  const defaults = new Map<string, Question>(parentQuestions.map(q => [q.id, q]));
  const selected = new Map<string, Question>();
  for (const item of cms) {
    const topic = aliases[item.id] ?? oldQuestions[item.question] ?? parentQuestions.find(q => q.question === item.question)?.id ?? item.id;
    if (selected.has(topic)) continue;
    const fallback = defaults.get(topic);
    const question = fallback && item.answer === legacyAnswers[topic] ? fallback : item;
    selected.set(topic, { ...question, id: topic, link: links[topic] });
  }
  for (const item of parentQuestions) if (!selected.has(item.id)) selected.set(item.id, { ...item, link: links[item.id] });
  // Newly added CMS questions remain visible ahead of the standard fallback topics.
  return [...[...selected].filter(([id]) => !order.includes(id)).map(([, value]) => value), ...order.flatMap(id => selected.has(id) ? [selected.get(id)!] : [])];
}
