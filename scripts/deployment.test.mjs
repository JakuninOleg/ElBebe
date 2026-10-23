import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { exportData, restoreData } from '../deploy/data.mjs';
import { prepareRuntime } from '../deploy/runtime.mjs';

const root = mkdtempSync(join(tmpdir(), 'el-bebe-deployment-'));
const project = join(root, 'project'), uploads = join(project, 'uploads');
mkdirSync(uploads, { recursive: true });
const cmsDb = join(project, 'data.db'), officeDb = join(root, 'private.sqlite');
const cms = new DatabaseSync(cmsDb);
cms.exec(`PRAGMA journal_mode=WAL;
  CREATE TABLE users (id TEXT); CREATE TABLE options (name TEXT, value TEXT);
  CREATE TABLE media (id TEXT, storage_key TEXT); CREATE TABLE revisions (id TEXT);
  INSERT INTO media VALUES ('photo', 'photo.webp'), ('video', 'video.mp4');
  INSERT INTO users VALUES ('existing-admin'); INSERT INTO options VALUES ('test', 'published-content');`);
const office = new DatabaseSync(officeDb);
office.exec("PRAGMA journal_mode=WAL; CREATE TABLE visits (id TEXT); INSERT INTO visits VALUES ('saved-visit')");
writeFileSync(join(uploads, 'photo.webp'), 'synthetic-photo-bytes');
writeFileSync(join(uploads, 'video.mp4'), Buffer.from([0, 1, 2, 3, 4, 5]));
const key = 'emdash_enc_v1_' + 'A'.repeat(43);
const options = { project, cmsDb, uploads, officeDb, key };
const bundle = join(root, 'bundle');

test('health probe reads the actual CMS database, reports no details and never creates a missing database', () => {
  const probe = `import { GET } from ${JSON.stringify(new URL('../src/pages/healthz.ts', import.meta.url).href)}; const response=await GET(); console.log(JSON.stringify({status:response.status,body:await response.json(),cache:response.headers.get('cache-control')}));`;
  const check = cwd => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', probe], { cwd, env: { ...process.env, EL_BEBE_DOCKER: 'false' }, encoding: 'utf8' }));
  assert.deepEqual(check(project), { status: 200, body: { ok: true }, cache: 'no-store' });
  const empty = join(root, 'empty-health'); mkdirSync(empty);
  assert.deepEqual(check(empty), { status: 503, body: { ok: false }, cache: 'no-store' });
  assert.equal(existsSync(join(empty, 'data.db')), false);
});

test('deployment snapshot includes active WAL data, existing users, private records and exact media bytes', async () => {
  const result = await exportData({ ...options, output: bundle });
  assert.equal(result.officeIncluded, true);
  assert.equal(result.mediaFiles, 2);
  const snapshot = new DatabaseSync(join(bundle, 'data/cms/data.db'), { readOnly: true });
  assert.equal(snapshot.prepare('SELECT id FROM users').get().id, 'existing-admin');
  assert.equal(snapshot.prepare('SELECT value FROM options').get().value, 'published-content');
  snapshot.close();
  const destination = join(root, 'restored');
  await restoreData({ bundle, destination, mountedKeyFile: join(bundle, 'emdash-encryption-key') });
  assert.deepEqual(readFileSync(join(destination, 'uploads/video.mp4')), readFileSync(join(uploads, 'video.mp4')));
  const restored = new DatabaseSync(join(destination, 'office/office.sqlite'), { readOnly: true });
  assert.equal(restored.prepare('SELECT id FROM visits').get().id, 'saved-visit');
  restored.close();
  assert.ok(existsSync(join(destination, 'sessions')));
  const originFile = join(root, 'image-origin.txt');
  writeFileSync(originFile, 'https://kindergarten.example');
  const env = { EMDASH_SITE_URL: 'https://kindergarten.example', EMDASH_ENCRYPTION_KEY_FILE: join(bundle, 'emdash-encryption-key') };
  prepareRuntime({ dataRoot: destination, originFile, env });
  assert.equal(env.EMDASH_ENCRYPTION_KEY, key);
  assert.throws(() => prepareRuntime({ dataRoot: destination, originFile, env: { ...env, EMDASH_SITE_URL: 'https://wrong.example' } }), /origin differs/);
  assert.throws(() => prepareRuntime({ dataRoot: join(root, 'empty-runtime'), originFile, env }), /Import the existing/);
});

test('deployment export and restore refuse overwrite, project-local backup, wrong keys and corrupted files', async () => {
  await assert.rejects(exportData({ ...options, output: bundle }), /already exists/);
  await assert.rejects(exportData({ ...options, output: join(project, 'unsafe-export') }), /outside the served/);
  await assert.rejects(restoreData({ bundle, destination: join(root, 'restored') }), /not empty/);
  const otherKey = join(root, 'other-key');
  writeFileSync(otherKey, 'emdash_enc_v1_' + 'B'.repeat(43));
  const rejected = join(root, 'not-restored');
  await assert.rejects(restoreData({ bundle, destination: rejected, mountedKeyFile: otherKey }), /key differs/);
  assert.equal(existsSync(rejected), false);
  writeFileSync(join(bundle, 'data/uploads/video.mp4'), 'changed');
  await assert.rejects(restoreData({ bundle, destination: rejected }), /integrity check/);
  assert.equal(existsSync(rejected), false);
  cms.close(); office.close();
});
