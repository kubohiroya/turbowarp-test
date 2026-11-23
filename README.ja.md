# TurboWarp-Test

<img src="assets/block-icon.svg" alt="" width="48" height="48">

[English](README.md) | 日本語

TurboWarp Plus Editor の作品の中に、ブロックのまま回帰テストを書くための拡張機能です。テストは専用のハットから始まり、緑の旗では動きません。確かめるブロックは、失敗したブロックをテストの実行器へ知らせます。

## できること

- 「テスト」ハットと「テストの前に」ハットを足します。どちらも緑の旗やほかのイベントでは起動しないので、配布した作品の中では不活性のままです。
- 確かめるブロックは、`===` で等しい、Scratch の `=` で等しい、真である、誤差以内で等しい、リストが等しい、の5つと、条件が指定のフレーム数以内に真になることを確かめるブロックです。
- 待つブロックを2つ足します。秒ではなくフレームで数えるので、どのコンピューターでも結果が変わりません。
- 確かめた結果を、構造化した記録として VM の runtime に出します。失敗したら、そのスクリプトを止めます。

テストの実行器、テストごとの状態の復元、失敗の印は、TurboWarp Plus Editor 側に置きます（[turbowarp-plus-editor#774](https://github.com/kubohiroya/turbowarp-plus-editor/issues/774)）。配布物からテストを外すには `sb3-toolchain build --strip-tests` を使います。

## 必要なものと安全性

**サンドボックスなし**で実行します。失敗したブロックのIDを知らせ、runtime が進めたフレームを数えるためです。サンドボックスでは読み込みを拒みます。通信も保存もしません。

待つ2つのブロックが条件をフレームごとに確かめ直せるのは、インタープリターで動くときだけです。コンパイルされたスクリプトは、ブロックの入力を1回しか評価しないからです。TurboWarp Plus Editor の実行器は、コンパイラーを切ってテストを動かします。コンパイルされたスクリプトで条件が最初に偽なら、変わりようのない値を待ち続けず、そのことを示して失敗します。

## 読み込み

TurboWarp Plus Editor では、「拡張機能を追加」の TurboWarp-Plus の一覧から読み込みます。ほかの TurboWarp では、「拡張機能を追加 → カスタム拡張機能 → URL」に `https://kubohiroya.github.io/turbowarp-test/dist/turbowarp-test.js` を入れ、サンドボックスなしで実行します。

ブロックの表記は、TurboWarp の言語に合わせて日本語か英語になります。

## 実行器との約束

確かめるブロックは、1件ごとに VM の runtime へイベント `KUBOHIROYATEST_ASSERTION` を出します（`src/protocol.ts`）。項目は英語版の README の表のとおりです。上限付きの待機は、上限を過ぎたときだけ記録を出します。ツールは opcode `kubohiroyatest_whentest` と `kubohiroyatest_whensetup` でテストを見つけ、ターゲットとブロックIDで指します。

## ブロック

各ブロックの説明は、[ブロックガイド](https://kubohiroya.github.io/turbowarp-test/)（[ソース](docs/index.html)）にあります。

## 開発

Node.js 24 以上と pnpm 11.28.8 を使います。`pnpm run check` で、型検査、lint、ビルド、テスト、README の生成結果、リポジトリの規約、パッケージの中身をまとめて確かめます。

拡張 ID は `kubohiroyatest` です。opcode と引数 ID は、保存した作品との互換性の約束です。

## ライセンス

MPL-2.0。[LICENSE](LICENSE) を参照してください。
