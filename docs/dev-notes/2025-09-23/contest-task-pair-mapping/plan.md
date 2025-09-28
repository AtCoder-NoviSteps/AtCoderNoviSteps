# Contest-Task Pair Mapping 実装計画

## 概要

既存の Task テーブルの unique 制約を維持しながら、複数コンテストで同一問題を扱うための拡張実装計画。[前回計画](../../2025-09-17/contest-task-mapping/initial_plan.md)をベースに、互換性レイヤを用いた段階的移行戦略を詳細化。

## 討議内容の要約

### 1. 命名の決定

- **モデル名**: `ContestTaskPair` (「ペア」であることを明示)
- **型名**: `ContestTaskPairKey` (Prisma モデルとの衝突回避)
- **マップ型**: `TaskResultMapByContestTaskPair` (キーと値の関係を明示)

### 2. データベース設計

#### Prisma スキーマ追加

```prisma
model ContestTaskPair {
  id             String   @id @default(uuid())
  contestId      String
  taskTableIndex String
  taskId         String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([contestId, taskId]) // ペアの重複を防止
  @@index([contestId])          // contestId 検索を高速化
  @@map("contesttaskpair")
}
```

**設計判断**:

- id 属性追加: 将来のリレーション対応・一貫性のため
- 複合一意制約: ペアレベルでの重複防止
- インデックス: 後から追加可能だが contestId 検索の高速化

#### マイグレーション

```bash
# 開発環境
pnpm dlx prisma migrate dev --name create_contest_task_pair
```

#### CRUD メソッドの実装

**ファイル**: `src/lib/services/contest_task_pairs.ts`

```typescript
import { default as db } from '$lib/server/database';
import type {
  ContestTaskPair,
  ContestTaskPairs,
  ContestTaskPairCreate,
  ContestTaskPairUpdate,
} from '$lib/types/contest_task_pair';

/**
 * 単一のContestTaskPairを取得
 */
export async function getContestTaskPair(
  contestId: string,
  taskId: string,
): Promise<ContestTaskPair | null> {
  const contestTaskPair = await db.contestTaskPair.findUnique({
    where: {
      contestId_taskId: {
        contestId,
        taskId,
      },
    },
  });

  return contestTaskPair;
}

/**
 * ContestTaskPair の一覧を取得
 */
export async function getContestTaskPairs(): Promise<ContestTaskPairs> {
  return await db.contestTaskPair.findMany();
}

/**
 * ContestTaskPair の新規レコードを作成
 */
export async function createContestTaskPair(
  contestId: string,
  taskTableIndex: string,
  taskId: string,
): Promise<void> {
  try {
    // 既存レコードの確認
    const existingRecord = await getContestTaskPair(contestId, taskId);

    if (existingRecord) {
      console.log(`ContestTaskPair already exists: contestId=${contestId}, taskId=${taskId}`);
      return
    }

    // 新規レコード作成
    const contestTaskPair = await db.contestTaskPair.create({
      data: {
        contestId,
        taskTableIndex,
        taskId,
      },
    });

    console.log('Created ContestTaskPair:', contestTaskPair);
  } catch (error) {
    console.error('Error creating ContestTaskPair:', error);
    throw error;
  }
}

/**
 * ContestTaskPair のレコードを更新
 */
export async function updateContestTaskPair(
  contestId: string,
  taskTableIndex: string,
  taskId: string,
): Promise<void> {
  try {
    // 既存レコードの確認
    const existingRecord = await getContestTaskPair(contestId, taskId);

    if (!existingRecord) {
      const errorMessage = `ContestTaskPair not found: contestId=${contestId}, taskId=${taskId}`;
      console.log(errorMessage);
      throw new Error(errorMessage);
    }

    // レコード更新
    const updatedContestTaskPair = await db.contestTaskPair.update({
      where: {
        contestId_taskId: {
          contestId,
          taskId,
        },
      },
      data: {
        contestId,
        taskTableIndex,
        taskId,
      },
    });

    console.log('Updated ContestTaskPair:', updatedContestTaskPair);
  } catch (error) {
    console.error('Error updating ContestTaskPair:', error);
    throw error;
  }
}
```

**特徴**:

- DRY原則に従い `getContestTaskPair()` を共通メソッドとして切り出し
- 複合ユニーク制約 `@@unique([contestId, taskId])` を活用
- 重複チェック・存在確認を事前に実施し、適切なログ出力
- Prisma の自動生成型を使用して型安全性を確保

### 3. 型定義の更新

#### Prisma型に基づく型定義

**ファイル**: `src/lib/types/contest_task_pair.ts`

```typescript
import type { ContestTaskPair as ContestTaskPairOrigin } from '@prisma/client';

export type ContestTaskPair = ContestTaskPairOrigin;

// Prismaの自動生成型をベースとした配列型
export type ContestTaskPairs = ContestTaskPair[];

// CRUD操作用のパラメータ型
export type ContestTaskPairCreate = {
  contestId: string;
  taskTableIndex: string;
  taskId: string;
};

export type ContestTaskPairUpdate = ContestTaskPairCreate;
```

#### レガシー型定義（マッピング用）

```typescript
// 型定義
type ContestTaskPairKey = `${string}:${string}`; // "contest_id:task_id"

// ヘルパー関数
function createContestTaskPairKey(contestId: string, taskId: string): ContestTaskPairKey {
  return `${contestId}:${taskId}`;
}

// マップの型（明示的）
type TaskResultMapByContestTaskPair = Map<ContestTaskPairKey, TaskResult>;
```

**設計判断**:

- Prisma の自動生成型を活用することで型安全性を確保
- クライアントサイドでも Prisma 型を使用可能（型定義のみでランタイムコード不要）
- CRUD パラメータ型を定義して、メソッド引数の型安全性を向上

### 4. 互換性レイヤ（TaskResultMapAdapter）

**目的**: 既存コードを壊さずに段階的に新形式へ移行

```typescript
class TaskResultMapAdapter<T> {
  constructor(
    private legacyMap?: Map<string, T>, // 既存: taskId -> value
    private enhancedMap?: Map<TaskResultByContestTaskPair, T>, // 新形式: contestId:taskId -> value
  ) {}

  private makeKey(contestId: string, taskId: string): ContestTaskPairKey {
    return `${contestId}:${taskId}`;
  }

  has(taskId: string, contestId?: string): boolean {
    // enhanced を優先、なければ legacy にフォールバック
    if (contestId && this.enhancedMap) {
      return this.enhancedMap.has(this.makeKey(contestId, taskId));
    }
    if (this.legacyMap && this.legacyMap.has(taskId)) return true;
    if (this.enhancedMap) {
      for (const key of this.enhancedMap.keys()) {
        if (key.endsWith(`:${taskId}`)) return true;
      }
    }
    return false;
  }

  get(taskId: string, contestId?: string): T | undefined {
    if (contestId && this.enhancedMap) {
      const v = this.enhancedMap.get(this.makeKey(contestId, taskId));
      if (v !== undefined) return v;
    }
    if (this.legacyMap && this.legacyMap.has(taskId)) {
      return this.legacyMap.get(taskId);
    }
    if (this.enhancedMap) {
      for (const [key, value] of this.enhancedMap) {
        if (key.endsWith(`:${taskId}`)) return value;
      }
    }
    return undefined;
  }

  // write-through を採用（移行期間の整合性確保）
  set(taskId: string, value: T, contestId?: string): void {
    if (this.legacyMap) this.legacyMap.set(taskId, value);
    if (contestId && this.enhancedMap) {
      this.enhancedMap.set(this.makeKey(contestId, taskId), value);
    }
  }

  delete(taskId: string, contestId?: string): boolean {
    let ok = false;
    if (contestId && this.enhancedMap) {
      ok = this.enhancedMap.delete(this.makeKey(contestId, taskId)) || ok;
    }
    if (this.legacyMap) {
      ok = this.legacyMap.delete(taskId) || ok;
    }
    return ok;
  }
}
```

### 5. 主要な変更箇所

#### src/lib/utils/task_results.ts への追加（新規ファイル）

```typescript
// TaskMapAdapter の実装
type ContestTaskPairKey = `${string}:${string}`;
type TaskResultByContestTaskPair<T> = Map<ContestTaskPairKey, T>;

export class TaskMapAdapter<T> {
  constructor(
    private legacyMap?: Map<string, T>,
    private enhancedMap?: TaskResultByContestTaskPair<T>,
  ) {
    // 型チェック・assert
    console.assert(legacyMap || enhancedMap, 'At least one map must be provided');

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `TaskMapAdapter initialized: legacy=${legacyMap?.size ?? 0}, enhanced=${enhancedMap?.size ?? 0}`,
      );
    }
  }

  get(taskId: string, contestId?: string): T | undefined {
    console.assert(
      typeof taskId === 'string' && taskId.length > 0,
      'taskId must be non-empty string',
    );

    const start = performance.now();

    if (contestId && this.enhancedMap) {
      const key = this.makeKey(contestId, taskId);
      const result = this.enhancedMap.get(key);
      if (result !== undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `TaskMapAdapter.get: enhanced hit (${(performance.now() - start).toFixed(2)}ms)`,
          );
        }
        return result;
      }
    }

    if (this.legacyMap && this.legacyMap.has(taskId)) {
      const result = this.legacyMap.get(taskId);
      if (process.env.NODE_ENV === 'development') {
        console.log(`TaskMapAdapter.get: legacy hit (${(performance.now() - start).toFixed(2)}ms)`);
      }
      return result;
    }

    // enhanced スキャン（移行期間のみ）
    if (this.enhancedMap) {
      for (const [key, value] of this.enhancedMap) {
        if (key.endsWith(`:${taskId}`)) {
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `TaskMapAdapter.get: enhanced scan hit (${(performance.now() - start).toFixed(2)}ms)`,
            );
          }
          return value;
        }
      }
    }

    return undefined;
  }

  private makeKey(contestId: string, taskId: string): ContestTaskPairKey {
    console.assert(
      typeof contestId === 'string' && contestId.length > 0,
      'contestId must be non-empty string',
    );
    console.assert(
      typeof taskId === 'string' && taskId.length > 0,
      'taskId must be non-empty string',
    );

    return `${contestId}:${taskId}` as ContestTaskPairKey;
  }

  // 他のメソッド (has, set, delete) も同様に実装
}

/**
 * Creates a unique key for a ContestTaskPair using contestId and taskId.
 * Throws an error if either argument is an empty string.
 *
 * @param contestId - The ID of the contest.
 * @param taskId - The ID of the task.
 * @returns A string in the format "contestId:taskId".
 * @throws Will throw an error if contestId or taskId is empty.
 */
export function createContestTaskPairKey(contestId: string, taskId: string): ContestTaskPairKey {
  if (!contestId || contestId.trim() === '') {
    throw new Error('contestId must be a non-empty string');
  }
  if (!taskId || taskId.trim() === '') {
    throw new Error('taskId must be a non-empty string');

  return `${contestId}:${taskId}`;
}
```

#### src/lib/services/tasks.ts への追加

```typescript
// コンテスト-タスクのマッピングを取得
export async function getContestTaskPairs(): Promise<Map<string, string[]>> {
  const rows = await db.contestTaskPair.findMany({
    select: { contestId: true, taskId: true },
  });

  const map = new Map<string, string[]>();

  for (const r of rows) {
    const arr = map.get(r.taskId) ?? [];
    arr.push(r.contestId);
    map.set(r.taskId, arr);
  }

  return map;
}

// 既存の getTasks() を wrap
export async function getMergedTasks() {
  const tasks = await getTasks();
  const contestTaskPairs = await getContestTaskPairs().catch(() => new Map());

  // contestId:taskId -> Task のマップ（TaskResult 作成で直接参照しやすい）
  const contestTaskPairMap = new Map<string, Task>();
  for (const t of tasks) {
    const contests = contestTaskPairs.get(t.task_id) ?? [t.contest_id];
    for (const c of contests) {
      contestTaskPairMap.set(`${c}:${t.task_id}`, t);
    }
  }

  return { tasks, contestTaskPairs, contestTaskPairMap };
}
```

#### src/lib/services/task_results.ts の変更

```typescript
import { TaskMapAdapter } from '$lib/utils/task_results';
import { getMergedTasks } from '$lib/services/tasks';

// getTaskResults にFeature Flag対応を追加
export async function getTaskResults(userId: string): Promise<TaskResults> {
  const enableContestTaskPair = process.env.ENABLE_CONTEST_TASK_PAIR === 'true';

  if (enableContestTaskPair) {
    console.time('getTaskResults-enhanced');
    console.log(`Processing enhanced mode for user ${userId}`);

    const { tasks, contestTaskPairs } = await getMergedTasks();
    const answers = await answer_crud.getAnswers(userId);

    // enhancedMap を構築
    const enhancedMap: TaskResultByContestTaskPair<TaskAnswer> = new Map();
    for (const [taskId, answer] of answers) {
      const contests = contestTaskPairs.get(taskId) ?? [answer.contest_id ?? ''];
      for (const contestId of contests) {
        if (!contestId) continue;
        enhancedMap.set(`${contestId}:${taskId}`, answer);
      }
    }

    const results = await relateTasksAndAnswers(userId, tasks, answers, enhancedMap);

    console.log(`Generated ${results.length} task results in enhanced mode`);
    console.timeEnd('getTaskResults-enhanced');
    return results;
  } else {
    // 既存の処理
    console.time('getTaskResults-legacy');
    const tasks = await getTasks();
    const answers = await answer_crud.getAnswers(userId);
    const results = await relateTasksAndAnswers(userId, tasks, answers);

    console.log(`Generated ${results.length} task results in legacy mode`);
    console.timeEnd('getTaskResults-legacy');
    return results;
  }
}

// relateTasksAndAnswers のシグネチャ変更（enhancedMap をオプション引数に）
async function relateTasksAndAnswers(
  userId: string,
  tasks: Tasks,
  answers: Map<string, TaskAnswer>,
  enhancedMap?: TaskResultByContestTaskPair<TaskAnswer>,
): Promise<TaskResults> {
  const isLoggedIn = userId !== undefined;
  const adapter = new TaskMapAdapter<TaskAnswer>(answers, enhancedMap);

  const taskResults = tasks.map((task: Task) => {
    const taskResult = createDefaultTaskResult(userId, task);

    if (isLoggedIn && adapter.has(task.task_id, task.contest_id)) {
      const answer = adapter.get(task.task_id, task.contest_id);
      const status = statusById.get(answer?.status_id);
      taskResult.status_name = status.status_name;
      taskResult.submission_status_image_path = status.image_path;
      taskResult.submission_status_label_name = status.label_name;
      taskResult.is_ac = status.is_ac;
      taskResult.updated_at = answer?.updated_at ?? taskResult.updated_at;
    }

    return taskResult;
  });

  return taskResults;
}
```

### 6. 移行戦略

#### Phase 1: 基盤整備

- [✅] Prisma スキーマに ContestTaskPair モデル追加
- [✅] マイグレーション実行
- [ ] CURD メソッドを追加
- [ ] TypeScript 型定義追加

#### Phase 2: 互換性レイヤ導入

- [ ] TaskMapAdapter 実装・テスト
- [ ] getMergedTasks() 実装
- [ ] src/lib/services/task_results.ts への適用

#### Phase 3: 段階的移行

- [ ] 他の影響箇所の特定・修正
- [ ] Feature flag による切替制御
- [ ] ログ・モニタリング追加

#### Phase 4: 完全移行

- [ ] Legacy マップの削除
- [ ] アダプタの簡素化
- [ ] パフォーマンス最適化

### 7. テスト計画

#### TaskMapAdapter の単体テスト

```typescript
// filepath: src/lib/utils/task_results.test.ts
import { describe, test, expect } from 'vitest';
import { TaskMapAdapter, createContestTaskPairKey } from './task_results';

describe('TaskMapAdapter', () => {
  test('expect to prioritize enhanced map when contestId is provided', () => {
    const legacy = new Map([['task1', { id: 'legacy' }]]);
    const enhanced = new Map([['contest1:task1', { id: 'enhanced' }]]);
    const adapter = new TaskMapAdapter(legacy, enhanced);

    expect(adapter.get('task1', 'contest1')?.id).toBe('enhanced');
    expect(adapter.get('task1')?.id).toBe('legacy');
  });

  test('expect to fallback to legacy when enhanced not found', () => {
    const legacy = new Map([['task1', { id: 'legacy' }]]);
    const enhanced = new Map();
    const adapter = new TaskMapAdapter(legacy, enhanced);

    expect(adapter.get('task1', 'contest1')?.id).toBe('legacy');
  });

  test('expect to handle write-through correctly', () => {
    const legacy = new Map();
    const enhanced = new Map();
    const adapter = new TaskMapAdapter(legacy, enhanced);

    adapter.set('task1', { id: 'value' }, 'contest1');
    expect(legacy.get('task1')?.id).toBe('value');
    expect(enhanced.get('contest1:task1')?.id).toBe('value');
  });

  test('expect to scan enhanced map when no contestId provided', () => {
    const legacy = new Map();
    const enhanced = new Map([['contest1:task1', { id: 'found' }]]);
    const adapter = new TaskMapAdapter(legacy, enhanced);

    expect(adapter.get('task1')?.id).toBe('found');
    expect(adapter.has('task1')).toBe(true);
  });

  test('expect to validate input parameters', () => {
    const adapter = new TaskMapAdapter(new Map(), new Map());

    // TypeScript strict モードでの型安全性を確保
    expect(() => adapter.get('')).toThrow();
    expect(() => adapter.get('task1', '')).toThrow();
  });
});

describe('createContestTaskPairKey', () => {
  test('expect to create valid key format', () => {
    expect(createContestTaskPairKey('abc001', 'abc001_a')).toBe('abc001:abc001_a');
  });

  test('expect to validate input parameters', () => {
    expect(() => createContestTaskPairKey('', 'task')).toThrow();
    expect(() => createContestTaskPairKey('contest', '')).toThrow();
    expect(() => createContestTaskPairKey(' ', 'task')).toThrow();
    expect(() => createContestTaskPairKey('contest', ' ')).toThrow();
  });
});
```

#### 既存テストとの互換性

- **場所**: `src/test/` の既存単体テスト
- **対応**: Feature Flag が false の場合は既存動作を維持
- **確認事項**: TaskMapAdapter 導入後も全既存テストがパスすること### 8. パフォーマンス・監視計画

#### 開発環境での監視

```typescript
// console.log ベースの監視（開発環境のみ）
export async function getTaskResults(userId: string): Promise<TaskResults> {
  if (process.env.NODE_ENV === 'development') {
    console.time('getTaskResults');
    console.log(`Processing ${answers.size} answers for user ${userId}`);
  }

  const results = await getTaskResults(userId);

  if (process.env.NODE_ENV === 'development') {
    console.log(`Generated ${results.length} task results`);
    console.timeEnd('getTaskResults');

    // メモリ使用量確認
    const memory = process.memoryUsage();
    console.log(`Memory usage: ${Math.round(memory.heapUsed / 1024 / 1024)}MB`);
  }

  return results;
}
```

#### Staging・本番環境での監視

- **ログ確認**: Vercel管理者画面
- **データ内容**: 本番データのサブセット（staging環境）
- **メトリクス**: 処理時間・データ数・エラー率を最小限ログ出力

#### APM導入について

- **Sentry/DataDog**: 導入コストが高いため当面見送り
- **代替手段**: console.log + Vercelログでの監視

### 9. 環境設定・Feature Flag

#### 環境変数設定

```bash
# .env または .env.local
ENABLE_CONTEST_TASK_PAIR=false  # 開発段階では false
```

#### Feature Flag の適用範囲

- **対象関数**: `getTaskResults()` のみ（段階1）
- **切り替え**: 環境変数による制御
- **既存動作**: Flag が false の場合は完全に既存処理を維持

#### データインポート方法

```typescript
// prisma/seed.ts での ContestTaskPair データ追加例
async function seedContestTaskPairs() {
  const contestTaskPairs = [
    { contestId: 'abc001', taskTableIndex: 'A', taskId: 'abc001_a' },
    { contestId: 'abc001', taskTableIndex: 'B', taskId: 'abc001_b' },
    // ... more data
  ];

  for (const pair of contestTaskPairs) {
    await prisma.contestTaskPair.upsert({
      where: {
        contestId_taskId: {
          contestId: pair.contestId,
          taskId: pair.taskId,
        },
      },
      update: { taskTableIndex: pair.taskTableIndex },
      create: pair,
    });
  }
}
```

## 追加討議内容の要約

### 実装の詳細決定事項

1. **ファイル構成**: `src/lib/utils/task_results.ts` に TaskMapAdapter を配置（CRUD分離・テスト容易性・移行後削除容易性）

2. **デプロイフロー**: 開発 → GitHub Actions → staging環境（Vercel） → 本番環境での段階的検証

3. **テストケース**:
   - `test` を使用（`it` ではなく）
   - `expect to` 表現に統一（`should` を避ける）
   - 既存テスト（`src/test/`）との互換性確保
   - TypeScript strict モードでの型安全性とassert追加

4. **パフォーマンス監視**:
   - Sentry/DataDog は導入見送り
   - console.log + Vercelログでの監視
   - 開発環境でのみ詳細ログ出力

5. **Feature Flag**:
   - 環境変数（.env）での制御
   - 適用範囲は `getTaskResults()` のみ（段階1）

6. **データインポート**:
   - 第1段階: seed.ts での手動データ投入
   - 第2段階: 管理者画面での自動インポート機能

7. **インフラ環境**:
   - ソースコード管理: Git/GitHub
   - データベース: Supabase（ロールバック機能あり）
   - staging環境: 本番データのサブセット使用

## 3. インポート処理の分離

**注意**: この部分は基本機能実装・動作確認後に改めて討議予定。

- 第1段階: seed.ts や CSV でのデータインポート優先
- 第2段階: 管理者画面を通したインポート機能実装
- AtCoder Problems API からのデータ取得・変換
- 既存 Task データとの整合性確認

## リスク要因と対策

| リスク                   | 影響度 | 対策                                                   |
| ------------------------ | ------ | ------------------------------------------------------ |
| 移行期間中のデータ不整合 | 高     | write-through による二重書き込み + Feature Flag制御    |
| 既存機能の破綻           | 高     | 互換性レイヤー + 既存テストでの継続検証                |
| パフォーマンス劣化       | 中     | enhanced スキャン処理を移行期間中に限定 + 監視強化     |
| テストカバレッジ不足     | 中     | TaskMapAdapter の単体テスト + TypeScript strict モード |
| ロールバックの複雑さ     | 低     | Supabaseのロールバック機能 + Feature Flag即座切替      |

## 決定事項

1. **モデル名**: ContestTaskPair
2. **型名**: ContestTaskPairKey, TaskResultByContestTaskPair
3. **移行方針**: TaskMapAdapter による段階的移行
4. **アダプタ配置**: `src/lib/utils/task_results.ts`（影響局所化・テスト容易性・削除容易性）
5. **id 属性**: 将来性を考慮して追加
6. **Feature Flag**: 環境変数制御、getTaskResults()のみ適用（段階1）
7. **テスト方針**: `test` + `expect to` + TypeScript strict + assert追加
8. **監視手法**: console.log + Vercelログ（APM導入見送り）
9. **データ投入**: seed.ts優先 → 管理者画面は第2段階

---

**作成日**: 2025-09-23
**更新日**: 2025-09-27
**ベース**: [initial_plan.md (2025-09-17)](../../2025-09-17/contest-task-mapping/initial_plan.md)
**ステータス**: 実装準備段階
