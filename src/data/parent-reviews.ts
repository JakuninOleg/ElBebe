import type { ParentReview } from '../lib/parent-reviews';

// Exact, limited excerpts from longer reviews. Stars, dates, authors and business
// identity checked in the public cards on 2026-10-22; no invented testimonials.
export const parentReviews: ParentReview[] = [
  {
    id: 'yandex-natalia-2025-05-15', author: 'Наталия Ермошкина', rating: 5, approved: true,
    source: 'yandex', date: '15 мая 2025', published: '2025-05-15', topic: 'О занятиях и внимании к детям',
    text: 'Воспитатели внимательные, доброжелательные, с индивидуальным подходом к каждому ребёнку. Программа насыщенная: развивающие занятия, творчество, английский язык, прогулки. Питание сбалансированное и разнообразное.',
    sourceUrl: 'https://yandex.ru/maps/org/154599785417/reviews?reviews%5BpublicId%5D=41wx37qp1tdq6164dzjyx32uu8',
  },
  {
    id: '2gis-olga-2022-03-01', author: 'OLGA Ikonnikova', rating: 5, approved: true,
    source: '2gis', date: '1 марта 2022', published: '2022-03-01', topic: 'О том, чем живёт ребёнок в саду',
    text: 'Все живут большой дружной семьёй. А вечерами дома мы с интересом рассматриваем фото и видео, что делали детки днем.',
    sourceUrl: 'https://2gis.ru/sochi/firm/70000001044912349/tab/reviews',
  },
  {
    id: 'yandex-nastasya-2025-05-30', author: 'Настасья Евглевская', rating: 5, approved: true,
    source: 'yandex', date: '30 мая 2025', published: '2025-05-30', topic: 'О саде, куда хочется вернуться',
    text: 'Обе дочки ходили туда. Сейчас уже младшая выпускница. … Любим сад. До сих пор старшая просит вернуться ) бывает иногда в гостях',
    sourceUrl: 'https://yandex.ru/maps/org/154599785417/reviews?reviews%5BpublicId%5D=INMYSEA',
  },
];
export const yandexReviewsUrl = 'https://yandex.ru/maps/org/el_bebe/154599785417/reviews/';
export const gisReviewsUrl = 'https://2gis.ru/sochi/firm/70000001044912349/tab/reviews';
