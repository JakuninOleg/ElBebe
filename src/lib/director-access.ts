import { directorRole, officePath } from './director-model.ts';

/** Editor is the project's restricted Director profile; native admin remains unchanged. */
export function officeUser(user?: { id: string; role: number } | null): boolean {
  return !!user?.id && (user.role === directorRole || user.role >= 50);
}
export function directorRoute(path: string, method: string): 'allow' | 'deny' | 'home' {
  if (path.startsWith('/_emdash/admin')) return path === officePath || path.startsWith(officePath + '/') || path.startsWith('/_emdash/admin/profile') || path.startsWith('/_emdash/admin/login') ? 'allow' : 'home';
  if (!path.startsWith('/_emdash/api/')) return 'allow';
  if (path.startsWith('/_emdash/api/plugins/el-bebe-office/')) return 'allow';
  if (['/_emdash/api/auth/me', '/_emdash/api/auth/logout', '/_emdash/api/auth/mode'].includes(path)) return 'allow';
  if (/^\/_emdash\/api\/auth\/(?:passkeys|passkey\/register|sessions)(?:\/|$)/.test(path)) return 'allow';
  if (['GET', 'HEAD'].includes(method) && (path === '/_emdash/api/manifest' || /^\/_emdash\/api\/media(?:\/|$)/.test(path))) return 'allow';
  if (method === 'POST' && (path === '/_emdash/api/media/upload-url' || /^\/_emdash\/api\/media\/[A-Za-z0-9_-]+\/(?:upload|confirm)$/.test(path))) return 'allow';
  if (method === 'PUT' && /^\/_emdash\/api\/media\/[A-Za-z0-9_-]+\/upload$/.test(path)) return 'allow';
  return 'deny';
}
