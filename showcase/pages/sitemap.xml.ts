import type { APIRoute } from 'astro';
import { publicSitemap } from '../../src/lib/public-pages';

export const GET: APIRoute = ({ site, url }) => new Response(publicSitemap((site ?? url).origin), {
  headers: { 'Content-Type': 'application/xml; charset=utf-8' },
});
