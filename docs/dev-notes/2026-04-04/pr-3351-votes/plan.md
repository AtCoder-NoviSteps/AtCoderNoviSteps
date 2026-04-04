# PR #3351 レビュー対応 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PR #3351 の AI レビュー指摘（Critical×2, Major×3, Minor×3）と目視 UI 調整（3件）をすべて解消する

**Architecture:** 既存の votes 機能ファイル群への局所修正。新ファイルは追加しない。`grade_options.ts` に純粋関数 1 件を追加してロジック重複を解消する。

**Tech Stack:** SvelteKit 2 + Svelte 5 Runes, Flowbite Svelte, TypeScript, Vitest

---

## 概要・設計方針

| #    | 指摘                                             | 分類     | 対応方針                                             |
| ---- | ------------------------------------------------ | -------- | ---------------------------------------------------- |
| 1    | SVG arc 100% セグメント描画不可                  | Critical | `arcPath()` でフルサークル検出 → デュアルアーク分割  |
| 2    | ナビバー「投票」 vs パンくず「グレード投票」     | Critical | パンくずを「投票」に統一                             |
| 3    | 空リング半径計算誤り                             | Major    | `r={OUTER_RADIUS}` → `r={RING_MID_RADIUS}`           |
| 4    | PENDING フォールバックがルートテンプレートに存在 | Major    | `resolveDisplayGrade()` を `grade_options.ts` に抽出 |
| 5    | フラスコアイコンのツールチップがキーボード非対応 | Major    | `votes/+page.svelte` を Flowbite `<Tooltip>` に置換  |
| 6    | 外部リンクに `noopener` 未設定                   | Minor    | `rel` に `noopener` を追加                           |
| 7    | 仮グレードロジック重複                           | Minor    | Task 4（`resolveDisplayGrade` 抽出）で同時解消       |
| 8    | TSDoc coverage 未達                              | Minor    | 追加された関数と既存 exports に TSDoc 補完           |
| UI-1 | テーブルのヘッダー＋本文フォントが小さい         | UI       | Flowbite override クラスでサイズアップ               |
| UI-2 | グレードアイコンが小さい                         | UI       | `GradeLabel` props をデフォルトサイズに戻す          |
| UI-3 | フラスコアイコンがグレードの右にある             | UI       | `VotableGrade.svelte` で順序入れ替え                 |

## 却下した代替案

- **Task 1 の epsilon 丸め**: `endAngle -= 0.0001` で SVG の問題を回避するアプローチ。形状が微妙にずれるため却下。デュアルアークが標準解。
- **Task 4 の `+page.svelte` 内 inline 関数化**: Svelte の `<script>` に関数を置く案。ユニットテスト不可になるため却下。
- **Task 5 の `tabindex` + `role` を `<span>` に付与**: Flowbite `<Tooltip>` を使わずアクセシブル属性だけ追加する案。詳細ページ（`[slug]/+page.svelte`）はすでに Flowbite Tooltip を使用しており、一覧ページと実装を揃えるため却下。

---

## 修正対象ファイル

| ファイル                                              | 変更種別                                                                                      |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/features/votes/utils/donut_chart.ts`             | 修正（arcPath バグ修正 + 内部関数分割）                                                       |
| `src/features/votes/utils/donut_chart.test.ts`        | 修正（フルサークルテスト追加）                                                                |
| `src/features/votes/utils/grade_options.ts`           | 修正（`resolveDisplayGrade` 追加）                                                            |
| `src/features/votes/utils/grade_options.test.ts`      | 修正（`resolveDisplayGrade` テスト追加）                                                      |
| `src/features/votes/components/VoteDonutChart.svelte` | 修正（空リング半径計算）                                                                      |
| `src/features/votes/components/VotableGrade.svelte`   | 修正（`resolveDisplayGrade` 使用、Flask 位置変更）                                            |
| `src/routes/votes/+page.svelte`                       | 修正（Flask Tooltip 化、`resolveDisplayGrade` 使用、noopener、文字サイズ、GradeLabel サイズ） |
| `src/routes/votes/[slug]/+page.svelte`                | 修正（パンくず「投票」統一、noopener、GradeLabel サイズ）                                     |

---

## Phase 1: バグ修正

### Task 1: SVG arc 100% セグメントバグ修正

**Files:**

- Modify: `src/features/votes/utils/donut_chart.ts`
- Modify: `src/features/votes/utils/donut_chart.test.ts`

SVG の `arc` コマンドは始点と終点が同一座標になるとき（全票が 1 グレードに集中）省略される。デュアルアークに分割して回避する。

- [x] **Step 1: 失敗するテストを追加**

`donut_chart.test.ts` の `describe('arcPath')` ブロックに追加:

```typescript
test('renders full-circle segment as two sub-paths to avoid degenerate arc', () => {
  const start = -Math.PI / 2;
  const end = start + 2 * Math.PI;
  const path = arcPath(100, 100, 70, 40, start, end);
  // Two M commands indicate two sub-paths (dual-arc workaround)
  const subPathCount = (path.match(/\bM\b/g) ?? []).length;
  expect(subPathCount).toBe(2);
});
```

- [x] **Step 2: テストが失敗することを確認**

```bash
pnpm test:unit src/features/votes/utils/donut_chart.test.ts
```

期待: FAIL (`subPathCount` が 1 になる)

- [x] **Step 3: `donut_chart.ts` を修正**

既存の `arcPath` 関数本体を `arcPathSegment`（非公開）に改名し、`arcPath` でフルサークル検出とデュアルアーク分割を追加。
`Point` 型を導入し、`cx/cy` を `center: Point` にまとめて引数を削減。4 頂点も意味のある名前に改める。

**注意:** `arcPath` の公開シグネチャが変わるため、`VoteDonutChart.svelte` の呼び出し側（Task 2 で修正）も合わせて更新する。

```typescript
type Point = { x: number; y: number };

/**
 * Generates SVG path data for one donut arc segment.
 * When the span covers a full circle, the path is split into two semicircular
 * arcs to avoid the SVG arc command degeneracy (start == end coordinates).
 * @param center - Center coordinates of the donut chart.
 * @param outerRadius - Outer ring radius.
 * @param innerRadius - Inner hole radius.
 * @param startAngle - Radians, clockwise from top.
 * @param endAngle - Radians, clockwise from top.
 * @returns SVG path `d` attribute string.
 */
export function arcPath(
  center: Point,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  if (endAngle - startAngle >= 2 * Math.PI - 1e-9) {
    const midAngle = startAngle + Math.PI;
    return [
      arcPathSegment(center, outerRadius, innerRadius, startAngle, midAngle),
      arcPathSegment(center, outerRadius, innerRadius, midAngle, endAngle),
    ].join(' ');
  }
  return arcPathSegment(center, outerRadius, innerRadius, startAngle, endAngle);
}

function arcPathSegment(
  center: Point,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart: Point = {
    x: center.x + outerRadius * Math.cos(startAngle),
    y: center.y + outerRadius * Math.sin(startAngle),
  };
  const outerEnd: Point = {
    x: center.x + outerRadius * Math.cos(endAngle),
    y: center.y + outerRadius * Math.sin(endAngle),
  };
  const innerEnd: Point = {
    x: center.x + innerRadius * Math.cos(endAngle),
    y: center.y + innerRadius * Math.sin(endAngle),
  };
  const innerStart: Point = {
    x: center.x + innerRadius * Math.cos(startAngle),
    y: center.y + innerRadius * Math.sin(startAngle),
  };
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  // SVG path commands per spec: M=moveto, A=arc, L=lineto, Z=closepath
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}
```

- [x] **Step 4: テストが通ることを確認**

```bash
pnpm test:unit src/features/votes/utils/donut_chart.test.ts
```

期待: PASS（既存テストも含め全件グリーン）

- [x] **Step 5: コミット**

```bash
git add src/features/votes/utils/donut_chart.ts src/features/votes/utils/donut_chart.test.ts
git commit -m "fix(votes): handle full-circle arc segment via dual-arc split"
```

---

### Task 2: 空リング（votes=0）の半径計算修正

**Files:**

- Modify: `src/features/votes/components/VoteDonutChart.svelte`

`stroke-width` 付き `<circle>` のリング中心線は `(outerRadius + innerRadius) / 2` が正しい。現状は `r={OUTER_RADIUS}` で外縁がはみ出している。`RING_MID_RADIUS` 定数が既に定義済みなのでそれを使う。

Task 1 で `arcPath` のシグネチャが `center: Point` に変わったため、呼び出し側も合わせて修正する。

- [x] **Step 1: `VoteDonutChart.svelte` の空リング `<circle>` と `arcPath` 呼び出しを修正**

`<circle>` の半径:

変更前:

```svelte
<circle cx={CX} cy={CY} r={OUTER_RADIUS} ... />
```

変更後:

```svelte
<circle cx={CX} cy={CY} r={RING_MID_RADIUS} ... />
```

`arcPath` 呼び出し（`{#each segments}` ブロック内）:

変更前:

```svelte
d={arcPath(CX, CY, OUTER_RADIUS, INNER_RADIUS, seg.startAngle, seg.endAngle)}
```

変更後:

```svelte
d={arcPath({ x: CX, y: CY }, OUTER_RADIUS, INNER_RADIUS, seg.startAngle, seg.endAngle)}
```

- [x] **Step 2: 型チェック**

```bash
pnpm check
```

期待: エラーなし

- [x] **Step 3: コミット**

```bash
git add src/features/votes/components/VoteDonutChart.svelte
git commit -m "fix(votes): use ring midpoint radius and update arcPath center arg"
```

---

## Phase 2: ロジック分離

### Task 3: PENDING フォールバックロジックを utils に抽出

**Files:**

- Modify: `src/features/votes/utils/grade_options.ts`
- Modify: `src/features/votes/utils/grade_options.test.ts`
- Modify: `src/routes/votes/+page.svelte`
- Modify: `src/features/votes/components/VotableGrade.svelte`

`votes/+page.svelte` テンプレート内の `{@const displayGrade}` 計算と、`VotableGrade.svelte` の `initialGrade` 計算が同一パターン（`PENDING ? estimatedGrade ?? grade : grade`）で重複している。`grade_options.ts` に `resolveDisplayGrade()` として抽出する。

- [x] **Step 1: `grade_options.test.ts` にテストを追加**

既存テストファイルに追記:

```typescript
import { resolveDisplayGrade, nonPendingGrades, qGrades, dGrades } from './grade_options';
import { TaskGrade } from '$lib/types/task';

describe('resolveDisplayGrade', () => {
  test('returns the grade as-is when it is not PENDING', () => {
    expect(resolveDisplayGrade(TaskGrade.Q1, TaskGrade.Q2)).toBe(TaskGrade.Q1);
  });

  test('returns estimatedGrade when grade is PENDING and estimatedGrade is provided', () => {
    expect(resolveDisplayGrade(TaskGrade.PENDING, TaskGrade.Q3)).toBe(TaskGrade.Q3);
  });

  test('returns PENDING when grade is PENDING and estimatedGrade is null', () => {
    expect(resolveDisplayGrade(TaskGrade.PENDING, null)).toBe(TaskGrade.PENDING);
  });

  test('returns PENDING when grade is PENDING and estimatedGrade is undefined', () => {
    expect(resolveDisplayGrade(TaskGrade.PENDING)).toBe(TaskGrade.PENDING);
  });
});
```

- [x] **Step 2: テストが失敗することを確認**

```bash
pnpm test:unit src/features/votes/utils/grade_options.test.ts
```

期待: FAIL（`resolveDisplayGrade` が未定義）

- [x] **Step 3: `grade_options.ts` に関数を追加**

ファイル末尾に追記:

```typescript
/**
 * Resolves the display grade for a PENDING task.
 * Returns `estimatedGrade` (median-based) when the official grade is still PENDING,
 * otherwise returns the official grade unchanged.
 * @param grade - The official task grade from the DB.
 * @param estimatedGrade - The median-based estimated grade, if available.
 * @returns The grade to display in the UI.
 */
export function resolveDisplayGrade(
  grade: TaskGrade,
  estimatedGrade?: TaskGrade | null,
): TaskGrade {
  if (grade !== TaskGrade.PENDING) {
    return grade;
  }

  return estimatedGrade ?? grade;
}
```

- [x] **Step 4: テストが通ることを確認**

```bash
pnpm test:unit src/features/votes/utils/grade_options.test.ts
```

期待: PASS

- [x] **Step 5: `votes/+page.svelte` で `resolveDisplayGrade` を使用**

`<script>` のインポートに追加:

```typescript
import { resolveDisplayGrade } from '$features/votes/utils/grade_options';
```

テンプレートの `{@const}` を置換:

変更前:

```svelte
{@const isProvisional = task.grade === TaskGrade.PENDING && task.estimatedGrade !== null}
{@const displayGrade =
  task.grade !== TaskGrade.PENDING ? task.grade : (task.estimatedGrade ?? task.grade)}
```

変更後:

```svelte
{@const displayGrade = resolveDisplayGrade(task.grade, task.estimatedGrade)}
{@const isProvisional = task.grade === TaskGrade.PENDING && displayGrade !== TaskGrade.PENDING}
```

- [x] **Step 6: `VotableGrade.svelte` で `resolveDisplayGrade` を使用**

インポートに追加:

```typescript
import { nonPendingGrades, resolveDisplayGrade } from '$features/votes/utils/grade_options';
```

`initialGrade` の計算を置換:

変更前:

```typescript
const initialGrade =
  taskResult.grade === TaskGrade.PENDING ? (estimatedGrade ?? taskResult.grade) : taskResult.grade;
```

変更後:

```typescript
const initialGrade = resolveDisplayGrade(taskResult.grade, estimatedGrade);
```

- [x] **Step 7: 型チェック**

```bash
pnpm check
```

期待: エラーなし

- [x] **Step 8: コミット**

```bash
git add src/features/votes/utils/grade_options.ts src/features/votes/utils/grade_options.test.ts \
        src/routes/votes/+page.svelte src/features/votes/components/VotableGrade.svelte
git commit -m "refactor(votes): extract resolveDisplayGrade to grade_options utility"
```

---

## Phase 3: アクセシビリティ・セキュリティ修正

### Task 4: フラスコアイコンのツールチップをキーボード対応に

**Files:**

- Modify: `src/routes/votes/+page.svelte`

現状は `title` 属性のみでキーボードユーザーが到達できない。詳細ページ（`[slug]/+page.svelte`）と同様に Flowbite `<Tooltip>` コンポーネントに置換する。

- [x] **Step 1: `votes/+page.svelte` を修正**

`<script>` のインポートに `Tooltip` を追加:

```typescript
import {
  Table,
  TableBody,
  TableBodyCell,
  TableBodyRow,
  TableHead,
  TableHeadCell,
  Input,
  Tooltip,
} from 'flowbite-svelte';
```

フラスコアイコンの `<span>` を置換。各タスク行で一意の ID が必要なため `task.task_id` を使う:

変更前:

```svelte
{#if isProvisional}
  <span
    title="3票以上集まると中央値が暫定グレードとして一覧表に反映されます。"
    class="cursor-help text-gray-500 dark:text-gray-400"
  >
    <FlaskConical class="w-4 h-4" />
  </span>
{/if}
```

変更後:

```svelte
{#if isProvisional}
  <span
    id="flask-{task.task_id}"
    class="cursor-help text-gray-500 dark:text-gray-400"
    tabindex="0"
    role="img"
    aria-label="暫定グレード"
  >
    <FlaskConical class="w-4 h-4" aria-hidden="true" />
  </span>
  <Tooltip triggeredBy="#flask-{task.task_id}" placement="top">
    3票以上集まると中央値が暫定グレードとして一覧表に反映されます。
  </Tooltip>
{/if}
```

- [x] **Step 2: 型チェック**

```bash
pnpm check
```

期待: エラーなし

- [x] **Step 3: コミット**

```bash
git add src/routes/votes/+page.svelte
git commit -m "fix(votes): make flask icon tooltip keyboard-accessible via Flowbite Tooltip"
```

---

### Task 5: 外部リンクに `noopener` を追加

**Files:**

- Modify: `src/routes/votes/+page.svelte`
- Modify: `src/routes/votes/[slug]/+page.svelte`

`noreferrer` は現代ブラウザで `noopener` を含意するが、明示的に両方指定するのが標準。

- [x] **Step 1: `votes/+page.svelte` の外部リンクを修正**

変更前 (行 106):

```svelte
rel="noreferrer external"
```

変更後:

```svelte
rel="noopener noreferrer external"
```

- [x] **Step 2: `votes/[slug]/+page.svelte` の外部リンクを修正**

変更前 (行 53):

```svelte
rel="noreferrer external"
```

変更後:

```svelte
rel="noopener noreferrer external"
```

- [x] **Step 3: コミット**

```bash
git add src/routes/votes/+page.svelte src/routes/votes/[slug]/+page.svelte
git commit -m "fix(votes): add noopener to external link rel attributes"
```

---

### Task 6: ナビバーラベル統一（パンくず「グレード投票」→「投票」）

**Files:**

- Modify: `src/routes/votes/[slug]/+page.svelte`

ナビバーは「投票」（`navbar-links.ts`）、詳細ページのパンくずは「グレード投票」で不整合。パンくずを「投票」に統一する。

- [x] **Step 1: `[slug]/+page.svelte` のパンくずを修正**

変更前:

```svelte
<a href={resolve('/votes', {})} class="hover:underline">グレード投票</a>
```

変更後:

```svelte
<a href={resolve('/votes', {})} class="hover:underline">投票</a>
```

- [x] **Step 2: コミット**

```bash
git add src/routes/votes/[slug]/+page.svelte
git commit -m "fix(votes): unify nav label from 'グレード投票' to '投票' in breadcrumb"
```

---

## Phase 4: UI 調整

### Task 7: テーブルのヘッダー＋本文フォントサイズを大きく

**Files:**

- Modify: `src/routes/votes/+page.svelte`

Flowbite の `TableHeadCell` はデフォルト `text-xs uppercase`、`TableBodyCell` は `text-sm`。それぞれ一段階大きくする。空メッセージ（検索前・結果なし）はそのまま。

- [x] **Step 1: `votes/+page.svelte` のテーブルヘッダーを修正**

各 `TableHeadCell` に `class="text-sm"` を追加:

```svelte
<TableHead>
  <TableHeadCell class="text-sm">グレード</TableHeadCell>
  <TableHeadCell class="text-sm">問題名</TableHeadCell>
  <TableHeadCell class="text-sm">出典</TableHeadCell>
  <TableHeadCell class="text-sm">票数</TableHeadCell>
</TableHead>
```

- [x] **Step 2: テーブル本文セルを修正**

データ行の `TableBodyCell` に `class="text-base"` を追加（空メッセージ行は除く）:

```svelte
<TableBodyCell class="text-base">
  <!-- グレードセル内容 -->
</TableBodyCell>
<TableBodyCell class="text-base">
  <!-- 問題名セル内容 -->
</TableBodyCell>
<TableBodyCell class="text-base">{getContestNameLabel(task.contest_id)}</TableBodyCell>
<TableBodyCell class="text-base">{task.voteTotal}</TableBodyCell>
```

- [x] **Step 3: 型チェック**

```bash
pnpm check
```

- [x] **Step 4: コミット**

```bash
git add src/routes/votes/+page.svelte
git commit -m "style(votes): increase table header and body font size"
```

---

### Task 8: グレードアイコンサイズを workbooks ページと同じに

**Files:**

- Modify: `src/routes/votes/+page.svelte`
- Modify: `src/routes/votes/[slug]/+page.svelte`

現状: `defaultPadding={0.25} defaultWidth={6} reducedWidth={6}`（小さい）
変更後: `GradeLabel` のデフォルト props（`defaultPadding=1, defaultWidth=10, reducedWidth=8`）を使用

- [x] **Step 1: `votes/+page.svelte` の `GradeLabel` を修正**

変更前:

```svelte
<GradeLabel taskGrade={displayGrade} defaultPadding={0.25} defaultWidth={6} reducedWidth={6} />
```

変更後（props を省略してデフォルト値を使用）:

```svelte
<GradeLabel taskGrade={displayGrade} />
```

- [x] **Step 2: `[slug]/+page.svelte` の `GradeLabel` を修正**

変更前 (行 49):

```svelte
<GradeLabel taskGrade={displayGrade} defaultPadding={0.25} defaultWidth={6} reducedWidth={6} />
```

変更後:

```svelte
<GradeLabel taskGrade={displayGrade} />
```

- [x] **Step 3: 型チェック**

```bash
pnpm check
```

- [x] **Step 4: コミット**

```bash
git add src/routes/votes/+page.svelte src/routes/votes/[slug]/+page.svelte
git commit -m "style(votes): use default GradeLabel size to match workbooks page"
```

---

### Task 9: フラスコアイコンの位置をグレードの左に変更

**Files:**

- Modify: `src/features/votes/components/VotableGrade.svelte`

`VotableGrade.svelte` では現在フラスコアイコンがグレードボタンの右に表示されている。左に移動する。

`votes/+page.svelte`（一覧ページの直接表示）はすでにフラスコが左側にあるため変更不要。

- [x] **Step 1: `VotableGrade.svelte` の順序を入れ替える**

変更前:

```svelte
<div class="inline-flex items-center gap-1">
  <button ...>
    <GradeLabel ... />
    <!-- Overlay -->
  </button>

  {#if isProvisional}
    <FlaskConical
      class="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500"
      aria-label="暫定グレード"
    />
  {/if}
</div>
```

変更後:

```svelte
<div class="inline-flex items-center gap-1">
  {#if isProvisional}
    <FlaskConical
      class="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500"
      aria-label="暫定グレード"
    />
  {/if}

  <button ...>
    <GradeLabel ... />
    <!-- Overlay -->
  </button>
</div>
```

- [x] **Step 2: 型チェック**

```bash
pnpm check
```

- [x] **Step 3: コミット**

```bash
git add src/features/votes/components/VotableGrade.svelte
git commit -m "style(votes): move flask icon to the left of grade label in VotableGrade"
```

---

## Phase 5: ドキュメント補完

### Task 10: TSDoc 補完

**Files:**

- Modify: `src/features/votes/utils/grade_options.ts`

`grade_options.ts` のエクスポート定数（`nonPendingGrades`, `qGrades`, `dGrades`）に TSDoc を追加する（`resolveDisplayGrade` は Task 3 で追加済み）。

- [x] **Step 1: `grade_options.ts` の定数に TSDoc を追加**

```typescript
/** All task grades excluding PENDING, in display order (Q11 → D6). */
export const nonPendingGrades = taskGradeValues.filter((grade) => grade !== TaskGrade.PENDING);

/** Q-tier grades only (Q11 → Q1). */
export const qGrades = nonPendingGrades.filter((grade) => grade.startsWith('Q'));

/** D-tier grades only (D1 → D6). */
export const dGrades = nonPendingGrades.filter((grade) => grade.startsWith('D'));
```

- [x] **Step 2: 全テスト実行**

```bash
pnpm test:unit
```

期待: PASS

- [x] **Step 3: lint チェック**

```bash
pnpm lint
```

期待: エラーなし

- [x] **Step 4: コミット**

```bash
git add src/features/votes/utils/grade_options.ts
git commit -m "docs(votes): add TSDoc to grade_options exports"
```

---

## 検証方法

```bash
# ユニットテスト
pnpm test:unit

# 型チェック
pnpm check

# lint
pnpm lint

# 開発サーバーで目視確認
pnpm dev
# → http://localhost:5174/votes
# - 全票が 1 グレードの問題: ドーナツが正しく描画されること
# - votes=0 の状態: 空リングサイズが正しいこと
# - フラスコアイコンにキーボードフォーカスが当たること (Tab キー)
# - 外部リンクのツールチップ・キーボードナビが動作すること
# - パンくずが「投票」であること
# - グレードアイコンが workbooks ページと同じサイズであること
```

## CodeRabbit Findings

### potential_issue (medium)

---

**File:** `src/features/votes/utils/donut_chart.ts` Line 32–71 / 86–101

> コーディングガイドラインにより、src//*utils/ 配下の各関数には隣接するユニットテストが必要です。buildDonutSegments と arcPath のテストを追加してください。

**判断:** 誤検知。`donut_chart.test.ts` が同ディレクトリに存在し、`buildDonutSegments` / `arcPath` の両関数をテスト済み（10件）。

---

**File:** `src/routes/votes/+page.svelte` Line 78–88

> #flask-{task.task_id} で task_id に . や : 等が含まれると triggeredBy のセレクタが壊れる可能性がある。AtCoderのIDは通常安全だが、念のため確認を。

**判断:** 対応不要。task_id は英数字＋アンダースコアのみで構成され、`.` や `:` は含まれない。

---

**File:** `src/routes/votes/[slug]/+page.svelte` Line 35

> resolve() の第2引数 {} は不要。SvelteKit の resolve() は単一のパス文字列のみを受け取ります。

**判断:** 誤検知。プロジェクトの `.claude/rules/sveltekit.md` に記載の通り、TypeScript 宣言マージによる型エラー回避のため静的ルートには `{}` を第2引数として渡す規約がある。

---

## CodeRabbit Findings（目視レビュー後 2026-04-04）

### potential_issue (medium)

---

**File:** `src/features/votes/utils/donut_chart.ts` Line 61

> Math.round(ratio * 100) は合計が100にならない場合があります（例: 3等分 → 33+33+33=99）。

**判断:** 対応済み。`Math.round(ratio * 1000) / 10` に変更し小数点1桁表示（33.3%）。CodeRabbit が修正後のコードを未反映。

---

**File:** `src/features/votes/utils/donut_chart.ts` Line 1–136、Line 86–101

> コーディングガイドラインにより、buildDonutSegments / buildArcPath のテストを追加してください。

**判断:** 誤検知。`donut_chart.test.ts` が同ディレクトリに存在し、全3関数をテスト済み（37件）。

---

**File:** `src/routes/votes/+page.svelte` Line 86–88

> task_id に . や # 等の CSS セレクタ特殊文字が含まれると Tooltip が動作しなくなります。

**判断:** 対応不要（3回目）。AtCoder の task_id は英数字＋アンダースコア＋ハイフンのみ。

---

**File:** `src/routes/votes/+page.svelte` Line 36–39

> 検索プレースホルダーは「出典」と表示されるが、実際は `contest_id` の生値でフィルタしており、`getContestNameLabel` の結果（人間が読める名称）では検索できない。

**判断:** ユーザー判断を仰ぐ。`getContestNameLabel(t.contest_id).toLowerCase()` を filter に追加するか、プレースホルダーを実態に合わせて変更するか。

---

### nitpick（PR CI で再指摘される可能性）

---

**File:** `src/features/votes/components/VoteDonutChart.svelte` Line 14–17

> `VotedGradeCounters` は一度しか使わない局所エイリアスで冗長。`VotedGradeCounter[]` を直接使うべき。

**判断:** plural alias ルール（AGENTS.md）に従い追加済み。CodeRabbit との見解相違。`counters: VotedGradeCounter[]` に戻してもよい。

---

**File:** `src/features/votes/utils/donut_chart.test.ts` Line 10–11

> `getColor` / `getLabel` の引数型が `string` だが `TaskGrade` に変えると型安全性が向上。

**判断:** 妥当。`buildDonutSegments` の引数型に合わせて `TaskGrade` に変更できる。

---

## 目視レビュー所見（2026-04-04）

Phase 1–5 完了後に目視レビューを実施。rules 違反・設計改善・却下判断を記録する。

---

### Rules 違反（必ず修正）

#### `donut_chart.ts`

- [x] `pct: number` → `percentage: number`（略称禁止）
- [x] `DonutSegment.grade: string` → `grade: TaskGrade`（domain type 必須）
- [x] `buildDonutSegments` の引数 `grades: string[]` → `TaskGrade[]`
- [x] `buildDonutSegments` の引数 `counters: { grade: string; ... }[]` → `grade: TaskGrade`
- [x] `getColor: (grade: string)` → `(grade: TaskGrade)`
- [x] `getLabel: (grade: string)` → `(grade: TaskGrade)`
- [x] `counters.reduce((sum, c) => ...)` → `(sum, counter) =>`（一文字変数禁止）
- [x] `counters.map((c) => ...)` → `(counter) =>`（同上）
- [x] `DonutSegment[]` を関数シグネチャで直接使用 → `type DonutSegments = DonutSegment[]` を定義して使う（plural alias 必須）

#### `donut_chart.test.ts`

- [x] `it(...)` → `test(...)` に全件置換（`test` 統一ルール）
- [x] `const GRADE_A = 'Q1'` → `const GRADE_A = TaskGrade.Q1`（domain type 必須）
- [x] `const GRADE_B = 'Q2'` → `const GRADE_B = TaskGrade.Q2`（同上）
- [x] `const getColor = (g: string)` → `(grade: string)`（一文字変数禁止）
- [x] `const getLabel = (g: string)` → `(grade: string)`（同上）
- [x] `expect(segment.label).toBe('1Q')` → `getLabel(GRADE_A)` を使う（ハードコード排除）

#### `VoteDonutChart.svelte`

- [x] `{#each segments as seg ...}` → `as segment`（略称禁止）
- [x] `lx`, `ly` → `labelX`, `labelY`（略称禁止）
- [x] `counters: VotedGradeCounter[]` の prop → `type VotedGradeCounters = VotedGradeCounter[]` を定義して使う（plural alias 必須）

---

### 設計改善（任意・推奨）

- [x] `DonutSegment` 型を `src/features/votes/types/donut_graph.ts` に移動
  - コンポーネントが消費する型は `types/` 配置が規約どおり
- [x] `calcPointOnCircle(center: Point, radius: number, angle: number): Point` を export helper として `donut_chart.ts` に追加（`pointOnCircle` → `calcPointOnCircle` に改名）
  - `arcPathSegment` 内の4点計算（`center.x + radius * Math.cos(angle)` パターン）が全4箇所で重複している
  - Svelte 側の `labelX`/`labelY` 計算も同パターンのため `export` して共有できる
- [x] `arcPath` → `buildArcPath` に改名
  - `arc` が動詞になっていない。`build` プレフィックスで関数であることを明示する
- [x] `VoteDonutChart.svelte` の各ブロックを `{#snippet}` に切り出す（sibling consistency ルール）
  - `{#snippet metallicGradient()}` — D6 グラデーション定義（`<defs>` 内）
  - `{#snippet emptyRing()}` — 投票0件時の空リング
  - `{#snippet medianIndicator()}` — 中央値ライン＋ラベル
  - `{#snippet segmentLabel(segment: DonutSegment)}` — `{#if segment.percentage >= 10}` 以降のラベル分岐
  - `{#snippet centerVoteCount()}` — 中央の総票数表示

---

### 却下した提案と根拠

| 提案 | 却下理由 |
|------|----------|
| `Point` 型を `votes/types/` に移動する | `Point` は `arcPathSegment` の内部実装補助型。`donut_chart.ts` 外から参照する理由がなく、`votes/types/` に置くと汎用幾何型が機能スコープに入り混む。private なまま `donut_chart.ts` に残す。 |
| `Angle` 型（`{ start, end, mid }`）を導入する | `DonutSegment` の3フィールドは呼び出し側で個別に参照されるケースが大半。`Angle` オブジェクトに包んでも `angle.start` と書くだけで可読性の向上がない。YAGNI。 |
