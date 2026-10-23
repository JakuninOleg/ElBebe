import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";
import { fileURLToPath } from "node:url";
import { privateFileDeny } from './config/private-files.mjs';

export default defineConfig({
	output: "server",
	build: { inlineStylesheets: 'always' },
	adapter: node({
		mode: "standalone",
	}),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			fonts: false,
			plugins: [{
				id: 'el-bebe-office', version: '1.0.0',
				entrypoint: fileURLToPath(new URL('./src/plugins/el-bebe-office/plugin.ts', import.meta.url)).replaceAll('\\', '/'),
				adminEntry: fileURLToPath(new URL('./src/plugins/el-bebe-office/admin.tsx', import.meta.url)).replaceAll('\\', '/'),
				adminPages: [
					{ path: '/requests', label: 'Заявки родителей', icon: 'inbox', group: 'Работа садика' },
					{ path: '/print', label: 'Документы для печати', icon: 'file-text', group: 'Работа садика' },
				],
			}],
			database: sqlite({ url: "file:./data.db" }),
			storage: local({
				directory: "./uploads",
				baseUrl: "/_emdash/api/media/file",
			}),
		}),
	],
	devToolbar: { enabled: false },
	vite: { server: { fs: { deny: privateFileDeny } } },
});
