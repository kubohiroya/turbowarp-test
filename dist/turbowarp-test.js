// Name: TurboWarp-Test
// ID: kubohiroyatest
// Description: Test hats and assertion blocks for regression tests written inside TurboWarp Plus Editor projects.
// By: Hiroya Kubo
// License: MPL-2.0

(function (Scratch) {
  'use strict';

//#region src/config.ts
var extensionConfig = {
	id: "kubohiroyatest",
	slug: "turbowarp-test",
	name: "TurboWarp-Test",
	description: "Test hats and assertion blocks for regression tests written inside TurboWarp Plus Editor projects.",
	author: "Hiroya Kubo",
	license: "MPL-2.0",
	unsandboxed: true,
	docsURI: "https://kubohiroya.github.io/turbowarp-test/",
	blockIconURI: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+CiAgPHJlY3QgeD0iNCIgeT0iOCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0iIzE2YTM0YSIvPgogIDxwYXRoIGQ9Ik0xNCAyNC41bDcgNyAxMy0xNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjQuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo="
};
var block_definitions_default = {
	extensionName: "Test",
	blocks: [
		{
			"opcode": "whentest",
			"blockType": "HAT",
			"text": "test [NAME]",
			"description": "Starts one test. The green flag never starts it: the test runner of TurboWarp Plus Editor does, or you click the script. NAME is only for display; tools address the test by its target and block ID.",
			"arguments": { "NAME": {
				"type": "STRING",
				"defaultValue": "my test"
			} }
		},
		{
			"opcode": "whensetup",
			"blockType": "HAT",
			"text": "before each test",
			"description": "Runs before every test, after the runner has restored the project. Use at most one per sprite or stage. The green flag never starts it.",
			"arguments": {}
		},
		{
			"opcode": "assert_strict_equals",
			"blockType": "COMMAND",
			"text": "check [ACTUAL] === [EXPECTED]",
			"description": "Passes when the two values are identical, type included, as JavaScript's === compares them: the text \"1\" does not equal the number 1, and \"ABC\" does not equal \"abc\". A failure stops this script.",
			"arguments": {
				"ACTUAL": {
					"type": "STRING",
					"defaultValue": ""
				},
				"EXPECTED": {
					"type": "STRING",
					"defaultValue": ""
				}
			}
		},
		{
			"opcode": "assert_equals",
			"blockType": "COMMAND",
			"text": "check [ACTUAL] equals [EXPECTED]",
			"description": "Passes when Scratch's = operator says the two values are equal: case is ignored and numbers are compared as numbers, so \"1\" equals \"1.0\" and \"ABC\" equals \"abc\". A failure stops this script.",
			"arguments": {
				"ACTUAL": {
					"type": "STRING",
					"defaultValue": ""
				},
				"EXPECTED": {
					"type": "STRING",
					"defaultValue": ""
				}
			}
		},
		{
			"opcode": "assert_true",
			"blockType": "COMMAND",
			"text": "check [CONDITION] is true",
			"description": "Passes when the condition is true. An empty slot is false. A failure stops this script.",
			"arguments": { "CONDITION": { "type": "BOOLEAN" } }
		},
		{
			"opcode": "assert_close",
			"blockType": "COMMAND",
			"text": "check [ACTUAL] is within [TOLERANCE] of [EXPECTED]",
			"description": "Passes when the two values, read as numbers, differ by at most the tolerance. Use it for positions, speeds and other results of floating-point arithmetic. A failure stops this script.",
			"arguments": {
				"ACTUAL": {
					"type": "NUMBER",
					"defaultValue": 0
				},
				"TOLERANCE": {
					"type": "NUMBER",
					"defaultValue": .001
				},
				"EXPECTED": {
					"type": "NUMBER",
					"defaultValue": 0
				}
			}
		},
		{
			"opcode": "assert_list_equals",
			"blockType": "COMMAND",
			"text": "check list [ACTUAL] equals list [EXPECTED]",
			"description": "Passes when the two lists have the same length and every item is identical (===) to the item in the same place. A failure stops this script.",
			"arguments": {
				"ACTUAL": {
					"type": "STRING",
					"menu": "lists"
				},
				"EXPECTED": {
					"type": "STRING",
					"menu": "lists"
				}
			}
		},
		{
			"opcode": "assert_eventually",
			"blockType": "COMMAND",
			"text": "check [CONDITION] becomes true within [FRAMES] frames",
			"description": "Checks the condition once in each frame and passes as soon as it is true. Fails when it is still false after the given number of frames. It counts frames, not seconds, so the result does not depend on the speed of the computer. The condition is checked again only when the script runs in the interpreter, as the test runner runs it; in a compiled script the block fails and says so. A failure stops this script.",
			"arguments": {
				"CONDITION": { "type": "BOOLEAN" },
				"FRAMES": {
					"type": "NUMBER",
					"defaultValue": 30
				}
			}
		},
		{
			"opcode": "step_frames",
			"blockType": "COMMAND",
			"text": "advance [FRAMES] frames",
			"description": "Waits for the given number of frames, so that other scripts, motion and clones move on. It counts frames, not seconds.",
			"arguments": { "FRAMES": {
				"type": "NUMBER",
				"defaultValue": 1
			} }
		},
		{
			"opcode": "wait_until_bounded",
			"blockType": "COMMAND",
			"text": "wait until [CONDITION] (at most [FRAMES] frames)",
			"description": "Waits until the condition is true, checking it once in each frame. Waiting longer than the given number of frames is a test failure and stops this script. As with the eventually check, the condition is checked again only in the interpreter.",
			"arguments": {
				"CONDITION": { "type": "BOOLEAN" },
				"FRAMES": {
					"type": "NUMBER",
					"defaultValue": 30
				}
			}
		}
	],
	menus: { "lists": { "acceptReporters": false } }
};
//#endregion
//#region src/checks.ts
/** JavaScript's ===. */
function strictlyEqual(actual, expected) {
	return actual === expected;
}
/** Scratch's = operator: case-insensitive, and numeric when both sides read as numbers. */
function scratchEqual(cast, actual, expected) {
	return cast.compare(actual, expected) === 0;
}
/** Whether two numbers differ by at most the tolerance. NaN never passes. */
function closeTo(actual, expected, tolerance) {
	return Math.abs(actual - expected) <= Math.abs(tolerance);
}
/** Same length, and every item === the item in the same place. */
function listsEqual(actual, expected) {
	return actual.length === expected.length && actual.every((item, index) => item === expected[index]);
}
/** A frame count from a block input: a whole number, at least 0. */
function frameCount(cast, value) {
	const frames = Math.floor(cast.toNumber(value));
	return Number.isFinite(frames) && frames > 0 ? frames : 0;
}
//#endregion
//#region src/protocol.ts
/**
* What the extension tells a test runner. Every assertion block, and a bounded wait that runs out,
* emits one record on the VM runtime under this event name. The runner of TurboWarp Plus Editor and
* `sb3-toolchain test run` listen for it; without a listener the records go nowhere.
*/
var ASSERTION_EVENT = "KUBOHIROYATEST_ASSERTION";
//#endregion
//#region src/extension.ts
var blockTypes = {
	HAT: "HAT",
	COMMAND: "COMMAND"
};
var argumentTypes = {
	STRING: "STRING",
	NUMBER: "NUMBER",
	BOOLEAN: "BOOLEAN"
};
var TestExtension = class {
	constructor(runtime) {
		this.runtime = runtime;
		this.frame = 0;
		runtime.on("BEFORE_EXECUTE", () => {
			this.frame += 1;
		});
	}
	getInfo() {
		return {
			id: extensionConfig.id,
			name: Scratch.translate(block_definitions_default.extensionName),
			docsURI: extensionConfig.docsURI,
			blockIconURI: extensionConfig.blockIconURI,
			color1: "#16a34a",
			color2: "#15803d",
			color3: "#166534",
			blocks: block_definitions_default.blocks.map((block) => ({
				opcode: block.opcode,
				blockType: Scratch.BlockType[blockTypes[block.blockType]],
				text: Scratch.translate(block.text),
				...block.blockType === "HAT" ? { isEdgeActivated: false } : {},
				arguments: Object.fromEntries(Object.entries(block.arguments).map(([name, argument]) => [name, {
					type: Scratch.ArgumentType[argumentTypes[argument.type]],
					..."defaultValue" in argument ? { defaultValue: argument.defaultValue } : {},
					..."menu" in argument ? { menu: argument.menu } : {}
				}]))
			})),
			menus: { lists: {
				acceptReporters: false,
				items: "listMenu"
			} }
		};
	}
	listMenu() {
		const names = /* @__PURE__ */ new Set();
		for (const owner of [this.runtime.getTargetForStage(), this.runtime.getEditingTarget()]) for (const variable of Object.values(owner?.variables ?? {})) if (variable.type === "list") names.add(variable.name);
		if (names.size === 0) return [{
			text: Scratch.translate("(no lists)"),
			value: ""
		}];
		return [...names].sort((left, right) => left.localeCompare(right));
	}
	whentest() {
		return true;
	}
	whensetup() {
		return true;
	}
	assert_strict_equals(args, util) {
		this.check(util, "strict-equals", strictlyEqual(args.ACTUAL, args.EXPECTED), {
			actual: args.ACTUAL,
			expected: args.EXPECTED
		});
	}
	assert_equals(args, util) {
		this.check(util, "equals", scratchEqual(Scratch.Cast, args.ACTUAL, args.EXPECTED), {
			actual: args.ACTUAL,
			expected: args.EXPECTED
		});
	}
	assert_true(args, util) {
		const actual = Scratch.Cast.toBoolean(args.CONDITION);
		this.check(util, "true", actual, {
			actual,
			expected: true
		});
	}
	assert_close(args, util) {
		const actual = Scratch.Cast.toNumber(args.ACTUAL);
		const expected = Scratch.Cast.toNumber(args.EXPECTED);
		const tolerance = Scratch.Cast.toNumber(args.TOLERANCE);
		this.check(util, "close", closeTo(actual, expected, tolerance), {
			actual,
			expected,
			tolerance
		});
	}
	assert_list_equals(args, util) {
		const names = [args.ACTUAL, args.EXPECTED].map((name) => Scratch.Cast.toString(name));
		const lists = names.map((name) => util.target.lookupVariableByNameAndType(name, "list"));
		const [actual, expected] = lists;
		if (!actual || !expected) {
			const missing = names.filter((_, index) => !lists[index]);
			this.check(util, "list-equals", false, { message: `No list named: ${missing.join(", ")}` });
			return;
		}
		this.check(util, "list-equals", listsEqual(actual.value, expected.value), {
			actual: [...actual.value],
			expected: [...expected.value]
		});
	}
	assert_eventually(args, util) {
		this.awaitCondition("eventually", args, util);
	}
	wait_until_bounded(args, util) {
		this.awaitCondition("wait-until", args, util);
	}
	step_frames(args, util) {
		const state = util.stackFrame;
		state.until ?? (state.until = this.frame + frameCount(Scratch.Cast, args.FRAMES));
		if (this.frame < state.until) util.yieldTick();
	}
	awaitCondition(kind, args, util) {
		const state = util.stackFrame;
		const frames = frameCount(Scratch.Cast, args.FRAMES);
		state.started ?? (state.started = this.frame);
		state.deadline ?? (state.deadline = this.frame + frames);
		const waited = this.frame - state.started;
		if (Scratch.Cast.toBoolean(args.CONDITION)) {
			if (kind === "eventually") this.check(util, kind, true, {
				actual: waited,
				expected: frames
			});
			return;
		}
		if (util.thread.isCompiled) {
			this.check(util, kind, false, {
				actual: waited,
				expected: frames,
				message: "The condition is checked again only in the interpreter. Run the test with the compiler off."
			});
			return;
		}
		if (this.frame >= state.deadline) {
			this.check(util, kind, false, {
				actual: waited,
				expected: frames
			});
			return;
		}
		util.yieldTick();
	}
	check(util, kind, passed, details) {
		const record = {
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
};
//#endregion
//#region src/index.ts
if (!Scratch.extensions.unsandboxed || !Scratch.vm) throw new Error("TurboWarp-Test must run unsandboxed.");
Scratch.translate.setup({ ja: {
	_Test: "テスト",
	"_test [NAME]": "テスト [NAME]",
	"_before each test": "テストの前に",
	"_check [ACTUAL] === [EXPECTED]": "[ACTUAL] が [EXPECTED] と === で等しいことを確かめる",
	"_check [ACTUAL] equals [EXPECTED]": "[ACTUAL] が [EXPECTED] と（Scratch の = で）等しいことを確かめる",
	"_check [CONDITION] is true": "[CONDITION] であることを確かめる",
	"_check [ACTUAL] is within [TOLERANCE] of [EXPECTED]": "[ACTUAL] が [EXPECTED] と誤差 [TOLERANCE] 以内で等しいことを確かめる",
	"_check list [ACTUAL] equals list [EXPECTED]": "リスト [ACTUAL] がリスト [EXPECTED] と等しいことを確かめる",
	"_check [CONDITION] becomes true within [FRAMES] frames": "[FRAMES] フレーム以内に [CONDITION] になることを確かめる",
	"_advance [FRAMES] frames": "[FRAMES] フレーム進める",
	"_wait until [CONDITION] (at most [FRAMES] frames)": "[CONDITION] になるまで待つ（最大 [FRAMES] フレーム）",
	"_(no lists)": "（リストがありません）"
} });
Scratch.extensions.register(new TestExtension(Scratch.vm.runtime));
//#endregion

})(Scratch);
