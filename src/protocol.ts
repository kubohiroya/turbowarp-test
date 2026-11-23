/**
 * What the extension tells a test runner. Every assertion block, and a bounded wait that runs out,
 * emits one record on the VM runtime under this event name. The runner of TurboWarp Plus Editor and
 * `sb3-toolchain test run` listen for it; without a listener the records go nowhere.
 */
export const ASSERTION_EVENT = 'KUBOHIROYATEST_ASSERTION';

export type AssertionKind =
  | 'strict-equals'
  | 'equals'
  | 'true'
  | 'close'
  | 'list-equals'
  | 'eventually'
  | 'wait-until';

export interface AssertionRecord {
  kind: AssertionKind;
  passed: boolean;
  /** The assertion block. */
  blockId: string | null;
  /** The top block of the script, the test hat when a runner started it. */
  topBlockId: string | null;
  targetId: string | null;
  /** Frames the runtime has stepped since the extension loaded. */
  frame: number;
  actual?: unknown;
  expected?: unknown;
  tolerance?: number;
  /** Why the check could not be made, such as a missing list. */
  message?: string;
}
