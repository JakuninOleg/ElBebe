import type { ImageValue } from 'emdash';

export interface LifePhotoItem {
  id: string;
  title: string;
  description?: string;
  image: ImageValue | string | null;
  width?: number;
  height?: number;
}

const chapters = [
  {
    id: 'otkrytiya', theme: 'learning', icon: 'palette', label: 'Занятия и творчество',
    title: 'Что получилось сегодня',
    text: 'На занятиях рисуем, делаем поделки, собираем конструктор и учимся играть в шахматы.',
    note: '«Смотри, я сам!»', more: 'Ещё с наших занятий', visible: 3,
    photos: ['pencils', 'chess-boy', 'painting', 'speech', 'letters', 'drawing', 'butterfly', 'blocks', 'creative-table', 'learning-together', 'construction', 'chess-girl', 'chess-smile', 'speech-coral'],
  },
  {
    id: 'druzya', theme: 'outdoors', icon: 'tree', label: 'Прогулки и друзья',
    title: 'Вместе интереснее',
    text: 'Собираем листья, рассматриваем цветы и гуляем по Сочи. А ещё играем на площадке и обнимаемся с друзьями.',
    note: 'Пойдём гулять!', more: 'Ещё с наших прогулок', visible: 2,
    photos: ['autumn-circle', 'friends', 'fountain', 'outdoor-play', 'rope-bridge', 'climbing', 'magnolia', 'autumn-boy', 'boy-white', 'boy-polo'],
  },
  {
    id: 'prazdniki', theme: 'celebration', icon: 'sun', label: 'Наши праздники',
    title: 'Празднуем в саду',
    text: 'Наряжаемся на Масленицу, делаем открытки к 9 Мая и встречаем гостей на праздниках.',
    note: 'С праздником!', more: 'Ещё праздничные моменты', visible: 3,
    photos: ['maslenitsa', 'victory-craft', 'celebration', 'confetti', 'graduation'],
  },
];

export function buildLifeAlbum(items: LifePhotoItem[]) {
  const photos = items.filter(item => item.image);
  const select = (ids: string[]) => ids.flatMap(id => {
    const photo = photos.find(item => item.id === id);
    return photo ? [photo] : [];
  });
  const selected = select(['playground-friends', 'abacus', 'heart']);
  const opening = selected.length ? selected : photos.slice(0, 3);
  const used = new Set(opening.map(item => item.id));
  const sections = chapters.map(chapter => {
    const entries = select(chapter.photos).filter(item => !used.has(item.id));
    entries.forEach(item => used.add(item.id));
    return { ...chapter, photos: entries };
  });
  const uncategorized = photos.filter(item => !used.has(item.id));
  return {
    opening,
    sections: [
      ...sections.filter(section => section.photos.length),
      ...(uncategorized.length ? [{ id: 'momenty', theme: 'daily', icon: 'camera', label: 'Другие моменты', title: 'Наши дни в Эльбэби', text: '', note: '', more: 'Ещё фотографии', visible: 3, photos: uncategorized }] : []),
    ],
  };
}
