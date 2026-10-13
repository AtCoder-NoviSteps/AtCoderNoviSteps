# AAL Contest 001（aalc001）の追加

## 概要

Issue #3974: [AAL Contest 001: Let's use segtree!](https://atcoder.jp/contests/aalc001)（contest_id `aalc001`、A〜X の 24 問）を ContestType `AALC` として追加し、xDPC グループの「組合せゲーム 24 題」の後に表示する。

参考: `.agents/skills/add-contest-table-provider/`、Game 24 追加時の PR #4120（plan は `git show 7fb10b8c:docs/dev-notes/2026-10-06/add-game-24-contest-table/plan.md`）。

## 前提となる事実

- **task_id は `aalc001_a`〜`aalc001_x`:** contest_id に `_` と小文字の問題記号を付けた一般的な形式。
- **問題データの入手:** エージェント環境からは atcoder.jp を取得できない（curl は拒否）。seed の 24 行は、ユーザーが貼った一覧から作る。
- **既存の分類ルールとの衝突はない:** `prefixes.ts` に `a` で始まる接頭辞はなく、`/^abc\d{3}$/` などの正規表現にも当たらない。
- **本番への反映:** マイグレーションは main への push 時に CI が `prisma migrate deploy` で適用する。問題データは反映後に管理画面 `/tasks` からインポートする（AtCoder Problems に aalc001 が反映されている必要がある）。

## 決定事項

| 項目               | 決定                                                   | 理由・補足                                                                    |
| ------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| ContestType        | `AALC`                                                 | ユーザー指定                                                                  |
| 位置               | enum・priority ともに `GAME_24` の直後                 | ユーザー指定。priority は 21 で、`ATCODER_MAIN_OFFICIAL_ONSITE` 以降は +1     |
| 表示名             | `AAL Contest 001: Let's use segtree!`                  | ユーザー指定。名前ラベル（`LABEL_GENERATORS`）とテーブルのタイトルで共通      |
| enum コメント      | `AAL Contest 001: Let's use segtree!`                  | 他の enum コメントと同様に英語の正式名                                        |
| 分類               | `CONTEST_TYPES_BY_ID` に `aalc001` を完全一致で追加    | aalc001 だけ扱う（ユーザー選択）。002 以降が出たら接頭辞ルールに拡張する      |
| Provider           | `aalc_provider.ts` に `AALCProvider` を作る            | Game24Provider をクラスごと複製（既存の単一コンテスト Provider の慣例）       |
| `abbreviationName` | `aalc001`                                              | contest_id と同じ（game-24・fps-24 と同じ方針）                               |
| 表示設定           | Game 24 と同じ                                         | これまでの 24 問コンテストとスタイルを揃える                                  |
| グループ           | `dps`（`xDPC・x 24 題`）の末尾に追加。名前・キーは不変 | AALC も 24 問なので「x 24 題」に含める（ユーザー選択）。localStorage キー維持 |
| seed の grade      | 付けない                                               | game-24・fps-24 と同様に PENDING                                              |
| E2E                | `XDPC_GROUP_TABLE_TITLES` の末尾に 1 件追加            | 見出しの並びを検証する既存テストを拡張するだけで足りる                        |
| コミット           | plan / Layer 1–3 と seed / Layer 4–5 と E2E            | 1 PR・3 コミット（#4120 と同じ）                                              |

## 主なシグネチャ

```typescript
// src/features/tasks/utils/contest-table/aalc_provider.ts
export class AALCProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean; // classifyContest === AALC && contest_id === 'aalc001'
  getMetadata(): ContestTableMetaData; // { title: "AAL Contest 001: Let's use segtree!", abbreviationName: 'aalc001' }
  getDisplayConfig(): ContestTableDisplayConfig; // Game24Provider と同じ値
  getContestRoundLabel(_contestId: string): string; // ''
}
```

## 見送り案

- **`aalc` の接頭辞で分類する:** 現時点で 002 以降の予定はなく、YAGNI。出たときに Pattern 1 か 4 で拡張する。
- **表示名を短くする（`AALC 001` / `セグ木 24 題`）:** ユーザーが正式名を選んだ。
- **グループ名を変える:** プリセットキー・aria-label・E2E に波及するうえ、「x 24 題」に収まる。
- **単一 contest_id 用の共通基底クラスを抽出する:** EDPC〜Game 24 の 5 クラスに波及し、本タスクの範囲を超える（#4120 と同じ判断）。

## フェーズ（低リスク → 高リスク）

### Phase 1: ContestType の追加（Layer 1–2）

- `prisma/schema.prisma` の enum で `GAME_24` の直後に `AALC` を追加 → `pnpm exec prisma migrate dev --name add_aalc_to_contest_type`
- `src/lib/contests/types/contest.ts` に同じ位置で追加
- `pnpm check`

### Phase 2: 分類・priority・ラベル（Layer 3、TDD）

- テスト先行
  - `fixtures/contest_type.ts` に `aalc001`（expected `ContestType.AALC`）、`fixtures/contest_name_labels.ts` に `aalc001`（expected `AAL Contest 001: Let's use segtree!`）
  - `classification.test.ts` / `labels/index.test.ts` に describe を追加
  - `priority.test.ts` に `ranks AALC directly below GAME_24`
  - RED を確認
- 実装
  - `CONTEST_TYPES_BY_ID` に `['aalc001', ContestType.AALC]`
  - `contestTypePriorities` に `[ContestType.AALC, 21]`、後続を +1、JSDoc の範囲を更新（0 = Highest, 28 = Lowest / Special 18-23 / External 24-28）
  - `LABEL_GENERATORS` に `[ContestType.AALC, () => "AAL Contest 001: Let's use segtree!"]`
  - GREEN。`src/test/lib/utils/task.test.ts` は priority の差分の期待値に後続種別を使っていないので変更不要の見込み（実行して確認）
- `prisma/tasks.ts` に 24 行を追加（貼られた一覧どおり）

### Phase 3: Provider とグループ登録（Layer 4–5、TDD）

- `aalc_provider.test.ts`（`game24_provider.test.ts` を複製）: フィルタ（aalc001 のみ・他 contest_id を除外）、メタデータ、表示設定、round label
  - test 名の例: `filters only aalc001 tasks`, `returns metadata for AAL Contest 001`
- RED → `aalc_provider.ts` 実装 → GREEN
- `contest_table_provider_groups.test.ts`: `dps` の contestTypes に `ContestType.AALC` を追加、`getSize()` を 6 に
- RED → `contest_table_provider_groups.ts` で `new AALCProvider(ContestType.AALC)` を `Game24Provider` の後に追加、JSDoc を `(EDPC, TDPC, NDPC, FPS 24, Game 24, and AAL Contest 001)` に → GREEN

### Phase 4: E2E

- `e2e/problems_contest_table.spec.ts` の `XDPC_GROUP_TABLE_TITLES` 末尾に `AAL Contest 001: Let's use segtree!` を追加し、test 名を `shows Game 24 and AAL Contest 001 tables after FPS 24 in the xDPC group` に変更

## 最終確認

- `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit` / 該当 E2E / `git diff --check`
- DB スキーマとマイグレーションの変更を含むので、AGENTS.md に従い Codex でクロスレビューする
