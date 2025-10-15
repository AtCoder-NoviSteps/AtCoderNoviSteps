# Contest-Task Pair Mapping 実装計画

## 概要

既存の Task テーブルの unique 制約を維持しながら、複数コンテストで同一問題を扱うための拡張実装計画。[前回計画](../../2025-09-17/contest-task-mapping/initial_plan.md)をベースに、互換性レイヤを用いた段階的移行戦略のうちデータベース設計と型定義を詳細化。

## 1. 命名の決定

- **モデル名**: `ContestTaskPair` (「ペア」であることを明示)
- **型名**: `ContestTaskPairKey` (Prisma モデルとの衝突回避)
- **マップ型**: `TaskResultMapByContestTaskPair` (キーと値の関係を明示)

## 2. データベース設計

### Prisma スキーマ追加

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

### マイグレーション

```bash
# 開発環境
pnpm dlx prisma migrate dev --name create_contest_task_pair
```

### CRUD メソッドの実装

**ファイル**: `src/lib/services/contest_task_pairs.ts`

```typescript
import { Prisma } from '@prisma/client';

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
): Promise<ContestTaskPair> {
  try {
    return await db.contestTaskPair.create({
      data: {
        contestId,
        taskTableIndex,
        taskId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const errorMessage = `ContestTaskPair already exists: contestId=${contestId}, taskId=${taskId}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    console.error('Failed to create ContestTaskPair:', error);
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
): Promise<ContestTaskPair> {
  try {
    return await db.contestTaskPair.update({
      where: {
        contestId_taskId: {
          contestId,
          taskId,
        },
      },
      data: {
        taskTableIndex,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      const errorMessage = `Not found ContestTaskPair: contestId=${contestId}, taskId=${taskId}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    console.error('Failed to update ContestTaskPair:', error);
    throw error;
  }
}
```

**特徴**:

- DRY原則に従い `getContestTaskPair()` を共通メソッドとして切り出し
- 複合ユニーク制約 `@@unique([contestId, taskId])` を活用
- Prisma のエラーハンドリング（例: `P2002`, `P2025`）を活用して、事前チェックを省略し、TOCTOU （Time-of-Check to Time-of-Use）競合を回避
- Prisma の自動生成型を使用して型安全性を確保

## 3. 型定義の更新

### Prisma型に基づく型定義

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

export type ContestTaskPairRead = ContestTaskPairCreate;

export type ContestTaskPairUpdate = ContestTaskPairCreate;
```

### マッピング用の型定義

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

## 4. 実行計画

- [✅] Prisma スキーマに ContestTaskPair モデル追加
- [✅] マイグレーション実行
- [✅] CRUD メソッドを追加
- [✅] TypeScript 型定義追加

## 決定事項

1. **モデル名**: ContestTaskPair
2. **型名**: ContestTaskPairKey, TaskResultMapByContestTaskPair

## 今後の課題

1. **移行方針**: TaskMapAdapter による段階的移行
2. **アダプタ配置**: `src/lib/utils/task_results.ts`（影響局所化・テスト容易性・削除容易性）
3. **id 属性**: 将来性を考慮して追加
4. **Feature Flag**: 環境変数制御、getTaskResults()のみ適用（段階1）
5. **テスト方針**: `test` + `expect to` + TypeScript strict + assert追加
6. **監視手法**: console.log + Vercelログ（APM導入見送り）
7. **データ投入**: seed.ts優先 → 管理者画面は、その次の段階で実装

---

## 教訓と一般化

以下は、実装中に得られた教訓を一般化したものです。今後の開発においても参考にしてください。

### 1. 防御的なチェックの再考

- **教訓**: Prisma のエラーハンドリング（例: `P2002` や `P2025`）を活用することで、事前チェックを省略し、TOCTOU（Time-of-Check to Time-of-Use）競合を回避できる。
- **推奨**: 事前チェックを行う代わりに、データベース操作の結果を直接利用し、エラーを適切に処理する。

### 2. 戻り値の活用

- **教訓**: CRUD メソッドで作成・更新されたレコードを返すことで、呼び出し元が追加のクエリを実行せずに結果を利用できる。
- **推奨**: `create` や `update` メソッドでは、`void` を返すのではなく、作成・更新されたレコードを返すようにする。

### 3. 型定義の明確化

- **教訓**: Prisma の自動生成型を活用しつつ、必要に応じて独自の型を定義することで、型安全性と可読性を向上できる。
- **推奨**: CRUD 操作用の型（例: `Create`, `Update`, `Read`）を明確に分離し、それぞれの目的に応じた型を定義する。

### 4. ログとエラーハンドリング

- **教訓**: エラー発生時には、適切なログを出力し、問題の特定を容易にする。
- **推奨**: Prisma のエラーコード（例: `P2002`, `P2025`）を活用して、エラー内容に応じた具体的なメッセージを出力する。

**更新日**: 2025-10-15
