// The extension in the Editor's pinned VM: what the green flag starts, what each check reports, and how waits count
// frames, in the interpreter (as the runner runs tests) and in compiled scripts.
import assert from 'node:assert/strict';
import {after, before, test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {chromium, type Browser, type Page} from '@playwright/test';
import {serveEditorRuntime} from '@kubohiroya/turbowarp-plus-editor-test-runtime';

let server: Awaited<ReturnType<typeof serveEditorRuntime>>;
let browser: Browser;
before(async () => {
  server = await serveEditorRuntime({script: fileURLToPath(new URL('./browser/vm.page.ts', import.meta.url))});
  browser = await chromium.launch(process.env.TWPE_CHROME_EXECUTABLE ? {executablePath: process.env.TWPE_CHROME_EXECUTABLE} : {});
});
after(async () => {
  await browser?.close();
  await server?.close();
});

const open = async (compiler: boolean): Promise<{page: Page; errors: string[]}> => {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(server.url);
  await page.evaluate((options) => (globalThis as any).setup(options), {compiler});
  return {page, errors};
};
const h = (page: Page, code: string): Promise<any> => page.evaluate(`(() => { const h = globalThis.harness; return ${code}; })()`);
const summary = (records: any[]) => records.map((record) => [record.blockId, record.kind, record.passed]);

test('the green flag starts no test or setup hat', async () => {
  const {page, errors} = await open(false);
  await h(page, 'h.greenFlag()');
  await h(page, 'h.step(5)');
  assert.equal(await h(page, 'h.value("count")'), 100, 'the green flag script ran');
  assert.equal(await h(page, 'h.value("ran")'), 0, 'no test ran');
  assert.deepEqual(await h(page, 'h.records()'), []);
  assert.deepEqual(errors, []);
});

for (const compiler of [false, true]) {
  const mode = compiler ? 'compiled' : 'interpreted';

  test(`a passing test reports each check with its block and test hat (${mode})`, async () => {
    const {page, errors} = await open(compiler);
    await h(page, 'h.run("passTest")');
    await h(page, 'h.step(10)');
    const records = await h(page, 'h.records()');
    assert.deepEqual(summary(records), [
      ['strictPass', 'strict-equals', true],
      ['looseCheck', 'equals', true],
      ['listPass', 'list-equals', true],
      ['framesBefore', 'true', true],
      ['framesAfter', 'true', true]
    ]);
    assert.ok(records.every((record: any) => record.topBlockId === 'passTest'));
    assert.ok(records.every((record: any) => record.targetId === records[0].targetId && record.targetId));
    assert.equal(records[4].frame - records[3].frame, 3, 'advance 3 frames waits three frames');
    assert.deepEqual(errors, []);
  });

  test(`a failing check reports its values and stops the script (${mode})`, async () => {
    const {page, errors} = await open(compiler);
    await h(page, 'h.run("failTest")');
    await h(page, 'h.step(3)');
    await h(page, 'h.run("listFailTest")');
    await h(page, 'h.step(3)');
    const records = await h(page, 'h.records()');
    assert.deepEqual(summary(records), [
      ['strictFail', 'strict-equals', false],
      ['listFail', 'list-equals', false]
    ]);
    assert.deepEqual([records[0].actual, records[0].expected], ['ABC', 'abc']);
    assert.deepEqual([records[1].actual, records[1].expected], [['a', 'b'], ['a', 1]]);
    assert.equal(await h(page, 'h.value("after")'), 0, 'the block after the failure did not run');
    assert.equal(await h(page, 'h.running()'), 0);
    assert.deepEqual(errors, []);
  });
}

test('waits check their condition once in each frame and fail when the frames run out (interpreted)', async () => {
  const {page, errors} = await open(false);
  await h(page, 'h.run("eventuallyTest")');
  await h(page, 'h.step(20)');
  const records = await h(page, 'h.records()');
  assert.deepEqual(summary(records), [
    ['eventually', 'eventually', true],
    ['waitShort', 'wait-until', false]
  ]);
  assert.ok(records[0].actual > 0 && records[0].actual <= 10, `waited ${records[0].actual} frames`);
  assert.equal(records[1].actual, 2);
  assert.equal(records[1].expected, 2);
  assert.deepEqual(errors, []);
});

test('a wait in a compiled script fails and says why instead of waiting on a value that cannot change', async () => {
  const {page, errors} = await open(true);
  await h(page, 'h.run("eventuallyTest")');
  await h(page, 'h.step(20)');
  const records = await h(page, 'h.records()');
  assert.deepEqual(summary(records), [['eventually', 'eventually', false]]);
  assert.match(records[0].message, /interpreter/);
  assert.deepEqual(errors, []);
});
