import { definePlugin, PluginRouteError, type RouteContext } from 'emdash';
import { changeVisitStatus, deletePrint, deleteVisit, getPrint, listPrints, listVisits, savePrint } from '../../lib/office-store';
import type { VisitStatus } from '../../lib/office-model';

function object(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw PluginRouteError.badRequest('Не удалось прочитать данные.');
  return input as Record<string, unknown>;
}
function id(input: unknown): string {
  if (typeof input !== 'string' || !/^[a-f0-9-]{36}$/i.test(input)) throw PluginRouteError.badRequest('Некорректный номер записи.');
  return input;
}
function integer(input: unknown, max: number): number {
  const value = Number(input);
  if (!Number.isInteger(value) || value < 0 || value > max) throw PluginRouteError.badRequest('Некорректный номер страницы или версии.');
  return value;
}
// EmDash checks the authenticated session, permissions and CSRF header before dispatch.
// Private personal records require the administrator's settings permission, not public content access.
const read = { permission: 'settings:manage' as const, public: false, methods: ['GET' as const], request: { body: 'none' as const } };
const write = { permission: 'settings:manage' as const, public: false, methods: ['POST' as const], request: { body: 'json' as const, maxBytes: 32_768 } };
function caller(ctx: RouteContext) { if (!ctx.user) throw PluginRouteError.unauthorized('Войдите в CMS.'); }

export function createPlugin() {
  return definePlugin({
    id: 'el-bebe-office', version: '1.0.0',
    capabilities: ['content:read'],
    routes: {
      'price-source': { ...read, handler: async ctx => {
        caller(ctx);
        const result = await ctx.content!.list('el_bebe_rates', { limit: 40, where: { status: 'published' } }).catch(() => {
          throw PluginRouteError.badRequest('Не удалось загрузить цены. Проверьте опубликованные записи «Режимы и стоимость» или заполните лист вручную.');
        });
        const items = [...result.items].sort((a, b) => Number(a.data.sort_order ?? 0) - Number(b.data.sort_order ?? 0));
        return { rows: items.map(({ data }) => ({ label: `${String(data.title ?? '')}${data.hours ? ` · ${String(data.hours)}` : ''}`, detail: String(data.price ?? ''), time: '', day: 0, age: '' })) };
      } },
      'visits': { ...read, handler: async ctx => { caller(ctx); const data = object(ctx.input); return listVisits(integer(data.page ?? 0, 10_000)); } },
      'visit-status': { ...write, handler: async ctx => {
        caller(ctx); const data = object(ctx.input);
        if (!['new', 'contacted', 'closed'].includes(String(data.status))) throw PluginRouteError.badRequest('Выберите статус заявки.');
        if (!changeVisitStatus(id(data.id), data.status as VisitStatus)) throw PluginRouteError.notFound('Заявка уже удалена.');
        return { ok: true };
      } },
      'visit-delete': { ...write, handler: async ctx => { caller(ctx); if (!deleteVisit(id(object(ctx.input).id))) throw PluginRouteError.notFound('Заявка уже удалена.'); return { ok: true }; } },
      'documents': { ...read, handler: async ctx => { caller(ctx); return { items: listPrints() }; } },
      'document': { ...read, handler: async ctx => {
        caller(ctx); const document = getPrint(id(object(ctx.input).id));
        if (!document) throw PluginRouteError.notFound('Документ уже удалён.');
        return document;
      } },
      'document-save': { ...write, handler: async ctx => {
        caller(ctx); const data = object(ctx.input);
        try { return savePrint(data.document, data.id ? id(data.id) : undefined, data.id ? integer(data.revision, 1_000_000) : undefined); }
        catch (error) {
          if (error instanceof Error && /Документ уже изменён/.test(error.message)) throw PluginRouteError.conflict(error.message);
          if (error instanceof Error && !('code' in error)) throw PluginRouteError.badRequest(error.message);
          throw PluginRouteError.internal('Не удалось сохранить документ.');
        }
      } },
      'document-delete': { ...write, handler: async ctx => {
        caller(ctx); const data = object(ctx.input);
        if (!deletePrint(id(data.id), integer(data.revision, 1_000_000))) throw PluginRouteError.conflict('Документ изменён или удалён. Обновите список.');
        return { ok: true };
      } },
    },
    admin: { pages: [
      { path: '/requests', label: 'Заявки родителей', icon: 'inbox', group: 'Работа садика' },
      { path: '/print', label: 'Документы для печати', icon: 'file-text', group: 'Работа садика' },
    ] },
  });
}
