# PR #3281 AI Review 批判的検証: refactor: Extract workbook list and add tests

Source: https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/3281
Reviewer: coderabbitai[bot]

---

## 検証結果サマリー

| #     | AI評価           | 実際                                                            | 対応                              |
| ----- | ---------------- | --------------------------------------------------------------- | --------------------------------- |
| 1     | 要修正           | **AI が誤り** — `admin`/`guest` は `prisma/users.ts` で定義済み | 対応不要 (別途クリーンアップ検討) |
| 2     | 要修正           | 正しい (ドキュメント確認待ち)                                   | 要確認後修正                      |
| 3     | 要修正           | 正しい (コード確認)                                             | 要修正                            |
| 4     | 要修正           | **AI が誤り** — 意図的設計                                      | 対応不要                          |
| 5     | 要修正           | 正しい + サービス層にも重複あり                                 | 要修正                            |
| 6     | テスト欠如       | 正しい (`getWorkbookWithAuthor` 未テスト)                       | テスト追加                        |
| 7     | テスト欠如       | 正しい (コメントと実装が不一致)                                 | テスト修正                        |
| 8     | アサーション弱い | 正しい                                                          | テスト修正                        |
| 9     | テスト不安定     | 正しいが fixture なしでは困難                                   | 保留                              |
| 10-14 | typo/スタイル    | 正しい                                                          | 修正                              |

---

## 詳細検証

### #1 E2E テスト: ログインユーザー名のミスマッチ — **AI が誤り、対応不要**

**AI の主張**: `auth.ts` が `'admin'`/`'guest'` を使うが、seed は `'admin_test'`/`'guest_test'` のみ。

**実際**:

- `prisma/users.ts` に `admin` / `guest` が定義されており、`prisma/seed.ts` がこれを import して seed している
- `auth.ts` の `'admin'`/`'guest'` は正しい

**別途クリーンアップ候補** (このPRとは無関係):

- `prisma/users_for_test.ts` の `admin_test`/`guest_test` は `tests/global.setup.ts` / `tests/global.teardown.ts` で seed/削除されているが、どのテストでも使われていない
- `users_for_test.ts`、`global.setup.ts`、`global.teardown.ts` は実質デッドコード

---

### #2 `$effect` 内の `get(store)` が非リアクティブ — 要修正

**場所**: `CurriculumWorkBookList.svelte:59-65`

`taskGradesByWorkBookTypeStore` は Svelte 4 の `writable` ストア。
`$effect` 内で `get(store)` を呼ぶと snapshot 取得のみで、ストア更新時に effect は再実行されない。

**Svelte 5 ドキュメントで確認済み** (`$effect` の "Understanding dependencies" セクション):
`$effect` はシグナルグラフへの読み取りをインターセプトして依存関係を追跡する。
`get()` はこのインターセプトをバイパスするため、依存として登録されない。
`$store` 自動サブスクライブ構文を使うと内部で `subscribe` が呼ばれ、シグナルグラフに参照が登録される。

修正案:

```svelte
$effect(() => {
  // get() → $store に変更することでストア更新時に再実行される
  const grade = $taskGradesByWorkBookTypeStore.get(WorkBookType.CURRICULUM) ?? TaskGrade.Q10;

  if (grade) {
    selectedGrade = grade;
  }
});
```

---

### #3 keyed `{#each}` の欠如 — 要修正

**場所**:

- `CurriculumTable.svelte:33`
- `SolutionTable.svelte:35`
- `CreatedByUserTable.svelte:43`

いずれも `{#each workbooks as workbook}` でキーなし。さらに内側に `{#if canRead(...)}` があるため、
フィルタ適用時に DOM の再利用が誤った要素にマッチする可能性が高い。

---

### #4 slug バリデーション不整合 — **AI が誤り、対応不要**

**AI の主張**: `load` は BAD_REQUEST、`action` は NOT_FOUND で不整合。

**実際**: 意図的な設計。

- `load` (line 27-29): 不正な形式の slug → `BAD_REQUEST` が正確（クライアントの入力エラー）
- `load` (line 31-35): 形式は正しいが存在しない → `NOT_FOUND` が正確
- `action` (line 95-98): `getWorkbookWithAuthor(slug)` が null → `NOT_FOUND` を返す

`action` で slug が不正形式の場合、`parseWorkBookId` / `parseWorkBookUrlSlug` が両方 null を返し
`getWorkbookWithAuthor` が null を返すため、`NOT_FOUND` になる。
セキュリティ上も action では詳細なエラー種別を隠すことが適切で、これは意図した動作。

---

### #5 ログにプライバシー情報を出力 — 要修正

**場所**: `src/routes/workbooks/create/+page.server.ts:71`

```typescript
console.log(`Created workbook "${workBook.title}" by user ${author.id}`);
```

さらに、サービス層 `workbooks.ts:158` にも重複した title ログがある:

```typescript
console.log(`Created workbook with title: ${newWorkBook.title}`);
```

ルート層のログを削除し、サービス層のログを汎用メッセージ `'Workbook created successfully'` に変更。

---

### #6 `getWorkbookWithAuthor` の null return テスト欠如 — テスト追加

`workbooks.test.ts` は `getWorkbookWithAuthor` を一切テストしていない。
null return パス（workbook が見つからない）と、author 存在確認のパスを追加する。

---

### #7 タイブレーク用テストのコメントと実装が不一致 — テスト修正

**場所**: `src/features/workbooks/utils/workbooks.test.ts:269-299`

コメント: `"Q7: 5 tasks, Q6: 5 tasks with same frequency → return easier Q7"`
実際の tasksMapByIds: Q8:2, Q7:5, Q6:**1** — Q6 は 1 件のみでタイが発生していない。

テスト結果 (Q7 が返る) は正しいが、タイブレークのコードパスを通っていない。
Q6 のタスクを追加して真のタイ（Q7:N, Q6:N）を作るか、テスト名/コメントを実態に合わせる。

---

### #8 フィルタ後のアサーションが弱い — テスト修正

**場所**: `tests/workbooks_list.test.ts:33-44`

```typescript
// クリック後のアサーション
await expect(page.getByRole('button', { name: '9Q' })).toBeVisible({ timeout: TIMEOUT });
```

9Q ボタンはクリック前から見えていた。アクティブ状態（CurriculumWorkBookList.svelte:94-97 で
`text-primary-700` クラスが付与される）を検証すべき。

---

### #9 fixture 不在時のテストスキップ — 保留

**場所**: `tests/workbooks_list.test.ts:61-69, 96-103`

補充問題集や特定グレードのワークブックが seed に存在しない場合にスキップする実装。
seed を拡充して決定論的にすれば解決できるが、fixture データの保証が難しい現状では保留。

---

### #10-14 typo・スタイル — 修正

| #   | 内容                                                                              | 場所                                                                                   |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 10  | CSSクラス typo `ext-left` → `text-left` (3箇所)                                   | `CurriculumTable.svelte:26`, `CreatedByUserTable.svelte:36`, `SolutionTable.svelte:28` |
| 11  | object shorthand: `workbooks: workbooks` → `workbooks` (4箇所)                    | `src/routes/workbooks/+page.server.ts:31-34`                                           |
| 12  | `?? []` を毎回アロケーション → 共有定数 `EMPTY_TASK_RESULTS`                      | `src/features/workbooks/utils/workbooks.ts:132`                                        |
| 13  | E2E セレクタ `.nth(1)` → `getByRole('button', { name: 'ログイン' })` で十分か確認 | `tests/helpers/auth.ts:21`                                                             |
| 14  | skill typo: `"Categories each as:"` → `"Categorize each as:"`                     | `.claude/skills/session-close/instructions.md:52`                                      |

---

## TODO リスト (優先度順)

### 優先度: 高

- [ ] **#3** 3ファイルの `{#each}` に `(workbook.id)` キーを追加
  - 根拠: `{#if canRead(...)}` との組み合わせでフィルタ時に DOM 不整合が起きる

### 優先度: 中

- [ ] **#2** `$effect` 内の `get(taskGradesByWorkBookTypeStore)` を `$taskGradesByWorkBookTypeStore` に変更
  - 根拠: Svelte 5 ドキュメント確認済み — `get()` は `$effect` のシグナル追跡をバイパスするため非リアクティブ

- [ ] **#5** `create/+page.server.ts:71` の `console.log` を削除
  - 根拠: サービス層 (`workbooks.ts:158`) に同等のログがあり重複。title の直接ログは不要

- [ ] **#6** `workbooks.test.ts` に `getWorkbookWithAuthor` のテストを追加
  - null return (workbook 未存在)
  - author 存在確認 (`isExistingAuthor` true/false)

- [ ] **#7** タイブレーク用テスト (line 269-299) を実際のタイ状態に修正
  - 根拠: コメントと実装が不一致。Q6 タスクを追加して Q7:N と Q6:N の同数を作る

- [ ] **#8** `workbooks_list.test.ts:43` のアサーションを強化
  - 9Q ボタンの active 状態 (`text-primary-700` クラス) を確認する

### 優先度: 低

- [ ] **#10** `ext-left` → `text-left` (3ファイル)
- [ ] **#11** object shorthand (4箇所) in `+page.server.ts`
- [ ] **#12** `getTaskResult` の `?? []` を定数化
- [ ] **#13** `.nth(1)` セレクタを調査し `data-testid` 等に変更の要否確認
- [ ] **#14** `.claude/skills/session-close/instructions.md:52` typo 修正
