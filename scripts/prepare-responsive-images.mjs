import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Derivatives preserve the approved framing. Full-size files remain album links.
const root = new URL('../public/images/el-bebe/', import.meta.url);
const output = new URL('responsive/', root);
await mkdir(output, { recursive: true });
const manifest = {};
for (const file of (await readdir(root)).filter(name => /^real-.*\.webp$/.test(name)).sort()) {
  const input = fileURLToPath(new URL(file, root));
  const { width, height } = await sharp(input).metadata();
  const variants = [];
  for (const size of [320, 480, 768].filter(size => size < width)) {
    const name = file.replace('.webp', `-${size}.webp`);
    await sharp(input).resize({ width: size, withoutEnlargement: true }).webp({ quality: 80 }).toFile(fileURLToPath(new URL(name, output)));
    variants.push({ src: `/images/el-bebe/responsive/${name}`, width: size });
  }
  variants.push({ src: `/images/el-bebe/${file}`, width });
  manifest[`/images/el-bebe/${file}`] = { width, height, variants };
}
await writeFile(new URL('../src/data/responsive-images.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Prepared responsive versions of ${Object.keys(manifest).length} photographs.`);
