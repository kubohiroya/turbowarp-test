/** The comparisons behind the assertion blocks, without the VM. */

export interface ScratchCast {
  compare(left: unknown, right: unknown): number;
  toBoolean(value: unknown): boolean;
  toNumber(value: unknown): number;
}

/** JavaScript's ===. */
export function strictlyEqual(actual: unknown, expected: unknown): boolean {
  return actual === expected;
}

/** Scratch's = operator: case-insensitive, and numeric when both sides read as numbers. */
export function scratchEqual(cast: ScratchCast, actual: unknown, expected: unknown): boolean {
  return cast.compare(actual, expected) === 0;
}

/** Whether two numbers differ by at most the tolerance. NaN never passes. */
export function closeTo(actual: number, expected: number, tolerance: number): boolean {
  return Math.abs(actual - expected) <= Math.abs(tolerance);
}

/** Same length, and every item === the item in the same place. */
export function listsEqual(actual: readonly unknown[], expected: readonly unknown[]): boolean {
  return actual.length === expected.length && actual.every((item, index) => item === expected[index]);
}

/** A frame count from a block input: a whole number, at least 0. */
export function frameCount(cast: ScratchCast, value: unknown): number {
  const frames = Math.floor(cast.toNumber(value));
  return Number.isFinite(frames) && frames > 0 ? frames : 0;
}
