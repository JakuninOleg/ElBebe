import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { groupCards } from '../src/data/group-cards.ts';
import { groupLessonIcons } from '../src/data/group-lesson-icons.ts';

const { groups, weekdays } = JSON.parse(await readFile(new URL('../src/data/group-schedules.json', import.meta.url), 'utf8'));
assert.equal(new Set(groupCards.map(group => group.id)).size, 3);
for (const card of groupCards) {
  const source = groups.find(group => group.id === card.id);
  assert.ok(source, `Missing schedule for ${card.id}`);
  await access(new URL(`../public/images/el-bebe/${card.image}.webp`, import.meta.url));
  for (const lesson of card.lessons) {
    if (lesson.icon.startsWith('lesson-')) assert.ok(groupLessonIcons[lesson.icon], `Missing icon: ${lesson.icon}`);
    const sourceText = source.schedule.flatMap(row => row.activities).join(' ').toLowerCase();
    for (const topic of ['английский', 'робототехника', 'логопед', 'психолог', 'шахматы']) {
      if (lesson.label.toLowerCase().includes(topic)) assert.ok(sourceText.includes(topic), `${card.id}: ${topic} is not in source schedule`);
    }
  }
  assert.equal(new Set(source.schedule.map(row => row.time)).size, source.schedule.length);
  for (let day = 0; day < weekdays.length; day++) {
    assert.ok(source.schedule.every(row => row.activities.length === 5));
    assert.equal(source.schedule.filter(row => /^(Завтрак|Подготовка к обеду\. Обед|Полдник|Ужин)$/.test(row.activities[day])).length, 4);
  }
}
const older = groups.find(group => group.id === 'older');
assert.equal(older.schedule.find(row => row.time === '15:15').activities[4], 'Полдник');
assert.equal(older.schedule.find(row => row.time === '15:30').activities[4], 'Финансовая грамотность («Бамбини-шоп»)');
assert.equal(older.schedule.flatMap(row => row.activities).filter(activity => activity.includes('Бамбини-шоп')).length, 1);
console.log('Group lessons agree with source schedules; icons and images exist; four daily meals; Bambini-shop occurs only Friday at 15:30.');
