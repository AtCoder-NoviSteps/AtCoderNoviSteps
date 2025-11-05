# FPS24（24 Problems on Formal Power Series）のコンテスト対応実装計画

## 📋 概要

FPS24 コンテスト対応として、`ContestType` enum に `FPS_24` を追加し、コンテスト ID `fps-24` の問題をインポートできるようにする実装計画です。

参考実装: [PR #1335: Add AXC-like contests](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/commit/193bd801eca7e3274e980e31758edd1d46a9a27b)

## 🎯 実装スコープ

### ✅ 実装対象

1. **Prisma スキーマ更新**
   - `prisma/schema.prisma` の `ContestType` enum に `FPS_24` を追加
   - 配置: `UNIVERSITY` の後、`OTHERS` の前

2. **Prisma マイグレーション**
   - 新規マイグレーションファイル作成: `add_fps_24_to_contest_type`
   - コマンド: `pnpm dlx prisma migrate dev --name add_fps_24_to_contest_type`

3. **ERD.md の手動更新**
   - マイグレーション実行後、ER図に `FPS_24` を追加

4. **型定義の更新**
   - `src/lib/types/contest.ts` に `FPS_24` を追加

5. **コンテスト分類ロジックの更新**
   - `src/lib/utils/contest.ts` の `classifyContest` 関数に FPS24 判定ロジックを追加
   - 判定条件: `contest_id === 'fps-24'` （完全一致）
   - 戻り値: `ContestType.FPS_24`

6. **優先度定義の更新**
   - `src/lib/utils/contest.ts` の `contestTypePriorities` Map に FPS24 を追加
   - 優先度: 17（UNIVERSITY の次）
   - 優先度: UNIVERSITY は 16、FPS_24 は 17、OTHERS は 18 に変更

7. **コンテスト名ラベルの更新**
   - `src/lib/utils/contest.ts` の `getContestNameLabel` 関数に FPS24 判定ロジックを追加
   - 判定条件: `contest_id === 'fps-24'` （完全一致）
   - 戻り値: `'FPS 24 題'`
   - 追加位置: `math-and-algorithm` の判定の後、`regexForAtCoderUniversity` の判定の前

8. **テスト実装**
   - `src/test/lib/utils/contest.test.ts` に FPS24 相当テストケースを追加
   - テストコンテスト ID: `fps-24`

9. **ERD.md（自動生成後の手動確認）**
   - マイグレーション後に `prisma generate` で ERD.md が自動更新される
   - 手動で `FPS_24` が正しく反映されているか確認

## 🔍 実装パターン（参考 PR より）

### enum 値の追加パターン

```prisma
enum ContestType {
  // 既存の値...
  UNIVERSITY // University Programming Contests in AtCoder (e.g., UTPC)
  FPS_24     // 24 Problems on Formal Power Series
  OTHERS     // AtCoder (その他)
  // その他...
}
```

### 型定義のパターン

```typescript
export const ContestType: { [key in ContestTypeOrigin]: key } = {
  // 既存の値...
  UNIVERSITY: 'UNIVERSITY',
  FPS_24: 'FPS_24',
  OTHERS: 'OTHERS',
  // その他...
};
```

### コンテスト分類ロジックのパターン

```typescript
export const classifyContest = (contest_id: string) => {
  // ... 既存のロジック ...

  // FPS24 判定（新規追加）
  if (contest_id === 'fps-24') {
    return ContestType.FPS_24;
  }

  // ... その他のロジック ...
};
```

### 優先度定義のパターン

```typescript
export const contestTypePriorities: Map<ContestType, number> = new Map([
  // 既存の値...
  [ContestType.UNIVERSITY, 16],
  [ContestType.FPS_24, 17], // 新規追加
  [ContestType.OTHERS, 18], // 従来の 17 から 18 に変更
  // その他...
]);
```

### コンテスト名ラベルのパターン

```typescript
export const getContestNameLabel = (contestId: string) => {
  // ... 既存のロジック ...

  if (contestId === 'math-and-algorithm') {
    return 'アルゴリズムと数学';
  }

  // FPS24 判定（新規追加）
  if (contestId === 'fps-24') {
    return 'FPS 24 題';
  }

  // ... その他のロジック ...
};
```

## 📝 実装ファイル一覧

| ファイル                                                                    | 操作 | 内容                                                                                    |
| --------------------------------------------------------------------------- | ---- | --------------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                                                      | 更新 | `ContestType` enum に `FPS_24` を追加                                                   |
| `prisma/migrations/YYYYMMDDHHMMSS_add_fps_24_to_contest_type/migration.sql` | 作成 | ALTER TYPE コマンド（自動生成）                                                         |
| `prisma/ERD.md`                                                             | 更新 | `FPS_24` が enum 値に反映されているか確認                                               |
| `src/lib/types/contest.ts`                                                  | 更新 | `ContestType` 型定義に `FPS_24` を追加                                                  |
| `src/lib/utils/contest.ts`                                                  | 更新 | `classifyContest`, `contestTypePriorities`, `getContestNameLabel` に FPS24 ロジック追加 |
| `src/test/lib/utils/contest.test.ts`                                        | 更新 | FPS24 関連テストケースを追加                                                            |

## 🧪 テストケース例

### コンテスト分類テスト

```typescript
describe('when contest_id means fps-24', () => {
  const testCases = [{ contestId: 'fps-24', expected: ContestType.FPS_24 }];

  runTests('classifyContest', testCases, ({ contestId, expected }: TestCaseForContestType) => {
    expect(classifyContest(contestId)).toEqual(expected);
  });
});
```

### 優先度テスト

```typescript
describe('when contest_id means fps-24 (priority)', () => {
  const testCases = [{ contestId: 'fps-24', expected: ContestType.FPS_24 }];

  runTests('getContestPriority', testCases, ({ contestId, expected }: TestCaseForContestType) => {
    expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
  });
});
```

### コンテスト名ラベルテスト

```typescript
describe('when contest_id is fps-24', () => {
  const testCases = [{ contestId: 'fps-24', expected: 'FPS 24 題' }];

  runTests(
    'getContestNameLabel',
    testCases,
    ({ contestId, expected }: TestCaseForContestNameLabel) => {
      expect(getContestNameLabel(contestId)).toEqual(expected);
    },
  );
});
```

## 📋 実装手順

### フェーズ 1: Prisma スキーマ更新

1. `prisma/schema.prisma` を開く
2. `ContestType` enum の `UNIVERSITY` の後に `FPS_24` を追加
3. コマンドを実行: `pnpm dlx prisma migrate dev --name add_fps_24_to_contest_type`
4. マイグレーション SQL ファイルが自動生成される
5. `prisma/ERD.md` を確認して `FPS_24` が反映されているか確認

### フェーズ 2: 型定義とロジックの更新

1. `src/lib/types/contest.ts` を更新（`FPS_24` を追加）
2. `src/lib/utils/contest.ts` を更新：
   - `classifyContest` 関数に FPS24 判定ロジックを追加
   - `contestTypePriorities` Map に `[ContestType.FPS_24, 17]` を追加
   - `UNIVERSITY` は 16 のまま、`OTHERS` の優先度を 18 に変更
   - `getContestNameLabel` 関数に FPS24 ラベル処理を追加（戻り値: `'FPS 24 題'`）

### フェーズ 3: テスト実装

1. `src/test/lib/utils/test_cases/contest_type.ts` を更新：
   - FPS24 テストケースデータを追加
2. `src/test/lib/utils/test_cases/contest_name_labels.ts` を更新：
   - FPS24 ラベルテストケースデータを追加（`contestId: 'fps-24'`, `expected: 'FPS 24 題'`）
3. `src/test/lib/utils/contest.test.ts` を更新：
   - FPS24 分類テスト（`classifyContest`）を追加
   - FPS24 優先度テスト（`getContestPriority`）を追加
   - FPS24 ラベルテスト（`getContestNameLabel`）を追加
4. テスト実行: `pnpm test:unit`

### フェーズ 4: 検証

1. ローカルでテスト実行: `pnpm test:unit`
2. 全テストが PASS であることを確認
3. Prisma Client が正しく生成されているか確認: `pnpm dlx prisma generate`

## ✅ チェックリスト

### 実装完了時の確認項目

- [ ] Prisma スキーマに `FPS_24` が追加されている
- [ ] マイグレーション SQL が正しく生成されている
- [ ] `prisma/ERD.md` に `FPS_24` が反映されている
- [ ] `src/lib/types/contest.ts` に `FPS_24: 'FPS_24'` が追加されている
- [ ] `src/lib/utils/contest.ts` の `classifyContest` に FPS24 ロジックが実装されている
- [ ] `src/lib/utils/contest.ts` の `contestTypePriorities` に `[ContestType.FPS_24, 17]` が追加されている
- [ ] `src/lib/utils/contest.ts` の `OTHERS` の優先度が 18 に更新されている
- [ ] `src/lib/utils/contest.ts` の `getContestNameLabel` に FPS24 ラベル処理が実装されている（戻り値: `'FPS 24 題'`）
- [ ] `src/test/lib/utils/test_cases/contest_type.ts` に FPS24 テストケースが追加されている
- [ ] `src/test/lib/utils/test_cases/contest_name_labels.ts` に FPS24 ラベルテストケースが追加されている
- [ ] `src/test/lib/utils/contest.test.ts` に FPS24 テストが追加されている
- [ ] `pnpm test:unit` が全て PASS している
- [ ] Prisma Client が正しく生成されている（`pnpm dlx prisma generate`）

## 📚 参考ドキュメント

### 指示ファイル（プロジェクト品質基準）

- `global.instructions.md`: プロジェクト全体の統一設定
- `source-code.instructions.md`: ソースコード構造とアーキテクチャ
- `tests.instructions.md`: テスト戦略（Vitest v3.2.4）
- `ci.instructions.md`: CI/CD 設定

### 重要な制約

- **TypeScript**: `strict: true` 必須
- **テスト**: Vitest v3.2.4 以上
- **命名規則**: enum は UPPER_SNAKE_CASE
- **Prisma**: キャメルケースでモデル定義

### 外部参照

- [AtCoder FPS24](https://atcoder.jp/contests/fps-24)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [参考 PR: Add AXC-like contests](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/commit/193bd801eca7e3274e980e31758edd1d46a9a27b)

## 🔗 関連タスク

- FPS24 の問題インポート処理の実装（別タスク）
- CI/CD でのテスト実行確認
- ドキュメント更新（必要に応じて）

## 🚀 将来の課題: FPS24 のコンテスト表テーブル実装

> **状態**: 未着手（将来の拡張予定）
> **参考**: [PR #2786: Add math and algo book to contest table](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/2786)

### 概要

本実装（Prisma スキーマ更新）の後、FPS24 をコンテスト表テーブルに表示するための UI Provider を実装する予定です。

参考 PR #2786 では「Math and Algorithm」コンテストについて、以下を実装しています：

- 問題データの追加（`prisma/tasks.ts`）
- UI Provider の実装（`src/lib/utils/contest_table_provider.ts`）
- テストケースの追加

### 実装予定

1. **問題データの追加**
   - `prisma/tasks.ts` に FPS24 の問題定義を追加
   - 問題ペアデータはコンテスト内で完結（`contest_task_pairs` は不使用）

2. **UI Provider の実装**
   - `src/lib/utils/contest_table_provider.ts` に `FPS24Provider` を実装
   - または既存の provider フレームワークを拡張
   - 以下の機能を実装：
     - 問題フィルタリング
     - メタデータ管理
     - テーブルレイアウト設定（ヘッダーやラウンドラベルの表示/非表示）

3. **テストの追加**
   - `src/test/lib/utils/contest_table_provider.test.ts` に FPS24 Provider テストを追加
   - モックデータの作成（`src/test/lib/utils/test_cases/contest_table_provider.ts`）

### 関連ファイル

| ファイル                                                  | 説明                 |
| --------------------------------------------------------- | -------------------- |
| `prisma/tasks.ts`                                         | FPS24 問題定義の追加 |
| `src/lib/utils/contest_table_provider.ts`                 | UI Provider 実装     |
| `src/test/lib/utils/contest_table_provider.test.ts`       | Provider テスト      |
| `src/test/lib/utils/test_cases/contest_table_provider.ts` | モックデータ定義     |

### 優先度

このタスクは、本実装（Prisma スキーマ + 基本ロジック）が完了した後に着手することを想定しています。

## 📚 実装から得られた教訓

### 実装完了時の状態

✅ 全チェックリスト項目を完了
✅ テスト 817 件全て PASS（FPS24 関連テスト含む）
✅ Prisma Client 正常に生成

### 主な学習ポイント

1. **Prisma Enum 追加の手順**
   - `schema.prisma` の enum 定義に追加
   - `pnpm dlx prisma migrate dev --name` で自動マイグレーション生成
   - 型安全性を保つために Prisma Client が自動再生成される

2. **型定義と実装の対応**
   - Prisma enum → TypeScript 型オブジェクト（`as const` 指定）
   - テストケースデータの構造化により、テスト追加時の漏れを防止
   - ランダムテスト名の生成で重複チェック可能

3. **コンテスト分類ロジック（優先度順）の統一性**
   - 判定は具体的 → 一般的へ段階的に実施
   - 完全一致（`contest_id === 'fps-24'`）を前にチェック
   - 優先度 Map で順序を一元管理（追加時に他の値も調整必要）

4. **テスト構造の再利用性**
   - テストケースを「data」ファイルと「test」ファイルで分離
   - 複数テスト関数（`classifyContest`, `getContestPriority`, `getContestNameLabel`）を同じデータで検証
   - テスト数が増えても保守性が維持される設計

5. **参考 PR パターンの活用**
   - 小さな変更でも参考 PR から実装パターンを確認
   - UPPER_SNAKE_CASE、判定条件のルール、優先度番号付けなど
   - 既存コードとの一貫性が重要

### 今後の参考

- UI Provider 実装時も同じテストケース構造を踏襲
- `contest_table_provider.ts` に新規ロジック追加時の参考になる
- テスト駆動で実装する場合も、テストケースデータを先に定義すると効率的
