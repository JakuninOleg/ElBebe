import { mkdir, writeFile } from 'node:fs/promises';
import { illustratedIcons } from '../src/data/illustrated-icons.ts';

// Keep the approved vector artwork intact while sharing it across every page.
const destination = new URL('../src/assets/el-bebe-illustrations.svg', import.meta.url);
await mkdir(new URL('../src/assets/', import.meta.url), { recursive: true });
const symbols = Object.entries(illustratedIcons).map(([id, art]) => `<symbol id="${id}" viewBox="0 0 120 110">${art}</symbol>`).join('\n');
await writeFile(destination, `<svg xmlns="http://www.w3.org/2000/svg" fill="none">\n${symbols}\n</svg>\n`);
