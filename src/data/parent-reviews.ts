import type { ParentReview } from '../lib/parent-reviews';

// Exact, limited excerpts from longer reviews. Stars, dates, authors and business
// identity checked in the public cards on 2026-10-22; no invented testimonials.
export const parentReviews: ParentReview[] = [
  {
    id: 'yandex-anna-2023-11-04', author: 'Анна Маркина', rating: 5, approved: true,
    source: 'yandex', date: '4 ноября 2023', published: '2023-11-04', topic: 'О впечатлениях после каждого дня',
    text: 'Мы знаем, что вечером заберем ребёнка и он будет сыт, доволен и обязательно узнает что-то новое. Потому что программа обучения очень интересная и занимательная.',
    avatar: '/images/el-bebe/reviews/anna.jpg',
    avatarSourceUrl: 'https://avatars.mds.yandex.net/get-yapic/21493/enc-1ae1c8e0400020a36fba6273dd10a46b98eee9008467e0d4eb455d6405be2647/islands-68',
    sourceUrl: 'https://yandex.ru/maps/org/154599785417/reviews?reviews%5BpublicId%5D=jmbutkrzpqtz3w9rpprrkrp1r8',
  },
  {
    id: '2gis-kristina-2023-04-01', author: 'Кристина Ермак', rating: 5, approved: true,
    source: '2gis', date: '1 апреля 2023', published: '2023-04-01', topic: 'Первые успехи в шахматах',
    text: 'Особая любовь это шахматы! Да! Шахматы, в 4 года дочь уже научилась играть!',
    avatar: '/images/el-bebe/reviews/kristina.jpg',
    avatarSourceUrl: 'https://i2.photo.2gis.com/images/profile/844424941612922_72f6_64x64.jpg',
    sourceUrl: 'https://2gis.ru/sochi/firm/70000001044912349/tab/reviews',
  },
  {
    id: 'yandex-nastasya-2025-05-30', author: 'Настасья Евглевская', rating: 5, approved: true,
    source: 'yandex', date: '30 мая 2025', published: '2025-05-30', topic: 'О саде, куда хочется вернуться',
    text: 'Обе дочки ходили туда. Сейчас уже младшая выпускница. … Любим сад. До сих пор старшая просит вернуться ) бывает иногда в гостях',
    avatar: '/images/el-bebe/reviews/nastasya.jpg',
    avatarSourceUrl: 'https://avatars.mds.yandex.net/get-yapic/37154/zB41XfAz3dEsexwfKVpe6tg1Pxw-1/islands-68',
    sourceUrl: 'https://yandex.ru/maps/org/154599785417/reviews?reviews%5BpublicId%5D=INMYSEA',
  },
];
export const yandexReviewsUrl = 'https://yandex.ru/maps/org/el_bebe/154599785417/reviews/';
export const gisReviewsUrl = 'https://2gis.ru/sochi/firm/70000001044912349/tab/reviews';
