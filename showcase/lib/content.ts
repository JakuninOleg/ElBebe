import snapshot from '../../src/data/showcase.json';
import type { SiteContent } from '../../src/lib/cms';
import { resolveSiteAddress } from '../../src/data/site-location';

export async function getSiteContent(): Promise<SiteContent> {
  return { ...snapshot, settings: { ...snapshot.settings, address: resolveSiteAddress(snapshot.settings.address) } } as unknown as SiteContent;
}
