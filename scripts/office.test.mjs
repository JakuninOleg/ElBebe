import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { visitClientAddress } from '../src/lib/visit-client-address.ts';
import { validatePrintDraft, yearsLabel, blankRow } from '../src/lib/office-model.ts';
import { privateDatabasePath, saveVisit, listVisits, changeVisitStatus, deleteVisit, savePrint, getPrint, listPrints, deletePrint } from '../src/lib/office-store.ts';
import { POST, ALL } from '../src/pages/api/visit.ts';

const directory = mkdtempSync(join(tmpdir(), 'el-bebe-office-test-'));
process.env.EL_BEBE_PRIVATE_DB = join(directory, 'office.sqlite');
const birthday = { kind: 'birthdays', title: 'Дни рождения', group: 'Пример группы', period: '2028-02', rows: [{ ...blankRow(), label: 'Тестовый ребёнок', day: 29, age: '5' }] };

test('Private records cannot use a path inside the served project', () => {
  const file = process.env.EL_BEBE_PRIVATE_DB;
  process.env.EL_BEBE_PRIVATE_DB = join(process.cwd(), 'public', 'contacts.sqlite');
  assert.throws(privateDatabasePath, /outside the served/);
  process.env.EL_BEBE_PRIVATE_DB = file;
});
test('Birthday validation follows the selected month, bounds text and formats age', () => {
  assert.equal(validatePrintDraft(birthday).rows[0].day, 29);
  assert.throws(() => validatePrintDraft({ ...birthday, period: '2027-02' }), /Такого дня/);
  assert.throws(() => validatePrintDraft({ ...birthday, rows: [{ ...birthday.rows[0], age: '99' }] }), /возраст/);
  assert.throws(() => validatePrintDraft({ ...birthday, title: 'x'.repeat(81) }), /80/);
  assert.throws(() => validatePrintDraft({ ...birthday, rows: [] }), /от 1 до 40/);
  for (const [age, label] of [['1', '1 год'], ['3', '3 года'], ['11', '11 лет'], ['15', '15 лет']]) assert.equal(yearsLabel(age), label);
});
test('Weekly schedule rejects impossible times/days; prices require a payment period', () => {
  const week = { ...birthday, kind: 'week', period: '', rows: [{ ...blankRow(), label: 'Тестовое занятие', day: 1, time: '09:30' }] };
  assert.equal(validatePrintDraft(week).rows[0].time, '09:30');
  assert.throws(() => validatePrintDraft({ ...week, rows: [{ ...week.rows[0], time: '25:99' }] }), /время/);
  assert.equal(validatePrintDraft({ ...week, rows: [{ ...week.rows[0], day: 5 }] }).rows[0].day, 5);
  assert.throws(() => validatePrintDraft({ ...week, rows: [{ ...week.rows[0], day: 6 }] }), /день недели/);
  assert.throws(() => validatePrintDraft({ ...week, kind: 'prices' }), /Цена и период/);
});
test('Documents survive reopen; stale edits and stale deletes cannot overwrite changes', () => {
  const first = savePrint(birthday);
  assert.equal(getPrint(first.id).title, birthday.title);
  assert.equal(listPrints().length, 1);
  const next = savePrint({ ...birthday, title: 'Изменённый документ' }, first.id, first.revision);
  assert.equal(next.revision, 2);
  assert.throws(() => savePrint(birthday, first.id, 1), /другом окне/);
  assert.equal(deletePrint(first.id, 1), false);
  assert.equal(deletePrint(first.id, 2), true);
  assert.equal(getPrint(first.id), null);
});
test('A lost response retried with the same key saves only one visit', () => {
  const record = { id: randomUUID(), received_at: new Date().toISOString(), name: 'Тест формы', phone: '+79000000000', consent_version: 'test', privacy_version: 'test', source: '/api/visit' };
  const key = randomUUID();
  assert.equal(saveVisit(record, key).duplicate, false);
  assert.equal(saveVisit({ ...record, id: randomUUID() }, key).id, record.id);
  assert.equal(listVisits().items.length, 1);
  assert.throws(() => saveVisit({ ...record, phone: '+79000000001' }, key), /another submission/);
  assert.equal(changeVisitStatus(record.id, 'contacted'), true);
  assert.equal(listVisits().items[0].status, 'contacted');
  assert.equal(deleteVisit(record.id), true);
});

function context(data, { origin = 'https://example.test', type = 'application/json', headers = {}, ip = 'test-local' } = {}) {
  const request = new Request('https://example.test/api/visit', { method: 'POST', headers: { 'Content-Type': type, Origin: origin, ...headers }, body: typeof data === 'string' ? data : JSON.stringify(data) });
  return { request, url: new URL(request.url), clientAddress: ip };
}
const valid = { name: 'Проверка формы', phone: '8 (900) 000-00-02', consent: true };
test('Visit API rejects cross-origin, invalid, excessive and bot submissions without saving', async () => {
  assert.equal((await POST(context(valid, { origin: 'https://other.test' }))).status, 403);
  assert.equal((await POST(context({ ...valid, consent: false }))).status, 422);
  assert.equal((await POST(context({ ...valid, name: '<script>bad</script>' }))).status, 422);
  assert.equal((await POST(context({ ...valid, website: 'spam' }))).status, 400);
  assert.equal((await POST(context('{broken'))).status, 400);
  assert.equal((await POST(context('x'.repeat(8193)))).status, 413);
  assert.equal((await POST(context('hello', { type: 'text/plain' }))).status, 415);
  assert.equal(listVisits().items.length, 0);
  assert.equal(ALL().status, 405);
});
test('Success is returned after the database insert; normalized phone and consent version persist', async () => {
  const key = randomUUID();
  const response = await POST(context(valid, { headers: { 'Idempotency-Key': key } }));
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.ok, true);
  const item = listVisits().items.find(row => row.id === body.id);
  assert.equal(item.phone, '+79000000002');
  assert.ok(item.consent_version);
  assert.equal((await POST(context(valid, { headers: { 'Idempotency-Key': key } }))).status, 200);
  assert.equal(listVisits().items.length, 1);
});
test('Visit API rate limits repeated requests', async () => {
  const data = { ...valid, phone: '+79000000003' };
  for (let i = 0; i < 3; i++) assert.equal((await POST(context(data, { ip: 'rate-test' }))).status, 201);
  const response = await POST(context(data, { ip: 'rate-test' }));
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get('Retry-After')) > 0);
});
test('Forwarded IP is trusted only with explicit opt-in and an actual local reverse proxy', () => {
  const headers = new Headers({ 'X-Real-IP': '192.0.2.10' });
  assert.equal(visitClientAddress('127.0.0.1', headers, false), '127.0.0.1');
  assert.equal(visitClientAddress('192.0.2.20', headers, true), '192.0.2.20');
  assert.equal(visitClientAddress('127.0.0.1', headers, true), '192.0.2.10');
  assert.equal(visitClientAddress('127.0.0.1', new Headers({ 'X-Real-IP': '1.2.3.4, 2.3.4.5' }), true), '127.0.0.1');
});
test('Storage failure cannot return a success response', () => {
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
    import {POST} from './src/pages/api/visit.ts';
    const request=new Request('https://example.test/api/visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(${JSON.stringify(valid)})});
    const response=await POST({request,url:new URL(request.url),clientAddress:'test'});
    console.log(JSON.stringify({status:response.status,body:await response.json()}));
  `], { encoding: 'utf8', env: { ...process.env, EL_BEBE_PRIVATE_DB: join(process.cwd(), 'public', 'forbidden.sqlite') }, stdio: ['ignore', 'pipe', 'pipe'] });
  const result = JSON.parse(output.trim());
  assert.equal(result.status, 500);
  assert.equal(result.body.ok, false);
});
