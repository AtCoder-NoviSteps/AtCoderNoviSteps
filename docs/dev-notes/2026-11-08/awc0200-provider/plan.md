# AWC0200 単独テーブル 実装計画

Issue: #4320（参考: PR #3997）

## 概要

- awc0200（特別回）を `AWCSpecialContestProvider` で単独テーブルとして表示する。
- 現在の `0151Onwards`（151〜9999）を `0151To0199`（151〜199）に狭め、awc0200 が通常回テーブルに重複して出ないようにする。
- AWC グループの表示順（上から）: `0200` → `0151To0199` → `0150` → `0101To0149` → `0100` → `0001To0099`
- 問題データは未公開のため、seed と fixture はダミー（15 問 A〜O、awc0100 / awc0150 と同じ構成）で作る。

## 設計根拠

- AWC の provider は config-driven（`ae1dca6b`）なので新クラスは不要。変更は `contest_table_provider_groups.ts` のインスタンス追加と既存インスタンスの config 変更だけ。
- 命名は PR #3997 の `0101Onwards` → `0101To0149` 改名に揃える。section `0151To0199`、title `AtCoder Weekday Contest 0151 〜 0199`、abbreviationName `awc0151To0199`。
- `abbreviationName` は `TaskTable.svelte` 内の Map キーと `{#each}` キーにしか使われず、永続化されないため、改名の互換対応は不要。
- 表示設定は既存の `SPECIAL_CONTEST_DISPLAY_CONFIG` をそのまま共有する。
- `awc_provider.test.ts` は config をテスト内に直書きしているため、本番の `maxRound` の設定ミス（awc0200 の二重表示）を検出できない。グループのテストで、登録済み provider 経由の重複なしを確認する。

## 却下した案

- 同じ PR で `0201Onwards` を追加する: ユーザー判断で別 issue に分ける。影響として、本 PR のデプロイ後から `0201Onwards` を追加するまで、awc0201 以降は表に出ない。
- `0151Onwards` を残して awc0200 だけ除外する: `AWCRangeProvider` に除外リストが要り、範囲と名前も食い違う。

## 変更対象

| ファイル                                                                       | 変更内容                                                      |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `prisma/tasks.ts`                                                              | awc0200 のダミー 15 件を追加                                  |
| `src/features/tasks/fixtures/contest-table/contest_table_provider.ts`          | 0151 系 fixture の改名 + awc0199 追加、awc0200 fixture 追加   |
| `src/features/tasks/utils/contest-table/awc_provider.test.ts`                  | range ケースの改名・境界更新、special ケースに AWC0200 を追加 |
| `src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts` | 登録順の検証、重複なしの検証                                  |
| `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts`      | `0151Onwards` → `0151To0199`、`0200` を先頭に登録             |
| `docs/guides/how-to-add-contest-table-provider.md`                             | リファレンス表・注記・パターン 2 見出し                       |

## Phase 1: seed にダミーデータ追加（データのみ、test-first 対象外）

- `prisma/tasks.ts` の awc0151 ブロックの直前に、`awc0200_a`〜`awc0200_o` の 15 件を追加する。
- 形式は既存のダミーに揃える: `{ id: 'awc0200_a', contest_id: 'awc0200', problem_index: 'A', name: 'Dummy Problem A', title: 'A. Dummy Problem A' }`
- コミット: `feat(db): add dummy awc0200 tasks to seed`

## Phase 2: fixture と provider テスト

provider のテストは config を直書きするため、本番コードを変えなくても通る。fixture の改名とケース更新だけをここでまとめる。

- fixture
  - `taskResultsForAWC0151OnwardsProvider` → `taskResultsForAWC0151To0199Provider` に改名し、上限境界の awc0199（5 問 A〜E）を追加する。
  - `taskResultsForAWC0200Provider`（15 問 A〜O、状態の並びは awc0150 と同じ）を追加する。
- `awc_provider.test.ts`
  - `allAWCTaskResults` に awc0200 fixture を追加する。
  - range ケース `AWC0151Onwards` → `AWC0151To0199`: `maxRound: 199`。included `['awc0151', 'awc0152', 'awc0199']`、excluded `['awc0150', 'awc0200']`。roundLabel は `awc0151` → `'0151'`、`awc0199` → `'0199'`（`awc0200` のケースは外す）。
  - special ケースの先頭に `AWC0200` を追加する: section `'0200'`、contestId `'awc0200'`、title `'AtCoder Weekday Contest 0200'`、abbreviationName `'awc0200'`。mixedData `[...0151To0199, ...0200]`、excluded `['awc0151', 'awc0199']`。
- 増えるテスト名の例: `AWCRangeProvider > AWC0151To0199 > filters correct contest range from mixed data`、`AWCSpecialContestProvider > AWC0200 > filters only the target contest from mixed data`
- コミット: `test(contest-table): cover AWC 0151-0199 range and AWC 0200 special contest`

## Phase 3: グループ登録（TDD）

- テスト（`contest_table_provider_groups.test.ts`）
  - 既存の `AWC0001Onwards registers 5 providers with correct keys` を `AWC0001Onwards registers 6 providers in display order` に変える。`getAllProviders().map(getProviderKey)` を次と `toEqual` で比べ、件数・存在・順序（0200 が 0151To0199 の上）を一度に検証する。

    ```typescript
    [
      'AWC::0200',
      'AWC::0151To0199',
      'AWC::0150',
      'AWC::0101To0149',
      'AWC::0100',
      'AWC::0001To0099',
    ];
    ```

  - `AWC0001Onwards assigns each AWC fixture contest to exactly one provider` を追加する。AWC の全 fixture（0001〜0099 / 0100 / 0101〜0149 / 0150 / 0151〜0199 / 0200）を登録済みの各 provider で filter し、各 contest_id がちょうど 1 つの provider にだけ現れることを確認する。`maxRound` を 199 にし忘れると、awc0200 が 2 つの provider に現れて落ちる。
  - **RED** を確認する。
- 実装（`contest_table_provider_groups.ts`）
  - 先頭の `AWCRangeProvider` を section `'0151To0199'`、`maxRound: 199`、title `'AtCoder Weekday Contest 0151 〜 0199'`、abbreviationName `'awc0151To0199'` に変える。
  - その上に `new AWCSpecialContestProvider(ContestType.AWC, { section: '0200', contestId: 'awc0200', title: 'AtCoder Weekday Contest 0200', abbreviationName: 'awc0200' })` を追加する。
- **GREEN**: `pnpm test:unit src/features/tasks/utils/contest-table/`
- コミット: `feat(contest-table): show AWC 0200 as a standalone table`

## Phase 4: ドキュメント

- `how-to-add-contest-table-provider.md`
  - パターン 2 の見出しを `（EDPC / TDPC / AWC0100 / AWC0150 / AWC0200）` にする。
  - 範囲フィルタ型の表: `AWC 0151-` → `AWC 0151-0199 | 0151～0199`
  - 単一ソース型の表: `AWC0100 / AWC0150 / AWC0200†` と contest_id に `'awc0200'` を追加する。
  - †注の section 一覧を `'0100'`, `'0150'`, `'0200'`, `'0151To0199'` にする。
  - 最終更新日を実装日に更新する。
- コミット: `docs: describe the AWC 0200 provider in the contest table guide`

## 検証

- `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit` / `git diff --check`
- `pnpm db:seed` 後に dev サーバーで AWC タブを開き、0200 の表が 0151〜0199 の上に出て、0151〜0199 の表に 0200 の行がないことを目視する。
- クロスレビューの条件（30 ファイル以上・認証・スキーマ・共有インターフェース）には当たらないため不要。

## 残タスク（本 PR の外）

- awc0200 開催後、seed のダミー名を実問題名に差し替える（awc0150 と同じ流れ）。問題数が 15 問でなければ fixture とテストも直す。
- `0201Onwards` の追加を別 issue で行う。それまで awc0201 以降は表に出ない。
