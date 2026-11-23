import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import definitions from '../src/block-definitions.json';
import {TestExtension} from '../src/extension.js';
import {fakeRuntime, fakeUtil, stubScratch} from './helpers.js';

beforeEach(stubScratch);
afterEach(() => vi.unstubAllGlobals());

describe('TestExtension', () => {
  it('declares every block, and hats that no event starts', () => {
    const info = new TestExtension(fakeRuntime()).getInfo() as {
      id: string;
      blocks: Array<{opcode: string; blockType: string; isEdgeActivated?: boolean}>;
      menus: Record<string, unknown>;
    };
    expect(info.id).toBe('kubohiroyatest');
    expect(info.blocks.map((block) => block.opcode)).toEqual(definitions.blocks.map((block) => block.opcode));
    const hats = info.blocks.filter((block) => block.blockType === 'hat');
    expect(hats.map((block) => block.opcode)).toEqual(['whentest', 'whensetup']);
    expect(hats.every((block) => block.isEdgeActivated === false)).toBe(true);
    expect(info.menus.lists).toEqual({acceptReporters: false, items: 'listMenu'});
  });

  it('offers the lists of the stage and the editing target', () => {
    const extension = new TestExtension(
      fakeRuntime({a: {name: 'scenes', type: 'list'}, b: {name: 'score', type: ''}, c: {name: 'expected', type: 'list'}})
    );
    expect(extension.listMenu()).toEqual(['expected', 'scenes']);
    expect(new TestExtension(fakeRuntime()).listMenu()).toEqual([{text: '(no lists)', value: ''}]);
  });

  it('records a passing assertion with its block and script', () => {
    const runtime = fakeRuntime();
    const util = fakeUtil();
    new TestExtension(runtime).assert_strict_equals({ACTUAL: 'a', EXPECTED: 'a'}, util);
    expect(runtime.records).toEqual([
      {kind: 'strict-equals', passed: true, blockId: 'assertion', topBlockId: 'hat', targetId: 'sprite', frame: 0, actual: 'a', expected: 'a'}
    ]);
    expect(util.stopped).toBe(false);
  });

  it('stops the script on the first failure', () => {
    const runtime = fakeRuntime();
    const util = fakeUtil();
    new TestExtension(runtime).assert_strict_equals({ACTUAL: '1', EXPECTED: 1}, util);
    expect(runtime.records[0]).toMatchObject({kind: 'strict-equals', passed: false, actual: '1', expected: 1});
    expect(util.stopped).toBe(true);
  });

  it("offers === and Scratch's = as two separate checks", () => {
    const runtime = fakeRuntime();
    const extension = new TestExtension(runtime);
    extension.assert_equals({ACTUAL: 'ABC', EXPECTED: 'abc'}, fakeUtil());
    extension.assert_strict_equals({ACTUAL: 'ABC', EXPECTED: 'abc'}, fakeUtil());
    expect(runtime.records.map((record) => [record.kind, record.passed])).toEqual([
      ['equals', true],
      ['strict-equals', false]
    ]);
  });

  it('checks truth, closeness and lists', () => {
    const runtime = fakeRuntime();
    const extension = new TestExtension(runtime);
    const lists = {scenes: ['a', 'b'], expected: ['a', 'b'], other: ['a']};
    extension.assert_true({CONDITION: true}, fakeUtil());
    extension.assert_true({CONDITION: ''}, fakeUtil());
    extension.assert_close({ACTUAL: '0.30000000000000004', EXPECTED: 0.3, TOLERANCE: 1e-9}, fakeUtil());
    extension.assert_list_equals({ACTUAL: 'scenes', EXPECTED: 'expected'}, fakeUtil({lists}));
    extension.assert_list_equals({ACTUAL: 'scenes', EXPECTED: 'other'}, fakeUtil({lists}));
    extension.assert_list_equals({ACTUAL: 'scenes', EXPECTED: 'gone'}, fakeUtil({lists}));
    expect(runtime.records.map((record) => [record.kind, record.passed])).toEqual([
      ['true', true],
      ['true', false],
      ['close', true],
      ['list-equals', true],
      ['list-equals', false],
      ['list-equals', false]
    ]);
    expect(runtime.records[5]).toMatchObject({message: 'No list named: gone'});
  });

  it('advances the given number of frames', () => {
    const runtime = fakeRuntime();
    const extension = new TestExtension(runtime);
    const util = fakeUtil();
    const run = () => {
      util.yielded = false;
      extension.step_frames({FRAMES: 2}, util);
      return util.yielded;
    };
    expect(run()).toBe(true);
    runtime.step();
    expect(run()).toBe(true);
    runtime.step();
    expect(run()).toBe(false);
  });

  it('passes eventually once the condition becomes true in time', () => {
    const runtime = fakeRuntime();
    const extension = new TestExtension(runtime);
    const util = fakeUtil();
    extension.assert_eventually({CONDITION: false, FRAMES: 3}, util);
    expect(util.yielded).toBe(true);
    runtime.step();
    extension.assert_eventually({CONDITION: true, FRAMES: 3}, util);
    expect(runtime.records).toEqual([expect.objectContaining({kind: 'eventually', passed: true, actual: 1, expected: 3})]);
  });

  it('fails eventually and the bounded wait when the frames run out', () => {
    for (const block of ['assert_eventually', 'wait_until_bounded'] as const) {
      const runtime = fakeRuntime();
      const extension = new TestExtension(runtime);
      const util = fakeUtil();
      for (let frame = 0; frame < 2; frame += 1) {
        extension[block]({CONDITION: false, FRAMES: 2}, util);
        runtime.step();
      }
      expect(runtime.records).toEqual([]);
      extension[block]({CONDITION: false, FRAMES: 2}, util);
      expect(runtime.records).toEqual([expect.objectContaining({passed: false, actual: 2, expected: 2})]);
      expect(util.stopped).toBe(true);
    }
  });

  it('reports nothing when a bounded wait ends in time', () => {
    const runtime = fakeRuntime();
    new TestExtension(runtime).wait_until_bounded({CONDITION: true, FRAMES: 1}, fakeUtil());
    expect(runtime.records).toEqual([]);
  });

  it('fails a wait in a compiled script instead of waiting on a condition that cannot change', () => {
    const runtime = fakeRuntime();
    const util = fakeUtil({isCompiled: true});
    new TestExtension(runtime).assert_eventually({CONDITION: false, FRAMES: 5}, util);
    expect(runtime.records[0]).toMatchObject({kind: 'eventually', passed: false});
    expect(runtime.records[0]?.message).toMatch(/interpreter/);
    expect(util.yielded).toBe(false);
    expect(util.stopped).toBe(true);
  });
});
