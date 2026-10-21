interface ScheduleRow { time: string; activities: string[]; }
const lessonTimes = new Set(['9:30','10:00','10:30','15:30','16:00','16:30']);

/** Preview lessons from the supplied schedule, including an explicit time override. */
export function lessonPreview(rows: ScheduleRow[], day: number) {
  return rows.filter(row => lessonTimes.has(row.time) && row.activities[day]?.trim() && row.activities[day] !== 'Прогулка').map(row => {
    const activity = row.activities[day];
    const override = activity.match(/\s+(\d{1,2}:\d{2})$/);
    return { time: override?.[1] || row.time, label: activity.replace(/\s+\d{1,2}:\d{2}$/, '').replace(' - ', ' — ') };
  });
}
