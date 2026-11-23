// The test page for vm.browser.ts: the Editor's pinned VM with the built extension registered, driven one frame at a
// time. Records arrive on the runtime as a runner would receive them.
declare const EditorRuntime: any;

type Block = Record<string, unknown>;

const text = (value: string) => [1, [10, value]];
const number = (value: number) => [1, [4, String(value)]];

/** Builds a sprite's blocks from scripts written as [id, block] pairs; next and parent links are filled in. */
const script = (x: number, ...stack: Array<[string, Block]>): Record<string, Block> => {
  const blocks: Record<string, Block> = {};
  stack.forEach(([id, block], index) => {
    blocks[id] = {
      fields: {},
      inputs: {},
      shadow: false,
      ...block,
      next: stack[index + 1]?.[0] ?? null,
      parent: index === 0 ? null : stack[index - 1]![0],
      topLevel: index === 0,
      ...(index === 0 ? {x, y: 0} : {})
    };
  });
  return blocks;
};
const child = (parent: string, block: Block): Block => ({
  fields: {}, inputs: {}, shadow: false, next: null, topLevel: false, parent, ...block
});
const listMenu = (parent: string, name: string): Block => ({
  opcode: 'kubohiroyatest_menu_lists', fields: {lists: [name, null]}, inputs: {}, shadow: true, next: null, topLevel: false, parent
});
const variable = (name: string) => [3, [12, name, `${name}Id`], [10, '']];

const project = () => ({
  meta: {semver: '3.0.0', vm: '0.2.0', agent: ''},
  extensions: ['kubohiroyatest'],
  monitors: [],
  targets: [
    {
      isStage: true, name: 'Stage', variables: {}, lists: {}, broadcasts: {goId: 'go'}, blocks: {}, comments: {},
      currentCostume: 0, costumes: [], sounds: [], volume: 100, layerOrder: 0
    },
    {
      isStage: false, name: 'Sprite1',
      variables: {ranId: ['ran', 0], countId: ['count', 0], afterId: ['after', 0]},
      lists: {scenesId: ['scenes', ['a', 'b']], expectedId: ['expected', ['a', 'b']], otherId: ['other', ['a', 1]]},
      broadcasts: {}, comments: {}, currentCostume: 0, costumes: [], sounds: [], volume: 100, layerOrder: 1,
      visible: true, x: 0, y: 0, size: 100, direction: 90, draggable: false, rotationStyle: 'all around',
      blocks: {
        ...script(0,
          ['flag', {opcode: 'event_whenflagclicked'}],
          ['flagSet', {opcode: 'data_changevariableby', fields: {VARIABLE: ['count', 'countId']}, inputs: {VALUE: number(100)}}]),
        ...script(200,
          ['passTest', {opcode: 'kubohiroyatest_whentest', inputs: {NAME: text('passes')}}],
          ['ranSet', {opcode: 'data_setvariableto', fields: {VARIABLE: ['ran', 'ranId']}, inputs: {VALUE: text('1')}}],
          ['strictPass', {opcode: 'kubohiroyatest_assert_strict_equals', inputs: {ACTUAL: text('a'), EXPECTED: text('a')}}],
          ['looseCheck', {opcode: 'kubohiroyatest_assert_equals', inputs: {ACTUAL: text('ABC'), EXPECTED: text('abc')}}],
          ['listPass', {opcode: 'kubohiroyatest_assert_list_equals', inputs: {ACTUAL: [1, 'listPassA'], EXPECTED: [1, 'listPassB']}}],
          ['framesBefore', {opcode: 'kubohiroyatest_assert_true', inputs: {CONDITION: [2, 'framesBeforeEq']}}],
          ['advance', {opcode: 'kubohiroyatest_step_frames', inputs: {FRAMES: number(3)}}],
          ['framesAfter', {opcode: 'kubohiroyatest_assert_true', inputs: {CONDITION: [2, 'framesAfterEq']}}]),
        listPassA: listMenu('listPass', 'scenes'),
        listPassB: listMenu('listPass', 'expected'),
        framesBeforeEq: child('framesBefore', {opcode: 'operator_equals', inputs: {OPERAND1: text('1'), OPERAND2: text('1')}}),
        framesAfterEq: child('framesAfter', {opcode: 'operator_equals', inputs: {OPERAND1: text('1'), OPERAND2: text('1')}}),
        ...script(400,
          ['failTest', {opcode: 'kubohiroyatest_whentest', inputs: {NAME: text('fails')}}],
          ['strictFail', {opcode: 'kubohiroyatest_assert_strict_equals', inputs: {ACTUAL: text('ABC'), EXPECTED: text('abc')}}],
          ['afterSet', {opcode: 'data_setvariableto', fields: {VARIABLE: ['after', 'afterId']}, inputs: {VALUE: text('1')}}]),
        ...script(600,
          ['listFailTest', {opcode: 'kubohiroyatest_whentest', inputs: {NAME: text('lists differ')}}],
          ['listFail', {opcode: 'kubohiroyatest_assert_list_equals', inputs: {ACTUAL: [1, 'listFailA'], EXPECTED: [1, 'listFailB']}}]),
        listFailA: listMenu('listFail', 'scenes'),
        listFailB: listMenu('listFail', 'other'),
        ...script(800,
          ['goReceived', {opcode: 'event_whenbroadcastreceived', fields: {BROADCAST_OPTION: ['go', 'goId']}}],
          ['loop', {opcode: 'control_forever', inputs: {SUBSTACK: [2, 'increment']}}]),
        increment: child('loop', {opcode: 'data_changevariableby', fields: {VARIABLE: ['count', 'countId']}, inputs: {VALUE: number(1)}}),
        ...script(1000,
          ['eventuallyTest', {opcode: 'kubohiroyatest_whentest', inputs: {NAME: text('eventually')}}],
          ['reset', {opcode: 'data_setvariableto', fields: {VARIABLE: ['count', 'countId']}, inputs: {VALUE: text('0')}}],
          ['broadcast', {opcode: 'event_broadcast', inputs: {BROADCAST_INPUT: [1, [11, 'go', 'goId']]}}],
          ['eventually', {opcode: 'kubohiroyatest_assert_eventually', inputs: {CONDITION: [2, 'countAbove'], FRAMES: number(10)}}],
          ['waitShort', {opcode: 'kubohiroyatest_wait_until_bounded', inputs: {CONDITION: [2, 'countNever'], FRAMES: number(2)}}]),
        countAbove: child('eventually', {opcode: 'operator_gt', inputs: {OPERAND1: variable('count'), OPERAND2: text('2')}}),
        // count only grows after the reset, so this never comes true.
        countNever: child('waitShort', {opcode: 'operator_lt', inputs: {OPERAND1: variable('count'), OPERAND2: text('0')}})
      }
    }
  ]
});

(globalThis as any).setup = async ({compiler}: {compiler: boolean}) => {
  const host = await EditorRuntime.start(document.getElementById('workspace'), {locale: 'en'});
  const vm = host.vm;
  const registered: any[] = [];
  (globalThis as any).Scratch = {
    ...EditorRuntime.vmModules.ScratchCommon,
    translate: Object.assign((message: string) => message, {setup: () => undefined}),
    extensions: {unsandboxed: true, register: (extension: unknown) => registered.push(extension)},
    vm
  };
  // @ts-expect-error The bundle is a classic script with no types; importing it runs it.
  await import('../../dist/turbowarp-test.js');
  host.registerExtension(registered[0]);
  await host.loadProject(project());
  vm.setCompilerOptions({enabled: compiler});
  const records: any[] = [];
  vm.runtime.on('KUBOHIROYATEST_ASSERTION', (record: unknown) => records.push(record));
  const sprite = vm.runtime.targets.find((target: any) => !target.isStage && target.isOriginal);
  const step = (frames: number) => {
    for (let frame = 0; frame < frames; frame++) vm.runtime._step();
  };
  const value = (name: string) => sprite.lookupVariableByNameAndType(name, '').value;
  (globalThis as any).harness = {
    records: () => records.map(record => ({...record})),
    clear: () => records.splice(0),
    greenFlag: () => vm.greenFlag(),
    run: (topBlockId: string) => vm.runtime.toggleScript(topBlockId, {target: sprite}),
    step,
    value,
    spriteId: sprite.id,
    running: () => vm.runtime.threads.length
  };
};
