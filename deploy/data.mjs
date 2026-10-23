import { DatabaseSync, backup } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, copyFileSync, chmodSync, chownSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { parseArgs, parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';

const format = 'el-bebe-deployment-v1';
const inside = (root, file) => { const path = relative(resolve(root), resolve(file)); return !path || (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`)); };
const privateMode = (path, mode) => { if (process.platform !== 'win32') chmodSync(path, mode); };
function files(root, prefix = '') {
  if (lstatSync(root).isSymbolicLink()) throw new Error('Symlinks are not allowed in deployment data.');
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink()) throw new Error('Symlinks are not allowed in deployment data.');
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return files(join(root, entry.name), name);
    if (!entry.isFile()) throw new Error('Only regular files are allowed in deployment data.');
    return [name];
  });
}
async function hash(path) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest('hex');
}
function readKey(value) {
  const key = value?.trim();
  if (!key || !key.split(',').every(part => /^emdash_enc_v1_[A-Za-z0-9_-]{43}$/.test(part.trim()))) throw new Error('Supply the existing EMDASH_ENCRYPTION_KEY; it is never generated or replaced during migration.');
  return key;
}
function databaseCheck(path, cms = false) {
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    if (db.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw new Error('Database integrity check failed.');
    if (cms) for (const name of ['users', 'options', 'media', 'revisions']) {
      if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name)) throw new Error('Not a complete EmDash database.');
    }
  } finally { db.close(); }
}
async function snapshot(source, target) {
  mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(source, { readOnly: true });
  try { await backup(db, target); } finally { db.close(); }
  // A transport snapshot is a single file; opening it must not create unlisted WAL/SHM sidecars.
  const copy = new DatabaseSync(target);
  try { copy.exec('PRAGMA journal_mode=DELETE'); } finally { copy.close(); }
  privateMode(target, 0o600);
}

export async function exportData({ project, output, cmsDb, uploads, officeDb, key }) {
  for (const root of [project, process.cwd(), uploads]) if (inside(root, output)) throw new Error('Export outside the served project and media directories.');
  if (existsSync(output)) throw new Error('The export directory already exists; choose a new directory.');
  databaseCheck(cmsDb, true);
  const media = files(uploads);
  if (officeDb && existsSync(officeDb)) databaseCheck(officeDb);
  const secret = readKey(key);
  mkdirSync(dirname(output), { recursive: true, mode: 0o700 });
  mkdirSync(output, { mode: 0o700 });
  await snapshot(cmsDb, join(output, 'data/cms/data.db'));
  for (const name of media) {
    const destination = join(output, 'data/uploads', name);
    mkdirSync(dirname(destination), { recursive: true, mode: 0o700 });
    copyFileSync(join(uploads, name), destination);
    privateMode(destination, 0o600);
  }
  mkdirSync(join(output, 'data/uploads'), { recursive: true, mode: 0o700 });
  const catalog = new DatabaseSync(join(output, 'data/cms/data.db'), { readOnly: true });
  try {
    const copied = new Set(media);
    for (const row of catalog.prepare('SELECT storage_key FROM media').all()) {
      if (!copied.has(String(row.storage_key).replace(/^\//, ''))) throw new Error('A media-library file is missing. Keep the source CMS stopped and export its complete uploads directory.');
    }
  } finally { catalog.close(); }
  const officeIncluded = !!officeDb && existsSync(officeDb);
  if (officeIncluded) await snapshot(officeDb, join(output, 'data/office/office.sqlite'));
  writeFileSync(join(output, 'emdash-encryption-key'), secret + '\n', { mode: 0o600, flag: 'wx' });
  const manifest = { format, createdAt: new Date().toISOString(), mediaFiles: media.length, officeIncluded, keySha256: await hash(join(output, 'emdash-encryption-key')), files: [] };
  for (const name of files(join(output, 'data'))) {
    const path = join(output, 'data', name);
    manifest.files.push({ name, bytes: lstatSync(path).size, sha256: await hash(path) });
  }
  writeFileSync(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  return manifest;
}

export async function restoreData({ bundle, destination, mountedKeyFile }) {
  const manifest = JSON.parse(readFileSync(join(bundle, 'manifest.json'), 'utf8'));
  if (manifest.format !== format || !Array.isArray(manifest.files)) throw new Error('Unsupported deployment bundle.');
  const actual = files(join(bundle, 'data')).sort();
  const declared = manifest.files.map(file => file.name).sort();
  if (new Set(declared).size !== declared.length || JSON.stringify(actual) !== JSON.stringify(declared)) throw new Error('Bundle file list does not match the manifest.');
  for (const file of manifest.files) {
    if (typeof file.name !== 'string' || file.name.includes('\\') || file.name.split('/').some(part => !part || part === '.' || part === '..') || !/^(cms\/data\.db|office\/office\.sqlite|uploads\/.+)$/.test(file.name)) throw new Error('Invalid path in the deployment bundle.');
    const path = resolve(bundle, 'data', file.name);
    if (!inside(join(bundle, 'data'), path) || lstatSync(path).size !== file.bytes || await hash(path) !== file.sha256) throw new Error('Bundle integrity check failed.');
  }
  const key = readKey(readFileSync(join(bundle, 'emdash-encryption-key'), 'utf8'));
  if (await hash(join(bundle, 'emdash-encryption-key')) !== manifest.keySha256) throw new Error('Bundle key integrity check failed.');
  if (mountedKeyFile && readKey(readFileSync(mountedKeyFile, 'utf8')) !== key) throw new Error('The mounted key differs from the bundle. Install its existing key before import.');
  databaseCheck(join(bundle, 'data/cms/data.db'), true);
  if (manifest.officeIncluded) databaseCheck(join(bundle, 'data/office/office.sqlite'));
  if (existsSync(destination) && files(destination).length) throw new Error('Destination is not empty. Existing VPS data will never be overwritten.');
  mkdirSync(destination, { recursive: true, mode: 0o700 });
  for (const file of manifest.files) {
    const target = join(destination, file.name);
    mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
    copyFileSync(join(bundle, 'data', file.name), target);
    privateMode(target, 0o600);
  }
  for (const name of ['cms', 'uploads', 'office', 'sessions']) mkdirSync(join(destination, name), { recursive: true, mode: 0o700 });
  writeFileSync(join(destination, 'import.json'), JSON.stringify({ format, importedAt: new Date().toISOString(), exportedAt: manifest.createdAt, mediaFiles: manifest.mediaFiles }) + '\n', { flag: 'wx', mode: 0o600 });
  // The official Node image runs the app as uid/gid 1000; only the one-off import runs as root.
  if (process.getuid?.() === 0) {
    const own = path => { chownSync(path, 1000, 1000); if (lstatSync(path).isDirectory()) for (const name of readdirSync(path)) own(join(path, name)); };
    own(destination);
  }
  return manifest;
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { project: { type: 'string' }, out: { type: 'string' }, from: { type: 'string' }, 'data-root': { type: 'string' }, 'office-db': { type: 'string' }, 'key-file': { type: 'string' } } });
  if (positionals[0] === 'restore') {
    if (!values.from) throw new Error('Use restore --from /import [--data-root /var/lib/el-bebe].');
    const result = await restoreData({ bundle: resolve(values.from), destination: resolve(values['data-root'] || '/var/lib/el-bebe'), mountedKeyFile: process.env.EMDASH_ENCRYPTION_KEY_FILE });
    console.log(`Imported CMS, ${result.mediaFiles} media files and ${result.officeIncluded ? 'office records' : 'an empty office directory'}. Existing accounts are preserved; sessions are not transferred.`);
    return;
  }
  if (positionals[0] !== 'export' || !values.out) throw new Error('Use export --project /path/to/project --out /private/new-bundle [--office-db /private/office.sqlite] [--key-file /private/existing-key].');
  const container = process.env.EL_BEBE_DOCKER === 'true';
  const project = resolve(values.project || process.cwd());
  let env = {};
  if (!container) for (const name of ['.env', '.env.local', '.env.development', '.env.development.local']) {
    const path = join(project, name);
    if (existsSync(path)) env = { ...env, ...parseEnv(readFileSync(path, 'utf8')) };
  }
  const keyFile = values['key-file'] || process.env.EMDASH_ENCRYPTION_KEY_FILE;
  const key = keyFile ? readFileSync(keyFile, 'utf8') : process.env.EMDASH_ENCRYPTION_KEY || env.EMDASH_ENCRYPTION_KEY;
  const officeDb = values['office-db'] || process.env.EL_BEBE_PRIVATE_DB || env.EL_BEBE_PRIVATE_DB || join(homedir(), '.el-bebe/office.sqlite');
  const result = await exportData({ project, output: resolve(values.out), cmsDb: container ? '/var/lib/el-bebe/cms/data.db' : join(project, 'data.db'), uploads: container ? '/var/lib/el-bebe/uploads' : join(project, 'uploads'), officeDb: resolve(project, officeDb), key });
  console.log(`Private bundle ready: ${result.mediaFiles} media files; office database ${result.officeIncluded ? 'included' : 'not present at the configured path'}. Do not commit or publish the bundle.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
