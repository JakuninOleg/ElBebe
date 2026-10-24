import { defineMiddleware } from 'astro:middleware';
import { publicSitemap } from './lib/public-pages';
import { directorRequest } from './lib/director-middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  const protectedResponse = await directorRequest(context, next);
  if (protectedResponse) return protectedResponse;
  if (path === '/sitemap.xml') {
    return new Response(publicSitemap(context.url.origin), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
  }
  // Unused public starter templates must not compete with the kindergarten site.
  // Keep their records and native admin/editor intact for later CMS work.
  if (/^\/(?:posts|tag|category)(?:\/|$)/.test(path) || /^\/about\/?$/.test(path) || /^\/sitemap-(?:posts|pages)\.xml$/.test(path)) {
    return context.rewrite('/404');
  }
  return next();
});
