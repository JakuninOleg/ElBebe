import test from 'node:test';
import assert from 'node:assert/strict';
import { directorRoute, officeUser } from '../src/lib/director-access.ts';
import { groupChoices, programFields, programDefaults, validateDirectorData, teacherGroups } from '../src/lib/director-model.ts';
import { resolveContacts } from '../src/data/site-contacts.ts';
import { resolvePrograms } from '../src/lib/group-programs.ts';
import { directorSchema, groupUpgrade, upgradeDirector } from './upgrade-director.mjs';
import { directorRequest } from '../src/lib/director-middleware.ts';

test('Director and owner can work in the office; lesser and absent users cannot', () => {
  for (const role of [10, 20, 30]) assert.equal(officeUser({ id: 'user', role }), false);
  for (const role of [40, 50]) assert.equal(officeUser({ id: 'user', role }), true);
  assert.equal(officeUser(null), false);
});
test('Director routes deny all system surfaces and API mutations by default', () => {
  for (const path of ['settings', 'admin/users', 'schema/collections', 'menus', 'widgets', 'sections', 'redirects', 'tokens', 'oauth/token', 'mcp', 'search', 'import', 'transfer', 'plugins/other/run']) {
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) assert.equal(directorRoute('/_emdash/api/' + path, method), 'deny', `${method} ${path}`);
  }
  assert.equal(directorRoute('/_emdash/admin/settings', 'GET'), 'home');
  assert.equal(directorRoute('/_emdash/admin/plugins/el-bebe-office/contacts', 'GET'), 'allow');
  assert.equal(directorRoute('/_emdash/api/media/file/photo.webp', 'GET'), 'allow');
  assert.equal(directorRoute('/_emdash/api/media/some-id', 'DELETE'), 'deny');
});
test('Actual request boundary blocks protected fields, blind saves, system APIs and forged publication metadata', async () => {
  let reached = 0;
  const next = async () => { reached++; return new Response('native'); };
  const context = (path, method, body) => ({
    url: new URL('http://localhost' + path), request: new Request('http://localhost' + path, { method, ...(body ? { body: JSON.stringify(body) } : {}) }),
    locals: { user: { id: 'director', role: 40 }, emdash: { handleContentGet: async () => ({ success: true, data: { item: { id: 'id', slug: 'younger', data: { program_key: 'younger' } } } }) } },
    redirect: path => new Response(null, { status: 302, headers: { Location: path } }),
  });
  for (const [path, method, body, expected] of [
    ['/settings', 'PUT', { siteName: 'changed' }, 403],
    ['/content/el_bebe_site/id', 'PUT', { data: { hero_title: 'bad' }, _rev: 'v1' }, 400],
    ['/content/el_bebe_groups/id', 'PUT', { data: { program_key: 'older' }, _rev: 'v1' }, 400],
    ['/content/el_bebe_rates/id', 'PUT', { data: { price: '100' } }, 409],
    ['/content/el_bebe_rates/id', 'POST', { data: {} }, 403],
    ['/content/el_bebe_groups', 'POST', { data: { title: 'new' } }, 403],
    ['/content/el_bebe_rates/id/publish', 'POST', { _rev: 'v1', slug: 'changed' }, 403],
  ]) {
    const response = await directorRequest(context('/_emdash/api' + path, method, body), next);
    assert.equal(response.status, expected, path);
  }
  assert.equal(reached, 0);
  assert.equal((await directorRequest(context('/_emdash/api/content/el_bebe_rates/id', 'PUT', { data: { price: '100 / мес.' }, _rev: 'v1' }), next)).status, 200);
  assert.equal(reached, 1);
  const outsider = context('/_emdash/api/settings', 'GET'); outsider.locals.user.role = 30;
  assert.equal(await directorRequest(outsider, next), null, 'Other roles continue through native authorization');
  const redirect = await directorRequest(context('/_emdash/admin/settings', 'GET'), next);
  assert.equal(redirect.status, 302);
  assert.match(redirect.headers.get('Location'), /el-bebe-office\/home$/);
});
test('Contacts resolve every phone link consistently and reject unsafe messenger URLs', () => {
  const c = resolveContacts({ phone: '+7 (999) 123-45-67', address: 'Новый адрес', email: 'garden@example.ru', hours: 'С 8 до 19', telegram_url: 'https://t.me/garden', vk_url: 'javascript:alert(1)' });
  assert.equal(c.phoneHref, 'tel:+79991234567');
  assert.equal(c.messengers[0].href, 'https://wa.me/79991234567');
  assert.equal(c.messengers[1].href, 'https://t.me/garden');
  assert.equal(c.messengers[2].href, null);
  assert.equal(c.address, 'Новый адрес');
  assert.equal(resolveContacts({ phone: 'broken' }).phone, resolveContacts().phone);
  assert.throws(() => validateDirectorData('el_bebe_site', { email: 'bad\nheader' }), /почт/);
  assert.throws(() => validateDirectorData('el_bebe_site', { telegram_url: 'https://t.me.evil.test/name' }), /HTTPS/);
});
test('Server validation restricts field sets, text length, image sources and group membership', () => {
  assert.deepEqual(teacherGroups(['younger', 'Старшая группа']), ['younger', 'older']);
  assert.throws(() => validateDirectorData('el_bebe_team', { groups: ['unknown'] }), /списка/);
  assert.throws(() => validateDirectorData('el_bebe_groups', { program_key: 'older' }, 'younger'), /Структуру/);
  assert.throws(() => validateDirectorData('el_bebe_rates', { is_main: true }), /Структуру/);
  assert.throws(() => validateDirectorData('el_bebe_site', { hero_title: 'Changed' }), /Структуру/);
  assert.throws(() => validateDirectorData('el_bebe_team', { image: { id: 'id', src: 'https://external.test/image' } }), /медиатек/);
  assert.throws(() => validateDirectorData('el_bebe_team', { bio: 'a'.repeat(651) }), /длину/);
  assert.throws(() => validateDirectorData('el_bebe_groups', { category_1_items: Array(9).fill('Занятие').join('\n') }, 'younger'), /восьми/);
});
test('Program edits change content while preserving three groups, six lessons and fixed category counts', () => {
  for (const group of groupChoices) {
    const data = programDefaults(group.id);
    const fields = programFields(group.id);
    assert.equal(fields.filter(f => /^lesson_/.test(f.key)).length, 6);
    const program = resolvePrograms([{ id: group.id, title: group.title, image: null, program: { ...data, summary: 'Новый текст', lesson_1: 'Новое занятие', category_1_title: 'Новый раздел' } }]).find(p => p.id === group.id);
    assert.equal(program.summary, 'Новый текст');
    assert.equal(program.lessons[0].label, 'Новое занятие');
    assert.equal(program.categories[0].title, 'Новый раздел');
    assert.equal(program.lessons.length, 6);
  }
  assert.equal(resolvePrograms([]).length, 3);
});
test('Migration fills missing program values and preserves authored text', () => {
  const entry = { id: 'database-id', slug: 'younger', data: { title: 'Младшая группа', summary: 'Авторский текст', image: { id: 'photo' } } };
  const data = groupUpgrade(entry);
  assert.equal(data.summary, 'Авторский текст');
  assert.equal(data.program_key, 'younger');
  assert.deepEqual(data.image, { id: 'photo' });
  assert.deepEqual(groupUpgrade({ ...entry, data }), data);
  assert.equal(groupUpgrade({ data: { title: 'Неизвестная группа' } }), null);
  assert.ok(directorSchema().el_bebe_team.some(f => f.slug === 'groups' && f.type === 'multiSelect'));
});
test('Migration never publishes an existing editorial draft and is safe to repeat', async () => {
  let item = { id: 'record', slug: 'younger', data: { title: 'Младшая группа' }, status: 'published', liveRevisionId: 'live', draftRevisionId: 'draft', _rev: 'rev1' };
  const schema = new Map(Object.entries(directorSchema()).map(([slug, fields]) => [slug, { fields: [...fields] }]));
  let published = 0;
  const client = { collection: async slug => schema.get(slug), createField: async () => assert.fail('No new fields expected'), async *listAll(slug) { if (slug === 'el_bebe_groups') yield item; }, get: async () => item, update: async (_slug, _id, input) => { item = { ...item, data: input.data }; return item; }, publish: async () => published++ };
  assert.equal((await upgradeDirector(client)).entriesUpdated, 1);
  assert.equal(published, 0);
  assert.equal((await upgradeDirector(client)).entriesUpdated, 0);
});
