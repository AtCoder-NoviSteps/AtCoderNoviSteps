# Zod 4 の enum 構文への置き換え（#4231）

## 概要

Zod 4 で非推奨になった `z.nativeEnum()` が 4 か所に残っている。
votes のスキーマには Zod 3 形式の `{ message }` も 1 か所ある。
これらを Zod 4 の構文（`z.enum()` / `.exclude()`）に置き換える。
再発防止として `coding-style.md` の Validation 行に 1 行追記する。

対象:

- `src/features/workbooks/zod/schema.ts:38` `workBookType: z.nativeEnum(WorkBookType)`
- `src/features/workbooks/zod/schema.ts:69` `taskGrade: z.nativeEnum(TaskGrade).nullable()`
- `src/features/workbooks/zod/schema.ts:70` `solutionCategory: z.nativeEnum(SolutionCategory).nullable()`
- `src/features/votes/zod/schema.ts:7-8` `z.nativeEnum(TaskGrade).refine(..., { message })`

調査で確認したこと:

- `z.nativeEnum` はこの 4 か所だけで使われている。Zod の `{ message }` も votes の 1 か所だけである（`src/**/zod/` 以外の `message:` は SvelteKit の `fail()` やフォームのメッセージで、Zod とは関係ない）。
- `.email()`、`errorMap`、`invalid_type_error` など、ほかの Zod 3 時代の非推奨 API は `src/` に残っていない。
- Zod 4.6.7 の `z.enum()` は、enum 風のオブジェクト（`{ [key in X]: key }` 形式の自前定数や Prisma の enum オブジェクト）をそのまま受け取れる。
- `z.enum(TaskGrade).exclude([TaskGrade.PENDING])` を Node で実行して確かめた。Q11 と D6 は通る。PENDING、`'INVALID'`、`null` はどれも `invalid_value` として拒否される。
- votes の PENDING 用エラー文言（`'Cannot vote for PENDING grade'`）は UI に表示されない（ルートは `fail(BAD_REQUEST, { form })` を返すだけで、`grade` のエラーを描画していない）。
- 不正な `workBookType` を拒否するテストがまだない（`taskGrade` と `solutionCategory` にはある）。

## 設計判断

### workbooks: `z.nativeEnum(X)` を `z.enum(X)` に置き換える

Zod 4 では `z.nativeEnum` は `z.enum` の非推奨エイリアスで、実行時の挙動と推論型は変わらない。
変更は呼び出し名だけで、`.nullable()` もそのまま使える。

### votes: `.refine()` をやめて `.exclude([TaskGrade.PENDING])` を使う

```typescript
grade: z.enum(TaskGrade).exclude([TaskGrade.PENDING]),
```

- 「PENDING を除いた選択肢」をスキーマの宣言だけで表せる。
- 推論型 `VoteAbsoluteGradeInput['grade']` から PENDING が外れる。投票処理（`vote_actions.ts`）の受け取り側では型が狭まるだけなので、呼び出し側を変える必要はない。
- カスタム文言は付けず、Zod 既定の `Invalid option: expected one of ...` に任せる。`.exclude()` に `error` を渡すと、PENDING 以外の不正値（`'INVALID'` や `null`）にも同じ文言が出てしまうためである。もともと UI に出ていない文言なので、ユーザーから見た変化はない。
- PENDING を拒否したときのエラーコードは `custom` から `invalid_value` に変わる。このコードに依存するコードはない。

### 再発防止: `coding-style.md` の Validation 行に追記する

いまの lint 設定には非推奨 API を検出するルールがない。
Validation 行の制約に「enum は `z.enum()`（`z.nativeEnum()` は使わない）、エラー文言は `{ error }`（`{ message }` は使わない）」を足す。

## 採用しなかった案

- **votes で `.refine()` を残し、`{ message }` を `{ error }` に変えるだけにする**: 差分は最小で文言も残る。しかし推論型に PENDING が残り、Zod 4 の書き方としても冗長なので採用しなかった（ユーザーの判断）。
- **`.exclude()` に `error: 'Cannot vote for PENDING grade'` を渡す**: 不正値全般に PENDING 用の文言が出て誤解を招くため、採用しなかった。
- **型情報付き lint の `no-deprecated` を導入する**: ESLint または oxlint を型情報付きで動かす必要があり、lint の実行時間と設定変更の規模が大きい。この Issue の範囲を超えるため見送る（必要なら別 Issue にする）。
- **votes の `TaskGrade` の import 元を `@prisma/client` から `#lib/types/task.js` にそろえる**: 挙動は同じで、この Issue の目的とは関係ないため見送る。

## フェーズ

### Phase 1: workbooks の 3 か所を置き換える（リスク低）

- レイヤー: Validation（`src/features/workbooks/zod/`）
- 責務: workbook 関連の enum フィールドを Zod 4 の構文で検証する
- テスト（先に追加する）: `src/features/workbooks/zod/schema.test.ts` の `describe('an incorrect workbook is given')` に次を追加する
  - `test('when an invalid workbook type is given', ...)`。`workBookType: 'INVALID' as WorkBookType` を渡し、`success` が `false` になることを確かめる
  - 置き換え前のコードでも通る特性テストである。置き換え後に挙動が変わっていないことの保証に使う
- 実装: 3 か所の `z.nativeEnum(` を `z.enum(` に置き換える
- 確認: `pnpm test:unit`、`pnpm check`
- コミット: `refactor(workbooks): replace deprecated z.nativeEnum with z.enum (#4231)`

### Phase 2: votes を `.exclude()` に置き換える（リスク低〜中: 推論型とエラーコードが変わる）

- レイヤー: Validation（`src/features/votes/zod/`）
- 責務: 投票できるグレード（PENDING 以外）だけを受け付ける
- テスト: `src/features/votes/zod/schema.test.ts` の既存ケースで十分である
  - `PENDING grade is rejected`、`unknown grade string is rejected`、`null grade is rejected`、`Q11 (first valid grade) is accepted`、`D6 (last valid grade) is accepted` がそのまま回帰テストになる
  - エラーの文言とコードは契約にしないので、テストでも固定しない
- 実装: `z.nativeEnum(TaskGrade).refine(...)` を `z.enum(TaskGrade).exclude([TaskGrade.PENDING])` に置き換える
- 確認: `pnpm test:unit`、`pnpm check`（`VoteAbsoluteGradeInput` が狭まっても型エラーが出ないこと）、`e2e/votes.spec.ts`（Superforms の `zod4()` アダプタが `.exclude()` 付きのスキーマを変換できること）
- コミット: `refactor(votes): replace z.nativeEnum and refine with z.enum().exclude() (#4231)`

### Phase 3: `coding-style.md` に追記する（ドキュメントのみ）

- `docs/guides/agent-rules/coding-style.md` の Layer 表の Validation 行に、`` `z.enum()` for enums (not `z.nativeEnum()`); `{ error }` (not `{ message }`) `` を追記する
- 表の列幅は `pnpm format` で整える
- コミット: `docs: require Zod 4 enum and error syntax in validation layer (#4231)`

## 完了前の確認

- `pnpm format`、`pnpm lint`、`pnpm check`、`pnpm test:unit`、`git diff --check`
- `grep -rn 'nativeEnum' --exclude-dir=node_modules --exclude-dir=.git .` でリポジトリ全体に残りがないこと（`docs/dev-notes/` のこの計画は除く。この環境には `rg` がない）
- クロスレビュー: 対象は 5 ファイルで、認証、DB スキーマ、共有の公開インターフェースのどれにも当たらないため不要（機械的なチェックだけ通す）
