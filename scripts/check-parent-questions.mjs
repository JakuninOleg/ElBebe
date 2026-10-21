import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const dataUrl = new URL('../src/data/el-bebe.ts', import.meta.url).href;
const source = (await readFile(new URL('../src/lib/parent-questions.ts', import.meta.url), 'utf8'))
  .replace("'../data/el-bebe'", JSON.stringify(dataUrl));
const { getParentQuestions } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`);

const starter = getParentQuestions([
  { id: 'current-conditions', question: 'Как узнать стоимость и подходящий режим?', answer: 'Уточните действующие условия при обращении: формат посещения, часы, стоимость и состав оплаты.' },
  { id: 'old-camera-record', question: 'Есть ли в саду видеонаблюдение?', answer: 'Да, в Эльбэби установлены камеры. При знакомстве расскажем, как организовано видеонаблюдение и какие правила действуют в саду.' },
]);
assert.equal(starter.length, 9);
assert.equal(new Set(starter.map(item => item.id)).size, starter.length);
assert.match(starter.find(item => item.id === 'price').answer, /Питание и все занятия/);
assert.match(starter.find(item => item.id === 'cameras').answer, /видеонаблюдение онлайн/);
assert.match(starter.find(item => item.id === 'hours').answer, /24\/7/);

const editedAnswer = 'Ответ, который редактор самостоятельно согласовал с детским садом.';
const edited = getParentQuestions([{ id: 'current-conditions', question: 'Как узнать стоимость и подходящий режим?', answer: editedAnswer }]);
assert.equal(edited.find(item => item.id === 'price').answer, editedAnswer);
assert.equal(edited.find(item => item.id === 'price').link.href, '/stoimost/');
const custom = getParentQuestions([{ id: 'custom', question: 'Другой вопрос родителей', answer: editedAnswer }]);
assert.equal(custom[0].id, 'custom');
assert.equal(custom[0].answer, editedAnswer);
console.log('FAQ: starter answers updated; aliases deduplicated; editor answers and custom questions preserved.');
