# Zod 4 の enum 構文への置き換え（#4231）

## 概要

Zod 4 で非推奨になった `z.nativeEnum()` 4 か所と、Zod 3 形式の `{ message }` 1 か所を Zod 4 の構文に置き換えた。

- workbooks（`workBookType`、`taskGrade`、`solutionCategory`）: `z.nativeEnum(X)` を `z.enum(X)` に置き換えた
- votes（`grade`）: `z.nativeEnum(TaskGrade).refine(val !== PENDING, { message })` を `z.enum(TaskGrade).exclude([TaskGrade.PENDING])` に置き換えた
- 再発防止として、`coding-style.md` の Validation 行に「enum は `z.enum()`、エラー文言は `{ error }`」を追記した

## 決定と不採用の案

- **votes は `.exclude()` を使う**: 「PENDING を除いた選択肢」をスキーマの宣言だけで表せる。推論型 `VoteAbsoluteGradeInput['grade']` からも PENDING が外れる。`.refine()` を残して `{ message }` を `{ error }` に変えるだけの案は、差分が最小で文言も残る。しかし推論型に PENDING が残り冗長なので採らなかった（ユーザー判断）
- **`.exclude()` にカスタム文言を渡さない**: `error` を渡すと、PENDING 以外の不正値（`'INVALID'` や `null`）にも同じ文言が出てしまう。以前の文言 `'Cannot vote for PENDING grade'` は UI に表示されていなかったので、Zod 既定の `Invalid option: expected one of ...` に任せた
- **再発防止はドキュメントへの 1 行追記にとどめる**: 型情報付き lint の `no-deprecated` は、ESLint または oxlint を型情報付きで動かす必要があり、規模が大きいので見送った（ユーザー判断）
- **votes の `TaskGrade` の import 元（`@prisma/client`）はそのままにする**: workbooks は `#lib/types/task.js` を使っていて不揃いだが、挙動は同じで、この Issue の目的とは関係ない

## コードと履歴からは分からない事実

- **置き換えの範囲**: 着手時点で、`z.nativeEnum` は上の 4 か所だけ、Zod の `{ message }` も votes の 1 か所だけだった。`.email()`、`errorMap`、`invalid_type_error` など、ほかの Zod 3 時代の非推奨 API は `src/` に残っていなかった
- **votes の挙動の変化**: PENDING を拒否したときのエラーコードは `custom` から `invalid_value` に、文言は Zod 既定のものに変わった。どちらにも依存するコードはない（ルートは `fail(BAD_REQUEST, { form })` を返すだけで、`grade` のエラーを描画していない）
- **検証結果**:
  - `pnpm test:unit`（2994 件）が通った。`pnpm lint` と `pnpm check` のエラーは 0 件で、`pnpm check` の警告 30 件は今回触っていないファイルのもの
  - 変異テスト: workbooks の `workBookType` を `z.string()` に変えると、追加した `when an invalid workbook type is given` だけが落ちた。votes の `.exclude()` を外すと、既存の `PENDING grade is rejected` だけが落ちた
  - Superforms の `zod4()` アダプタ経由でも、Q7 と D6 は受け付け、PENDING と `'INVALID'` は拒否されることを、Vitest の一時テストで確かめた（確認後に削除した）
  - ローカルのブラウザで投票できることを、ユーザーが確かめた
- **`pnpm format` は流していない**: `prettier --write .` は未追跡の `docs/dev-notes/` まで書き換えるため。代わりに、変更したファイルに `prettier --check` をかけて通ることを確かめた
- **E2E は実行していない**: `e2e/votes.spec.ts` は投票ボタンの表示までしか確認せず、フォームを送信しないため。投票の送信はブラウザでの確認で代えた
- **クロスレビュー**: 対象は 5 ファイルで、認証、DB スキーマ、共有の公開インターフェースのどれにも当たらないため行っていない

## 残りのタスク

なし。
