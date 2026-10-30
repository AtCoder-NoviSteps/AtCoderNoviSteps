# JAG 模擬地区テーブルのグループ名を「JAG 夏合宿・模擬地区など」に変更

## 概要

PR #4224 で追加したコンテスト別テーブルのグループ「JAG 模擬地区」は、模擬地区だけでなく夏合宿・冬合宿・春合宿や AtCoder 上の JAG も含む（計 76 件、うち模擬地区は一部）。
実態に合わせ、問題一覧のボタン表示とグループ名を「JAG 夏合宿・模擬地区など」に変える。
表示文言だけの変更で、データ・分類・provider key・localStorage の値は変わらない。

## 調査結果

### 変更する（グループを指す箇所）

| 箇所                                                                                   | 内容                                                                   |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts:337-338`      | `AojJagRegional` の `groupName` と `buttonLabel`                       |
| `src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts:282,284` | 上記の期待値                                                           |
| `src/features/tasks/utils/contest-table/aoj_jag_providers.ts:62`                       | `JagRegionalProvider` の TSDoc「(JAG 模擬地区 group)」                 |
| `docs/guides/how-to-add-contest-table-provider.md:85,87,148`                           | 「変形: 明示的な配列で並べる（JAG 模擬地区）」、注意見出し、一覧表の行 |

ボタンは `TaskTable.svelte:218` が `getMetadata().buttonLabel` をそのまま描画する。
選択状態の localStorage（`contest_table_providers`）にはオブジェクトのキー `aojJagRegional` が入るので、文言を変えても既存ユーザーの選択は保たれる。
e2e と Svelte コンポーネントのテストにこの文言は出てこない。

### 変更しない（個々のコンテスト名を指す箇所）

- `src/lib/contests/utils/labels/aoj.ts:25,30`（`Regional: ' 模擬地区 '`）とそのテスト・fixture: `JAGRegional2022` → 「JAG 模擬地区 2022」のようなコンテスト名ラベル。コンテストそのものの名前なので正しい
- `aoj_jag_providers.test.ts:556`（「JAG 模擬地区 2016（in JAG 夏合宿 2016 Day3）」）: 1 テーブルのタイトル
- `src/lib/clients/index.ts:69`（`'AOJ - JAG 模擬地区'`）: 管理画面の取り込み元ラベル。AOJ API の `jag/regional` は模擬地区だけを返し、合宿系は管理画面から取り込めない（ガイド参照）ので、実態どおり
- ガイド 85 行目の「例: 模擬地区 2014 は夏合宿 2014 の Day2 と Day4 の間」: 個々のコンテストの話
- `docs/dev-notes/` 配下の過去の記録

## 設計判断

- **`ariaLabel` は据え置く**: 現在の `'Filter JAG Regional and Training Camps'` は既に合宿を含む意味になっている。他のグループも英語の aria-label で揃っているため、ここだけ変える理由がない
- **内部識別子は据え置く**: `AojJagRegional` / `aojJagRegional` / `JagRegionalProvider` / `AOJ_JAG_REGIONAL_ENTRIES` / `aoj_jag_regional_entries.ts` は変えない。`aojJagRegional` は localStorage に保存される値でもある

## 却下した案

- **内部識別子も `Camp` などに改名**: 表示を直したいという目的に対して変更範囲が大きく、localStorage の値が変わって既存ユーザーの選択がデフォルトに戻る。YAGNI
- **コンテスト名ラベル（`aoj.ts`）の「模擬地区」も変える**: 個々のコンテストは実際に模擬地区なので誤りになる
- **管理画面の取り込みラベルも変える**: 取り込めるのは模擬地区だけなので、変えると逆に実態とずれる

## フェーズ

1 PR、変更ファイル 4 件。認証・DB・公開インターフェースに触れないので cross-review は不要。

### Phase 1: グループ名とボタン表示の変更（TDD）

- 層: `src/**/utils/`（contest-table の provider group 定義）
- テスト名: 既存の `AojJagRegional registers one provider per contest, newest first`
- 手順:
  1. テストの `getGroupName()` と `buttonLabel` の期待値を `'JAG 夏合宿・模擬地区など'` にして、落ちることを確認
  2. `contest_table_provider_groups.ts` の `groupName` と `buttonLabel` を変更
  3. `pnpm test:unit` で通ることを確認

### Phase 2: コメントとガイドの追従

- `aoj_jag_providers.ts:62` の TSDoc を「(JAG 夏合宿・模擬地区など group)」に変更
- `how-to-add-contest-table-provider.md` の 85 行目の見出し部分・87 行目の注意見出し・148 行目の一覧表の行を新しいグループ名に変更（表の列幅は `pnpm format` で揃える）

### 確認

- `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit` / `git diff --check`
- `pnpm dev` の問題一覧で、ボタンが「JAG 夏合宿・模擬地区など」と表示され、狭い画面幅でも折り返しが崩れないこと（文字数が 8 → 13 に増える）
