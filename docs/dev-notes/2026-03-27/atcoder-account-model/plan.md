# AtCoder アカウントモデル分割・コード集約 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**

1. `User` モデルから AtCoder 関連フィールドを `AtCoderAccount` モデルに切り出す
2. アカウント関連のコードを `src/features/account` に集約する

**Architecture:**

- `AtCoderAccount` は `User` との 1 対 0-or-1 リレーション。`userId` を PK として使い、独立した ID フィールドを持たない（結合キーが重複しないため）
- `hooks.server.ts` は `getUser` の戻り値に含まれる `atCoderAccount` を参照して `is_validated` を設定する
- サービス層は `db.atCoderAccount.upsert` を使う（AtCoder 未登録ユーザーのレコードが存在しない可能性があるため）
- 認証用 URL（`https://prettyhappy.sakura.ne.jp/...`）はこのタスクでは変更しない（認証サーバー移行は別 issue）

**Tech Stack:** SvelteKit 2 + Svelte 5 Runes, TypeScript, Prisma, Vitest (unit)

---

## ファイル変更一覧

| 操作 | ファイル                                                                        | 変更内容                                                                                           |
| ---- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 修正 | `prisma/schema.prisma`                                                          | `AtCoderAccount` モデル追加、`User` から AtCoder フィールド削除                                    |
| 新規 | `prisma/migrations/YYYYMMDD_split_atcoder_account/migration.sql`                | テーブル作成・データ移行・旧カラム削除                                                             |
| 修正 | `src/lib/services/users.ts`                                                     | `getUser` / `getUserById` に `include: { atCoderAccount: true }` 追加、`updateValicationCode` 削除 |
| 修正 | `src/hooks.server.ts`                                                           | `user.atCoderAccount?.isValidated` を参照するよう更新                                              |
| 新規 | `src/features/account/services/atcoder_verification.ts`                         | `validateApiService.ts` の移行先（AtCoderAccount CRUD に書き換え）                                 |
| 削除 | `src/lib/services/validateApiService.ts`                                        | 移行後に削除                                                                                       |
| 修正 | `src/routes/users/edit/+page.server.ts`                                         | import パスを新 service に更新、load 戻り値を AtCoderAccount 参照に変更                            |
| 新規 | `src/features/account/components/settings/AtCoderVerificationForm.svelte`       | `AtCoderUserValidationForm.svelte` の移行先                                                        |
| 削除 | `src/lib/components/AtCoderUserValidationForm.svelte`                           | 移行後に削除                                                                                       |
| 新規 | `src/features/account/components/delete/AccountDeletionForm.svelte`             | `UserAccountDeletionForm.svelte` の移行先                                                          |
| 新規 | `src/features/account/components/delete/WarningMessageOnDeletingAccount.svelte` | `WarningMessageOnDeletingAccount.svelte` の移行先                                                  |
| 削除 | `src/lib/components/UserAccountDeletionForm.svelte`                             | 移行後に削除                                                                                       |
| 削除 | `src/lib/components/WarningMessageOnDeletingAccount.svelte`                     | 移行後に削除                                                                                       |
| 修正 | `src/routes/users/edit/+page.svelte`                                            | import パスを新コンポーネントに更新                                                                |
| 修正 | `src/test/lib/utils/test_cases/account_transfer.ts`                             | AtCoder フィールド参照を `atCoderAccount` に更新                                                   |

---

## フェーズ概要

| フェーズ | 内容                                                           | リスク                             |
| -------- | -------------------------------------------------------------- | ---------------------------------- |
| Phase 1  | `AtCoderAccount` モデル追加・マイグレーション                  | 高（DB スキーマ変更・データ移行）  |
| Phase 2  | サービス層の更新（users.ts / hooks.server.ts）                 | 中（全リクエストに影響する hooks） |
| Phase 3  | `atcoder_verification.ts` サービス実装と `page.server.ts` 更新 | 中（外部 API 連携）                |
| Phase 4  | コンポーネント移行と import パス更新                           | 低（純粋な移動）                   |

---

## 設計上の判断と却下した代替案

### AtCoderAccount の PK 設計

- **採用**: `userId String @id`（User の id をそのまま PK として使う）
- **却下**: `id String @id @default(cuid())` + `userId String @unique` → 冗長。1:1 リレーションでは userId を PK にする方がシンプル

### データ移行方針

- **採用**: Migration SQL 内で `INSERT INTO atcoder_account SELECT ... FROM user WHERE atcoder_username != ''`（既存データのある行のみ移行）
- **却下**: アプリケーション側でシード処理 → マイグレーションとデータ移行が分離し、Prisma の冪等性保証が崩れる

### `getUser` での AtCoderAccount 取得

- **採用**: `include: { atCoderAccount: true }` を常に付ける（hooks.server.ts で毎リクエスト呼ぶ関数に統一）
- **却下**: AtCoderAccount を別クエリで取得 → N+1 問題。JOIN の方が効率的

### `validateApiService.ts` の upsert

- **採用**: `db.atCoderAccount.upsert({ where: { userId }, create: {...}, update: {...} })` → ユーザーが未登録でも create が走る
- **却下**: `create` / `update` を条件分岐 → 複雑になる

### コンポーネントのリネーム

- `AtCoderUserValidationForm` → `AtCoderVerificationForm`（`User` という語を除去しドメインを明確化）
- `UserAccountDeletionForm` → `AccountDeletionForm`（同上）

---

## Phase 1: `AtCoderAccount` モデル追加・マイグレーション

**Files:**

- Modify: `prisma/schema.prisma`
- Create: migration SQL

### スキーマ変更

- [ ] **Step 1: `prisma/schema.prisma` を修正する**

```prisma
// 追加
model AtCoderAccount {
  userId         String   @id
  handle         String   @default("")
  isValidated    Boolean  @default(false)
  validationCode String   @default("")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("atcoder_account")
}

// User モデルを修正
model User {
  id         String   @id @unique
  username   String   @unique
  role       Roles    @default(USER)
  // atcoder_* フィールドをすべて削除
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  auth_session   Session[]
  key            Key[]
  taskAnswer     TaskAnswer[]
  workBooks      WorkBook[]
  voteGrade      VoteGrade[]
  atCoderAccount AtCoderAccount?  // 追加

  @@map("user")
}
```

- [ ] **Step 2: マイグレーションを作成する**

```bash
docker exec atcodernovisteps-web-1 pnpm exec prisma migrate dev --name split_atcoder_account
```

Prisma が自動生成するマイグレーション SQL に **データ移行 SQL を手動で追記する**:

```sql
-- 既存の AtCoder データを移行（atcoder_username が空でないユーザーのみ）
INSERT INTO "atcoder_account" ("userId", "handle", "isValidated", "validationCode", "createdAt", "updatedAt")
SELECT
  "id",
  "atcoder_username",
  COALESCE("atcoder_validation_status", false),
  "atcoder_validation_code",
  NOW(),
  NOW()
FROM "user"
WHERE "atcoder_username" != '';
```

注意: Prisma の自動生成 SQL は `DROP COLUMN` を最後に置くので、`INSERT INTO` は `DROP COLUMN` の前に手動挿入すること。

- [ ] **Step 3: Prisma クライアントを再生成する**

```bash
docker exec atcodernovisteps-web-1 pnpm exec prisma generate
```

- [ ] **Step 4: lint・型チェックを実行する**

```bash
docker exec atcodernovisteps-web-1 pnpm lint
docker exec atcodernovisteps-web-1 pnpm check
```

期待: エラーなし（まだ services/hooks が旧フィールドを参照しているため型エラーが出る可能性あり。次フェーズで解消）

- [ ] **Step 5: コミットする**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add AtCoderAccount model and migrate data from User"
```

---

## Phase 2: サービス層の更新（users.ts / hooks.server.ts）

**Files:**

- Modify: `src/lib/services/users.ts`
- Modify: `src/hooks.server.ts`

### users.ts の変更

`getUser` と `getUserById` に `include: { atCoderAccount: true }` を追加し、`updateValicationCode` を削除する（`validateApiService.ts` で AtCoderAccount を直接更新するため不要）。

- [ ] **Step 1: `src/lib/services/users.ts` を修正する**

```typescript
import { default as db } from '$lib/server/database';

export async function getUser(username: string) {
  return await db.user.findUnique({
    where: { username },
    include: { atCoderAccount: true },
  });
}

export async function getUserById(userId: string) {
  return await db.user.findUnique({
    where: { id: userId },
    include: { atCoderAccount: true },
  });
}

export async function deleteUser(username: string) {
  return await db.user.delete({ where: { username } });
}
```

### hooks.server.ts の変更

`user.atcoder_validation_status` → `user.atCoderAccount?.isValidated` に変更。

- [ ] **Step 2: `src/hooks.server.ts` を修正する**

```typescript
event.locals.user = {
  id: user.id,
  name: user.username,
  role: user.role,
  atcoder_name: user.atCoderAccount?.handle ?? '',
  is_validated: user.atCoderAccount?.isValidated ?? null,
};
```

- [ ] **Step 3: lint・型チェック・unit tests を実行する**

```bash
docker exec atcodernovisteps-web-1 pnpm lint
docker exec atcodernovisteps-web-1 pnpm check
docker exec atcodernovisteps-web-1 pnpm test:unit
```

期待: エラーなし、全テスト通過

- [ ] **Step 4: コミットする**

```bash
git add src/lib/services/users.ts src/hooks.server.ts
git commit -m "refactor: update users.ts and hooks.server.ts to use AtCoderAccount relation"
```

---

## Phase 3: `atcoder_verification.ts` サービス実装と `page.server.ts` 更新

**Files:**

- Create: `src/features/account/services/atcoder_verification.ts`
- Delete: `src/lib/services/validateApiService.ts`
- Modify: `src/routes/users/edit/+page.server.ts`
- Modify: `src/test/lib/utils/test_cases/account_transfer.ts`（AtCoder フィールド参照の更新）

### atcoder_verification.ts の実装

`validateApiService.ts` の実装を `AtCoderAccount` を使うよう書き換える。

- [ ] **Step 1: `src/features/account/services/atcoder_verification.ts` を作成する**

```typescript
import { default as db } from '$lib/server/database';
import { sha256 } from '$lib/utils/hash';

const CONFIRM_API_URL = 'https://prettyhappy.sakura.ne.jp/php_curl/index.php';

/** Calls the external API to check if the validation code appears in the user's AtCoder affiliation. */
async function confirmWithExternalApi(handle: string, validationCode: string): Promise<boolean> {
  const url = `${CONFIRM_API_URL}?user=${handle}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Network response was not ok.');
  }

  const jsonData = await response.json();
  return jsonData.contents?.some((item: string) => item === validationCode) ?? false;
}

/**
 * Generates a SHA256 validation code, stores it in AtCoderAccount, and returns the code.
 * Creates the AtCoderAccount record if it does not exist yet.
 */
export async function generate(username: string, handle: string): Promise<string> {
  const date = new Date().toISOString();
  const validationCode = await sha256(username + date);

  const user = await db.user.findUniqueOrThrow({ where: { username } });

  await db.atCoderAccount.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      handle,
      validationCode,
      isValidated: false,
    },
    update: {
      handle,
      validationCode,
      isValidated: false,
    },
  });

  return validationCode;
}

/**
 * Checks the external API and, if confirmed, marks the AtCoderAccount as validated.
 * @returns true if validation succeeded, false otherwise.
 */
export async function validate(username: string): Promise<boolean> {
  const user = await db.user.findUniqueOrThrow({
    where: { username },
    include: { atCoderAccount: true },
  });

  if (!user.atCoderAccount) {
    return false;
  }

  const confirmed = await confirmWithExternalApi(
    user.atCoderAccount.handle,
    user.atCoderAccount.validationCode,
  );

  if (!confirmed) {
    return false;
  }

  await db.atCoderAccount.update({
    where: { userId: user.id },
    data: { validationCode: '', isValidated: true },
  });

  return true;
}

/** Deletes the AtCoderAccount record, effectively resetting the verification state. */
export async function reset(username: string): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { username } });

  await db.atCoderAccount.deleteMany({ where: { userId: user.id } });
}
```

- [ ] **Step 2: `src/routes/users/edit/+page.server.ts` の import と load 戻り値を更新する**

```typescript
import * as verificationService from '$features/account/services/atcoder_verification';

// load 関数の戻り値
return {
  // ...
  atcoder_username: user?.atCoderAccount?.handle ?? '',
  atcoder_validationcode: user?.atCoderAccount?.validationCode ?? '',
  is_validated: user?.atCoderAccount?.isValidated ?? false,
  // ...
};
```

reset action の戻り値:

```typescript
// reset action: void を返すので validationCode の戻り値が不要になる
reset: async ({ request }) => {
  const formData = await request.formData();
  const username = formData.get('username')?.toString() as string;
  const atcoder_username = formData.get('atcoder_username')?.toString() as string;

  await verificationService.reset(username);

  return {
    success: true,
    username,
    atcoder_username,
    atcoder_validationcode: '',
    message_type: 'green',
    message: 'Successfully reset.',
  };
},
```

- [ ] **Step 3: `src/lib/services/validateApiService.ts` を削除する**

```bash
git rm src/lib/services/validateApiService.ts
```

- [ ] **Step 4: `src/test/lib/utils/test_cases/account_transfer.ts` を更新する**

`atcoder_username`・`atcoder_validation_code`・`atcoder_validation_status` フィールドの参照を確認し、`AtCoderAccount` の構造（`atCoderAccount.handle` 等）に合わせて更新する。

- [ ] **Step 5: lint・型チェック・unit tests を実行する**

```bash
docker exec atcodernovisteps-web-1 pnpm lint
docker exec atcodernovisteps-web-1 pnpm check
docker exec atcodernovisteps-web-1 pnpm test:unit
```

期待: エラーなし、全テスト通過

- [ ] **Step 6: コミットする**

```bash
git add src/features/account/services/atcoder_verification.ts \
        src/routes/users/edit/+page.server.ts \
        src/lib/services/validateApiService.ts \
        src/test/lib/utils/test_cases/account_transfer.ts
git commit -m "refactor: move AtCoder verification logic to src/features/account/services"
```

---

## Phase 4: コンポーネント移行と import パス更新

**Files:**

- Create: `src/features/account/components/settings/AtCoderVerificationForm.svelte`
- Create: `src/features/account/components/delete/AccountDeletionForm.svelte`
- Create: `src/features/account/components/delete/WarningMessageOnDeletingAccount.svelte`
- Delete: `src/lib/components/AtCoderUserValidationForm.svelte`
- Delete: `src/lib/components/UserAccountDeletionForm.svelte`
- Delete: `src/lib/components/WarningMessageOnDeletingAccount.svelte`
- Modify: `src/routes/users/edit/+page.svelte`

- [ ] **Step 1: ディレクトリを作成してコンポーネントをコピーする**

```bash
mkdir -p src/features/account/components/settings
mkdir -p src/features/account/components/delete
```

ファイルをコピー後、内部の import パスを更新する:

- `AtCoderUserValidationForm.svelte` → `AtCoderVerificationForm.svelte`
  - 内部に自身の import はなし（変更不要）
- `UserAccountDeletionForm.svelte` → `AccountDeletionForm.svelte`
  - `$lib/components/WarningMessageOnDeletingAccount` → `./WarningMessageOnDeletingAccount`
- `WarningMessageOnDeletingAccount.svelte` → そのままコピー（外部 import なし）

- [ ] **Step 2: `src/routes/users/edit/+page.svelte` の import パスを更新する**

```svelte
import AtCoderVerificationForm from
'$features/account/components/settings/AtCoderVerificationForm.svelte'; import AccountDeletionForm
from '$features/account/components/delete/AccountDeletionForm.svelte';
```

（現状 AtCoderUserValidationForm はコメントアウトされているが、import 文もコメントアウトのため、コメント内パスも更新する）

- [ ] **Step 3: 旧コンポーネントを削除する**

```bash
git rm src/lib/components/AtCoderUserValidationForm.svelte
git rm src/lib/components/UserAccountDeletionForm.svelte
git rm src/lib/components/WarningMessageOnDeletingAccount.svelte
```

- [ ] **Step 4: lint・型チェック・unit tests を実行する**

```bash
docker exec atcodernovisteps-web-1 pnpm lint
docker exec atcodernovisteps-web-1 pnpm check
docker exec atcodernovisteps-web-1 pnpm test:unit
```

期待: エラーなし、全テスト通過

- [ ] **Step 5: コミットする**

```bash
git add src/features/account/ src/routes/users/edit/+page.svelte
git commit -m "refactor: move account components to src/features/account"
```

---

## 動作確認チェックリスト

- [ ] `/users/edit` ページが正常に表示される
- [ ] AtCoder ID 入力 → 「文字列を生成」ボタンが機能する（DB に AtCoderAccount レコードが作成される）
- [ ] AtCoder 所属欄にコードを入力 → 「本人確認」ボタンが機能する（外部 API 呼び出し）
- [ ] 「リセット」ボタンで AtCoderAccount が削除される
- [ ] hooks.server.ts が `is_validated` を正しく設定する
- [ ] 既存ユーザーデータのマイグレーションが正常に完了している（DB 確認）

---

## 注意事項

- **認証サーバー移行**（`https://prettyhappy.sakura.ne.jp/...` の変更）は別 issue として管理。このブランチでは URL を変更しない
- `feature/atcoder-verified-voting` ブランチが先にマージされる場合、このブランチでマージコンフリクトが発生する可能性がある（`hooks.server.ts`・`+page.server.ts` 等）。その場合は `is_validated` の参照先を `atCoderAccount?.isValidated` に保ちながら解消すること
