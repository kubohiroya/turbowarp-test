import {TestExtension} from './extension.js';

if (!Scratch.extensions.unsandboxed || !Scratch.vm) {
  // Assertions report the block that failed and count frames, which needs the VM itself.
  throw new Error('TurboWarp-Test must run unsandboxed.');
}

Scratch.translate.setup({
  ja: {
    _Test: 'テスト',
    '_test [NAME]': 'テスト [NAME]',
    '_before each test': 'テストの前に',
    '_check [ACTUAL] === [EXPECTED]': '[ACTUAL] が [EXPECTED] と === で等しいことを確かめる',
    '_check [ACTUAL] equals [EXPECTED]': '[ACTUAL] が [EXPECTED] と（Scratch の = で）等しいことを確かめる',
    '_check [CONDITION] is true': '[CONDITION] であることを確かめる',
    '_check [ACTUAL] is within [TOLERANCE] of [EXPECTED]':
      '[ACTUAL] が [EXPECTED] と誤差 [TOLERANCE] 以内で等しいことを確かめる',
    '_check list [ACTUAL] equals list [EXPECTED]': 'リスト [ACTUAL] がリスト [EXPECTED] と等しいことを確かめる',
    '_check [CONDITION] becomes true within [FRAMES] frames':
      '[FRAMES] フレーム以内に [CONDITION] になることを確かめる',
    '_advance [FRAMES] frames': '[FRAMES] フレーム進める',
    '_wait until [CONDITION] (at most [FRAMES] frames)': '[CONDITION] になるまで待つ（最大 [FRAMES] フレーム）',
    '_(no lists)': '（リストがありません）'
  }
});

Scratch.extensions.register(new TestExtension(Scratch.vm.runtime));
