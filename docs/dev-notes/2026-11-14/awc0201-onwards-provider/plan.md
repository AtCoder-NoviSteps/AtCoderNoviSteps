# AWC 0201 以降のテーブル追加

Issue: #4325（参考: PR #4006、AWC 0200 対応の #4320）

## 概要

- awc0201 以降を `AWCRangeProvider`（provider key `AWC::0201Onwards`）で表示し、既存グループ `AWC0001Onwards` の先頭、つまり AWC 0200 の表の上に登録する。
- ボタン（`AWC 0001 〜 `）とグループは変えない。
- seed: awc0201 は未開催なので、ダミー（A〜E）を入れる。
- seed: awc0200 のダミー名を実問題名に差し替える。本番 DB には投入済みなので、本番側の作業はない。

## 表示順（変更後）

| 表示順 | provider key               | 範囲・対象                            |
| ------ | -------------------------- | ------------------------------------- |
| 1      | `AWC::0201Onwards`（新規） | awc0201〜awc9999（A〜E）              |
| 2      | `AWC::0200`                | awc0200（15 問）                      |
| 3      | `AWC::0151To0199`          | awc0151〜awc0199                      |
| 4 以降 | 既存のまま                 | 0150 / 0101〜0149 / 0100 / 0001〜0099 |

## 設計

`contest_table_provider_groups.ts` の `AWC0001Onwards` の先頭に、次のインスタンスを追加する。

```typescript
new AWCRangeProvider(ContestType.AWC, {
  section: '0201Onwards',
  minRound: 201,
  maxRound: 9999,
  title: 'AtCoder Weekday Contest 0201 〜',
  abbreviationName: 'awc0201Onwards',
}),
```

- 新しい class・関数・型は追加しない。`AWCRangeProvider` は config で動くので、インスタンスを 1 つ足すだけで済む。
- 命名と上限は、旧 `0151Onwards`（`maxRound: 9999`、title `'AtCoder Weekday Contest 0151 〜'`）に揃える。contest_id は `awc\d{4}` の形なので、9999 が実質の上限になる。
- 分類（`/^awc\d{4}$/`）・ラベル・priority は awc0201 を既にカバーしているので、Layer 1〜3 は変更しない。

### 却下した案

- `0201To0249` のように上限を閉じる案: awc0250 が特殊回になるかは未確定（YAGNI）。上限を閉じると、awc0250 以降がどの表にも出なくなる。特殊回が決まった時点で、`0151Onwards` → `0151To0199` と同じ手順で範囲を狭める。
- 新しいボタン（グループ）を作る案: ユーザーの指示どおり、既存のボタンを維持する。

## Phase

ブランチ: staging から `#4325` を作成する。

### Phase 1: awc0200 の seed を実問題名に差し替える（データのみ）

- `prisma/tasks.ts` の `awc0200_a`〜`awc0200_o` の `name` / `title` を、ユーザーが提供した行（[awc0200_problems.json](awc0200_problems.json)）で置き換える。`id` / `contest_id` / `problem_index` は変わらない。
- 事前確認: 15 件であること、`id` が一意であること、`title` = `{problem_index}. {name}` であること。fixture は 15 問（A〜O）の仮定と一致するので、fixture とテストは変更しない。
- json はこのコミットで削除する。
- commit: `feat(db): use published problem names for awc0200 tasks`

### Phase 2: awc0201 のダミー seed を追加する

- `awc0201_a`〜`awc0201_e`（`Dummy Problem A`〜`E`）を、awc0200 ブロックの直前に追加する（新しい回を上に置く）。
- 回内の並びは既存の AWC ブロックに合わせて A→E とする（add-tasks チェックリストの F→A とは異なる）。
- 確認: `grep -c "id: 'awc0201_"` が 5 になること。
- commit: `feat(db): add dummy awc0201 tasks to seed`

### Phase 3: fixture と provider テスト

- fixture: `contest_table_provider.ts` に `taskResultsForAWC0201OnwardsProvider`（awc0201 / awc0202 の各 A〜E）を追加する。
- `awc_provider.test.ts`:
  - `rangeProviderCases` の先頭に `AWC0201Onwards` を追加する。
  - included: `awc0201`, `awc0202`。excluded: `awc0199`, `awc0200`。
  - round label: `awc0201` → `'0201'`、`awc0202` → `'0202'`。
  - `allAWCTaskResults` に新しい fixture を追加する。
- 既存クラスに config を渡すテストなので、最初から GREEN になる。本番 config のミスの検出は、Phase 4 のグループテストが担う。
- commit: `test(contest-table): cover AWC 0201 onwards range`

### Phase 4: グループ登録（TDD）

- テスト（`contest_table_provider_groups.test.ts`）:
  - `AWC0001Onwards registers 7 providers in display order`: 先頭に `'AWC::0201Onwards'` を追加する。
  - `AWC0001Onwards shows $contestId only in $providerKey`: `awc0201` / `awc0202` → `AWC::0201Onwards` のケースを追加し、全件の配列に新しい fixture を加える。
  - **RED** を確認する。
- `AWC0001Onwards` の先頭に上記の config を `addProvider` する（呼び出し順 = 表示順）。→ **GREEN**
- commit: `feat(contest-table): show AWC 0201 onwards above AWC 0200`

### Phase 5: ガイドを更新する

- `docs/guides/how-to-add-contest-table-provider.md`:
  - 範囲フィルタ型の表に `AWC 0201- | 0201～ | A～E` の行を追加する。
  - †注の section 一覧に `'0201Onwards'` を追加する。
  - 最終更新日を 2026-11-14 にする。
- commit: `docs: describe the AWC 0201 onwards provider in the contest table guide`

## 検証

- `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit` / `git diff --check` を実行する。
- 変異で検出力を確認する（想定）:
  - `minRound: 201` → `200` は、awc0200 が 2 つの表に出るので `shows awc0200 only in AWC::0200` が失敗するはず。
  - `maxRound: 9999` → `201` は、awc0202 のケースが失敗するはず。
- `pnpm db:seed` 後の dev サーバーでの目視は、ローカル DB に書き込むので、実施前にユーザーに確認する。
- cross-review: AGENTS.md の条件（30 ファイル以上、認証、スキーマ／マイグレーション、共有インターフェース）に該当しないので任意。
