import snapshot from '../../src/data/showcase.json';
import type { SiteContent } from '../../src/lib/cms';
import { resolveContacts } from '../../src/data/site-contacts';

export async function getSiteContent(): Promise<SiteContent> {
  return { ...snapshot, team: (snapshot.team as SiteContent['team']).map(person => ({ ...person, groups: 'groups' in person ? person.groups : [] })), settings: { ...snapshot.settings, ...resolveContacts(snapshot.settings) } } as unknown as SiteContent;
}
