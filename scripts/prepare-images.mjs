import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const specs = JSON.parse(await readFile(new URL('./image-sources.json', import.meta.url), 'utf8'));
const sourceDirectory = process.env.EL_BEBE_IMAGE_SOURCE_DIR;
if (!sourceDirectory) throw new Error('Set EL_BEBE_IMAGE_SOURCE_DIR to the local directory with the original generated PNGs.');
const out = resolve('public/images/el-bebe');
await mkdir(out, { recursive: true });
for (const item of specs) {
  const result = await sharp(resolve(sourceDirectory, item.source)).resize({ width: item.width ?? (item.name === 'logo' ? 680 : 1400), withoutEnlargement: true }).webp({ quality: 86, alphaQuality: 100 }).toFile(resolve(out, `${item.name}.webp`));
  console.log(`${item.name}.webp: ${result.width}×${result.height}, ${Math.round(result.size / 1024)} KB`);
}
await writeFile(resolve(out, 'provenance.json'), JSON.stringify({ type: 'AI-generated temporary design assets', actualPeopleOrPremises: false, replaceBeforePublishing: true, assets: specs.map(({ name }) => `${name}.webp`) }, null, 2));
