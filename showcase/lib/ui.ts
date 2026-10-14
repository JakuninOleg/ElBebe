export { default as Image } from '../components/Image.astro';
export { default as EmDashHead } from '../components/Head.astro';
export { default as EmDashBodyStart, default as EmDashBodyEnd } from '../components/Empty.astro';

export function createPublicPageContext({ Astro: _astro, ...page }: { Astro: unknown; [key: string]: unknown }) {
  return page;
}
