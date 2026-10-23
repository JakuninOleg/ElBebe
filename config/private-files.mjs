// Preserve Vite's default denials and protect local CMS/office files too.
export const privateFileDeny = [
  '.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}', '.npmrc', '.yarnrc.yml', '**/.git/**',
  '*.{db,sqlite,sqlite3}', '*.{db,sqlite,sqlite3}-{wal,shm,journal}', '*.jsonl',
  '**/.astro/sessions/**', '**/.emdash/**', '**/uploads/**',
  '**/deploy/secrets/**', '**/deploy/backups/**', '**/deploy/bundles/**', '**/emdash-encryption-key',
];
