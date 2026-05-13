# 問題コメント機能 — 設計書

## 概要

AtCoder NoviSteps の問題詳細ページ（`/problems/[slug]`）に、ユーザが問題に対してコメントを投稿・閲覧できる機能を追加する。**解法・考え方の共有**を目的とし、議論は既存の SNS で代替できるためスコープ外とする。

## Discord との用途の違い

設計の検討過程で「Discord でよいのでは？」という意見が上がった。Discord は競プロコミュニティに浸透しており新機能を作る必要がない点は利点だが、**問題との文脈の紐付け**という点で代替にはならないと判断した。

| 観点 | コメント機能（本機能） | Discord |
|---|---|---|
| 問題との紐付け | 問題ページに直接表示される | 問題ごとにチャンネルを作ることは不可能。統合チャンネルでは過去の議論が埋もれる |
| 検索性 | 問題ページを開けば即座に参照できる | 数千問分の議論が混在し、目的の議論を探せない |
| 主な用途 | 特定問題の解法・考え方の共有 | リアルタイム雑談・コンテスト中の交流 |
| 向いているユーザ行動 | 問題を解いた後・解いている最中に「この問題について調べる」 | コミュニティ全体で「今起きていることについて話す」 |

本機能の核心的な価値は「問題ページを開いたときにその問題の解法・考え方がすぐ見える」ことであり、Discord ではこれを実現できない。

## コメント機能で解決したい課題

現状、問題詳細ページには回答状況の記録（提出ステータスの更新）しか機能がない。そのため以下の課題がある。

- 問題を解いた際の考察・解法の記録を他ユーザと共有する場所がない
- 問題でつまずいているときにヒントや解説を参照する手段がない

コメント機能を追加することで、解法・考え方の共有を同一の問題ページ上で実現する。議論は既存の SNS での実施を想定するため、本機能では不要とする。

## 仕様の素案

### 公開範囲・権限

| 操作 | 条件 |
|---|---|
| コメント閲覧 | ログインユーザのみ |
| コメント投稿 | ログインユーザのみ |
| コメント公開/非公開設定 | 投稿本人（デフォルト: 公開） |
| コメント編集 | 投稿本人 または 管理者（ADMIN） |
| コメント削除 | 投稿本人 または 管理者（ADMIN） |

非公開コメントは投稿本人と管理者（ADMIN）のみが閲覧できる。管理者は通報対応・BAN判断のために非公開コメントを閲覧できる必要がある。

### コメント方針

- コメントの目的は**解法・考え方の共有**に限定する。議論は既存の SNS で代替できるため行わない
- スレッド（返信）機能は持たない。フラットなコメント一覧のみ
- ネタバレ対策は行わない（ユーザの責任）

### モデレーション

悪質なコメント・荒らし対策として以下の3機能を実装する。

| 機能 | 概要 |
|---|---|
| **通報（A）** | ログインユーザが任意のコメントを通報できる。管理画面に通報一覧を表示し、運営は通報済みコメントのみを確認・対処すれば良い |
| **レートリミット（B）** | 同一ユーザは **10分間に10件** までしかコメントを投稿できない。超過時は `fail(429)` を返す |
| **投稿BAN（C）** | 管理者が特定ユーザのコメント投稿を禁止できる。BAN中ユーザは投稿フォームが非表示になり、action でも `fail(403)` を返す |

### 表示仕様

- 表示場所: 問題詳細ページ（`/problems/[slug]`）下部
- 表示順: コメントを投稿日時の降順（新しい順）
- ページネーション: **20件/ページ**（`?page=N` クエリパラメータ）
- コメント形式: プレーンテキスト（1〜200文字）
- 非公開コメントは投稿本人と管理者の一覧内でアイコン等で識別できるよう表示する

---

## 設計

### データモデル

新テーブル `task_comment` を追加する。

```prisma
model TaskComment {
  id        String   @id @default(uuid())
  taskId    String
  userId    String
  isPublic  Boolean  @default(true) // false = 投稿本人と管理者のみ閲覧可
  // CHECK: char_length(content) BETWEEN 1 AND 200 — dual enforcement with Zod (see content length constraint)
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  task    Task @relation(fields: [taskId], references: [task_id], onDelete: Cascade)
  user    User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([taskId, createdAt])
  @@map("task_comment")
}
```

通報を管理するテーブル `task_comment_report` も追加する。

```prisma
model TaskCommentReport {
  id         String   @id @default(uuid())
  commentId  String
  reporterId String
  createdAt  DateTime @default(now())

  comment  TaskComment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  reporter User        @relation("CommentReports", fields: [reporterId], references: [id], onDelete: Cascade)

  @@unique([commentId, reporterId]) // 同一ユーザによる重複通報を防止
  @@map("task_comment_report")
}
```

また、`Task`・`User`・`TaskComment` モデルに以下のフィールドを追加する（`prisma generate` に必要）。

```prisma
// Task モデルに追加
taskComments TaskComment[]

// User モデルに追加
isCommentBanned Boolean  @default(false)  // 投稿BAN フラグ
taskComments    TaskComment[]
commentReports  TaskCommentReport[] @relation("CommentReports")

// TaskComment モデルに追加
reports TaskCommentReport[]
```

**設計判断:**

- スレッド機能を持たないため `parentId` による自己参照リレーションは不要。フラットな一覧のみ。
- `isPublic` フィールドでコメントの公開範囲を制御する。デフォルト公開（`true`）。
- `onDelete: Cascade` により Task・User 削除時に関連するコメントも削除される。
- ページネーション用に `(taskId, createdAt)` 複合インデックスを追加する。
- `content` の1〜200文字制約は Zod（早期バリデーション）と SQL `CHECK`（最終防衛ライン）の両層で強制する（dual enforcement）。マイグレーション SQL に `CHECK (char_length(content) BETWEEN 1 AND 200)` を手動で追加する。

**却下した代替案:**

- **スレッド（1段階リプライ）**: 「議論を行わない」方針と矛盾するため削除。フラットなコメント一覧のほうが実装がシンプルで、荒らし・議論の起点となるリスクも低い。

### ディレクトリ構成

```
src/features/comments/
├── components/
│   ├── CommentSection.svelte      # コメント一覧＋フォームの親コンテナ
│   ├── CommentList.svelte         # コメントのリスト＋ページネーション
│   ├── CommentItem.svelte         # 個別コメント（本文・投稿者・日時・操作ボタン）
│   └── CommentForm.svelte         # 投稿フォーム
├── services/
│   ├── task_comment.ts
│   └── task_comment_moderation.ts  # 通報・BAN関連
├── types/
│   └── index.ts
└── fixtures/
    └── task_comment.ts
```

### 型定義

```typescript
// src/features/comments/types/index.ts

export type TaskCommentWithUser = {
  id: string;
  taskId: string;
  userId: string;
  isPublic: boolean;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: { username: string };
};

export type TaskCommentPage = {
  comments: TaskCommentWithUser[];
  totalCount: number;
  page: number;
  pageSize: number;
};
```

### サービス層

**`src/features/comments/services/task_comment.ts`**

| 関数 | シグネチャ | 説明 |
|---|---|---|
| `getTaskComments` | `(taskId, currentUserId, isAdmin, page, pageSize) => Promise<TaskCommentPage \| null>` | コメントをページネーションで取得。一般ユーザは公開コメント＋自分の非公開コメントを取得。管理者は全コメントを取得。タスクが存在しない場合は `null` |
| `createTaskComment` | `(taskId, userId, content, isPublic) => Promise<TaskCommentWithUser>` | コメントを投稿 |
| `deleteTaskComment` | `(commentId, requesterId, requesterRole) => Promise<true \| null>` | 本人または ADMIN のみ削除可能。成功時 `true`、権限なし・存在しない場合は `null` |
| `updateTaskComment` | `(commentId, requesterId, requesterRole, content, isPublic) => Promise<TaskCommentWithUser \| null>` | 本人または ADMIN のみ編集可能。権限なしは `null` |
| `checkCommentRateLimit` | `(userId) => Promise<boolean>` | 過去10分以内の投稿数が10件未満なら `true`（投稿可）を返す |

**`src/features/comments/services/task_comment_moderation.ts`**

| 関数 | シグネチャ | 説明 |
|---|---|---|
| `reportTaskComment` | `(commentId, reporterId) => Promise<true \| null>` | コメントを通報する。重複通報は `null` を返す |
| `getReportedComments` | `(page, pageSize) => Promise<ReportedCommentPage>` | 管理画面用: 通報件数付きコメント一覧を取得 |
| `banUserFromComments` | `(targetUserId, adminId) => Promise<true \| null>` | 対象ユーザを投稿BANする。ADMIN のみ実行可能 |
| `unbanUserFromComments` | `(targetUserId, adminId) => Promise<true \| null>` | 対象ユーザの投稿BANを解除する。ADMIN のみ実行可能 |

**型定義追加（`types/index.ts`）:**

```typescript
export type ReportedCommentPage = {
  comments: (TaskCommentWithUser & { reportCount: number })[];
  totalCount: number;
  page: number;
  pageSize: number;
};
```

**エラーケース:**

- タスクが存在しない: `getTaskComments` が `null` を返す → load() で `error(404)` に変換
- 権限なし（第三者が削除・編集）: `null` を返す → action で `fail(403)` に変換
- 存在しないコメント: `null` を返す（Prisma P2025）→ action で `fail(404)` に変換
- レートリミット超過: `checkCommentRateLimit` が `false` を返す → action で `fail(429)` に変換
- BAN中ユーザが投稿: action で `fail(403, { error: 'comment_banned' })` に変換
- 重複通報: `reportTaskComment` が `null` を返す → action で `fail(409)` に変換

### ルートハンドラ変更

`src/routes/problems/[slug]/+page.server.ts` を変更する。

**load():**

```typescript
const [taskResult, buttons, commentPage] = await Promise.all([
  getTask(...),
  getButtons(...),
  getTaskComments(task.task_id, locals.user.id, isAdmin, page, PAGE_SIZE),
]);

if (!commentPage) error(404, 'Task not found');
```

未ログインの場合は `redirect(302, '/login')` を返す（コメント閲覧もログイン必須）。
`page` は `url.searchParams.get('page')` から取得（デフォルト 1）。
`isAdmin` は `locals.user.role === 'ADMIN'` で判定する。

**actions（追加）:**

| action 名 | バリデーション | 処理 |
|---|---|---|
| `createComment` | `content`: 1〜200文字, `isPublic`: boolean | BAN確認 → レートリミット確認 → `createTaskComment` |
| `deleteComment` | `commentId`: UUID | `deleteTaskComment` |
| `updateComment` | `commentId`: UUID, `content`: 1〜200文字, `isPublic`: boolean | `updateTaskComment` |
| `reportComment` | `commentId`: UUID | `reportTaskComment` |

全 action でログイン確認を行い、未認証の場合は `fail(401)` を返す。

**BAN管理は管理者ルートで行う（`src/routes/(admin)/` 配下に追加）:**

| action 名 | 処理 |
|---|---|
| `banUser` | `banUserFromComments` |
| `unbanUser` | `unbanUserFromComments` |
| 通報一覧表示 | `getReportedComments` を load() で取得 |

### Zod スキーマ

```typescript
const createCommentSchema = z.object({
  content: z.string().min(1).max(200),
  isPublic: z.boolean().default(true),
});

const deleteCommentSchema = z.object({
  commentId: z.string().uuid(),
});

const updateCommentSchema = z.object({
  commentId: z.string().uuid(),
  content: z.string().min(1).max(200),
  isPublic: z.boolean(),
});

const reportCommentSchema = z.object({
  commentId: z.string().uuid(),
});

const banUserSchema = z.object({
  targetUserId: z.string(),
});
```

### UIコンポーネント

**CommentSection.svelte**

- `data.commentPage`・`data.user`・`data.isCommentBanned` を受け取る
- 未ログイン時は「コメントを閲覧するにはログインが必要です」を表示（閲覧もログイン必須）
- BAN中ユーザには投稿フォームを非表示にし「投稿が制限されています」を表示
- `CommentList` と `CommentForm` を束ねる

**CommentList.svelte**

- コメントを `{#each}` でレンダリング
- 各コメントに `CommentItem` を表示
- 非公開コメントはアイコン等で識別できるよう表示（本人・管理者のみ表示）
- Flowbite の `Pagination` でページネーションUIを表示

**CommentItem.svelte**

- ユーザ名・投稿日時（相対時間）・本文を表示
- 本人または管理者には「編集」「削除」ボタンを表示
- ログインユーザには「通報する」ボタンを表示（自分のコメントは非表示）
- スレッドを持たないため「返信する」ボタンは存在しない

**CommentForm.svelte**

- `use:enhance` で progressive enhancement
- 公開/非公開を切り替えるトグル（チェックボックスまたはセレクト）を表示
- 送信後にフォームをリセット

### テスト方針

`src/features/comments/services/task_comment.test.ts` でユニットテストを実施する。DBモックは `vi.mock('$lib/server/database', ...)` を使用。

**`task_comment.test.ts`:**

| テスト対象 | ケース |
|---|---|
| `getTaskComments` | 一般ユーザ（公開＋自分の非公開のみ取得）、管理者（全件取得）、page=1、最終ページ、コメント0件 |
| `createTaskComment` | 正常投稿（公開）、正常投稿（非公開）、content 空文字、201文字超 |
| `deleteTaskComment` | 本人削除、管理者削除、第三者削除（エラー） |
| `updateTaskComment` | 本人更新、管理者更新、第三者更新（エラー） |
| `checkCommentRateLimit` | 9件投稿済みで `true`、10件投稿済みで `false` |

**`task_comment_moderation.test.ts`:**

| テスト対象 | ケース |
|---|---|
| `reportTaskComment` | 正常通報、重複通報（エラー） |
| `banUserFromComments` | 管理者がBAN、非管理者がBAN（エラー） |
| `unbanUserFromComments` | 管理者がBAN解除、非管理者がBAN解除（エラー） |

E2Eテスト（Playwright）は今回スコープ外とし、手動確認で代替する。

---

## 実装フェーズ概要

| フェーズ | 内容 | レイヤー |
|---|---|---|
| 1 | DBスキーマ追加・マイグレーション（`task_comment`・`task_comment_report`・`User.isCommentBanned`） | prisma |
| 2 | 型定義・フィクスチャ | types / fixtures |
| 3 | コメントサービス層実装＋ユニットテスト（`task_comment.ts`） | services |
| 4 | モデレーションサービス層実装＋ユニットテスト（`task_comment_moderation.ts`） | services |
| 5 | ルートハンドラ変更（load + actions）＋管理者ルート追加 | routes |
| 6 | UIコンポーネント実装 | components |
| 7 | 結合確認・フォーマット・PR準備 | — |
