# TurboWarp-Test

<img src="assets/block-icon.svg" alt="" width="48" height="48">

English | [日本語](README.ja.md)

Write regression tests inside a TurboWarp Plus Editor project, as blocks. A test starts from its own hat, which the green flag never starts, and every check reports the block that failed to the test runner.

## What it does

- Adds a **test** hat and a **before each test** hat. Neither starts on the green flag or any other event, so tests stay inert in a released project.
- Adds five checks: `===` equality, Scratch's `=` equality, truth, closeness within a tolerance, and list equality, plus a check that a condition becomes true within a number of frames.
- Adds two ways to wait that count frames, not seconds, so tests give the same result on any computer.
- Reports every check as a structured record on the VM runtime. A failed check stops its script.

The test runner, the state restoration between tests and the failure markers live in TurboWarp Plus Editor ([turbowarp-plus-editor#774](https://github.com/kubohiroya/turbowarp-plus-editor/issues/774)). `sb3-toolchain build --strip-tests` leaves the tests out of a release.

## Requirements and safety

The extension must run **unsandboxed**: a check reports the ID of the block that failed, and the waits count the frames the runtime steps. It refuses to load in the sandbox. It makes no network requests and stores nothing.

The two waiting blocks check their condition again in each frame only in the interpreter, because a compiled script evaluates block inputs once. The runner of TurboWarp Plus Editor runs tests with the compiler off. In a compiled script a wait whose condition starts false fails and says so, instead of waiting on a value that cannot change.

## Load the extension

In TurboWarp Plus Editor, add it from the TurboWarp-Plus list under **Add Extension**. In another TurboWarp, choose **Add Extension → Custom Extension → URL**, enter `https://kubohiroya.github.io/turbowarp-test/dist/turbowarp-test.js` and run it without the sandbox.

The extension uses English or Japanese block labels according to TurboWarp's language.

## Runner contract

Each check emits one record on the VM runtime under the event `KUBOHIROYATEST_ASSERTION` (`src/protocol.ts`):

| Field | Meaning |
|---|---|
| `kind` | `strict-equals`, `equals`, `true`, `close`, `list-equals`, `eventually` or `wait-until` |
| `passed` | Whether the check passed |
| `blockId` | The check block |
| `topBlockId` | The top block of the script: the test hat when a runner started it |
| `targetId` | The sprite or stage |
| `frame` | Frames the runtime has stepped since the extension loaded |
| `actual`, `expected`, `tolerance` | The compared values, when there are any |
| `message` | Why the check could not be made, such as a missing list |

A bounded wait reports only when it runs out. Tools find tests by the opcodes `kubohiroyatest_whentest` and `kubohiroyatest_whensetup` and address them by target and block ID.

## Block reference

<!-- BEGIN GENERATED BLOCKS -->

### `test [NAME]`

Starts one test. The green flag never starts it: the test runner of TurboWarp Plus Editor does, or you click the script. NAME is only for display; tools address the test by its target and block ID.

| Property | Value |
|---|---|
| Type | Hat |
| Opcode | `whentest` |
| `NAME` | String, default: `my test` |

### `before each test`

Runs before every test, after the runner has restored the project. Use at most one per sprite or stage. The green flag never starts it.

| Property | Value |
|---|---|
| Type | Hat |
| Opcode | `whensetup` |

### `check [ACTUAL] === [EXPECTED]`

Passes when the two values are identical, type included, as JavaScript's === compares them: the text "1" does not equal the number 1, and "ABC" does not equal "abc". A failure stops this script.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `assert_strict_equals` |
| `ACTUAL` | String, default: `` |
| `EXPECTED` | String, default: `` |

### `check [ACTUAL] equals [EXPECTED]`

Passes when Scratch's = operator says the two values are equal: case is ignored and numbers are compared as numbers, so "1" equals "1.0" and "ABC" equals "abc". A failure stops this script.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `assert_equals` |
| `ACTUAL` | String, default: `` |
| `EXPECTED` | String, default: `` |

### `check [CONDITION] is true`

Passes when the condition is true. An empty slot is false. A failure stops this script.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `assert_true` |
| `CONDITION` | Boolean, default: `undefined` |

### `check [ACTUAL] is within [TOLERANCE] of [EXPECTED]`

Passes when the two values, read as numbers, differ by at most the tolerance. Use it for positions, speeds and other results of floating-point arithmetic. A failure stops this script.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `assert_close` |
| `ACTUAL` | Number, default: `0` |
| `TOLERANCE` | Number, default: `0.001` |
| `EXPECTED` | Number, default: `0` |

### `check list [ACTUAL] equals list [EXPECTED]`

Passes when the two lists have the same length and every item is identical (===) to the item in the same place. A failure stops this script.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `assert_list_equals` |
| `ACTUAL` | String, default: `undefined` |
| `EXPECTED` | String, default: `undefined` |

### `check [CONDITION] becomes true within [FRAMES] frames`

Checks the condition once in each frame and passes as soon as it is true. Fails when it is still false after the given number of frames. It counts frames, not seconds, so the result does not depend on the speed of the computer. The condition is checked again only when the script runs in the interpreter, as the test runner runs it; in a compiled script the block fails and says so. A failure stops this script.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `assert_eventually` |
| `CONDITION` | Boolean, default: `undefined` |
| `FRAMES` | Number, default: `30` |

### `advance [FRAMES] frames`

Waits for the given number of frames, so that other scripts, motion and clones move on. It counts frames, not seconds.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `step_frames` |
| `FRAMES` | Number, default: `1` |

### `wait until [CONDITION] (at most [FRAMES] frames)`

Waits until the condition is true, checking it once in each frame. Waiting longer than the given number of frames is a test failure and stops this script. As with the eventually check, the condition is checked again only in the interpreter.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `wait_until_bounded` |
| `CONDITION` | Boolean, default: `undefined` |
| `FRAMES` | Number, default: `30` |

<!-- END GENERATED BLOCKS -->

## Development

Requires Node.js >=24 and pnpm 11.28.8.

```bash
npm install --global corepack@latest
corepack enable
pnpm install --frozen-lockfile
pnpm run build
pnpm run test
pnpm run typecheck
pnpm run lint
```

`pnpm run docs` updates this block reference. `pnpm run docs:check` checks it without modifying it.
`pnpm run check:dist` rebuilds and compares the distribution files. `pnpm run check` runs the project checks.
Tests execute the generated bundle, so build before running tests from a clean checkout.

```bash
pnpm add --save-exact @kubohiroya/turbowarp-test@0.1.0
```

The build produces one self-contained `dist/turbowarp-test.js` and `dist/extension-manifest.json`.
The extension ID is `kubohiroyatest`; opcodes and argument IDs are saved-project compatibility contracts.

## Documentation

Read the [published block guide](https://kubohiroya.github.io/turbowarp-test/) or its [local source](docs/index.html).
Each block has the stable anchor `#block-<opcode>`. The extension's `docsURI` opens that guide.
See [the contribution guide](CONTRIBUTING.md) for verification and rollback.

## License

SPDX-License-Identifier: MPL-2.0. See [LICENSE](LICENSE).
