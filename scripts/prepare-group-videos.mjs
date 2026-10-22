// Usage: node scripts/prepare-group-videos.mjs <ffmpeg-executable> <source-directory>
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, stat, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { groupVideos } from '../src/data/group-videos.ts';

const [ffmpeg, sourceDirectory] = process.argv.slice(2);
if (!ffmpeg || !sourceDirectory) throw new Error('Provide FFmpeg and the directory containing small.mp4, middle.mp4 and robo.mp4.');
const run = promisify(execFile);
const manifest = [];
for (const [group, clip] of Object.entries(groupVideos)) {
  const input = resolve(sourceDirectory, clip.sourceFile);
  const output = resolve('public', clip.src.slice(1));
  if (input === output) throw new Error('Never overwrite the source recording.');
  await mkdir(dirname(output), { recursive: true });
  await run(ffmpeg, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-i', input,
    '-map', '0:v:0', '-map', '0:a:0?', '-map_metadata', '-1', '-map_chapters', '-1',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-maxrate', '480k', '-bufsize', '960k', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-level:v', '3.1', '-threads', '2', '-fps_mode', 'vfr',
    '-c:a', 'copy', '-movflags', '+faststart', '-y', output], { maxBuffer: 1024 * 1024 });
  const sourceBytes = (await stat(input)).size;
  const bytes = (await stat(output)).size;
  manifest.push({ group, sourceFile: clip.sourceFile, sourceBytes, sourceSha256: createHash('sha256').update(await readFile(input)).digest('hex'),
    output: clip.src, bytes, savingPercent: Math.round((1 - bytes / sourceBytes) * 100) });
  console.log(`${group}: ${(sourceBytes / 1e6).toFixed(2)} MB -> ${(bytes / 1e6).toFixed(2)} MB`);
}
await writeFile('docs/group-video-encoding.json', `${JSON.stringify({ encoder: 'FFmpeg / libx264, CRF 28, slow, capped at 480 kbps / 960 kb buffer; AAC stream copied; faststart; original dimensions and duration', clips: manifest }, null, 2)}\n`);
