import type { SiteContent } from '../lib/cms';

// Proposed copy from the approved mockup. These are previews, not verified programs.
export const groupPreviews: Array<SiteContent['groups'][number] & { previewImage: string }> = [
  { id: 'younger', title: 'Младшая группа', summary: 'Первое знакомство с садом', activities: 'Сенсорные игры, речь, движение.', approach: 'Больше поддержки и повторения. Помогаем освоиться и пробовать самому.', image: null, previewImage: 'group-younger' },
  { id: 'middle', title: 'Средняя группа', summary: 'Больше вопросов и открытий', activities: 'Творчество, логика, сюжетные игры.', approach: 'Учимся договариваться, выбирать и действовать вместе.', image: null, previewImage: 'play' },
  { id: 'older', title: 'Старшая группа', summary: 'Больше самостоятельности', activities: 'Проекты, счёт, речевые игры.', approach: 'Обсуждаем идеи, ищем решения и доводим задуманное до конца.', image: null, previewImage: 'group-older' },
];
