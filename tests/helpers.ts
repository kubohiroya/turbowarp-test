import {vi} from 'vitest';
import type {BlockUtil, TestRuntime} from '../src/extension.js';
import type {AssertionRecord} from '../src/protocol.js';

/** A Cast that follows scratch-vm's rules closely enough for the checks under test. */
export const cast = {
  toString: (value: unknown) => (value === null || value === undefined ? '' : String(value)),
  toNumber: (value: unknown) => {
    const number = Number(value);
    return Number.isNaN(number) ? 0 : number;
  },
  toBoolean: (value: unknown) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return !(value === '' || value === '0' || value.toLowerCase() === 'false');
    return Boolean(value);
  },
  compare: (left: unknown, right: unknown) => {
    const n1 = Number(left);
    const n2 = Number(right);
    const blank = (value: unknown) => typeof value === 'string' && value.trim() === '';
    if (Number.isNaN(n1) || Number.isNaN(n2) || blank(left) || blank(right) || n1 === 0 && left === '' || n2 === 0 && right === '') {
      const s1 = String(left).toLowerCase();
      const s2 = String(right).toLowerCase();
      return s1 < s2 ? -1 : s1 > s2 ? 1 : 0;
    }
    return n1 - n2;
  }
};

export function stubScratch(): void {
  vi.stubGlobal('Scratch', {
    BlockType: {HAT: 'hat', COMMAND: 'command'},
    ArgumentType: {STRING: 'string', NUMBER: 'number', BOOLEAN: 'Boolean'},
    Cast: cast,
    translate: vi.fn((message: string) => message)
  });
}

export interface FakeRuntime extends TestRuntime {
  records: AssertionRecord[];
  step(): void;
}

export function fakeRuntime(variables: Record<string, {name: string; type: string}> = {}): FakeRuntime {
  const listeners: Array<() => void> = [];
  const records: AssertionRecord[] = [];
  return {
    records,
    on: (_event, listener) => listeners.push(listener),
    emit: (_event, record) => records.push(record),
    getEditingTarget: () => ({variables}),
    getTargetForStage: () => ({variables: {}}),
    step: () => listeners.forEach((listener) => listener())
  };
}

export interface FakeUtil extends BlockUtil {
  stopped: boolean;
  yielded: boolean;
}

export function fakeUtil(
  {lists = {}, isCompiled = false}: {lists?: Record<string, unknown[]>; isCompiled?: boolean} = {}
): FakeUtil {
  const util: FakeUtil = {
    stopped: false,
    yielded: false,
    target: {
      id: 'sprite',
      lookupVariableByNameAndType: (name) => (name in lists ? {value: lists[name]!} : undefined)
    },
    thread: {topBlock: 'hat', peekStack: () => 'assertion', isCompiled},
    stackFrame: {},
    yieldTick: () => {
      util.yielded = true;
    },
    stopThisScript: () => {
      util.stopped = true;
    }
  };
  return util;
}
