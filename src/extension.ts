import {extensionConfig} from './config.js';
import definitions from './block-definitions.json';
import {closeTo, frameCount, listsEqual, scratchEqual, strictlyEqual} from './checks.js';
import {ASSERTION_EVENT} from './protocol.js';
import type {AssertionKind, AssertionRecord} from './protocol.js';

export interface TestRuntime {
  on(event: 'BEFORE_EXECUTE', listener: () => void): void;
  emit(event: string, record: AssertionRecord): void;
  getEditingTarget(): VariableOwner | null | undefined;
  getTargetForStage(): VariableOwner | null | undefined;
}

interface VariableOwner {
  variables: Record<string, {name: string; type: string}>;
}

export interface BlockUtil {
  target: {
    id: string;
    lookupVariableByNameAndType(name: string, type: 'list'): {value: unknown[]} | null | undefined;
  };
  thread: {topBlock: string; peekStack(): string | undefined; isCompiled?: boolean};
  stackFrame: Record<string, unknown>;
  yieldTick(): void;
  stopThisScript(): void;
}

type Args = Record<string, unknown>;

const blockTypes = {HAT: 'HAT', COMMAND: 'COMMAND'} as const;
const argumentTypes = {STRING: 'STRING', NUMBER: 'NUMBER', BOOLEAN: 'BOOLEAN'} as const;

export class TestExtension implements TurboWarpExtension {
  private frame = 0;

  public constructor(private readonly runtime: TestRuntime) {
    runtime.on('BEFORE_EXECUTE', () => {
      this.frame += 1;
    });
  }

  public getInfo(): Record<string, unknown> {
    return {
      id: extensionConfig.id,
      name: Scratch.translate(definitions.extensionName),
      docsURI: extensionConfig.docsURI,
      blockIconURI: extensionConfig.blockIconURI,
      color1: '#16a34a',
      color2: '#15803d',
      color3: '#166534',
      blocks: definitions.blocks.map((block) => ({
        opcode: block.opcode,
        blockType: Scratch.BlockType[blockTypes[block.blockType as keyof typeof blockTypes]],
        text: Scratch.translate(block.text),
        // The green flag and other events never start a test; only a runner or a click does.
        ...(block.blockType === 'HAT' ? {isEdgeActivated: false} : {}),
        arguments: Object.fromEntries(
          Object.entries(block.arguments).map(([name, argument]) => [
            name,
            {
              type: Scratch.ArgumentType[argumentTypes[argument.type as keyof typeof argumentTypes]],
              ...('defaultValue' in argument ? {defaultValue: argument.defaultValue} : {}),
              ...('menu' in argument ? {menu: argument.menu} : {})
            }
          ])
        )
      })),
      menus: {
        lists: {acceptReporters: false, items: 'listMenu'}
      }
    };
  }

  public listMenu(): Array<string | {text: string; value: string}> {
    const names = new Set<string>();
    for (const owner of [this.runtime.getTargetForStage(), this.runtime.getEditingTarget()]) {
      for (const variable of Object.values(owner?.variables ?? {})) {
        if (variable.type === 'list') names.add(variable.name);
      }
    }
    if (names.size === 0) return [{text: Scratch.translate('(no lists)'), value: ''}];
    return [...names].sort((left, right) => left.localeCompare(right));
  }

  public whentest(): boolean {
    return true;
  }

  public whensetup(): boolean {
    return true;
  }

  public assert_strict_equals(args: Args, util: BlockUtil): void {
    this.check(util, 'strict-equals', strictlyEqual(args.ACTUAL, args.EXPECTED), {
      actual: args.ACTUAL,
      expected: args.EXPECTED
    });
  }

  public assert_equals(args: Args, util: BlockUtil): void {
    this.check(util, 'equals', scratchEqual(Scratch.Cast, args.ACTUAL, args.EXPECTED), {
      actual: args.ACTUAL,
      expected: args.EXPECTED
    });
  }

  public assert_true(args: Args, util: BlockUtil): void {
    const actual = Scratch.Cast.toBoolean(args.CONDITION);
    this.check(util, 'true', actual, {actual, expected: true});
  }

  public assert_close(args: Args, util: BlockUtil): void {
    const actual = Scratch.Cast.toNumber(args.ACTUAL);
    const expected = Scratch.Cast.toNumber(args.EXPECTED);
    const tolerance = Scratch.Cast.toNumber(args.TOLERANCE);
    this.check(util, 'close', closeTo(actual, expected, tolerance), {actual, expected, tolerance});
  }

  public assert_list_equals(args: Args, util: BlockUtil): void {
    const names = [args.ACTUAL, args.EXPECTED].map((name) => Scratch.Cast.toString(name));
    const lists = names.map((name) => util.target.lookupVariableByNameAndType(name, 'list'));
    const [actual, expected] = lists;
    if (!actual || !expected) {
      const missing = names.filter((_, index) => !lists[index]);
      this.check(util, 'list-equals', false, {message: `No list named: ${missing.join(', ')}`});
      return;
    }
    this.check(util, 'list-equals', listsEqual(actual.value, expected.value), {
      actual: [...actual.value],
      expected: [...expected.value]
    });
  }

  public assert_eventually(args: Args, util: BlockUtil): void {
    this.awaitCondition('eventually', args, util);
  }

  public wait_until_bounded(args: Args, util: BlockUtil): void {
    this.awaitCondition('wait-until', args, util);
  }

  public step_frames(args: Args, util: BlockUtil): void {
    const state = util.stackFrame as {until?: number};
    state.until ??= this.frame + frameCount(Scratch.Cast, args.FRAMES);
    if (this.frame < state.until) util.yieldTick();
  }

  private awaitCondition(kind: AssertionKind, args: Args, util: BlockUtil): void {
    const state = util.stackFrame as {deadline?: number; started?: number};
    const frames = frameCount(Scratch.Cast, args.FRAMES);
    state.started ??= this.frame;
    state.deadline ??= this.frame + frames;
    const waited = this.frame - state.started;
    if (Scratch.Cast.toBoolean(args.CONDITION)) {
      // A wait that ends in time is not an assertion; only running out is reported.
      if (kind === 'eventually') this.check(util, kind, true, {actual: waited, expected: frames});
      return;
    }
    if (util.thread.isCompiled) {
      // A compiled script evaluates the inputs once, so the condition could never change here.
      this.check(util, kind, false, {
        actual: waited,
        expected: frames,
        message: 'The condition is checked again only in the interpreter. Run the test with the compiler off.'
      });
      return;
    }
    if (this.frame >= state.deadline) {
      this.check(util, kind, false, {actual: waited, expected: frames});
      return;
    }
    util.yieldTick();
  }

  private check(
    util: BlockUtil,
    kind: AssertionKind,
    passed: boolean,
    details: Pick<AssertionRecord, 'actual' | 'expected' | 'tolerance' | 'message'>
  ): void {
    const record: AssertionRecord = {
      kind,
      passed,
      blockId: util.thread.peekStack() ?? null,
      topBlockId: util.thread.topBlock ?? null,
      targetId: util.target.id ?? null,
      frame: this.frame,
      ...details
    };
    this.runtime.emit(ASSERTION_EVENT, record);
    if (!passed) util.stopThisScript();
  }
}
