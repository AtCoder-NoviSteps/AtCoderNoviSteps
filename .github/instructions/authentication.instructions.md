# 認証・セキュリティガイド

## 概要

AtCoder-NoviStepsプロジェクトの認証システム（Lucia Auth）とセキュリティ実装

## 認証アーキテクチャ

### Lucia Auth v2 構成

- **Adapter**: `@lucia-auth/adapter-prisma`
- **Session管理**: PostgreSQL + Prisma
- **AtCoder連携**: AtCoderアカウント認証

### 認証フロー

```mermaid
graph TD
    A[ユーザー登録] --> B[AtCoder認証コード生成]
    B --> C[AtCoder側でコード確認]
    C --> D[認証ステータス更新]
    D --> E[セッション作成]
    E --> F[ログイン完了]
```

## Prismaスキーマ（認証関連）

### User モデル

```prisma
model User {
  id                        String   @id @unique
  username                  String   @unique
  role                      Roles    @default(USER)
  atcoder_validation_code   String   @default("")
  atcoder_username          String   @default("")
  atcoder_validation_status Boolean? @default(false)

  auth_session Session[]
  key          Key[]
}

enum Roles {
  ADMIN
  USER
}
```

### Session管理

```prisma
model Session {
  id             String @id @unique
  user_id        String
  active_expires BigInt
  idle_expires   BigInt

  user User @relation(references: [id], fields: [user_id], onDelete: Cascade)
}
```

## 実装ガイド

### Luciaセットアップ

```typescript
// lib/server/auth/lucia.ts
import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { prisma } from '@lucia-auth/adapter-prisma';
import { PrismaClient } from '@prisma/client';

const client = new PrismaClient();

export const auth = lucia({
  env: process.env.NODE_ENV === 'development' ? 'DEV' : 'PROD',
  middleware: sveltekit(),
  adapter: prisma(client),
  getUserAttributes: (data) => ({
    username: data.username,
    role: data.role,
    atcoderUsername: data.atcoder_username,
    atcoderValidationStatus: data.atcoder_validation_status,
  }),
});

export type Auth = typeof auth;
```

### AtCoder認証プロバイダー

```typescript
// lib/server/auth/atcoder-provider.ts
export class AtCoderAuthProvider {
  async generateValidationCode(username: string): Promise<string> {
    // 8桁のランダムコード生成
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    await prisma.user.update({
      where: { username },
      data: {
        atcoder_validation_code: code,
        atcoder_validation_status: false,
      },
    });

    return code;
  }

  async validateAtCoderAccount(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { atcoder_validation_code: true, atcoder_username: true },
    });

    if (!user?.atcoder_validation_code) return false;

    // AtCoder APIで自己紹介欄にコードが含まれているかチェック
    const isValid = await this.checkCodeInProfile(
      user.atcoder_username,
      user.atcoder_validation_code,
    );

    if (isValid) {
      await prisma.user.update({
        where: { username },
        data: { atcoder_validation_status: true },
      });
    }

    return isValid;
  }

  private async checkCodeInProfile(atcoderUsername: string, code: string): Promise<boolean> {
    // AtCoder APIまたはスクレイピングでプロフィール確認
    // 実装詳細は外部API仕様に依存
    return false; // placeholder
  }
}
```

## セキュリティ実装

### XSS対策

```typescript
// lib/server/security/xss.ts
import { filterXSS } from 'xss';

export function sanitizeHtml(input: string): string {
  return filterXSS(input, {
    whiteList: {
      // 許可するHTMLタグを限定
      p: [],
      br: [],
      strong: [],
      em: [],
    },
  });
}
```

### CSRF対策

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { auth } from '$lib/server/auth/lucia';

export const handle: Handle = async ({ event, resolve }) => {
  // Lucia認証ハンドラー
  event.locals.auth = auth.handleRequest(event);

  // CSRF保護（SvelteKit内蔵）
  if (event.request.method === 'POST') {
    const contentType = event.request.headers.get('content-type');
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      // Form actionでのCSRF自動チェック
    }
  }

  return await resolve(event);
};
```

### セッション管理

```typescript
// lib/server/auth/session.ts
export class SessionManager {
  static async createSession(userId: string): Promise<Session> {
    return await auth.createSession({
      userId,
      attributes: {},
    });
  }

  static async validateSession(sessionId: string): Promise<{
    session: Session | null;
    user: User | null;
  }> {
    return await auth.validateSession(sessionId);
  }

  static async invalidateSession(sessionId: string): Promise<void> {
    await auth.invalidateSession(sessionId);
  }

  static async invalidateAllUserSessions(userId: string): Promise<void> {
    await auth.invalidateAllUserSessions(userId);
  }
}
```

## 権限管理

### ロールベースアクセス制御

```typescript
// lib/server/auth/permissions.ts
export enum Permission {
  READ_PROBLEMS = 'read:problems',
  CREATE_WORKBOOK = 'create:workbook',
  ADMIN_USERS = 'admin:users',
  MODERATE_CONTENT = 'moderate:content',
}

export const ROLE_PERMISSIONS: Record<Roles, Permission[]> = {
  USER: [Permission.READ_PROBLEMS, Permission.CREATE_WORKBOOK],
  ADMIN: [
    Permission.READ_PROBLEMS,
    Permission.CREATE_WORKBOOK,
    Permission.ADMIN_USERS,
    Permission.MODERATE_CONTENT,
  ],
};

export function hasPermission(userRole: Roles, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission);
}
```

### ルートガード

```typescript
// lib/server/auth/guards.ts
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function requireAuth(event: RequestEvent) {
  const session = await event.locals.auth.validate();
  if (!session) {
    throw error(401, 'Authentication required');
  }
  return session;
}

export async function requirePermission(event: RequestEvent, permission: Permission) {
  const session = await requireAuth(event);

  if (!hasPermission(session.user.role, permission)) {
    throw error(403, 'Insufficient permissions');
  }

  return session;
}

export async function requireAtCoderVerification(event: RequestEvent) {
  const session = await requireAuth(event);

  if (!session.user.atcoderValidationStatus) {
    throw error(403, 'AtCoder account verification required');
  }

  return session;
}
```

## 環境変数

### 必須設定

```bash
# .env
LUCIA_SESSION_SECRET="your-super-secret-session-key-here"
DATABASE_URL="postgresql://user:pass@localhost:5432/atcoder_novisteps"

# AtCoder連携（オプション）
ATCODER_API_BASE_URL="https://kenkoooo.com/atcoder/atcoder-api"
ATCODER_SCRAPING_USER_AGENT="AtCoderNoviSteps/1.0"
```

## テスト戦略

### 認証テスト

```typescript
// tests/integration/auth.test.ts
import { test, expect } from 'vitest';
import { auth } from '$lib/server/auth/lucia';

test('should create and validate session', async () => {
  const user = await createTestUser();
  const session = await auth.createSession({
    userId: user.id,
    attributes: {},
  });

  expect(session.sessionId).toBeDefined();

  const { session: validatedSession, user: validatedUser } = await auth.validateSession(
    session.sessionId,
  );

  expect(validatedSession?.sessionId).toBe(session.sessionId);
  expect(validatedUser?.id).toBe(user.id);
});
```

### AtCoder認証テスト

```typescript
// tests/unit/auth/atcoder-provider.test.ts
import { test, expect, vi } from 'vitest';
import { AtCoderAuthProvider } from '$lib/server/auth/atcoder-provider';

test('should generate validation code', async () => {
  const provider = new AtCoderAuthProvider();
  const code = await provider.generateValidationCode('testuser');

  expect(code).toMatch(/^[A-Z0-9]{8}$/);
});
```

## セキュリティチェックリスト

### 本番環境

- [ ] セッションシークレットがランダム生成されている
- [ ] HTTPS強制設定
- [ ] セキュリティヘッダー設定（CSP、HSTS等）
- [ ] レート制限実装
- [ ] SQLインジェクション対策（Prisma使用）
- [ ] XSS対策（入力サニタイズ）
- [ ] CSRF対策（SvelteKit内蔵）

### 開発環境

- [ ] `.env`ファイルの`.gitignore`設定
- [ ] 開発用認証情報の分離
- [ ] セキュリティテストの自動化
- [ ] 依存関係の脆弱性スキャン
