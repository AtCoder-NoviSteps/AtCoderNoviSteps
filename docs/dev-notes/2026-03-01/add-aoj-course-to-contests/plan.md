# AOJ コースへの DSL・CGL・NTL 追加 (Issue #3223)

## 背景

[Issue #3223](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3223) で、AOJ (Aizu Online Judge) の以下の3コースを AtCoderNoviSteps に追加することが要求されています。

- **DSL** (データ構造) — 18 問
- **CGL** (計算幾何学) — 25 問
- **NTL** (整数論) — 11 問

現在 `AOJ_COURSES` には ITP1・ALDS1・ITP2・DPL・GRL の5件が登録されています。新コースも同じパターンで追加するだけで、アーキテクチャ上の変更は不要です。

## 変更対象ファイル

### 1. `src/lib/utils/contest.ts` — `AOJ_COURSES` に3件追加

```typescript
export const AOJ_COURSES: ContestPrefix = {
  ITP1: 'プログラミング入門',
  ALDS1: 'アルゴリズムとデータ構造入門',
  ITP2: 'プログラミング応用',
  DPL: '組み合わせ最適化',
  GRL: 'グラフ',
  DSL: 'データ構造', // 追加
  CGL: '計算幾何学', // 追加
  NTL: '整数論', // 追加
} as const;
```

`AOJ_COURSES` を参照している以下の関数・変数はデータ駆動なので変更不要：

- `getPrefixForAojCourses()` / `aojCoursePrefixes` Set
- `classifyContest()`
- `getContestNameLabel()`
- `isAojContest()`

### 2. `src/test/lib/utils/test_cases/contest_type.ts` — `aojCoursesData` に3件追加

```typescript
const aojCoursesData = [
  // 既存エントリ...
  { name: 'AOJ Courses, DSL', contestId: 'DSL' },
  { name: 'AOJ Courses, CGL', contestId: 'CGL' },
  { name: 'AOJ Courses, NTL', contestId: 'NTL' },
];
```

### 3. `src/test/lib/utils/test_cases/contest_name_and_task_index.ts` — `AOJ_COURSES_TEST_DATA` に3件追加

```typescript
const AOJ_COURSES_TEST_DATA = {
  // 既存エントリ...
  DSL: {
    contestId: 'DSL',
    tasks: ['1_A', '2_H'],
  },
  CGL: {
    contestId: 'CGL',
    tasks: ['1_A', '7_I'],
  },
  NTL: {
    contestId: 'NTL',
    tasks: ['1_A', '2_F'],
  },
};
```

## 変更不要なもの

| ファイル                                    | 理由                                                   |
| ------------------------------------------- | ------------------------------------------------------ |
| `src/lib/clients/aizu_online_judge.ts`      | AOJ API から動的にコースを取得するため                 |
| `prisma/schema.prisma`                      | `ContestType.AOJ_COURSES` が既にすべてのコースをカバー |
| DB マイグレーション                         | スキーマ変更なし                                       |
| `src/test/lib/utils/test_cases/task_url.ts` | AOJ_COURSES 参照なし、変更不要                         |

## 確認方法

```bash
pnpm test:unit   # テストが通ること
pnpm check       # TypeScript 型チェック
pnpm lint        # ESLint チェック
```

## 注意事項

### AOJ API に存在しない問題 + タイトルの重複による id 衝突

AOJ の `/problems?size=N` エンドポイントは、実際には存在しない（ページが not found になる）問題を返すことがある。例えば `CGL_4_D` は AOJ 上では存在しない + API レスポンスに `CGL_2_B` と `CGL_7_A` と同じタイトルの場合がある。

現在のタスク `id` 生成ロジックは `sha256(contest_id + task.title)` であるため、同一コース内でタイトルが重複すると `Task.id` の一意制約違反（P2002）が発生する。

- **影響**: CGL コースのインポート時に `PrismaClientKnownRequestError: Unique constraint failed on the fields: (\`id\`)` が発生する
- **根本原因**: `sha256(contest_id + title)` は title の重複に弱い。`task.id`（API のユニーク識別子）を使うべき
- **暫定対処**: 該当コースの存在する問題のみインポート

## 実装後の教訓

- `AOJ_COURSES` はデータ駆動設計になっており、新コース追加は定数オブジェクトに1行足すだけで、呼び出し側コードの変更は不要だった。
- テストデータも同様に、既存パターンをそのまま踏襲して追記するだけで済む。
- プランの「変更不要なもの」セクションを事前に確認しておくと、余計な調査を省ける。
