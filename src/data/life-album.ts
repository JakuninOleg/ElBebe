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
    title: 'А что, если попробовать?',
    text: 'Рисовать, считать, строить и думать над следующим ходом. У каждого — своё маленькое открытие.',
    note: '«Смотри, я сам!»', more: 'Ещё с наших занятий', visible: 3,
    photos: ['pencils', 'chess-boy', 'painting', 'speech', 'letters', 'drawing', 'butterfly', 'blocks', 'creative-table', 'learning-together', 'construction', 'chess-girl', 'chess-smile', 'speech-coral'],
  },
  {
    id: 'druzya', theme: 'outdoors', icon: 'tree', label: 'Прогулки и друзья',
    title: 'Вместе интереснее',
    text: 'Собирать осенние листья, замечать цветы и обниматься просто так. Хорошо, когда рядом друзья.',
    note: 'Маленькие приключения каждый день', more: 'Ещё с наших прогулок', visible: 2,
    photos: ['autumn-circle', 'friends', 'fountain', 'outdoor-play', 'rope-bridge', 'climbing', 'magnolia', 'autumn-boy', 'boy-white', 'boy-polo'],
  },
  {
    id: 'prazdniki', theme: 'celebration', icon: 'sun', label: 'Наши праздники',
    title: 'Поводы для радости',
    text: 'Любимые герои, праздничные костюмы и открытки своими руками. Такие моменты хочется сохранить.',
    note: 'И целое море улыбок!', more: 'Ещё праздничные моменты', visible: 3,
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
