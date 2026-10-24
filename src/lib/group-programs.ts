import { groupCards } from '../data/group-cards.ts';
import { groupPages } from '../data/group-pages.ts';
import scheduleData from '../data/group-schedules.json' with { type: 'json' };
const schedules = scheduleData.groups;
import type { SiteContent } from './cms.ts';
import { programKey } from './director-model.ts';

export function resolvePrograms(groups: SiteContent['groups']) {
  return groupCards.map(card => {
    const entry = groups.find(g => programKey(g) === card.id);
    const data = entry?.program ?? {};
    const value = (key: string, fallback: string) => typeof data[key] === 'string' && data[key].trim() ? data[key].trim() : fallback;
    const page = groupPages[card.id];
    const schedule = schedules.find(g => g.id === card.id)!;
    return {
      ...card, photo: entry?.image ?? null,
      summary: value('summary', card.summary),
      lessons: card.lessons.map((lesson, i) => ({ ...lesson, label: value(`lesson_${i + 1}`, lesson.label) })),
      page: { ...page, intro: value('intro', page.intro), approach: value('approach', page.approach), note: value('note', page.note), question: value('question', page.question), answer: value('answer', page.answer) },
      categories: schedule.categories.map((category, i) => ({ ...category, title: value(`category_${i + 1}_title`, category.title), activities: value(`category_${i + 1}_items`, category.activities.join('\n')).split('\n').map(v => v.trim()).filter(Boolean) })),
    };
  });
}
