import type { ImageValue } from 'emdash';

export function imageSource(image: ImageValue | string | null | undefined, fallback: string): string | undefined {
  // Native media without a URL must be resolved by EmDash, not replaced by the curated fallback.
  return image ? (typeof image === 'string' ? image : image.src) : fallback;
}
