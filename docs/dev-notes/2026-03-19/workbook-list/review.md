# PR #3281 AI Review: refactor: Extract workbook list and add tests

Source: https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/3281
Reviewer: coderabbitai[bot]

## 優先度: 高 (ブロッカー)

### 1. E2E テスト: ログインユーザー名のミスマッチ

**場所**: `tests/helpers/auth.ts:7-14`

ハードコードのユーザー名 `'admin'` / `'guest'` がシードデータの `'admin_test'` / `'guest_test'` と不一致。
全 E2E ログインフローが失敗する。

### 2. `$effect` 内の `get(store)` が非リアクティブ

**場所**: `CurriculumWorkBookList.svelte:60-63`

`get(store)` はスナップショット取得であり、ストアが更新されても effect は再実行されない。
`$store` 構文または明示的サブスクリプションに修正が必要。

### 3. keyed `{#each}` の欠如

**場所**:

- `CreatedByUserTable.svelte:43`
- `CurriculumTable.svelte:33`
- `SolutionTable.svelte:35`

`(workbook.id)` キーがないとフィルタ/並び替え時に DOM が誤った要素を再利用する。

### 4. slug バリデーション不整合

**場所**: `src/routes/workbooks/edit/[slug]/+page.server.ts`

`load` 関数は `BAD_REQUEST`、action は `NOT_FOUND` を返す。どちらかに統一すべき。

---

## 優先度: 中 (品質・テストの信頼性)

### 5. ログにプライバシー情報を出力

**場所**: `src/routes/workbooks/create/+page.server.ts:71`

workbook タイトルとユーザー ID を生のままログ出力している。
`'Workbook created successfully'` のような汎用メッセージに置き換える。

### 6. `getWorkbookWithAuthor()` の null return テスト欠如

**場所**: `src/features/workbooks/services/workbooks.test.ts`

null を返すパスが直接テストされていない。

### 7. タイブレーク用テストフィクスチャが実際にタイを作っていない

**場所**: `src/features/workbooks/utils/workbooks.test.ts:269-299`

Q7 が 5 回、Q6 が 1 回 → 同率条件がないため、タイブレークのコードパスが実行されない。

### 8. フィルタ後のアサーションが無意味

**場所**: `tests/workbooks_list.test.ts:33-44`

フィルタボタンクリック後に「ボタンが見えている」を再アサート（クリック前から見えていた）。
アクティブフィルタの状態やリスト内容を検証すべき。

### 9. フィクスチャ不在時のテストスキップで回帰が隠れる

**場所**: `tests/workbooks_list.test.ts:61-69, 96-103`

フィクスチャデータがない場合にテストをスキップする実装になっており、
データ不足でも回帰が検出されない。決定論的なシードデータを使うべき。

---

## 優先度: 低 (typo・スタイル)

| #   | 内容                                                                           | 場所                                                                                   |
| --- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| 10  | CSSクラス typo `ext-left` → `text-left` (3箇所)                                | `CreatedByUserTable.svelte:36`, `CurriculumTable.svelte:26`, `SolutionTable.svelte:28` |
| 11  | object shorthand: `workbooks: workbooks` → `workbooks`                         | `src/routes/workbooks/+page.server.ts:31`                                              |
| 12  | `?? []` を毎回アロケーション → 共有定数 `EMPTY_TASK_RESULTS` に                | `src/features/workbooks/utils/workbooks.ts:132`                                        |
| 13  | E2E セレクタ `.nth(1)` が壊れやすい → `data-testid` を使う                     | `tests/helpers/auth.ts:21`                                                             |
| 14  | skills instructions の typo: `"Categories each as:"` → `"Categorize each as:"` | `.claude/skills/session-close/instructions.md:52`                                      |
