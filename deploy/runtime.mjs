import { accessSync, constants, mkdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { startRebuildWorker } from './cms-rebuild.mjs';

export function prepareRuntime({ dataRoot = '/var/lib/el-bebe', originFile = new URL('../image-origin.txt', import.meta.url), env = process.env } = {}) {
  const expected = readFileSync(originFile, 'utf8').trim();
  if (!expected || env.EMDASH_SITE_URL !== expected) throw new Error('Site origin differs from the image. Rebuild with the DOMAIN configured in deploy/.env.');
  const keyFile = env.EMDASH_ENCRYPTION_KEY_FILE;
  if (!keyFile) throw new Error('Mount the existing EmDash encryption key as a Docker secret.');
  const key = readFileSync(keyFile, 'utf8').trim();
  if (!key || !key.split(',').every(value => /^emdash_enc_v1_[A-Za-z0-9_-]{43}$/.test(value.trim()))) throw new Error('The EmDash encryption key file is missing or invalid.');
  env.EMDASH_ENCRYPTION_KEY = key;
  for (const dir of ['cms', 'uploads', 'office', 'sessions']) mkdirSync(join(dataRoot, dir), { recursive: true, mode: 0o700 });
  const cms = join(dataRoot, 'cms/data.db');
  try {
    accessSync(cms, constants.R_OK | constants.W_OK);
    const imported = JSON.parse(readFileSync(join(dataRoot, 'import.json'), 'utf8'));
    if (imported.format !== 'el-bebe-deployment-v1') throw new Error();
  } catch { throw new Error('Import the existing CMS database and uploads before starting the app. No empty site will be created.'); }
  const db = new DatabaseSync(cms, { readOnly: true });
  try {
    if (db.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw new Error('CMS database integrity check failed.');
    for (const table of ['users', 'options', 'media', 'revisions']) {
      if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)) throw new Error('Import a complete EmDash database, not a seed or an empty SQLite file.');
    }
  } finally { db.close(); }
}
if (process.env.EL_BEBE_DOCKER === 'true') { prepareRuntime(); startRebuildWorker(); }
