# ±0 相対評価バッジ表示機能 — 設計仕様

## 概要

ユーザ投票の中央値グレードと運営グレードの差（diff）が 0 のとき、グレードアイコン右上に `±0` バッジを表示する。現在は diff=0 のときバッジが非表示だが、「一致している」という情報を明示的に伝えるよう変更する。

## 設計根拠

- diff=0 は「ユーザの評価が運営グレードと一致」という有意な情報であり、表示しないと他の diff 値と非対称になる
- 既存の badge ロジック（`getRelativeEvaluationLabel` → `RelativeEvaluationBadge`）をそのまま流用できるため、変更箇所が最小限

## 却下した代替案

- **Option B（コンポーネント内で diff=0 を特別処理）**: `label` と `diff` の責務が混在し、変更箇所が増えるため却下
- **Option C（`showZeroBadge` prop 追加）**: 全呼び出し箇所で同じ挙動をするため YAGNI。不要な複雑性を避けて却下

## 変更対象

### `src/features/votes/utils/relative_evaluation.ts`

| 関数                                   | diff=0 の現在値 | 変更後                                                        |
| -------------------------------------- | --------------- | ------------------------------------------------------------- |
| `getRelativeEvaluationLabel`           | `''`            | `'±0'`                                                        |
| `getRelativeEvaluationBadgeColorClass` | `''`            | `'bg-green-500 text-white dark:bg-green-600 dark:text-white'` |
| `getRelativeEvaluationTooltipText`     | `''`（default） | `'ユーザは「ふつう」と評価'`（`'±0'` case 追加）              |

### `src/features/votes/components/RelativeEvaluationBadge.svelte`

- `{#if label}` ブロックは変更不要（`'±0'` は truthy）
- `--`/`++` のスペーシング処理（`-&thinsp;-`）は `±0` に不要なため追加不要
- `aria-label` / `tooltipText` は既存ロジック経由で自動的に機能する
- **ツールチップの新規表示**: 現在は diff=0 のとき `tooltipText === ''` のため `{#if showTooltip && tooltipText}` が false でツールチップ非表示だった。変更後は `tooltipText = 'ユーザは「ふつう」と評価'`（truthy）になるため、`showTooltip=true` の呼び出し箇所（`votes/+page.svelte`、`votes/[slug]/+page.svelte`、`vote_management/+page.svelte`）でツールチップが初めて表示される。これは意図した挙動変更である。

### `src/features/votes/utils/relative_evaluation.test.ts`

- `getRelativeEvaluationLabel(0)` の既存アサーション（`''`）を `'±0'` に更新
- `getRelativeEvaluationBadgeColorClass(0)` の既存アサーション（`''`）をグリーンクラスに更新（既存テスト `'returns empty string for diff === 0 (badge not shown)'` を修正）
- `getRelativeEvaluationTooltipText('±0')` → `'ユーザは「ふつう」と評価'` のテストケースを追加。`default: return ''` ブランチは変更なし（無効な label 値に対して `''` を返す挙動は維持）

## 影響範囲

`RelativeEvaluationBadge` を使う 4 箇所すべてで ±0 バッジが表示される：

- `src/features/votes/components/VotableGrade.svelte`（グレードアイコンのドロップダウントリガー）
- `src/routes/votes/+page.svelte`（投票一覧）
- `src/routes/votes/[slug]/+page.svelte`（投票詳細）
- `src/routes/(admin)/vote_management/+page.svelte`（管理画面）

**スクリーンリーダーの読み上げ**: `VotableGrade.svelte` の sr-only テキストが `, relative evaluation: ±0` を含むようになる。`±0` はほとんどのスクリーンリーダーで "plus minus zero" または "plus-minus zero" として読み上げられる。これは意図した挙動変更である。

**`calcGradeDiff` の戻り値型**: `getGradeOrder` はグレード順序を表す整数を返すため、`calcGradeDiff` は常に整数を返す。`diff === 0` の厳密等価比較は安全である。

`getRelativeEvaluationJapaneseLabel(0)` は既に `'ふつう'` を返しており変更不要。

## テスト方針

TDD: テストを先に修正・追加してから実装コードを変更する。`pnpm test:unit` で全テスト通過を確認。
