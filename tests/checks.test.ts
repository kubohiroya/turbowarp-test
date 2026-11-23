import {describe, expect, it} from 'vitest';
import {closeTo, frameCount, listsEqual, scratchEqual, strictlyEqual} from '../src/checks.js';
import {cast} from './helpers.js';

describe('checks', () => {
  it('=== tells types and case apart', () => {
    expect(strictlyEqual('3', '3')).toBe(true);
    expect(strictlyEqual('1', 1)).toBe(false);
    expect(strictlyEqual('1', '1.0')).toBe(false);
    expect(strictlyEqual('ABC', 'abc')).toBe(false);
  });

  it("equals follows Scratch's =", () => {
    expect(scratchEqual(cast, '1', '1.0')).toBe(true);
    expect(scratchEqual(cast, 'ABC', 'abc')).toBe(true);
    expect(scratchEqual(cast, '1', 1)).toBe(true);
    expect(scratchEqual(cast, 'a', 'b')).toBe(false);
  });

  it('compares numbers within a tolerance', () => {
    expect(closeTo(0.1 + 0.2, 0.3, 1e-9)).toBe(true);
    expect(closeTo(1, 1.5, 0.4)).toBe(false);
    expect(closeTo(1, 1.5, -0.5)).toBe(true);
    expect(closeTo(Number.NaN, 0, 1)).toBe(false);
  });

  it('compares lists item by item with ===', () => {
    expect(listsEqual(['a', 1], ['a', 1])).toBe(true);
    expect(listsEqual(['1'], [1])).toBe(false);
    expect(listsEqual(['a'], ['a', 'b'])).toBe(false);
    expect(listsEqual([], [])).toBe(true);
  });

  it.each([
    ['3', 3],
    [2.9, 2],
    [-1, 0],
    ['abc', 0],
    [Infinity, 0]
  ])('reads %s as %i frames', (value, frames) => {
    expect(frameCount(cast, value)).toBe(frames);
  });
});
