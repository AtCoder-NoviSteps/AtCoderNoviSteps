# ARC-Like コンテスト 3 件の追加（#4140）

## 概要

[#4140](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/4140) で、`nikkei2019-2-qual`・`ddcc2020-qual`・`diverta2019-2` の全問題を `prisma/tasks.ts` に追加し、`ContestType.ARC_LIKE` に分類した。
3 件とも ARC 相当とするのはユーザーの判断による（コンテスト ID や問題構成からは機械的に決まらない）。

## 決定事項

| 項目                      | 決定                                         | 理由                                                                                       |
| ------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 追加する問題              | 各コンテストの全問題（A〜F）                 | `tenka1-2019` のように一部だけ載せる前例もあるが、本件は全問題を対象とした                 |
| `ARC_LIKE` のコンテスト名 | 公式名（日本語名があれば日本語）             | 既存の `nikkei2019-qual` に合わせた。名前は AtCoder のコンテストページでユーザーが確認済み |
| 本戦（`*-final`）         | スコープ外                                   | Issue の対象外（YAGNI）                                                                    |
| 表示ラベル                | 変更しない（コンテスト ID の大文字化のまま） | `ARC_LIKE` にはラベル生成関数がなく、既存の ARC-Like と同じ扱いにそろえる                  |

## 前提として判明したこと

- `ABC_LIKE` / `ARC_LIKE` は完全一致、その他のグループは前方一致で判定する。そのため、既存の `diverta2019` キーでは `diverta2019-2` を拾えず、続編にも個別のキーが要る。変数名（`ContestPrefix`、`arcLikePrefixes`）からは前方一致に見えるので、`prefixes.ts` にコメントを追加した。
- 問題データの取得元は [problems.json](https://kenkoooo.com/atcoder/resources/problems.json) だが、エージェントからは atcoder.jp に到達できず、WebFetch は problems.json を途中で切り捨てる。今回は該当行をユーザーに貼ってもらった。
- 参考にした #3951 以降、コンテスト関連のユーティリティは `src/lib/contests/utils/`、テストケースは `src/lib/contests/fixtures/` へ移動している。

## 採用しなかった案

- `ARC_LIKE` を前方一致に変更する：`diverta2019` などのキーが想定外の ID まで拾ってしまう。
- ARC-Like 用のラベル生成関数を追加する：要件外で、既存の ARC-Like コンテストの表示まで変わる。

## 派生した変更

同種の Issue（「問題を追加しましょう」）は繰り返し起きるが、既存の `add-contest-table-provider` skill は ContestType や Provider を新しく追加するときにしか読み込まれない。そこで以下を整備した。

- `add-tasks` skill を新設した（`SKILL.md` に概略、`instructions.md` に詳細）。AOJ 側の手順は #3951 の差分から読み取った下書きで、未検証。必要になったときに直す。
- `add-contest-table-provider` の手順 0 と Layer 3 から `add-tasks` を参照するようにし、データ取得と照合方法の説明を一か所にまとめた。
- `how-to-add-contest-table-provider.md` の「事前確認」に、完全一致と前方一致の違いを 1 行追記した。
- Claude は `.claude/skills/` のシンボリックリンクから、Codex は AGENTS.md の skill 一覧から参照する。

## 検証

- format、lint、check、unit test（2697 件）、`git diff --check` がすべて通った。
- クロスレビューは対象外（手で編集したソースは 3 ファイルで、認証・スキーマ・公開インターフェースの変更もない）。
