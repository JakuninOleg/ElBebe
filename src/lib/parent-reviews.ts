export interface ParentReview {
  id: string;
  author: string;
  text: string;
  rating: number;
  sourceUrl: string;
  approved: boolean;
  source?: 'yandex' | '2gis';
  date?: string;
  published?: string;
  topic?: string;
}

/** Publish only checked, five-star reviews linked to this kindergarten. */
export function selectParentReviews(reviews: ParentReview[]): ParentReview[] {
  const seen = new Set<string>();
  return reviews.filter(review => {
    if (review.rating !== 5 || !review.approved || !review.id?.trim() || !review.author?.trim() || !review.text?.trim() || seen.has(review.id)) return false;
    try {
      const url = new URL(review.sourceUrl);
      const yandex = ['yandex.ru', 'www.yandex.ru', 'yandex.com', 'www.yandex.com'].includes(url.hostname) && /^\/maps\/org\/(?:el_bebe\/)?154599785417\/reviews\/?$/.test(url.pathname);
      const gis = ['2gis.ru', 'www.2gis.ru'].includes(url.hostname) && url.pathname === '/sochi/firm/70000001044912349/tab/reviews';
      if (url.protocol !== 'https:' || url.username || url.password || !(yandex || gis) || (review.source === 'yandex' && !yandex) || (review.source === '2gis' && !gis)) return false;
    } catch { return false; }
    seen.add(review.id);
    return true;
  });
}
