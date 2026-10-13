# AAL Contest 001（aalc001）の追加

## 概要

Issue #3974: [AAL Contest 001: Let's use segtree!](https://atcoder.jp/contests/aalc001)（contest_id `aalc001`、A〜X の 24 問）を ContestType `AALC` として追加し、xDPC グループの「組合せゲーム 24 題」の後に表示した。

PR #4120（Game 24）の手順をそのまま踏襲した。経緯は `git show 7fb10b8c:docs/dev-notes/2026-10-06/add-game-24-contest-table/plan.md` を参照。

## 前提となる事実

- **問題データの入手:** エージェント環境からは atcoder.jp を取得できない（curl は拒否された）。seed の 24 行は、ユーザーが貼った一覧から作った。
- **本番への反映:** マイグレーションは、main への push 時に CI が `prisma migrate deploy` で適用する。問題データは、反映後に管理画面 `/tasks` からインポートする（AtCoder Problems に aalc001 が反映されている必要がある）。
- **既存の分類ルールとは衝突しない:** `prefixes.ts` に `a` で始まる接頭辞はなく、`/^abc\d{3}$/` などの正規表現にも当たらない。

## 決定事項

| 項目               | 決定                                         | 理由・補足                                                                                           |
| ------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 種別名・位置       | `AALC`、enum・priority とも `GAME_24` の後   | ユーザー指定                                                                                         |
| 表示名             | 正式名 `AAL Contest 001: Let's use segtree!` | ユーザー選択。短縮形（`AALC 001` / `セグ木 24 題`）は採らなかった                                    |
| 分類               | `aalc001` の完全一致                         | ユーザー選択。種別名は回数を含まないが、002 以降は予定がないため（YAGNI）                            |
| ファイル・クラス名 | `aalc_provider.ts` / `AALCProvider`          | ユーザー指定。当初案の `aalc001_provider.ts` / `AALC001Provider` から変更                            |
| グループ           | `xDPC・x 24 題` の名前とキー `dps` は不変    | ユーザー選択。AALC も 24 問なので「x 24 題」に含まれる。キーは localStorage に保存されるため変えない |
| seed の並び        | X→A の降順、`game_x` の直前                  | `prisma/tasks.ts` の既存ブロック（game-24・fps-24）の並びに合わせた。貼られた一覧は A→X だった       |
| seed の grade      | 付けない                                     | game-24・fps-24 と同様に PENDING とし、本番で投票か管理画面から設定する                              |

## 見送り案

- **`aalc` の接頭辞で分類する:** 002 以降の予定がない。開かれたときに Pattern 1（範囲）か Pattern 4（コンストラクタ引数）で拡張する。
- **グループ名を変える:** プリセットキー・aria-label・E2E に波及するうえ、「x 24 題」に収まっている。
- **単一 contest_id 用の共通基底クラスを抽出する:** EDPC〜Game 24 の 5 クラスに波及し、本タスクの範囲を超える（#4120 と同じ判断）。

## 補足

- priority の挿入で後続の種別が 1 つずつ下がったが、`src/test/lib/utils/task.test.ts` は該当する種別を使っていないので変更が不要だった。
- 作業ブランチ `#3974` は着手時点で既にあり、staging と同じコミットを指していたのでそのまま使った。
- Codex のクロスレビュー（`codex review --base staging`）では指摘がなかった。
