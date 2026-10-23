import type { APIRoute } from 'astro';
import { DatabaseSync } from 'node:sqlite';

export const prerender = false;
export const GET: APIRoute = () => {
  let ok = false;
  let db: DatabaseSync | undefined;
  try {
    db = new DatabaseSync(process.env.EL_BEBE_DOCKER === 'true' ? '/var/lib/el-bebe/cms/data.db' : 'data.db', { readOnly: true });
    db.prepare('SELECT 1 FROM options LIMIT 1').get();
    ok = true;
  } catch { /* The health response never contains configuration or database details. */ }
  finally { db?.close(); }
  return new Response(JSON.stringify({ ok }), { status: ok ? 200 : 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
};
