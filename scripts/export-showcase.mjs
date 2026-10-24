import { DatabaseSync } from 'node:sqlite';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { contactFields, programKey, teacherGroups } from '../src/lib/director-model.ts';
import { previewSpaces } from '../src/data/el-bebe.ts';

// Read only live revisions of public site collections. Never read accounts,
// sessions, settings, secrets, drafts, or form submissions.
const db = new DatabaseSync(fileURLToPath(new URL('../data.db', import.meta.url)), { readOnly: true });
const string = value => typeof value === 'string' ? value.trim() : '';
function entries(collection) {
  if (!['site', 'team', 'groups', 'rates', 'faqs', 'spaces', 'testimonials'].includes(collection)) throw new Error('Unexpected showcase collection.');
  const slug = `el_bebe_${collection}`;
  return db.prepare(`SELECT e.slug, r.data FROM ec_${slug} e JOIN revisions r ON r.id = e.live_revision_id AND r.collection = ? AND r.entry_id = e.id WHERE e.status = 'published' AND e.deleted_at IS NULL`).all(slug)
    .map(row => ({ id: row.slug, data: JSON.parse(row.data) }))
    .sort((a, b) => (Number(a.data.sort_order) || 0) - (Number(b.data.sort_order) || 0) || a.id.localeCompare(b.id));
}
function publicImage(value) {
  if (!value) return null;
  if (/(?:^|\/)(?:el-bebe-)?(?:room|play|life|garden|playground|group-younger|group-middle-art|group-older-robot)\.webp$/.test(string(value.filename))) return null;
  const match = /^el-bebe-([a-z0-9-]+\.webp)$/.exec(string(value.filename));
  if (!match || !existsSync(new URL(`../public/images/el-bebe/${match[1]}`, import.meta.url))) throw new Error('Add a reviewed public counterpart for every showcase image before exporting.');
  return { id: match[1], src: `/images/el-bebe/${match[1]}`, alt: string(value.alt) };
}
function publicUrl(value) {
  try { const url = new URL(string(value)); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
}
try {
  const settings = entries('site')[0]?.data;
  if (!settings) throw new Error('Publish site settings before exporting the showcase.');
  const snapshot = {
    teamConfigured: entries('team').length > 0,
    settings: Object.fromEntries([...new Set(['hero_title', 'hero_text', 'license_text', ...contactFields.map(field => field.key)])].map(field => [field, string(settings[field])])),
    team: entries('team').filter(({ data }) => data.is_hidden !== true).map(({ id, data }) => ({ id, name: string(data.title), role: string(data.role), bio: string(data.bio), groups: teacherGroups(data.groups), image: publicImage(data.image) })),
    groups: entries('groups').map(({ id, data }) => ({ id: programKey({ id, data }) || id, title: string(data.title), summary: string(data.summary), activities: string(data.activities), approach: string(data.approach), program: Object.fromEntries(Object.entries(data).filter(([, value]) => typeof value === 'string')), image: publicImage(data.image) })),
    rates: entries('rates').map(({ id, data }) => ({ id, title: string(data.title), hours: string(data.hours), price: string(data.price), description: string(data.description), isMain: data.is_main === true || data.is_main === 1, isEntryFee: data.is_entry_fee === true || data.is_entry_fee === 1 })),
    faqs: entries('faqs').map(({ id, data }) => ({ id, question: string(data.title), answer: string(data.answer) })),
    spaces: entries('spaces').some(({ data }) => publicImage(data.image))
      ? entries('spaces').map(({ id, data }) => ({ id, title: string(data.title), description: string(data.description), image: publicImage(data.image) }))
      : previewSpaces,
    testimonials: entries('testimonials').filter(({ data }) => string(data.title) && string(data.quote) && publicUrl(data.source_url)).map(({ id, data }) => ({ id, author: string(data.title), quote: string(data.quote), source_url: publicUrl(data.source_url) })),
  };
  writeFileSync(new URL('../src/data/showcase.json', import.meta.url), `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Public showcase snapshot: ${snapshot.rates.length} rates, ${snapshot.faqs.length} FAQs, ${snapshot.spaces.length} photos, ${snapshot.team.length} team records, ${snapshot.testimonials.length} sourced reviews.`);
} finally { db.close(); }
