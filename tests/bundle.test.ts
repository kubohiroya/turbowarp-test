import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {describe, expect, it} from 'vitest';
import definitions from '../src/block-definitions.json';
import {extensionConfig} from '../src/config.js';
import type {TestExtension} from '../src/extension.js';
import {ASSERTION_EVENT} from '../src/protocol.js';
import {cast, fakeRuntime, fakeUtil} from './helpers.js';

const bundle = readFileSync(new URL('../dist/turbowarp-test.js', import.meta.url), 'utf8');

function loadBundle(locale: 'ja' | 'en', unsandboxed: boolean) {
  const registered: TestExtension[] = [];
  const runtime = fakeRuntime();
  const events: string[] = [];
  const emit = runtime.emit;
  runtime.emit = (event, record) => {
    events.push(event);
    emit(event, record);
  };
  let dictionary: Record<string, string> = {};
  const translate = Object.assign((message: string) => dictionary[`_${message}`] ?? message, {
    setup: (translations: Record<string, Record<string, string>>) => {
      dictionary = translations[locale] ?? {};
    }
  });
  const context = {
    Scratch: {
      extensions: {unsandboxed, register: (extension: TestExtension) => registered.push(extension)},
      ...(unsandboxed ? {vm: {runtime}} : {}),
      BlockType: {HAT: 'hat', COMMAND: 'command'},
      ArgumentType: {STRING: 'string', NUMBER: 'number', BOOLEAN: 'Boolean'},
      Cast: cast,
      translate
    }
  };
  runInNewContext(bundle, context, {timeout: 1000});
  return {registered, runtime, events};
}

describe('distribution bundle', () => {
  it('registers unsandboxed and reports to the VM runtime', () => {
    const {registered, runtime, events} = loadBundle('en', true);
    expect(registered).toHaveLength(1);
    registered[0]!.assert_equals({ACTUAL: '1', EXPECTED: '1.0'}, fakeUtil());
    expect(events).toEqual([ASSERTION_EVENT]);
    expect(runtime.records[0]).toMatchObject({kind: 'equals', passed: true});
  });

  it('refuses to load in the sandbox', () => {
    expect(() => loadBundle('en', false)).toThrow('must run unsandboxed');
  });

  it('shows Japanese block labels with the TurboWarp translation ID convention', () => {
    const info = loadBundle('ja', true).registered[0]!.getInfo() as {name: string; blocks: Array<{text: string}>};
    expect(info.name).toBe('テスト');
    expect(info.blocks.map((block) => block.text)).toEqual([
      'テスト [NAME]',
      'テストの前に',
      '[ACTUAL] が [EXPECTED] と === で等しいことを確かめる',
      '[ACTUAL] が [EXPECTED] と（Scratch の = で）等しいことを確かめる',
      '[CONDITION] であることを確かめる',
      '[ACTUAL] が [EXPECTED] と誤差 [TOLERANCE] 以内で等しいことを確かめる',
      'リスト [ACTUAL] がリスト [EXPECTED] と等しいことを確かめる',
      '[FRAMES] フレーム以内に [CONDITION] になることを確かめる',
      '[FRAMES] フレーム進める',
      '[CONDITION] になるまで待つ（最大 [FRAMES] フレーム）'
    ]);
  });

  it('ships matching API metadata and documentation anchors for every block', () => {
    const manifest = JSON.parse(readFileSync(new URL('../dist/extension-manifest.json', import.meta.url), 'utf8'));
    const html = readFileSync(new URL('../docs/index.html', import.meta.url), 'utf8');
    expect(manifest.id).toBe(extensionConfig.id);
    expect(manifest.blocks.map((block: {opcode: string}) => block.opcode)).toEqual(
      definitions.blocks.map((block) => block.opcode).sort()
    );
    for (const block of definitions.blocks) {
      expect(html).toContain(`id="block-${block.opcode}"`);
      expect(html).toContain(`href="#block-${block.opcode}"`);
    }
    const ids = new Set(Array.from(html.matchAll(/id="([^"]+)"/g), (match) => match[1]));
    for (const match of html.matchAll(/href="#([^"]+)"/g)) expect(ids.has(match[1])).toBe(true);
  });
});
