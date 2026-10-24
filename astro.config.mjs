import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig, sessionDrivers } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";
import { fileURLToPath } from "node:url";
import { privateFileDeny } from './config/private-files.mjs';

const container = process.env.EL_BEBE_DOCKER === 'true';
const siteUrl = process.env.EMDASH_SITE_URL;
if (container && !siteUrl) throw new Error('Set EMDASH_SITE_URL when building the VPS image.');

export default defineConfig({
	site: siteUrl,
	session: container ? { driver: sessionDrivers.fsLite({ base: '/var/lib/el-bebe/sessions' }) } : undefined,
	output: "server",
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
			siteUrl,
			maxUploadSize: 250 * 1024 * 1024,
			fonts: false,
			plugins: [{
				id: 'el-bebe-office', version: '1.0.0',
				entrypoint: fileURLToPath(new URL('./src/plugins/el-bebe-office/plugin.ts', import.meta.url)).replaceAll('\\', '/'),
				adminEntry: fileURLToPath(new URL('./src/plugins/el-bebe-office/admin.tsx', import.meta.url)).replaceAll('\\', '/'),
				adminPages: [
					{ path: '/home', label: 'Кабинет директора', icon: 'house', group: 'Работа садика' },
					{ path: '/team', label: 'Воспитатели', icon: 'users', group: 'Работа садика' },
					{ path: '/rates', label: 'Стоимость', icon: 'currency-rub', group: 'Работа садика' },
					{ path: '/contacts', label: 'Контакты', icon: 'phone', group: 'Работа садика' },
					{ path: '/programs', label: 'Программы групп', icon: 'book-open', group: 'Работа садика' },
					{ path: '/requests', label: 'Заявки родителей', icon: 'inbox', group: 'Работа садика' },
					{ path: '/print', label: 'Документы для печати', icon: 'file-text', group: 'Работа садика' },
				],
			}],
			database: sqlite({ url: container ? 'file:/var/lib/el-bebe/cms/data.db' : "file:./data.db" }),
			storage: local({
				directory: container ? '/var/lib/el-bebe/uploads' : "./uploads",
				baseUrl: "/_emdash/api/media/file",
			}),
		}),
	],
	devToolbar: { enabled: false },
	vite: { server: { fs: { deny: privateFileDeny } } },
});
