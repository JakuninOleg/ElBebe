import snapshot from '../../src/data/showcase.json';
import type { SiteContent } from '../../src/lib/cms';

export async function getSiteContent(): Promise<SiteContent> {
  return snapshot as unknown as SiteContent;
}
