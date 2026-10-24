import type { APIContext } from 'astro';
import { directorRoute } from './director-access.ts';
import { directorRole, officePath, programKey, validateDirectorData } from './director-model.ts';

export async function directorRequest(context: APIContext, next: () => Promise<Response>): Promise<Response | null> {
  const path = context.url.pathname;
  if (context.locals.user?.role === directorRole && path.startsWith('/_emdash/')) {
    const method = context.request.method;
    const deny = (message = 'Этот раздел доступен только владельцу сайта.', status = 403) => new Response(JSON.stringify({ success: false, error: { code: 'FORBIDDEN', message } }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });
    const content = /^\/_emdash\/api\/content\/(el_bebe_(?:site|team|rates|groups))(?:\/([A-Za-z0-9_-]+))?(?:\/(publish|unpublish))?\/?$/.exec(path);
    if (content) {
      const [, collection, id, action] = content;
      if (['GET', 'HEAD'].includes(method) && !action) return next();
      if (!((method === 'PUT' && id && !action) || (method === 'POST' && id && action === 'publish') || (method === 'POST' && !id && collection === 'el_bebe_team'))) return deny();
      try {
        if (Number(context.request.headers.get('content-length')) > 32768) return deny('Слишком много данных.', 413);
        const reader = context.request.clone().body?.getReader();
        const chunks: Uint8Array[] = []; let size = 0;
        if (reader) {
          try { while (true) {
            const chunk = await reader.read(); if (chunk.done) break;
            size += chunk.value.byteLength;
            if (size > 32768) { void reader.cancel(); return deny('Слишком много данных.', 413); }
            chunks.push(chunk.value);
          } } finally { reader.releaseLock(); }
        }
        const raw = Buffer.concat(chunks).toString('utf8');
        const body = JSON.parse(raw);
        const allowed = id ? action ? ['_rev'] : ['data', '_rev'] : ['data', 'slug', 'status'];
        if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !allowed.includes(key))) return deny('Служебные поля и структура сайта недоступны директору.');
        if (id && (typeof body._rev !== 'string' || !body._rev)) return deny('Обновите запись перед сохранением.', 409);
        if (!action) {
          const existing = id ? await context.locals.emdash!.handleContentGet(collection, id, undefined, { includeDrafts: true }) : null;
          if (existing && !existing.success) return deny('Запись не найдена.', 404);
          const item = existing?.data?.item;
          validateDirectorData(collection, body.data, collection === 'el_bebe_groups' ? programKey({ id: item?.id, slug: item?.slug as string, data: item?.data as Record<string, unknown> }) : undefined);
          if (!id && (body.status && body.status !== 'draft' || typeof body.slug !== 'string' || !/^[a-z0-9-]{1,100}$/.test(body.slug))) return deny('Новый сотрудник сначала сохраняется как черновик.', 400);
        }
      } catch (error) { return deny(error instanceof Error ? error.message : 'Проверьте поля.', 400); }
      return next();
    }
    const decision = directorRoute(path, method);
    if (decision === 'home') return context.redirect(officePath + '/home', 302);
    if (decision === 'deny') return deny();
    const response = await next();
    if (path === '/_emdash/api/manifest' && response.ok) {
      const manifest = await response.json();
      if (manifest.data) {
        manifest.data.collections = {};
        manifest.data.taxonomies = [];
        manifest.data.plugins = Object.fromEntries(Object.entries(manifest.data.plugins ?? {}).filter(([id]) => id === 'el-bebe-office'));
      }
      return new Response(JSON.stringify(manifest), { status: response.status, headers: response.headers });
    }
    if (path.startsWith('/_emdash/admin') && response.ok && response.headers.get('content-type')?.includes('text/html')) {
      const html = (await response.text()).replace('<html ', '<html data-el-bebe-director="true" ');
      return new Response(html, { status: response.status, headers: response.headers });
    }
    return response;
  }
  return null;
}
