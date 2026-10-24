import { DatabaseSync, backup } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// The deployer stops the app first. Media and secrets are never modified by a release.
export async function snapshotDatabases(target, dataRoot = '/var/lib/el-bebe') {
  if (existsSync(target)) throw new Error('Use a fresh private release backup directory.');
  mkdirSync(target, { recursive: true, mode: 0o700 });
  for (const [source, name] of [[join(dataRoot, 'cms/data.db'), 'cms.sqlite'], [join(dataRoot, 'office/office.sqlite'), 'office.sqlite']]) {
    if (!existsSync(source) && name === 'office.sqlite') continue;
    const db = new DatabaseSync(source, { readOnly: true });
    try {
      if (db.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw new Error('Database integrity check failed.');
      await backup(db, join(target, name));
    } finally { db.close(); }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = process.argv[2];
  if (!/^\/backups\/[0-9]+-[0-9]+$/.test(target ?? '')) throw new Error('Use a private release backup directory.');
  await snapshotDatabases(target);
  console.log('Pre-release database snapshots saved.');
}
