import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { validatePrintDraft, type SavedPrint, type VisitStatus } from './office-model.ts';

export type VisitRecord = { id: string; received_at: string; name: string; phone: string; consent_version: string; privacy_version: string; source: string };
export type StoredVisit = VisitRecord & { status: VisitStatus; updated_at: string };
let instance: DatabaseSync | undefined;

export function privateDatabasePath(): string {
  const file = resolve(process.env.EL_BEBE_PRIVATE_DB || resolve(homedir(), '.el-bebe', 'office.sqlite'));
  const fromProject = relative(process.cwd(), file);
  if (!fromProject || (!isAbsolute(fromProject) && fromProject !== '..' && !fromProject.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`))) {
    throw new Error('Private office storage must be outside the served project root.');
  }
  return file;
}

function database(): DatabaseSync {
  if (instance) return instance;
  const file = privateDatabasePath();
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(file);
  if (process.platform !== 'win32') chmodSync(file, 0o600);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY, received_at TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL,
      consent_version TEXT NOT NULL, privacy_version TEXT NOT NULL, source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','closed')),
      updated_at TEXT NOT NULL, request_key TEXT UNIQUE
    );
    CREATE INDEX IF NOT EXISTS visits_received ON visits(received_at DESC);
    CREATE TABLE IF NOT EXISTS print_documents (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, kind TEXT NOT NULL,
      data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS office_settings (
      name TEXT PRIMARY KEY, value TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1
    );`);
  instance = db;
  return db;
}

export function requestEmail(): { email: string; revision: number } {
  const row = database().prepare("SELECT value, revision FROM office_settings WHERE name = 'request_email'").get();
  return { email: row ? String(row.value) : '', revision: row ? Number(row.revision) : 0 };
}
export function saveRequestEmail(email: string, revision: number) {
  if (email.length > 254 || email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new Error('Проверьте адрес почты для заявок.');
  const db = database();
  const result = revision === 0
    ? db.prepare("INSERT OR IGNORE INTO office_settings (name, value) VALUES ('request_email', ?)").run(email)
    : db.prepare("UPDATE office_settings SET value = ?, revision = revision + 1 WHERE name = 'request_email' AND revision = ?").run(email, revision);
  if (!result.changes) throw new Error('Адрес изменён в другом окне. Обновите страницу.');
  return requestEmail();
}

export class VisitRequestConflictError extends Error {}

export function findSavedVisit(requestKey: string, record: Pick<VisitRecord, 'name' | 'phone'>): string | null {
  const previous = database().prepare('SELECT id, name, phone FROM visits WHERE request_key = ?').get(requestKey);
  if (previous) {
    if (previous.name !== record.name || previous.phone !== record.phone) throw new VisitRequestConflictError('Request key already used for another submission.');
    return String(previous.id);
  }
  return null;
}

export function saveVisit(record: VisitRecord, requestKey: string | null = null): { id: string; duplicate: boolean } {
  const db = database();
  const previous = requestKey ? findSavedVisit(requestKey, record) : null;
  if (previous) return { id: previous, duplicate: true };
  db.prepare(`INSERT INTO visits (id, received_at, name, phone, consent_version, privacy_version, source, updated_at, request_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(record.id, record.received_at, record.name, record.phone, record.consent_version, record.privacy_version, record.source, record.received_at, requestKey);
  return { id: record.id, duplicate: false };
}

export function listVisits(page = 0): { items: StoredVisit[]; more: boolean } {
  const rows = database().prepare(`SELECT id, received_at, name, phone, consent_version, privacy_version, source, status, updated_at
    FROM visits ORDER BY received_at DESC LIMIT 51 OFFSET ?`).all(page * 50) as unknown as StoredVisit[];
  return { items: rows.slice(0, 50), more: rows.length > 50 };
}

export function changeVisitStatus(id: string, status: VisitStatus): boolean {
  if (!['new', 'contacted', 'closed'].includes(status)) throw new Error('Выберите статус заявки.');
  return database().prepare('UPDATE visits SET status = ?, updated_at = ? WHERE id = ?').run(status, new Date().toISOString(), id).changes > 0;
}

export function deleteVisit(id: string): boolean { return database().prepare('DELETE FROM visits WHERE id = ?').run(id).changes > 0; }

export function listPrints(): Array<Pick<SavedPrint, 'id' | 'title' | 'kind' | 'revision' | 'updatedAt'>> {
  return database().prepare('SELECT id, title, kind, revision, updated_at AS updatedAt FROM print_documents ORDER BY updated_at DESC LIMIT 200').all() as unknown as ReturnType<typeof listPrints>;
}

export function getPrint(id: string): SavedPrint | null {
  const row = database().prepare('SELECT id, data, revision, updated_at FROM print_documents WHERE id = ?').get(id);
  return row ? { ...JSON.parse(String(row.data)), id: String(row.id), revision: Number(row.revision), updatedAt: String(row.updated_at) } : null;
}

export function savePrint(input: unknown, id?: string, revision?: number): SavedPrint {
  const draft = validatePrintDraft(input);
  const db = database();
  const updatedAt = new Date().toISOString();
  if (id) {
    const result = db.prepare('UPDATE print_documents SET title = ?, kind = ?, data = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ?')
      .run(draft.title, draft.kind, JSON.stringify(draft), updatedAt, id, revision ?? 0);
    if (!result.changes) throw new Error('Документ уже изменён в другом окне. Откройте его заново, чтобы сохранить актуальную версию.');
  } else {
    if (listPrints().length >= 200) throw new Error('Сохранено 200 документов. Удалите ненужные документы перед созданием новых.');
    id = randomUUID();
    db.prepare('INSERT INTO print_documents (id, title, kind, data, updated_at) VALUES (?, ?, ?, ?, ?)').run(id, draft.title, draft.kind, JSON.stringify(draft), updatedAt);
  }
  return getPrint(id)!;
}

export function deletePrint(id: string, revision: number): boolean {
  return database().prepare('DELETE FROM print_documents WHERE id = ? AND revision = ?').run(id, revision).changes > 0;
}
