import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { rebuildQueue, dispatchRebuild, requestCmsRebuild } from '../deploy/cms-rebuild.mjs';
import { snapshotDatabases } from '../deploy/backup-release.mjs';

function queue() { return rebuildQueue(join(mkdtempSync(join(tmpdir(), 'el-bebe-rebuild-')), 'office.sqlite')); }
const config = { repository: 'JakuninOleg/ElBebe', token: 'test-token-only' };

test('only public collections queue builds; rapid publications debounce and survive a new connection', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'el-bebe-queue-')), 'office.sqlite');
  const first = rebuildQueue(file);
  for (const name of ['visits', 'print_documents', 'office_settings']) assert.equal(first.enqueue(name, 0), false);
  assert.equal(first.enqueue('el_bebe_team', 1_000), true);
  assert.equal(first.enqueue('el_bebe_rates', 20_000), true);
  assert.equal(first.pending(49_999), undefined);
  assert.deepEqual({ ...rebuildQueue(file).pending(50_000) }, { revision: 2, attempts: 0 });
  assert.throws(() => rebuildQueue('./public/queue.sqlite'), /private absolute/);
  assert.doesNotThrow(() => requestCmsRebuild('el_bebe_team', { EL_BEBE_DOCKER: 'false' }));
});

test('dispatch sends no CMS content and a concurrent publication remains pending', async () => {
  const pending = queue(); pending.enqueue('el_bebe_groups', 0);
  let calls = 0;
  const fetcher = async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.github.com/repos/JakuninOleg/ElBebe/actions/workflows/ci-cd.yml/dispatches');
    assert.deepEqual(JSON.parse(options.body), { ref: 'main', inputs: { reason: 'cms', content_revision: '1' } });
    assert.equal(options.redirect, 'error');
    pending.enqueue('el_bebe_site', 31_000);
    return new Response(null, { status: 204 });
  };
  assert.equal(await dispatchRebuild({ ...config, queue: pending, fetcher, now: 30_000 }), true);
  assert.deepEqual({ ...pending.pending(61_000) }, { revision: 2, attempts: 0 });
  assert.equal(await dispatchRebuild({ ...config, queue: pending, fetcher, now: 31_001 }), false);
  assert.equal(calls, 1);
});

test('failed GitHub requests retain the queue with bounded backoff; only an accepted request acknowledges it', async () => {
  const pending = queue(); pending.enqueue('el_bebe_faqs', 0);
  const denied = async () => new Response(null, { status: 403 });
  await assert.rejects(dispatchRebuild({ ...config, queue: pending, fetcher: denied, now: 30_000 }), /not accept/);
  assert.equal(pending.pending(89_999), undefined);
  assert.equal(pending.pending(90_000).attempts, 1);
  await assert.rejects(dispatchRebuild({ ...config, queue: pending, fetcher: async () => { throw new Error('offline'); }, now: 90_000 }), /offline/);
  assert.equal(pending.pending(209_999), undefined);
  assert.equal(pending.pending(210_000).attempts, 2);
  assert.equal(await dispatchRebuild({ ...config, queue: pending, fetcher: async () => new Response('{}', { status: 200 }), now: 210_000 }), true);
  assert.equal(pending.pending(1_000_000), undefined);
  for (let n = 0; n < 15; n++) pending.failed(1_000_000);
  pending.enqueue('el_bebe_team', 1_000_000);
  assert.equal(pending.pending(4_599_999), undefined);
  assert.ok(pending.pending(4_600_000));
  await assert.rejects(dispatchRebuild({ ...config, repository: '../escape', queue: pending }), /Invalid/);
  await assert.rejects(dispatchRebuild({ ...config, ref: 'untrusted-branch', queue: pending }), /Invalid/);
});

test('pre-release snapshots include both open WAL databases and refuse overwrite', async () => {
  const root = mkdtempSync(join(tmpdir(), 'el-bebe-pre-release-'));
  mkdirSync(join(root, 'cms')); mkdirSync(join(root, 'office'));
  const databases = ['cms/data.db', 'office/office.sqlite'].map(name => new DatabaseSync(join(root, name)));
  try {
    for (const db of databases) db.exec("PRAGMA journal_mode=WAL; CREATE TABLE sentinel(value TEXT); INSERT INTO sentinel VALUES('existing-record');");
    const target = join(root, 'snapshot');
    await snapshotDatabases(target, root);
    for (const name of ['cms.sqlite', 'office.sqlite']) {
      const copy = new DatabaseSync(join(target, name), { readOnly: true });
      assert.equal(copy.prepare('SELECT value FROM sentinel').get().value, 'existing-record'); copy.close();
    }
    await assert.rejects(snapshotDatabases(target, root), /fresh/);
  } finally { databases.forEach(db => db.close()); }
});

test('deployment preserves data and rolls back failed health checks (mock Docker transport)', () => {
  const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
  const result = execFileSync(bash, [fileURLToPath(new URL('./deploy-release.test.sh', import.meta.url))], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8', timeout: 30_000,
  });
  assert.match(result, /All deployment failure scenarios passed/);
});
