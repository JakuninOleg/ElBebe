import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute } from 'node:path';

const collections = new Set(['site', 'team', 'groups', 'rates', 'faqs', 'spaces', 'testimonials'].map(name => 'el_bebe_' + name));
export function rebuildQueue(file) {
  if (!file || !isAbsolute(file)) throw new Error('Use the private absolute office database path.');
  function database() {
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    const db = new DatabaseSync(file);
    db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS cms_rebuild_queue (
        id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, dispatched INTEGER NOT NULL DEFAULT 0,
        changed_at INTEGER NOT NULL, retry_at INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0
      );`);
    return db;
  }
  return {
    enqueue(collection, now = Date.now()) {
      if (!collections.has(collection)) return false;
      const db = database();
      try { db.prepare(`INSERT INTO cms_rebuild_queue(id,revision,changed_at) VALUES(1,1,?)
        ON CONFLICT(id) DO UPDATE SET revision=revision+1,changed_at=excluded.changed_at`).run(now); return true; }
      finally { db.close(); }
    },
    pending(now = Date.now()) {
      const db = database();
      try { return db.prepare('SELECT revision,attempts FROM cms_rebuild_queue WHERE id=1 AND revision>dispatched AND changed_at<=? AND retry_at<=?').get(now - 30_000, now); }
      finally { db.close(); }
    },
    dispatched(revision) {
      const db = database();
      try { db.prepare('UPDATE cms_rebuild_queue SET dispatched=MAX(dispatched,?),attempts=0,retry_at=0 WHERE id=1').run(revision); }
      finally { db.close(); }
    },
    failed(now = Date.now()) {
      const db = database();
      try { const row = db.prepare('SELECT attempts FROM cms_rebuild_queue WHERE id=1').get();
        if (row) db.prepare('UPDATE cms_rebuild_queue SET attempts=attempts+1,retry_at=? WHERE id=1').run(now + Math.min(3_600_000, 60_000 * 2 ** Math.min(Number(row.attempts), 6))); }
      finally { db.close(); }
    },
  };
}

export async function dispatchRebuild({ queue, repository, ref = 'main', token, fetcher = fetch, now = Date.now() }) {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(repository) || ref !== 'main' || !token || /\s/.test(token)) throw new Error('Invalid rebuild configuration.');
  const pending = queue.pending(now);
  if (!pending) return false;
  try {
    const response = await fetcher(`https://api.github.com/repos/${repository}/actions/workflows/ci-cd.yml/dispatches`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20_000),
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10', 'Content-Type': 'application/json', 'User-Agent': 'ElBebe-CMS' },
      body: JSON.stringify({ ref, inputs: { reason: 'cms', content_revision: String(pending.revision) } }),
    });
    if (!response.ok) throw new Error('GitHub did not accept the workflow dispatch.');
    await response.body?.cancel();
    queue.dispatched(pending.revision);
    return true;
  } catch (error) { queue.failed(now); throw error; }
}

export function requestCmsRebuild(collection, env = process.env) {
  if (env.EL_BEBE_DOCKER !== 'true') return;
  try { rebuildQueue(env.EL_BEBE_PRIVATE_DB).enqueue(collection); }
  catch { console.warn('[CI/CD] Could not queue a CMS rebuild; published content is still available through SSR.'); }
}

export function startRebuildWorker(env = process.env) {
  if (!env.CMS_REBUILD_REPOSITORY || !env.CMS_REBUILD_TOKEN_FILE) return;
  const queue = rebuildQueue(env.EL_BEBE_PRIVATE_DB);
  let busy = false;
  async function tick() {
    if (busy) return;
    busy = true;
    try { await dispatchRebuild({ queue, repository: env.CMS_REBUILD_REPOSITORY, token: readFileSync(env.CMS_REBUILD_TOKEN_FILE, 'utf8').trim() }); }
    catch { console.warn('[CI/CD] CMS rebuild dispatch failed; the persistent queue will retry.'); }
    finally { busy = false; }
  }
  const timer = setInterval(() => void tick(), 30_000); timer.unref();
  void tick();
  return () => clearInterval(timer);
}
