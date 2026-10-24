import { EmDashClient } from 'emdash/client';
import { pathToFileURL } from 'node:url';
import { contactFields, groupChoices, programDefaults, programFields, programKey, teamFields } from '../src/lib/director-model.ts';
import { resolveContacts } from '../src/data/site-contacts.ts';

export function directorSchema() {
  const field = f => ({ slug: f.key, label: f.label, type: f.type === 'groups' ? 'multiSelect' : f.type === 'boolean' ? 'boolean' : f.type === 'number' ? 'integer' : f.type === 'image' ? 'image' : f.type === 'text' ? 'text' : 'string', required: false,
    validation: f.type === 'groups' ? { options: groupChoices.map(g => g.title) } : f.max ? { maxLength: f.max } : undefined });
  const program = [...new Map(groupChoices.flatMap(g => programFields(g.id)).map(f => [f.key, f])).values()];
  return {
    el_bebe_site: contactFields.map(field),
    el_bebe_team: teamFields.map(field),
    el_bebe_groups: [{ slug: 'program_key', label: 'Группа (служебное поле)', type: 'select', validation: { options: groupChoices.map(g => g.id) } }, ...program.map(field)],
  };
}
const legacy = {
  younger: { summary: 'Первое знакомство с садом', approach: 'Больше поддержки и повторения. Помогаем освоиться и пробовать самому.' },
  middle: { summary: 'Больше вопросов и открытий', approach: 'Учимся договариваться, выбирать и действовать вместе.' },
  older: { summary: 'Больше самостоятельности', approach: 'Обсуждаем идеи, ищем решения и доводим задуманное до конца.' },
};
export function groupUpgrade(entry) {
  const key = programKey(entry);
  if (!key) return null;
  const data = { ...entry.data }, defaults = programDefaults(key);
  for (const [field, value] of Object.entries(defaults)) if (!data[field] || data[field] === legacy[key]?.[field]) data[field] = value;
  return data;
}
/** Additive, retryable migration using native schema/revision APIs; never resets or seeds the database. */
export async function upgradeDirector(client) {
  const report = { fieldsCreated: 0, entriesUpdated: 0 };
  for (const [slug, definitions] of Object.entries(directorSchema())) {
    const collection = await client.collection(slug);
    const fields = new Map(collection.fields.map(field => [field.slug, field]));
    for (const field of definitions) {
      const existing = fields.get(field.slug);
      if (existing && existing.type !== field.type) throw new Error(`Incompatible field ${slug}.${field.slug}; no data removed.`);
      if (!existing) { await client.createField(slug, field); report.fieldsCreated++; }
    }
  }
  for (const collection of ['el_bebe_site', 'el_bebe_groups', 'el_bebe_team']) {
    for await (const record of client.listAll(collection, { limit: 100 })) {
      const entry = await client.get(collection, record.id, { raw: true });
      // Existing editorial drafts must never be published by a migration.
      const hasDraft = entry.draftRevisionId && entry.draftRevisionId !== entry.liveRevisionId;
      let data;
      if (collection === 'el_bebe_groups') data = groupUpgrade(entry);
      if (collection === 'el_bebe_team') data = { ...entry.data, groups: entry.data.groups ?? [], is_hidden: entry.data.is_hidden ?? false };
      if (collection === 'el_bebe_site') {
        const resolved = resolveContacts(entry.data);
        data = { ...entry.data };
        for (const field of contactFields) if (data[field.key] === undefined || field.key === 'phone' && !data[field.key]) data[field.key] = resolved[field.key] ?? '';
      }
      if (!data || JSON.stringify(data) === JSON.stringify(entry.data)) continue;
      const updated = await client.update(collection, entry.id, { data, _rev: entry._rev });
      if (entry.status === 'published' && !hasDraft) await client.publish(collection, entry.id, { _rev: updated._rev });
      report.entriesUpdated++;
    }
  }
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2), target = new URL(args.includes('--url') ? args[args.indexOf('--url') + 1] : 'http://127.0.0.1:4321');
  const dev = args.includes('--dev-local');
  if (dev && (target.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname))) throw new Error('--dev-local is restricted to a local development server.');
  if (target.username || target.password || target.pathname !== '/' || target.search || target.hash) throw new Error('Use an origin URL.');
  if (!dev && !process.env.EMDASH_TOKEN) throw new Error('Set an ordinary administrator EMDASH_TOKEN, or use --dev-local against the development server.');
  const client = new EmDashClient({ baseUrl: target.origin, token: process.env.EMDASH_TOKEN, devBypass: dev });
  console.log(JSON.stringify(await upgradeDirector(client)));
}
