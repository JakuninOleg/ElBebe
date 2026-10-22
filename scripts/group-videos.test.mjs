import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { groupVideos } from '../src/data/group-videos.ts';

const routes = { younger: 'mladshaya', middle: 'srednyaya', older: 'starshaya' };
test('provided recordings are assigned to the requested groups and load only on demand', async () => {
  assert.deepEqual(Object.fromEntries(Object.entries(groupVideos).map(([id, clip]) => [id, clip.sourceFile])), {
    younger: 'small.mp4', middle: 'middle.mp4', older: 'robo.mp4',
  });
  for (const [id, clip] of Object.entries(groupVideos)) {
    const html = await readFile(`dist-showcase/gruppy/${routes[id]}/index.html`, 'utf8');
    const videos = [...html.matchAll(/<video\b[^>]*>[\s\S]*?<\/video>/g)];
    assert.equal(videos.length, 1);
    const video = videos[0][0];
    assert.ok(video.includes(`src="${clip.src}"`) && video.includes(`poster="${clip.poster}"`));
    assert.match(video, /preload="none"/);
    assert.match(video, /\bcontrols\b/);
    assert.match(video, /\bplaysinline\b/);
    assert.doesNotMatch(video, /\bautoplay\b/);
    assert.doesNotMatch(html, /Скоро здесь|Готовится к публикации/);
    const poster = await readFile(`public${clip.poster}`);
    assert.equal(poster.toString('ascii', 0, 4), 'RIFF');
    assert.equal(poster.toString('ascii', 8, 12), 'WEBP');
  }
});

test('web copies are smaller, contain video and audio, and support fast-start playback', async () => {
  const manifest = JSON.parse(await readFile('docs/group-video-encoding.json', 'utf8'));
  for (const clip of manifest.clips) {
    const bytes = await readFile(`public${clip.output}`);
    assert.equal(bytes.length, clip.bytes);
    assert.ok(bytes.length < clip.sourceBytes);
    const atoms = new Map();
    for (let offset = 0; offset + 8 <= bytes.length;) {
      const type = bytes.toString('ascii', offset + 4, offset + 8);
      let size = bytes.readUInt32BE(offset);
      if (size === 1) size = Number(bytes.readBigUInt64BE(offset + 8));
      if (size === 0) size = bytes.length - offset;
      assert.ok(size >= 8 && offset + size <= bytes.length);
      atoms.set(type, { offset, size });
      offset += size;
    }
    assert.ok(atoms.has('moov') && atoms.has('mdat'));
    assert.ok(atoms.get('moov').offset < atoms.get('mdat').offset);
    const { offset, size } = atoms.get('moov');
    const metadata = bytes.subarray(offset, offset + size);
    assert.ok(metadata.includes(Buffer.from('avc1')) && metadata.includes(Buffer.from('mp4a')));
  }
});
