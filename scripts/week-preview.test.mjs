import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { lessonPreview } from '../src/lib/week-preview.ts';
import { dailySchedule } from '../src/data/daily-schedule.ts';
import { parentReviews } from '../src/data/parent-reviews.ts';
const { groups }=JSON.parse(await readFile(new URL('../src/data/group-schedules.json',import.meta.url),'utf8'));

test('Tuesday speech therapist uses the explicit 10:30 time, not the table row time',()=>{
  const lessons=lessonPreview(groups.find(group=>group.id==='younger').schedule,1);
  assert.deepEqual(lessons.find(lesson=>lesson.label==='Логопед'),{time:'10:30',label:'Логопед'});
  assert.equal(lessons.length,4);
});
test('older Friday preview includes the shop lesson once and excludes meals and walks',()=>{
  const lessons=lessonPreview(groups.find(group=>group.id==='older').schedule,4);
  assert.equal(lessons.filter(lesson=>lesson.label.includes('Бамбини-шоп')).length,1);
  assert.equal(lessons.find(lesson=>lesson.label.includes('Бамбини-шоп')).time,'15:30');
  assert.ok(lessons.every(lesson=>!/^Прогулка|Полдник|Ужин/.test(lesson.label)));
});
test('all fifteen group/day combinations have real lessons; day overview has single times',()=>{
  for(const group of groups) for(let day=0;day<5;day++) assert.ok(lessonPreview(group.schedule,day).length>=4);
  assert.ok(dailySchedule.every(([time])=>/^\d{1,2}:\d{2}$/.test(time)));
  assert.deepEqual(dailySchedule.find(([time])=>time==='11:00'),['11:00','Прогулка']);
  assert.ok(dailySchedule.every(([,activity])=>!activity.includes('по расписанию')));
});
test('every current review has its real, locally stored source avatar',async()=>{
  for(const review of parentReviews) {
    assert.ok(review.avatar.startsWith('/images/el-bebe/reviews/'));
    assert.match(review.avatarSourceUrl,/^https:\/\/(avatars\.mds\.yandex\.net|i\d\.photo\.2gis\.com)\//);
    await access(new URL('../public'+review.avatar,import.meta.url));
  }
});
