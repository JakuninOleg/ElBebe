#!/usr/bin/env node
import { EmDashClient } from "emdash/client";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Additive setup for the running local instance. Never runs seed/reset/import on an existing DB.
// Requires an existing ordinary API/OAuth token in EMDASH_TOKEN. No authentication bypass.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== "--url")) throw new Error("Usage: node scripts/setup-elbebe.mjs [--url http://127.0.0.1:4321]");
const target = new URL(args[1] ?? "http://127.0.0.1:4321");
if (target.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(target.hostname) || target.username || target.password || target.pathname !== "/" || target.search || target.hash) {
  throw new Error("Setup is restricted to an explicitly local HTTP EmDash instance.");
}
const seed = JSON.parse(await readFile(join(root, "seed", "el-bebe.json"), "utf8"));
if (!seed.collections.every((collection) => /^el_bebe_[a-z_]+$/.test(collection.slug))) throw new Error("Unexpected collection outside El Bebe scope.");
const token = process.env.EMDASH_TOKEN?.trim();
if (!token) throw new Error("Set EMDASH_TOKEN to an existing ordinary EmDash API/OAuth token before running this setup. No authentication bypass is used.");
const client = new EmDashClient({ baseUrl: target.origin, token });
const report = { collectionsCreated: 0, fieldsCreated: 0, entriesCreated: 0, existingEntriesKept: 0, mediaUploaded: 0, pendingImages: [] };
const knownCollections = new Map((await client.collections()).map((collection) => [collection.slug, collection]));

for (const definition of seed.collections) {
  if (!knownCollections.has(definition.slug)) {
    await client.createCollection({ slug: definition.slug, label: definition.label, labelSingular: definition.labelSingular, supports: definition.supports });
    report.collectionsCreated++;
  }
  const current = await client.collection(definition.slug);
  const fields = new Map(current.fields.map((field) => [field.slug, field]));
  for (const [index, field] of definition.fields.entries()) {
    const existing = fields.get(field.slug);
    if (existing && existing.type !== field.type) throw new Error(`Incompatible field ${definition.slug}.${field.slug}: leaving existing data untouched.`);
    if (!existing) { await client.createField(definition.slug, { ...field, sortOrder: index }); report.fieldsCreated++; }
  }
}

// Temporary AI visuals are never assigned to employee records. Reuse media by stable filenames.
const media = [];
let cursor;
do {
  const page = await client.mediaList({ limit: 100, cursor });
  media.push(...page.items);
  cursor = page.nextCursor;
} while (cursor);
const images = new Map();
for (const [name, alt] of Object.entries({
  hero: "Визуализация детства. Временная AI-иллюстрация El Bebe",
  together: "Визуализация совместной игры. Временная AI-иллюстрация El Bebe",
  play: "Визуализация пространства для игры. Временная AI-иллюстрация El Bebe",
  garden: "Визуализация зелёного дворика. Временная AI-иллюстрация El Bebe",
  room: "Визуализация комнаты для занятий. Временная AI-иллюстрация El Bebe",
  playground: "Визуализация детской площадки. Временная AI-иллюстрация El Bebe",
})) {
  const filename = `el-bebe-${name}.webp`;
  const existing = media.find((item) => item.filename === filename);
  if (existing) { images.set(name, { id: existing.id }); continue; }
  let bytes;
  try { bytes = await readFile(join(root, "public", "images", "el-bebe", `${name}.webp`)); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    report.pendingImages.push(`${name}.webp`);
    continue;
  }
  const image = await client.mediaUpload(bytes, filename, { alt, caption: alt, contentType: "image/webp" });
  images.set(name, { id: image.id });
  report.mediaUploaded++;
}

for (const definition of seed.collections) {
  const existing = new Set();
  for await (const entry of client.listAll(definition.slug, { limit: 100 })) existing.add(entry.slug);
  for (const entry of seed.content[definition.slug] ?? []) {
    if (existing.has(entry.slug)) { report.existingEntriesKept++; continue; }
    const data = { ...entry.data };
    if (definition.slug === "el_bebe_spaces") {
      // Defer this NEW entry until its illustration exists. A repeated run can add it
      // without updating any previously created or editor-modified record.
      if (!images.has(entry.slug)) continue;
      data.image = images.get(entry.slug);
    }
    const created = await client.create(definition.slug, { slug: entry.slug, data, status: "draft" });
    await client.publish(definition.slug, created.id);
    report.entriesCreated++;
  }
}
console.log(JSON.stringify({ target: target.origin, ...report }, null, 2));
