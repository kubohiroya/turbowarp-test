# 開発・検証ガイド

設計は [turbowarp-plus-editor#774](https://github.com/kubohiroya/turbowarp-plus-editor/issues/774) にあります。足場は turbowarp-uuid（テンプレートから作った拡張）を写しました。

## 構成

- `src/block-definitions.json`: ブロックの正本。
- `src/config.ts`: 拡張IDとmetadataの正本。
- `src/checks.ts`: 確かめる比較。VM に触れない。
- `src/protocol.ts`: 実行器へ出す記録とイベント名。実行器との約束の正本。
- `src/extension.ts`: TurboWarp API への接続、記録の送出、フレームの計数。
- `dist/`: コミット対象の非minify bundleと決定的manifest。
- `docs/index.html`: 全ブロックの日本語説明と固定アンカー。

## 検証

`pnpm install --frozen-lockfile` で開発環境を用意し、`pnpm run check` を実行します。
テストは比較の規則、各ブロックの記録と停止、フレームの計数、コンパイルされたスクリプトでの待機の失敗、生成bundleの登録・サンドボックスでの拒否・日本語表示を確認します。
`pnpm run test:browser` は、Editor が固定する VM（`@kubohiroya/turbowarp-plus-editor-test-runtime`）で、緑の旗がテストのハットを起動しないこと、記録のブロックID、失敗での停止、フレームの計数、コンパイルされたスクリプトでの待機の失敗を、ヘッドレスの Chromium で確かめます。CI でも実行します。
ブロック変更時は `pnpm run docs` でREADMEを生成し、日本語READMEとHTML説明を更新します。

コード内コメントは英語で書きます。拡張ID、opcode、引数ID、記録の項目を変更する場合は、保存済みプロジェクトと実行器（TurboWarp Plus Editor、sb3-toolchain）との互換性を説明してください。

## ロールバック

この機能は拡張を読み込んだ場合だけ有効です。テストのハットは緑の旗で起動しないので、読み込んだままでも作品の動きは変わりません。切り戻しは拡張の読み込み解除です。

## 外部公開

新規GitHub repository、push、PR、Issue更新、Pages設定・公開、npm公開は、対象と操作についてユーザーの明示承認を得てから実行します。
