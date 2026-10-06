# 組合せゲーム 24 題（game-24）の追加

## 概要

[組合せゲーム 24 題](https://atcoder.jp/contests/game-24)（contest_id `game-24`、A〜X の 24 問）を ContestType `GAME_24` として追加し、xDPC グループの「FPS 24 題」の後に表示する。あわせて、グループ名を「xDPC・FPS 24」から「xDPC・x 24 題」に改名した。

参考: `.agents/skills/add-contest-table-provider/`、FPS 24 追加時の #2796（インポート）と #2797（テーブル）。

## 前提となる事実

- **task_id は contest_id の数字を含まない:** `game_a`〜`game_x` であり、`fps-24` の `fps_24_a` とは形式が異なる。AtCoder の問題 URL は `getTaskUrl` が contestId と taskId を連結して作るだけで、AtCoder 側には task_id を分解する処理がないため、この形式でも影響はない。
- **問題データの入手:** エージェント環境からは atcoder.jp を取得できず（curl は拒否され、WebFetch は失敗）、kenkoooo の problems.json も WebFetch では途中で切れて `game-24` が見つからなかった。seed の 24 行は、ユーザーが貼った一覧から作った。
- **本番への反映:** マイグレーションは、main への push 時に CI の本番ジョブ（`.github/workflows/ci.yml`）がデプロイ前に `prisma migrate deploy` で適用するので、手動の操作は要らない。問題データは、反映後に管理画面 `/tasks` からインポートする（AtCoder Problems に game-24 が反映されている必要がある）。

## 決定事項

| 項目               | 決定                                         | 理由・補足                                                                                            |
| ------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 位置               | enum・priority ともに `FPS_24` の直後        | ユーザー指定。priority は 20 で、後続の種別は 1 つずつ下がる                                          |
| 表示名             | `組合せゲーム 24 題`                         | ユーザー指定。「FPS 24 題」に合わせ、数字の前後に半角スペースを入れる                                 |
| グループ名・ボタン | `xDPC・x 24 題`                              | ユーザー指定。aria-label は `xDPC and x 24 contests`                                                  |
| enum コメント      | `24 Problems on Combinatorial Games`         | `FPS_24` の英語コメントの形式に合わせる                                                               |
| プリセットキー     | `dps` のまま                                 | localStorage（`contest_table_providers`）に保存されるキーなので、変えると既存ユーザーの選択が失われる |
| Provider           | `game24_provider.ts` をクラスごと複製        | EDPC / TDPC / NDPC / FPS24 の既存慣例に合わせる                                                       |
| 表示設定           | FPS 24 と同じ                                | 同じグループ内で見た目を揃える                                                                        |
| seed の grade      | 付けない                                     | fps-24 と同様に PENDING とし、本番では投票か管理画面で設定する                                        |
| フィクスチャ       | `taskResultsForGame24Provider` は作らない    | FPS 24 用の同等品がどのテストからも参照されていなかった（YAGNI）                                      |
| E2E                | ボタンを押した後の h2 見出しの並びを検証する | 見出しは tasks の有無に関係なく描画されるので、seed に依存しない                                      |
| コミット           | plan / Layer 1–3 と seed / Layer 4–5 と E2E  | 1 PR・3 コミット                                                                                      |

## 見送り案

- **`x24_providers.ts` に統合する:** `fps24_provider.ts` のリネームで差分が膨らむ。
- **単一 contest_id 用の共通基底クラスを抽出する:** DP 系 3 クラスにも波及し、本タスクの範囲を超える。
- **2 PR に分割する:** 変更が小さく、コミットを分ければレビューに支障はない。
- **ボタンに `aria-pressed` を付ける:** 選択状態を E2E で検証できるようになるが、UI の変更なので別タスクにする。
- **E2E で問題リンク（`game_a`）まで検証する:** seed に依存するため見送った。

## 補足

- PostgreSQL の `ALTER TYPE ... ADD VALUE` は値を末尾に追加するので、DB 上の enum の並びは schema の並びと一致しない。過去に追加した値も同じ状態で、表示順は `contestTypePriorities` で管理しているので問題ない。
- `src/test/lib/utils/task.test.ts` の priority の差分の期待値は、20 より前の種別しか使っていないので、今回は変更が不要だった。
- Codex のクロスレビューでは指摘がなかった。
