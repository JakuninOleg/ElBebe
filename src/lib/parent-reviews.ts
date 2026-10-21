export interface ParentReview {
  id: string;
  author: string;
  text: string;
  rating: number;
  sourceUrl: string;
  approved: boolean;
}

/** Publish only checked, five-star reviews linked to this kindergarten. */
export function selectParentReviews(reviews: ParentReview[]): ParentReview[] {
  const seen = new Set<string>();
  return reviews.filter(review => {
    if (review.rating !== 5 || !review.approved || !review.id?.trim() || !review.author?.trim() || !review.text?.trim() || seen.has(review.id)) return false;
    try {
      const url = new URL(review.sourceUrl);
      if (url.protocol !== 'https:' || !['yandex.ru', 'www.yandex.ru', 'yandex.com', 'www.yandex.com'].includes(url.hostname) || !url.pathname.startsWith('/maps/') || !url.pathname.includes('/154599785417/')) return false;
    } catch { return false; }
    seen.add(review.id);
    return true;
  });
}
