/** Intended public pages; native CMS records and administration stay intact. */
export const publicPages = [
  '/', '/gruppy/', '/stoimost/', '/den-v-sadu/', '/komanda/',
  '/prostranstvo/', '/roditelyam/', '/kontakty/', '/svedeniya/',
  '/privacy/', '/soglasie/',
];

export function publicSitemap(origin: string): string {
  const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPages.map(path => `  <url><loc>${escapeXml(new URL(path, origin).href)}</loc></url>`).join('\n')}\n</urlset>`;
}
