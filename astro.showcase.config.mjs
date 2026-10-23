import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';
import { privateFileDeny } from './config/private-files.mjs';

// Static client preview: the same pages and design, without the CMS runtime,
// authentication routes, SQLite, uploads, or a personal-data collection API.
export default defineConfig({
  srcDir: './showcase',
  outDir: './dist-showcase',
  output: 'static',
  build: { inlineStylesheets: 'always' },
  site: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4322',
  integrations: [react()],
  vite: {
    server: { fs: { deny: privateFileDeny } },
    resolve: {
      alias: [
        { find: /^(?:\.\.\/)+lib\/cms$/, replacement: fileURLToPath(new URL('./showcase/lib/content.ts', import.meta.url)) },
        { find: /^(?:\.\.\/)+lib\/emdash-ui$/, replacement: fileURLToPath(new URL('./showcase/lib/ui.ts', import.meta.url)) },
      ],
    },
  },
  devToolbar: { enabled: false },
});
