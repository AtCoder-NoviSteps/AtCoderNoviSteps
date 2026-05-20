# ±0 相対評価バッジ表示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** diff=0（ユーザ投票中央値と運営グレードが一致）のとき、グレードアイコン右上に緑色の `±0` バッジを表示する。

**Architecture:** `getRelativeEvaluationLabel` が diff=0 で `'±0'` を返すよう変更し、対応するバッジ色・ツールチップ文言をユーティリティ関数に追加する。`RelativeEvaluationBadge.svelte` は `{#if label}` で表示制御しており `'±0'` は truthy なため、コンポーネント本体の変更は不要。

**Tech Stack:** TypeScript, Svelte 5 (Runes), Vitest, Tailwind CSS v4

---

## File Map

| Action | File | 変更内容 |
|--------|------|----------|
| Modify | `src/features/votes/utils/relative_evaluation.ts` | `getRelativeEvaluationLabel(0)` → `'±0'`、`getRelativeEvaluationBadgeColorClass(0)` → グリーン、`getRelativeEvaluationTooltipText('±0')` → 日本語文言追加 |
| Modify | `src/features/votes/utils/relative_evaluation.test.ts` | diff=0 のアサーション更新・追加 |

---

### Task 1: テストを更新して失敗させる

**Files:**
- Modify: `src/features/votes/utils/relative_evaluation.test.ts`

- [ ] **Step 1: `getRelativeEvaluationLabel(0)` のアサーションを `'±0'` に変更する**

`src/features/votes/utils/relative_evaluation.test.ts` の `describe('getRelativeEvaluationLabel')` ブロック内にある diff=0 のテストを探す：

```typescript
test('returns "" for diff === 0', () => {
  expect(getRelativeEvaluationLabel(0)).toBe('');
});
```

これを以下に置き換える：

```typescript
test('returns "±0" for diff === 0', () => {
  expect(getRelativeEvaluationLabel(0)).toBe('±0');
});
```

- [ ] **Step 2: `getRelativeEvaluationBadgeColorClass(0)` のアサーションをグリーンクラスに変更する**

同ファイルの `describe('getRelativeEvaluationBadgeColorClass')` ブロック内にある diff=0 のテストを探す：

```typescript
test('returns empty string for diff === 0 (badge not shown)', () => {
  expect(getRelativeEvaluationBadgeColorClass(0)).toBe('');
});
```

これを以下に置き換える：

```typescript
test('returns green bg classes for diff === 0 (neutral)', () => {
  expect(getRelativeEvaluationBadgeColorClass(0)).toBe(
    'bg-green-500 text-white dark:bg-green-600 dark:text-white',
  );
});
```

- [ ] **Step 3: `getRelativeEvaluationTooltipText('±0')` のテストを追加する**

同ファイルの `describe('getRelativeEvaluationTooltipText')` ブロック内に以下を追加する（既存の `test('returns "" for empty string ...')` の直後が適切）：

```typescript
test('returns tooltip text for ±0 (neutral match)', () => {
  expect(getRelativeEvaluationTooltipText('±0')).toBe('ユーザは「ふつう」と評価');
});
```

- [ ] **Step 4: テストを実行して失敗を確認する**

```bash
pnpm test:unit src/features/votes/utils/relative_evaluation.test.ts
```

期待される出力: 3 つのテストが FAIL（`getRelativeEvaluationLabel`、`getRelativeEvaluationBadgeColorClass`、`getRelativeEvaluationTooltipText` それぞれ）

---

### Task 2: 実装を変更してテストを通す

**Files:**
- Modify: `src/features/votes/utils/relative_evaluation.ts`

- [ ] **Step 1: `getRelativeEvaluationLabel` の diff=0 分岐を `'±0'` に変更する**

`src/features/votes/utils/relative_evaluation.ts` の `getRelativeEvaluationLabel` 関数内：

変更前：
```typescript
if (diff === 0) {
  return '';
}
```

変更後：
```typescript
if (diff === 0) {
  return '±0';
}
```

- [ ] **Step 2: `getRelativeEvaluationBadgeColorClass` の diff=0 分岐にグリーンを返すよう変更する**

同ファイルの `getRelativeEvaluationBadgeColorClass` 関数内の末尾 `return '';`：

変更前：
```typescript
export function getRelativeEvaluationBadgeColorClass(diff: number): string {
  if (diff < 0) {
    return 'bg-sky-400 text-white dark:bg-sky-500 dark:text-white';
  }
  if (diff > 0) {
    return 'bg-orange-400 text-white dark:bg-orange-500 dark:text-white';
  }
  return '';
}
```

変更後：
```typescript
export function getRelativeEvaluationBadgeColorClass(diff: number): string {
  if (diff < 0) {
    return 'bg-sky-400 text-white dark:bg-sky-500 dark:text-white';
  }
  if (diff > 0) {
    return 'bg-orange-400 text-white dark:bg-orange-500 dark:text-white';
  }
  return 'bg-green-500 text-white dark:bg-green-600 dark:text-white';
}
```

- [ ] **Step 3: `getRelativeEvaluationTooltipText` に `'±0'` ケースを追加する**

同ファイルの `getRelativeEvaluationTooltipText` 関数の switch 文に `'±0'` ケースを追加する：

変更前：
```typescript
export function getRelativeEvaluationTooltipText(label: string): string {
  switch (label) {
    case '++':
      return 'ユーザは「難しい」と評価';
    case '+':
      return 'ユーザは「やや難しい」と評価';
    case '-':
      return 'ユーザは「やや易しい」と評価';
    case '--':
      return 'ユーザは「易しい」と評価';
    default:
      return '';
  }
}
```

変更後：
```typescript
export function getRelativeEvaluationTooltipText(label: string): string {
  switch (label) {
    case '++':
      return 'ユーザは「難しい」と評価';
    case '+':
      return 'ユーザは「やや難しい」と評価';
    case '±0':
      return 'ユーザは「ふつう」と評価';
    case '-':
      return 'ユーザは「やや易しい」と評価';
    case '--':
      return 'ユーザは「易しい」と評価';
    default:
      return '';
  }
}
```

- [ ] **Step 4: テストを実行してすべて通ることを確認する**

```bash
pnpm test:unit src/features/votes/utils/relative_evaluation.test.ts
```

期待される出力: 全テスト PASS

- [ ] **Step 5: ユニットテスト全体を実行してリグレッションがないことを確認する**

```bash
pnpm test:unit
```

期待される出力: 全テスト PASS

- [ ] **Step 6: TSDoc コメントを更新する**

`getRelativeEvaluationLabel` 関数の TSDoc テーブル内の diff=0 行を更新する：

変更前：
```
 * |  0     | `""`  |
```

変更後：
```
 * |  0     | `±0`  |
```

`getRelativeEvaluationBadgeColorClass` 関数の TSDoc を更新する：

変更前：
```
 * Returns empty string for diff === 0 (badge is not shown).
```

変更後（関数説明の末尾行）：
```
 * Zero diff (neutral) → green.
```

- [ ] **Step 7: コミットする**

```bash
git add src/features/votes/utils/relative_evaluation.ts src/features/votes/utils/relative_evaluation.test.ts
git commit -m "feat: show ±0 badge when vote median matches official grade"
```
