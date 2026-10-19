import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const master = fileURLToPath(new URL('../docs/design/favicon-bunny-master.png', import.meta.url));
const publicFile = name => new URL(`../public/${name}`, import.meta.url);
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map(size => sharp(master)
  .resize(size, size, { kernel: 'lanczos3' }).png().toBuffer()));

for (const [index, size] of sizes.entries()) {
  await writeFile(publicFile(`favicon-bunny-${size}.png`), frames[index]);
}

const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
for (const [index, size] of sizes.entries()) {
  const entry = 6 + index * 16;
  directory.writeUInt8(size, entry);
  directory.writeUInt8(size, entry + 1);
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(frames[index].length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += frames[index].length;
}
await writeFile(publicFile('favicon.ico'), Buffer.concat([directory, ...frames]));
await sharp(master).resize(180, 180)
  .flatten({ background: '#fffdf7' }).png()
  .toFile(fileURLToPath(publicFile('apple-touch-icon.png')));
