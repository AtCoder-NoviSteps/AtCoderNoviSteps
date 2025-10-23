# contest_task_pairs データ投入処理の実装

## 概要

`prisma/seed.ts` に `prisma/contest_task_pairs.ts` のデータ投入処理を追加します。

`addTasks()` と `addTask()` の実装パターンを参考に、`addContestTaskPairs()` と `addContestTaskPair()` を実装しています。

## 追加内容

### 1. インポート追加

`.fabbrica` から `defineContestTaskPairFactory` をインポート：

```typescript
import {
  initialize,
  defineContestTaskPairFactory,
  defineUserFactory,
  defineKeyFactory,
  defineTaskFactory,
  defineTagFactory,
  defineTaskTagFactory,
  defineTaskAnswerFactory,
  defineSubmissionStatusFactory,
  defineWorkBookFactory,
} from './.fabbrica';
```

`contest_task_pairs` データをインポート：

```typescript
import { contest_task_pairs } from './contest_task_pairs';
```

### 2. 並行処理設定追加

`QUEUE_CONCURRENCY` に `contestTaskPairs` を追加：

```typescript
const QUEUE_CONCURRENCY = {
  users: Number(process.env.SEED_USERS_CONCURRENCY) || 2,
  tasks: Number(process.env.SEED_TASKS_CONCURRENCY) || 3,
  contestTaskPairs: Number(process.env.SEED_CONTEST_TASK_PAIRS_CONCURRENCY) || 2,
  tags: Number(process.env.SEED_TAGS_CONCURRENCY) || 2,
  taskTags: Number(process.env.SEED_TASK_TAGS_CONCURRENCY) || 2,
  submissionStatuses: Number(process.env.SEED_SUBMISSION_STATUSES_CONCURRENCY) || 2,
  answers: Number(process.env.SEED_ANSWERS_CONCURRENCY) || 2,
} as const;
```

### 3. main 関数に処理追加

```typescript
async function main() {
  try {
    console.log('Seeding has been started.');

    await addUsers();
    await addTasks();
    await addContestTaskPairs();
    await addWorkBooks();
    await addTags();
    await addTaskTags();
    await addSubmissionStatuses();
    await addAnswers();

    console.log('Seeding has been completed.');
  } catch (e) {
    console.error('Failed to seed:', e);
    throw e;
  }
}
```

### 4. 投入処理関数追加

#### `addContestTaskPairs()` 関数

```typescript
async function addContestTaskPairs() {
  console.log('Start adding contest task pairs...');

  const contestTaskPairFactory = defineContestTaskPairFactory();

  // Create a queue with limited concurrency for contest task pair operations
  const contestTaskPairQueue = new PQueue({ concurrency: QUEUE_CONCURRENCY.contestTaskPairs });

  for (const pair of contest_task_pairs) {
    contestTaskPairQueue.add(async () => {
      try {
        const [registeredPair, registeredTask] = await Promise.all([
          prisma.contestTaskPair.findUnique({
            where: {
              contestId_taskId: {
                contestId: pair.contest_id,
                taskId: pair.problem_id,
              },
            },
          }),
          prisma.task.findUnique({
            where: { task_id: pair.problem_id },
          }),
        ]);

        if (!registeredTask) {
          console.warn(
            'Skipped contest task pair due to missing task:',
            pair.problem_id,
            'for contest',
            pair.contest_id,
            'index',
            pair.problem_index,
          );
        } else if (!registeredPair) {
          await addContestTaskPair(pair, contestTaskPairFactory);
          console.log(
            'contest_id:',
            pair.contest_id,
            'problem_index:',
            pair.problem_index,
            'task_id:',
            pair.task_id,
            'was registered.',
          );
        }
      } catch (e) {
        console.error('Failed to add contest task pair', pair, e);
      }
    });
  }

  await contestTaskPairQueue.onIdle(); // Wait for all contest task pairs to complete
  console.log('Finished adding contest task pairs.');
}
```

#### `addContestTaskPair()` 関数

```typescript
async function addContestTaskPair(
  pairs: (typeof contest_task_pairs)[number],
  contestTaskPairFactory: ReturnType<typeof defineContestTaskPairFactory>,
) {
  await contestTaskPairFactory.create({
    contestId: pairs.contest_id,
    taskTableIndex: pairs.problem_index,
    taskId: pairs.task_id,
  });
}
```

## 実装パターン

`addTasks()` / `addTask()` と同じパターンを採用：

- **重複チェック**：`findUnique()` で既存データをチェック
- **並行処理**：`PQueue` を使用した並行処理制御
- **エラーハンドリング**：try-catch で例外処理
- **ログ出力**：処理開始・完了・エラーをログ出力

## contest_task_pairs データ構造

```typescript
{
  contest_id: string; // コンテストID（例：'tessoku-book'）
  task_id: string; // タスクID（例：'typical90_s'）
  problem_index: string; // 問題インデックス（例：'C18'）
}
```

## 実行方法

```bash
pnpm db:seed
```

通常のシード実行で `addContestTaskPairs()` が呼び出されます。

## 環境変数による並行数調整

```bash
SEED_CONTEST_TASK_PAIRS_CONCURRENCY=4 pnpm db:seed
```

## 実装完了

2025-10-22 に実装完了。合計 13 個の `ContestTaskPair` レコードが正常に投入されました。

## 教訓と抽象化

### 1. ファクトリ再生成の必要性

**問題**: Prisma スキーマに新しいモデルを追加しても、`.fabbrica` に自動生成されない場合がある。

**原因**: スキーマ変更後に `prisma generate` を実行する必要があります。

**解決策**:

```bash
pnpm prisma generate
```

このコマンドにより、新しいモデル用のファクトリが生成されます。

### 2. 既存パターンの活用による効率化

**パターン**: データ投入処理の実装パターンは統一する。

**利点**:

- コードの一貫性が保たれる
- デバッグやメンテナンスが容易
- 新しい開発者の理解が速い

**実装パターン** (`addTasks()` と同じ):

1. ファクトリをインスタンス化
2. `PQueue` で並行処理制御
3. `findUnique()` で重複チェック
4. キューが空になるまで待機
5. 処理結果をログ出力

### 3. データ構造の名前の統一性

**注意点**: `contest_task_pairs.ts` ファイルのフィールド名が `problem_id` ですが、Prisma スキーマでは `taskId` です。

**推奨**: データファイルとスキーマのフィールド名を統一する、または明確なマッピングを文書化する。

**現在の対応**:

```typescript
// contest_task_pairs.ts から読み込まれるデータ
{
  contest_id: 'tessoku-book',
  problem_id: 'typical90_s',      // ← 注意：problem_id
  problem_index: 'C18'
}

// Prisma への投入時にマッピング
contestId: pair.contest_id,
taskId: pair.problem_id,           // ← problem_id を taskId に
taskTableIndex: pair.problem_index
```

### 4. 処理順序の設計

**重要**: `addContestTaskPairs()` は `addTasks()` の後に実行する。

**理由**: `ContestTaskPair` は `taskId` を参照します。外部キー制約により、参照先が存在する必要があります。

**処理順序**:

1. `addUsers()` - ユーザー作成
2. `addTasks()` - タスク作成 ⭐ 先
3. `addContestTaskPairs()` - コンテスト-タスク ペア ⭐ 後
4. `addWorkBooks()` - ワークブック作成

### 5. 環境変数による動的調整

**利点**: 環境に応じて並行処理数を調整可能。

**フォールバック**: デフォルト値を用意することで、環境変数が設定されていない場合も動作します。

```typescript
const QUEUE_CONCURRENCY = {
  contestTaskPairs: Number(process.env.SEED_CONTEST_TASK_PAIRS_CONCURRENCY) || 2,
};
```

### 6. ログ出力の重要性

**ポイント**:

- 処理開始・完了ログで全体的な進捗を把握
- エラー発生時は詳細をログ出力
- 既存データとの重複は警告またはスキップログを出力

**効果**: トレーニング・デバッグ時の問題特定が容易
