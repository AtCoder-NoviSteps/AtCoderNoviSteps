# 問題コメント機能 — 設計書

## 概要

AtCoder NoviSteps の問題詳細ページ（`/problems/[slug]`）に、ユーザが問題に対してコメントを投稿・閲覧できる機能を追加する。解法メモの公開共有や他ユーザとの質問・議論を目的とする。

## Discord との用途の違い

「Discord でいいのでは？」という意見が上がったが、AtCoder NoviSteps に公式 Discord は存在しない。また仮に設けたとしても、Discord はコメント機能の代替にはならない。

| 観点 | コメント機能（本機能） | Discord |
|---|---|---|
| 問題との紐付け | 問題ページに直接表示される | 問題ごとにチャンネルを作ることは不可能。統合チャンネルでは過去の議論が埋もれる |
| 検索性 | 問題ページを開けば即座に参照できる | 数千問分の議論が混在し、目的の議論を探せない |
| 主な用途 | 特定問題の解法メモ共有・質問・議論 | リアルタイム雑談・コンテスト中の交流・運営アナウンス |
| 向いているユーザ行動 | 問題を解いた後・解いている最中に「この問題について調べる」 | コミュニティ全体で「今起きていることについて話す」 |

問題に紐付いた非同期の議論はコメント機能が担う。Discord はその代替にならない。

## コメント機能で解決したい課題

現状、問題詳細ページには回答状況の記録（提出ステータスの更新）しか機能がない。そのため以下の課題がある。

- 問題を解いた際の考察・解法の記録を他ユーザと共有する場所がない
- 問題でつまずいているときにヒントや解説を求める手段がない
- 問題の難易度・質に関する議論ができない

コメント機能を追加することで、解法メモの公開共有と他ユーザとの質問・議論の両方を同一の問題ページ上で実現する。

## 仕様の素案

### 公開範囲・権限

| 操作 | 条件 |
|---|---|
| コメント閲覧 | 全ユーザ（未ログインも可） |
| コメント投稿 | ログインユーザのみ |
| コメント編集 | 投稿本人 または 管理者（ADMIN） |
| コメント削除 | 投稿本人 または 管理者（ADMIN） |

### スレッド構造

- トップレベルコメントに対して **1段階のみ** リプライを付けられる（GitHub Issue コメント型）
- リプライへのリプライは禁止（アプリ層で強制）
- ネタバレ対策は行わない（ユーザの責任）

### モデレーション

悪質なコメント・荒らし対策として以下の3機能を実装する。

| 機能 | 概要 |
|---|---|
| **通報（A）** | ログインユーザが任意のコメントを通報できる。管理画面に通報一覧を表示し、運営は通報済みコメントのみを確認・対処すれば良い |
| **レートリミット（B）** | 同一ユーザは **10分間に10件** までしかコメント（トップレベル＋リプライ合計）を投稿できない。超過時は `fail(429)` を返す |
| **投稿BAN（C）** | 管理者が特定ユーザのコメント投稿を禁止できる。BAN中ユーザは投稿フォームが非表示になり、action でも `fail(403)` を返す |

### 表示仕様

- 表示場所: 問題詳細ページ（`/problems/[slug]`）下部
- 表示順: トップレベルコメントを投稿日時の降順（新しい順）
- リプライは各トップレベルコメントの下に昇順で全件表示
- ページネーション: トップレベルコメントに対して **20件/ページ**（`?page=N` クエリパラメータ）
- コメント形式: プレーンテキスト（1〜1000文字）

---

## 設計

### データモデル

新テーブル `task_comment` を追加する。

```prisma
model TaskComment {
  id        String   @id @default(uuid())
  taskId    String
  userId    String
  parentId  String?  // null = トップレベル、非 null = リプライ（1段階のみ）
  // CHECK: char_length(content) BETWEEN 1 AND 1000 — dual enforcement with Zod (see content length constraint)
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  task    Task         @relation(fields: [taskId], references: [task_id], onDelete: Cascade)
  user    User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent  TaskComment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies TaskComment[] @relation("CommentReplies")

  @@index([taskId, createdAt])
  @@map("task_comment")
}
```

通報を管理するテーブル `task_comment_report` も追加する。

```prisma
model TaskCommentReport {
  id        String   @id @default(uuid())
  commentId String
  reporterId String
  createdAt DateTime @default(now())

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

- `parentId` の自己参照リレーションで1段階ネストのみ許容する。深い再帰クエリが不要になりシンプルに保てる。
- `onDelete: Cascade` により Task・User・親コメント削除時に関連するコメントも削除される。
- ページネーション用に `(taskId, createdAt)` 複合インデックスを追加する。
- `content` の1〜1000文字制約は Zod（早期バリデーション）と SQL `CHECK`（最終防衛ライン）の両層で強制する（dual enforcement）。マイグレーション SQL に `CHECK (char_length(content) BETWEEN 1 AND 1000)` を手動で追加する。
- 1段階リプライ制限はアプリ層（`createTaskCommentReply` 内での `parent.parentId != null` チェック）でのみ強制する。DB の自己参照 FK に `CHECK` で深さを制限する方法は Prisma では標準サポートされないため、アプリ層のみとする。管理者以外は DB に直接アクセスしないためリスクは許容範囲内。

**却下した代替案:**

- **多段ネスト（Materialized Path / 再帰CTE）**: このユースケースにはオーバーエンジニアリング。Prisma での再帰クエリサポートが薄くコストが高い。

### ディレクトリ構成

```
src/features/comments/
├── components/
│   ├── CommentSection.svelte      # コメント一覧＋フォームの親コンテナ
│   ├── CommentList.svelte         # トップレベルコメントのリスト＋ページネーション
│   ├── CommentItem.svelte         # 個別コメント（本文・投稿者・日時・操作ボタン）
│   ├── ReplyList.svelte           # リプライ一覧
│   └── CommentForm.svelte         # 投稿フォーム（新規＋返信で共用）
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

export type TaskCommentWithReplies = {
  id: string;
  taskId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: { username: string };
  replies: TaskCommentWithUser[];
};

export type TaskCommentWithUser = {
  id: string;
  taskId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: { username: string };
};

export type TaskCommentPage = {
  comments: TaskCommentWithReplies[];
  totalCount: number;
  page: number;
  pageSize: number;
};
```

### サービス層

**`src/features/comments/services/task_comment.ts`**

| 関数 | シグネチャ | 説明 |
|---|---|---|
| `getTaskComments` | `(taskId, page, pageSize) => Promise<TaskCommentPage \| null>` | トップレベルコメントをページネーションで取得。タスクが存在しない場合は `null` |
| `createTaskComment` | `(taskId, userId, content) => Promise<TaskCommentWithUser>` | トップレベルコメントを投稿 |
| `createTaskCommentReply` | `(parentId, userId, content) => Promise<TaskCommentWithUser \| null>` | リプライを投稿。親がリプライの場合は `null` を返す |
| `deleteTaskComment` | `(commentId, requesterId, requesterRole) => Promise<true \| null>` | 本人または ADMIN のみ削除可能。成功時 `true`、権限なし・存在しない場合は `null` |
| `updateTaskComment` | `(commentId, requesterId, requesterRole, content) => Promise<TaskCommentWithUser \| null>` | 本人または ADMIN のみ編集可能。権限なしは `null` |
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
- リプライへのリプライ: `createTaskCommentReply` が `null` を返す → action で `fail(400, { error: 'invalid_parent' })` に変換
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
  getTaskComments(task.task_id, page, PAGE_SIZE),
]);

if (!commentPage) error(404, 'Task not found');
```

`page` は `url.searchParams.get('page')` から取得（デフォルト 1）。

**actions（追加）:**

| action 名 | バリデーション | 処理 |
|---|---|---|
| `createComment` | `content`: 1〜1000文字 | BAN確認 → レートリミット確認 → `createTaskComment` |
| `createReply` | `parentId`: UUID, `content`: 1〜1000文字 | BAN確認 → レートリミット確認 → `createTaskCommentReply` |
| `deleteComment` | `commentId`: UUID | `deleteTaskComment` |
| `updateComment` | `commentId`: UUID, `content`: 1〜1000文字 | `updateTaskComment` |
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
  content: z.string().min(1).max(1000),
});

const createReplySchema = z.object({
  parentId: z.string().uuid(),
  content: z.string().min(1).max(1000),
});

const deleteCommentSchema = z.object({
  commentId: z.string().uuid(),
});

const updateCommentSchema = z.object({
  commentId: z.string().uuid(),
  content: z.string().min(1).max(1000),
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
- 未ログイン時は「コメントするにはログインが必要です」を表示
- BAN中ユーザには投稿フォームを非表示にし「投稿が制限されています」を表示
- `CommentList` と `CommentForm` を束ねる

**CommentList.svelte**

- トップレベルコメントを `{#each}` でレンダリング
- 各コメントに `CommentItem` + `ReplyList` を表示
- Flowbite の `Pagination` でページネーションUIを表示

**CommentItem.svelte**

- ユーザ名・投稿日時（相対時間）・本文を表示
- 本人または管理者には「編集」「削除」ボタンを表示
- リプライ可能なコメント（トップレベル）には「返信する」ボタンを表示し、クリックで `CommentForm` をインライン展開
- ログインユーザには「通報する」ボタンを表示（自分のコメントは非表示）

**ReplyList.svelte**

- リプライを `CommentItem` で表示
- `CommentItem` の「返信する」ボタンは非表示にしてネスト防止

**CommentForm.svelte**

- `use:enhance` で progressive enhancement
- `parentId` を hidden input で渡す（null の場合はトップレベル投稿）
- 送信後にフォームをリセット

### テスト方針

`src/features/comments/services/task_comment.test.ts` でユニットテストを実施する。DBモックは `vi.mock('$lib/server/database', ...)` を使用。

**`task_comment.test.ts`:**

| テスト対象 | ケース |
|---|---|
| `getTaskComments` | 正常取得、page=1、最終ページ、コメント0件 |
| `createTaskComment` | 正常投稿、content 空文字、1001文字超 |
| `createTaskCommentReply` | 正常返信、リプライへのリプライ禁止 |
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
