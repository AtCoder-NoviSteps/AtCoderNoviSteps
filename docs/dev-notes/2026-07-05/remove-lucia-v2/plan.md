# lucia v2 剥がし: 実装計画

> **For agentic workers:** 実装開始にはユーザーの明示的な同意が必要(計画承認 ≠ 実装開始)。実装時は superpowers:executing-plans または superpowers:subagent-driven-development を使用し、チェックボックスで進捗を管理すること。

**Goal:** EOL の `lucia@2.7.7` + `@lucia-auth/adapter-prisma@3.0.2` を、DB マイグレーションゼロ・既存パスワード/ログイン中セッション完全互換で自前実装に置換する。

**Issue:** [#3855](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3855)(#682 から参照) / **ブランチ:** `#3855`(作成済み) / **PR:** 1 本(フェーズ = コミット単位)

**調査・設計判断・却下代替案:** [survey.md](./survey.md) 参照(本計画は survey の設計方針 10 項目を前提とする。重複記載しない)

---

## 本計画での追加決定(survey からの差分)

| 項目                                    | 決定                                                                                           | 理由                                                                                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `validateSession` のクエリ数            | `include: { user: true }` の **1 クエリに統合**(現行 adapter は 2 クエリ)                      | 返す値は同一で挙動不変。全リクエストのホットパスで DB 1 往復削減。survey で「任意の最適化」と評価済み                                                              |
| 新規モジュールのテスト配置              | **co-located**(`src/lib/server/password.test.ts` 等)                                           | vite.config は対応済み。`src/test/` は「existing tests (phase transition)」で新規追加は避ける方向                                                                  |
| signup / login のドメインロジック置き場 | ルート直書きではなく **`src/features/auth/services/credentials.ts`** を新設                    | survey Phase 4 は「ルートで `prisma.$transaction`」としていたが、プロジェクトルール(prisma-db.md「ルートハンドラに直接 Prisma 禁止・CRUD はサービス層」)に従い修正 |
| cookie 生成の置き場                     | `SESSION_COOKIE_NAME` は session.ts、cookie の set/delete は auth.ts の `createAuthRequest` 内 | session.ts を framework 非依存(cookies API を持ち込まない)に保つ                                                                                                   |
| 乱数ユーティリティ                      | `src/lib/server/random.ts` を新設                                                              | salt(16 字)/ user ID(15 字)/ session ID(40 字)の 3 箇所で共用                                                                                                      |

## 互換性仕様(実装が参照する正確な値・node_modules 実読で確定)

- **乱数**: アルファベット `abcdefghijklmnopqrstuvwxyz1234567890`(36 字)。salt 16 字 / user ID 15 字 / session ID 40 字
- **パスワード**: `s2:{salt}:{hash}`。入力を `normalize('NFKC')` → scrypt(N=16384, r=16, p=1, dkLen=64)→ hex。比較は定数時間(**長さ不一致は事前チェックで false**)。`s2:` 以外の形式(2 パート・`$2a` 等)は一律 false。`node:crypto` の scrypt は **`maxmem: 64 * 1024 * 1024` を明示**(既定 32MiB に抵触)
- **期限判定**: 期限切れは `now > expires` のとき(**等値はまだ有効**)。active: `now <= active_expires` / idle: `active_expires < now <= idle_expires` / dead: `now > idle_expires`
- **期限値**: 作成・延長とも `active_expires = now + 24h`、`idle_expires = active_expires + 14d`(ms epoch)。idle 延長は**同一 ID のまま UPDATE のみ**。dead でも**行削除しない**
- **cookie**: 名前 `auth_session` / 値 = セッション ID / `path: '/'`, `httpOnly: true`, `sameSite: 'lax'`, `secure: !dev`, `expires: idlePeriodExpiresAt`。無効時はクリア、idle 延長時は**触らない**
- **BigInt**: `active_expires` / `idle_expires` の読み取りは `bigint` → 比較前に `Number()` 変換。書き込みは Number のままで可(現行 adapter と同じ)

## ファイルマップ

| 種別   | パス                                                                | 内容                                                                                                                                                                       |
| ------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 新規   | `src/lib/server/random.ts` + `random.test.ts`                       | `generateRandomString(length)`                                                                                                                                             |
| 新規   | `src/lib/server/password.ts` + `password.test.ts`                   | `hashPassword` / `verifyPassword`(**相対 import のみ** — seed から tsx で使うため `$lib` alias 禁止)                                                                       |
| 新規   | `src/lib/server/session.ts` + `session.test.ts`                     | `createSession` / `validateSession` / `invalidateSession` / `SESSION_COOKIE_NAME`                                                                                          |
| 変更   | `src/lib/server/auth.ts` + `auth.test.ts`(新規)                     | `createAuthRequest` 追加(Phase 3)→ lucia 初期化削除(Phase 4)                                                                                                               |
| 変更   | `src/hooks.server.ts`                                               | `auth.handleRequest` → `createAuthRequest`                                                                                                                                 |
| 変更   | `src/app.d.ts`                                                      | `Locals.auth` 型差し替え(Phase 3)→ `Lucia` namespace 削除(Phase 4)                                                                                                         |
| 新規   | `src/features/auth/services/credentials.ts` + `credentials.test.ts` | `registerUser` / `authenticateUser`                                                                                                                                        |
| 変更   | `src/routes/(auth)/signup/+page.server.ts`                          | `auth.createUser` → `registerUser` + `createSession`                                                                                                                       |
| 変更   | `src/routes/(auth)/login/+page.server.ts`                           | `auth.useKey` → `authenticateUser` + `createSession`                                                                                                                       |
| 変更   | `src/routes/(auth)/logout/+page.server.ts`                          | `auth.invalidateSession` → `invalidateSession`                                                                                                                             |
| 変更   | `prisma/seed.ts`                                                    | `generateLuciaPasswordHash` → 相対 import の `hashPassword`                                                                                                                |
| 変更   | `package.json`                                                      | `lucia` / `@lucia-auth/adapter-prisma` 削除                                                                                                                                |
| 変更   | コメント棚卸し                                                      | `database.ts` / `hooks.server.ts` / `+page.server.ts` / `+layout.server.ts` / `+page.svelte` / auth ルート 3 本 / `atcoder_verification.test.ts` / `.claude/rules/auth.md` |
| 無変更 | `src/routes/users/edit/+page.server.ts`                             | `locals.auth.setSession(null)` は新 API と同形状(確認のみ)                                                                                                                 |
| 無変更 | `prisma/schema.prisma` / migrations                                 | **DB 変更ゼロ**                                                                                                                                                            |

各フェーズ完了時に `pnpm test:unit` / `pnpm check` / `pnpm lint` / `pnpm build` 全通過を確認してからコミットする。

---

## Phase 1: 互換性フィクスチャ + 乱数 + パスワードユーティリティ(TDD)

**互換性の錨。lucia が残っているうちにフィクスチャを固定する。**

**フィクスチャ選定の前提**: `authSchema`(`src/lib/zod/schema.ts`)のパスワード規則は半角英数字のみ(`[a-zA-Z\d]{8,128}` + 大小英字・数字各 1 以上)で、**初回実装(2023-09)から不変**(git 確認済み)。signup / login とも同スキーマで検証してから crypto 層に到達するため、**非 ASCII パスワードは prod のハッシュにも `verifyPassword` への入力にも存在し得ない**。よってフィクスチャは (a) スキーマ準拠の実在パスワード = 互換性の錨、(b) スキーマ外の全角ベクタ = `normalize('NFKC')` の実装漏れ検出専用(ASCII ベクタは normalize の有無で結果が変わらないため、これが唯一の検出手段)の 2 系統のみとする。

- [x] 1-1. lucia でフィクスチャ生成(実装前に必ず実行):

```bash
pnpm exec tsx -e '
import { generateLuciaPasswordHash } from "lucia/utils";
// "Ch0kuda1": seed の実パスワード(スキーマ準拠・prod 互換の錨)
// "AtC0derN0viSteps": スキーマ準拠のもう 1 本(単発の偶然一致を排除)
// "Ｃｈ０ｋｕｄａ１": スキーマ外。NFKC 正規化の実装漏れ検出専用ガード
const passwords = ["Ch0kuda1", "AtC0derN0viSteps", "Ｃｈ０ｋｕｄａ１"];
for (const p of passwords) {
  console.log(JSON.stringify(p), await generateLuciaPasswordHash(p));
}
'
```

出力された 3 ハッシュを `password.test.ts` の fixture 定数として貼り付ける(生成コマンドと上記の選定理由をコメントで残す)。`Ｃｈ０ｋｕｄａ１`(全角)は NFKC 正規化で `Ch0kuda1` と同一になるため、**半角入力で検証が通ること**が normalize 実装の存在証明になる(アプリの入力ドメイン外だが、lucia アルゴリズム等価性の担保として意図的に含める)。

- [x] 1-2. `src/lib/server/random.test.ts` を書く(失敗を確認):
  - 指定長の文字列を返す(16 / 15 / 40)
  - 全文字が `[a-z0-9]`(36 字アルファベット)に含まれる(1000 回生成で検証)
  - 呼び出しごとに異なる値(衝突しない)
- [x] 1-3. `src/lib/server/random.ts` を実装 → テスト通過:

```typescript
const DEFAULT_ALPHABET = 'abcdefghijklmnopqrstuvwxyz1234567890';

/** lucia v2 compatible random string (used for salts, user ids, and session ids). */
export const generateRandomString = (length: number, alphabet = DEFAULT_ALPHABET): string => {
  const randomUint32Values = new Uint32Array(length);
  crypto.getRandomValues(randomUint32Values);
  const u32Max = 0xffffffff;
  let result = '';

  for (let i = 0; i < length; i++) {
    const rand = randomUint32Values[i] / (u32Max + 1);
    result += alphabet[Math.floor(alphabet.length * rand)];
  }

  return result;
};
```

- [x] 1-4. `src/lib/server/password.test.ts` を書く(失敗を確認)。ケース:
  - 自己ラウンドトリップ: `hashPassword` → `verifyPassword` が true / 生成形式が `^s2:[a-z0-9]{16}:[0-9a-f]{128}$`
  - **lucia フィクスチャ 3 本の検証一致**(`verifyPassword('Ch0kuda1', fixture)` === true 等。定数時間比較が 128 字 hex 全一致を要求するため、これがバイト互換の機械的証明になる)
  - NFKC ガード(入力ドメイン外・normalize 実装漏れ検出専用): 全角生成フィクスチャに半角入力 `Ch0kuda1` で true(逆も true)
  - 拒否系(全て false・throw しない。stored hash の形式契約 = survey 設計方針 9-10 の固定): パスワード不一致 / 旧 2 パート形式 `{salt}:{hash}` / bcrypt `$2a$...` / 空文字ハッシュ / 部品数不正 `s2:saltonly` / 空パスワード vs 正規ハッシュ
- [x] 1-5. `src/lib/server/password.ts` を実装 → テスト通過。**`./random` 相対 import + node 組み込みのみ**(`$lib` alias を使うと Phase 4 の seed(tsx 実行)が壊れる):

```typescript
import { scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { generateRandomString } from './random';

const scryptAsync = promisify(scrypt);

// lucia v2 compatible parameters. 128 * N * r = 32MiB hits the default maxmem, so raise it to 64MiB.
const SCRYPT_OPTIONS = { N: 16384, r: 16, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const HASH_VERSION = 's2';

/** Generates a lucia v2 compatible password hash: `s2:{salt}:{hash}`. */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = generateRandomString(SALT_LENGTH);
  const hash = await computeHash(password, salt);

  return `${HASH_VERSION}:${salt}:${hash}`;
};

/** Verifies a password against a stored hash. Unknown formats (v1 two-part, bcrypt $2a) return false. */
export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const parts = storedHash.split(':');

  if (parts.length !== 3 || parts[0] !== HASH_VERSION) {
    return false;
  }

  const [, salt, expectedHash] = parts;
  const actualHash = await computeHash(password, salt);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const actualBuffer = Buffer.from(actualHash, 'hex');

  // timingSafeEqual throws on length mismatch, so check length first
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
};

const computeHash = async (password: string, salt: string): Promise<string> => {
  // NFKC-normalize so visually identical unicode inputs hash identically (lucia v2 behavior)
  const derivedKey = (await scryptAsync(
    password.normalize('NFKC'),
    salt,
    KEY_LENGTH,
    SCRYPT_OPTIONS,
  )) as Buffer;

  return derivedKey.toString('hex');
};
```

- [x] 1-6. `pnpm test:unit` / `pnpm check` / `pnpm lint` 通過を確認
- [x] 1-7. コミット: `feat(auth): add lucia v2 compatible password and random utilities`

## Phase 2: セッションサービス(TDD)

- [x] 2-1. `src/lib/server/session.test.ts` を書く(失敗を確認)。`vi.mock('$lib/server/database')`(default export をモック)+ `vi.useFakeTimers()` + `vi.setSystemTime`。**モックの `active_expires` / `idle_expires` は必ず `BigInt` で返す**(Number を返すモックでは変換漏れを検出できない)。ケース:
  - `createSession`: 40 字 `[a-z0-9]` の ID / `active_expires = now + 24h`・`idle_expires = now + 24h + 14d` で create される / 戻り値 `{ sessionId, idlePeriodExpiresAt }`
  - `validateSession` active(`now <= active_expires`): update / delete が**呼ばれない**、`{ sessionId, user: { userId, username, role } }` を返す
  - `validateSession` idle(`active_expires < now <= idle_expires`): **同一 ID** に update(新期限値をアサート)、delete は呼ばれない
  - `validateSession` dead(`now > idle_expires`): null 返し、**update / delete とも呼ばれない**(行は残す)
  - `validateSession` 境界値: `now === active_expires` は active(書き込みなし)/ `now === idle_expires` は idle(延長)— lucia の `>` 比較の再現
  - `validateSession` 行なし: null
  - `findUnique` が `include: { user: true }` で呼ばれる(1 クエリ)
  - `invalidateSession`: delete が呼ばれる / **P2025 は握りつぶす**(`PrismaClientKnownRequestError` を mockRejectedValue)/ P2025 以外は re-throw
- [x] 2-2. `src/lib/server/session.ts` を実装 → テスト通過:

```typescript
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { Roles } from '@prisma/client';

import client from '$lib/server/database';
import { generateRandomString } from '$lib/server/random';

// lucia v2 defaults: active 24h, idle +14d
const ACTIVE_PERIOD_MS = 1000 * 60 * 60 * 24;
const IDLE_PERIOD_MS = 1000 * 60 * 60 * 24 * 14;
const SESSION_ID_LENGTH = 40;

export const SESSION_COOKIE_NAME = 'auth_session';

export type SessionCookieData = { sessionId: string; idlePeriodExpiresAt: Date };

export type ValidatedSession = {
  sessionId: string;
  user: { userId: string; username: string; role: Roles };
};

const computeExpirations = (now: number) => {
  const activePeriodExpiresAt = new Date(now + ACTIVE_PERIOD_MS);
  const idlePeriodExpiresAt = new Date(activePeriodExpiresAt.getTime() + IDLE_PERIOD_MS);

  return { activePeriodExpiresAt, idlePeriodExpiresAt };
};

export const createSession = async (userId: string): Promise<SessionCookieData> => {
  const sessionId = generateRandomString(SESSION_ID_LENGTH);
  const { activePeriodExpiresAt, idlePeriodExpiresAt } = computeExpirations(Date.now());

  await client.session.create({
    data: {
      id: sessionId,
      user_id: userId,
      active_expires: activePeriodExpiresAt.getTime(),
      idle_expires: idlePeriodExpiresAt.getTime(),
    },
  });

  return { sessionId, idlePeriodExpiresAt };
};

export const validateSession = async (sessionId: string): Promise<ValidatedSession | null> => {
  const session = await client.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  const now = Date.now();

  // lucia v2: expired only when now is strictly past the deadline; dead rows are kept (no cleanup)
  if (now > Number(session.idle_expires)) {
    return null;
  }

  if (now > Number(session.active_expires)) {
    // idle state: extend expirations keeping the same id (no rotation, cookie untouched)
    const { activePeriodExpiresAt, idlePeriodExpiresAt } = computeExpirations(now);

    await client.session.update({
      where: { id: sessionId },
      data: {
        active_expires: activePeriodExpiresAt.getTime(),
        idle_expires: idlePeriodExpiresAt.getTime(),
      },
    });
  }

  return {
    sessionId: session.id,
    user: {
      userId: session.user.id,
      username: session.user.username,
      role: session.user.role,
    },
  };
};

export const invalidateSession = async (sessionId: string): Promise<void> => {
  try {
    await client.session.delete({ where: { id: sessionId } });
  } catch (error) {
    // P2025 (row already gone): swallow for logout idempotency, same as the lucia adapter
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return;
    }

    throw error;
  }
};
```

- [x] 2-3. `pnpm test:unit` / `pnpm check` / `pnpm lint` / `pnpm build` 通過を確認
- [x] 2-4. コミット: `feat(auth): add self-managed session service compatible with lucia v2`

## Phase 3: locals.auth 互換オブジェクト + hooks + 型

**注意: lucia の `auth` export と `app.d.ts` の `Lucia` namespace はこのフェーズでは削除しない**(auth ルート 3 本が Phase 4 まで使用。消すと本フェーズで `pnpm check` / `build` が落ちる)。

- [x] 3-1. `src/lib/server/auth.test.ts` を書く(失敗を確認)。`vi.mock('$lib/server/session')` + `vi.mock('$lib/server/database')`(Phase 3 時点では auth.ts が lucia 初期化のため database を import している)+ cookies(get/set/delete)をスパイにしたモック event。ケース:
  - cookie なし: null を返し `validateSession` は呼ばれない
  - 有効セッション: セッションを返す / **2 回目の `validate()` で `validateSession` が再度呼ばれない**(リクエスト内キャッシュ)
  - 無効セッション(cookie あり): null を返し `cookies.delete(SESSION_COOKIE_NAME, { path: '/' })` が呼ばれる
  - `setSession(session)`: `cookies.set` が正確な属性(`path: '/'`, `httpOnly: true`, `sameSite: 'lax'`, `secure: !dev`, `expires: idlePeriodExpiresAt`)で呼ばれる
  - `setSession(null)`: `cookies.delete` が呼ばれる
  - `setSession` 後の `validate()` はキャッシュを使わず再検証する
- [x] 3-2. `src/lib/server/auth.ts` に **追加**(lucia 初期化はそのまま残す)→ テスト通過:

```typescript
import type { RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';

import {
  SESSION_COOKIE_NAME,
  validateSession,
  type SessionCookieData,
  type ValidatedSession,
} from '$lib/server/session';

export type AuthRequest = {
  validate: () => Promise<ValidatedSession | null>;
  setSession: (session: SessionCookieData | null) => void;
};

export const createAuthRequest = (event: RequestEvent): AuthRequest => {
  let validatePromise: Promise<ValidatedSession | null> | null = null;

  const setSessionCookie = (session: SessionCookieData | null): void => {
    if (session) {
      event.cookies.set(SESSION_COOKIE_NAME, session.sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: !dev,
        expires: session.idlePeriodExpiresAt,
      });
    } else {
      event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
    }
  };

  return {
    validate: () => {
      // request-scoped cache: hooks and route guards both call validate() on every request
      if (validatePromise) {
        return validatePromise;
      }

      validatePromise = (async () => {
        const sessionId = event.cookies.get(SESSION_COOKIE_NAME);

        if (!sessionId) {
          return null;
        }

        const session = await validateSession(sessionId);

        if (!session) {
          setSessionCookie(null); // clear the stale cookie (lucia v2 behavior)
        }

        return session;
      })();

      return validatePromise;
    },
    setSession: (session) => {
      validatePromise = null;
      setSessionCookie(session);
    },
  };
};
```

設計メモ: idle 延長は `validateSession` 内で完結し `setSession` を経由しないため、cookie は自動的に「延長時は触らない」(v2 と同挙動)。lucia の `storedSessionId === sessionId` early-return ガードは呼び出し経路上不要になるため実装しない。

- [x] 3-3. `src/hooks.server.ts`: `event.locals.auth = auth.handleRequest(event);` → `event.locals.auth = createAuthRequest(event);` に差し替え(import も変更。以降のロジック不変)。lucia-auth.com へのコメントリンクをこのタイミングで削除
- [x] 3-4. `src/app.d.ts`: `auth: import('lucia').AuthRequest;` → `auth: import('$lib/server/auth').AuthRequest;`。**`Lucia` namespace と `/// <reference types="lucia" />` は残す**
- [x] 3-5. `pnpm test:unit`(サービス層ガード・ルートのテストが**無変更で**通ることを確認)/ `pnpm check` / `pnpm lint` / `pnpm build` 通過を確認
- [x] 3-6. コミット: `feat(auth): replace lucia AuthRequest with self-managed createAuthRequest`

## Phase 4: 認証ルート置換 + seed 置換 + 依存削除

- [x] 4-1. `src/features/auth/services/credentials.test.ts` を書く(失敗を確認)。`vi.mock('$lib/server/database')` + `vi.mock('$lib/server/password')`。ケース:
  - `registerUser` 成功: `$transaction` で user(15 字 `[a-z0-9]` ID)+ key(`id: 'username:{小文字}'`, `hashed_password`)が作成され `{ userId }` を返す
  - `registerUser` P2002(username / key.id どちら由来でも): null を返す
  - `registerUser` その他のエラー: re-throw
  - `authenticateUser` 成功: `key.findUnique({ where: { id: 'username:{小文字}' } })` → `verifyPassword` true → `{ userId }`
  - `authenticateUser` key なし / `hashed_password` が null / パスワード不一致: いずれも null(現行の「ユーザー不在とパスワード誤りを同一応答」仕様の維持)
- [x] 4-2. `src/features/auth/services/credentials.ts` を実装 → テスト通過:

```typescript
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import client from '$lib/server/database';
import { hashPassword, verifyPassword } from '$lib/server/password';
import { generateRandomString } from '$lib/server/random';

const USER_ID_LENGTH = 15; // lucia v2 createUser default

const buildKeyId = (username: string): string => `username:${username.toLowerCase()}`;

/** Creates a user with a password key. Returns null when the username is already taken. */
export const registerUser = async (
  username: string,
  password: string,
): Promise<{ userId: string } | null> => {
  const userId = generateRandomString(USER_ID_LENGTH);
  const hashedPassword = await hashPassword(password);

  try {
    await client.$transaction([
      client.user.create({ data: { id: userId, username } }),
      client.key.create({
        data: { id: buildKeyId(username), user_id: userId, hashed_password: hashedPassword },
      }),
    ]);
  } catch (error) {
    // P2002 on user.username or key.id both mean the username is taken
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      return null;
    }

    throw error;
  }

  return { userId };
};

/** Returns the user id for valid credentials, or null (missing user and wrong password are indistinguishable). */
export const authenticateUser = async (
  username: string,
  password: string,
): Promise<{ userId: string } | null> => {
  const key = await client.key.findUnique({ where: { id: buildKeyId(username) } });

  if (!key || key.hashed_password === null) {
    return null;
  }

  const isValid = await verifyPassword(password, key.hashed_password);

  return isValid ? { userId: key.user_id } : null;
};
```

- [x] 4-3. `signup/+page.server.ts` を置換: `auth.createUser` + `LuciaError` 分岐 → `registerUser`。null なら現行の重複メッセージで 400(**文言は一字一句維持** — E2E が文言依存)、成功なら `createSession(userId)` → `locals.auth.setSession(session)`。予期しないエラーは catch で現行の 500 メッセージ。lucia import(`LuciaError` / `auth`)を削除
- [x] 4-4. `login/+page.server.ts` を置換: `auth.useKey` + `LuciaError` 分岐 → `authenticateUser`。null なら現行のログイン失敗メッセージで 400、成功なら `createSession` + `setSession`。エラー文言・応答の同一性を維持。lucia import を削除
- [x] 4-5. `logout/+page.server.ts` を置換: `auth.invalidateSession(session.sessionId)` → `invalidateSession(session.sessionId)`($lib/server/session から import)。`setSession(null)` はそのまま
- [x] 4-6. `users/edit/+page.server.ts`: 変更不要を確認(`locals.auth.setSession(null)` のみ = cookie クリア。session 行は `onDelete: Cascade` で削除される)
- [x] 4-7. `prisma/seed.ts`: `import { generateLuciaPasswordHash } from 'lucia/utils'` → `import { hashPassword } from '../src/lib/server/password'`(相対パス)。`pnpm db:seed` が tsx で通ることを確認
- [x] 4-8. `src/lib/server/auth.ts` から lucia 初期化(`lucia()` / `Auth` 型 / lucia import 3 本)を削除。`src/app.d.ts` から `Lucia` namespace と `/// <reference types="lucia" />` を削除
- [x] 4-9. `package.json` から `lucia` / `@lucia-auth/adapter-prisma` を削除 → `pnpm install`
- [x] 4-10. 残存参照の棚卸し: `grep -rin lucia src prisma docs .claude --include='*.{ts,svelte,md}'` で確認し、以下を更新:
  - `src/lib/server/database.ts` / `src/routes/+page.server.ts` / `+page.svelte` / `+layout.server.ts` / auth ルート 3 本のコメント内 lucia-auth.com リンクを削除
  - `src/features/account/services/atcoder_verification.test.ts:45` のコメント(「Lucia が UUID を生成」は不正確)→ 「auth service generates a 15-char random id」に修正
  - `.claude/rules/auth.md` の「Lucia v2」セクションを自前実装の説明(`src/lib/server/session.ts` / `password.ts` / `createAuthRequest`)に書き換え
  - `src/routes/forgot_password/+page.svelte` の lucia example リンクは**残す**(将来のパスワードリセット設計の参考リンクであり本移行と無関係)
- [x] 4-11. `pnpm test:unit` / `pnpm check` / `pnpm lint` / `pnpm build` 通過を確認
- [x] 4-12. コミット: `feat(auth): replace lucia in auth routes and seed, drop lucia dependencies`

## Phase 5: 検証 + 仕上げ

- [x] 5-1. `pnpm test:e2e` 全通過(signin / redirect_after_login / user_edit / votes / workbook 系。※signup の E2E は存在しないため 5-3 の実機確認で担保)
- [x] 5-2. **セッション継続の実機確認**: Phase 3 直前のコミットを checkout → `pnpm dev` → シードユーザー(`guest` / `Ch0kuda1`)でログイン → サーバ停止 → ブランチ先頭を checkout → `pnpm dev` → リロードで**ログイン状態が維持**されること(cookie 名・値が devtools で不変であること)
- [x] 5-3. **パスワード互換 + signup の実機確認**: 移行後コードでシードユーザーの再ログイン成功 / 新規ユーザー作成 → ログアウト → 再ログイン成功 / 既存ユーザー名で signup → 重複メッセージ(400)/ 誤パスワードでログイン失敗(400)/ 二重ログアウトで 500 にならないこと
- [x] 5-4. `pnpm format` → 差分があればコミットに含める
- [x] 5-5. `coderabbit review --plain` を実行し、critical / high / potential_issue(medium)の所見を本ファイル末尾の `## CodeRabbit Findings` に記録(**修正はユーザー判断。無断で直さない**)
- [x] 5-6. AGENTS.md の必須リファクタサイクル: 新規の学び・残タスクを本ファイルに追記 → `/session-close`

## リスクと対策

survey.md の「リスクと対策」表を参照。本計画で追加されるリスクは 1 点:

- **サービス層化(credentials.ts)に伴う挙動差**: ルート直書きからの移し替えでエラー変換の粒度が変わる(LuciaError → null 返し)。対策: Phase 4 のユニットテストで「重複 = null」「その他 = re-throw」の境界を固定し、ルート側の応答コード・文言を現行と突き合わせて確認(5-3)

## ロールバック

DB 変更ゼロのため、本番障害時は直前リリースの再デプロイのみで完全に戻る。ローカルはフェーズ単位のコミットを revert。

## 新規の学び（本セッション / 5-6）

ルールに未収録で再利用価値のある知見のみ記録（`phase-N.md` は無し = 単一 plan のため破棄対象なし）。

1. **lucia v2 は idle 延長時に cookie を再発行しない（実ソース確認済み）** — `validateSession` は idle 時 **同一 session ID** のまま期限を UPDATE し `fresh: true` を返すが、`AuthRequest.setSession`/`setSessionCookie` の先頭ガード `if (storedSessionId === sessionId) return;` により **ID 不変では cookie を必ず再発行しない**。「idle 時 cookie を触らない = v2 互換」の根拠。静的レビュー（CodeRabbit 等）は「idle 延長で cookie 未更新 = バグ」と誤判定しがち。**互換実装のレビューは元ライブラリの dist を実読して裏取りする**。
2. **削除済み依存の実ソース裏取り** — node_modules から消え、pnpm store にも無い場合でも `npm pack <pkg>@<ver>` で tarball を取得し `dist/` を読める。互換性の根拠検証に有効。
3. **`grep --include='*.{ts,svelte,md}'` は brace 展開されない** — 残存参照スイープで対象漏れを生む。かつスイープ対象は `src` だけでなく **root（CONTRIBUTING.md 等）/ `e2e` / 設定ファイル（vite.config.ts）** まで含めること（本作業で 4-10 が `src prisma .claude/rules` に絞り 3 ファイル取りこぼした）。`rg -g` 複数指定が安全。
4. **rules doc の重複** — 認証セクションにファイル一覧を足すと `## Key Files` と二重管理になる。**概念は概念セクション、ファイル→責務は Key Files に一本化**。
5. **互換維持タスクに「改善」を混ぜない** — タイミング列挙・cookie 非再発行はいずれも lucia v2 と同挙動＝移行による回帰ではない。互換が目的の移行では、レビュー指摘の「強化」も**元実装の挙動を確認してから**別タスクとして切り出す。

## 残タスク

- [ ] **A-1（cookie スライディング更新）** — v2 由来の「ログインから最長 ~15 日で再ログイン」制約。直すと v2 互換を意図的に破る強化。survey.md の既知残課題。優先度低。
- [ ] **credentials の定数時間化（ダミーハッシュ）** — ユーザー名列挙のタイミング側チャネル封じ。移行スコープ外の独立した任意強化（旧 lucia コードにも等しく該当）。
- [ ] **C: plan.md の grep コマンド訂正** — L442 の `--include='*.{ts,svelte,md}'` を `rg -g` 複数指定へ（ドキュメント軽微）。
- 5-1/5-2/5-3（e2e / 実機確認）はローカル完了済み（記録上チェック済み）。PR 時、CodeRabbit の無関係 findings（`docs/ui-mock/` 等）は本 PR スコープ外。

## CodeRabbit Findings

`coderabbit review --plain`(v0.6.5、branch `#3855` = staging から 5 commits)実行。全 36 findings のうち大半は本移行と無関係の未追跡ファイル(`docs/ui-mock/`・他 dev-notes)に対するもの。以下は**本ブランチが変更したファイル**に限定して抽出(重大度は CodeRabbit の Major/Minor 表記)。**修正は未実施。ユーザー判断待ち。**

**⚠️ 追記(lucia@2.7.7 実ソース検証後)**: 下記 A-1 / A-3 について、npm から `lucia@2.7.7` の tarball を取得し `dist/auth/request.js`・`dist/auth/index.js` を実読して裏取りした。結論は各項に反映済み。CodeRabbit の A-1 指摘は **lucia v2 挙動の理解として誤り**だった(初版の私の記録も CodeRabbit を過信しており誤り。訂正済み)。

### A. ソース（Major）

- **[auth.ts:51-57] idle 延長時に Cookie の `expires` を再発行しない** → **v2 と完全一致。互換性の観点では問題なし(CodeRabbit 指摘は v2 挙動の誤認)**
  - 実ソース検証: lucia v2 `validateSession`(`dist/auth/index.js`)は idle 時 **同一 session ID のまま** `updateSession` で期限延長し `fresh: true` を返す。`AuthRequest.validate`(`dist/auth/request.js`)は `session.fresh` で `maybeSetSession(session)` を呼ぶが、`setSession`/`setSessionCookie` は先頭に `if (this.storedSessionId === sessionId) return;` ガードを持つ。idle 延長は ID 不変のためこのガードで **必ず early-return し、Cookie は再発行されない**。→ 本実装(idle 時 cookie を触らない)は **byte-for-byte で v2 同挙動**。survey.md line 99 / 175 の記述が正しい。
  - ただし v2 由来の **既知の制約**は残る: Cookie の expires は発行時固定のため、継続利用でも **ログインから最長 ~15 日で再ログインが必要**(cookie 層でのスライディング更新がない)。これは survey.md line 175 が「残課題」として明記済み。修正は v2 互換性を意図的に破る強化であり、本移行のスコープ外。**回帰でもバグでもない**。

- **[session.ts:58-64] 並行ログアウト時の P2025 で 500** → ✅ **修正済み(ロバスト性優先)** — idle 延長の `update` を try/catch し、`P2025`(findUnique〜update 間で行が削除された競合)は `null`(未認証)を返す。それ以外は re-throw。テスト 2 本追加(P2025→null / P2003→re-throw)。
  - 📝 補足: lucia v2 も `adapter.updateSession` を try/catch せず同じ競合を持っていた(回帰ではない)。本修正は v2 挙動からの意図的な改善(500 回避)。

- **[credentials.ts:45-49] 無効認証のタイミング差（Security）** → **v2 と一致。本移行による回帰なし。ユーザー名列挙の水準は不変**
  - 実ソース検証: lucia v2 `useKey`(`dist/auth/index.js`)も `getKey` が無ければ **ハッシュ検証せず即 `AUTH_INVALID_KEY_ID` を throw**。既存ユーザーの誤パスワード時のみハッシュを実行する。→ 本実装の分岐は v2 と同一で、タイミング側チャネルは **移行前から存在**していた。
  - 📝 さらに signup は重複ユーザー名で専用メッセージ(400)を返すため、**ユーザー名列挙は元から signup 経由で可能**。したがって本移行でセキュリティ水準は変わらない。定数時間化(ダミーハッシュ)は独立した強化であり、旧コードにも等しく当てはまる任意対応。

- **[credentials.test.ts:128-143] 上記に対応するテスト（Security）** — 「欠損キー時に `verifyPassword` を呼ばない」= v2 と同じ挙動を固定するテスト。定数時間化を採用する場合のみ期待値変更が必要。上記 credentials.ts:45 と一体で判断。

### B. ソース（Minor）→ ✅ 修正済み

- **[credentials.ts:9 / seed.ts] `toLowerCase()` と `toLocaleLowerCase()` の不一致** — seed 側を `toLowerCase()` に統一(本セッションで修正)。
  - 📝 補足: username は zod `authSchema` で `[a-zA-Z\d]`(ASCII のみ)に制限済みのため元々実害はなかったが、一貫性のため統一。

### C. 計画・ドキュメント

- **[plan.md:442-446] `grep --include='*.{ts,svelte,md}'` の brace 展開が効かない** — grep は `{ts,svelte,md}` を展開しない。実際の 4-10 実行では `--include` を使わず全拡張子を対象にしたためこの点での取りこぼしは無かったが、計画記載のコマンドは誤り(かつ 4-10 は `src prisma .claude/rules` に対象を絞ったため D の漏れが発生)。`rg -g` 複数指定か拡張子ごとの `--include` に修正。

### D. 5-5 スイープで追加検出した residual lucia 参照 → ✅ 修正済み（4-10 の grep が `src prisma .claude/rules` のみを対象にしていた漏れ）

- **[vite.config.ts:8]** `optimizeDeps.exclude` の死んだ `@lucia-auth/adapter-prisma` を削除。
- **[e2e/problems_cache.spec.ts:22-24]** stale な Lucia コメントを self-managed auth の説明に修正。
- (root の CONTRIBUTING.md は本セッションで対応済み)

### 対応方針メモ（実ソース検証後）

- **A-1 / A-3 は対応不要**(v2 と byte 互換。CodeRabbit の指摘は v2 挙動の誤認)。A-1 の「~15 日で再ログイン」は survey.md 既知の残課題で、直すなら v2 互換を意図的に破る別タスク。
- **B / D は修正済み**。
- **A-2(P2025)** は ✅ **修正済み**(ロバスト性優先で P2025→null 化)。
- C(grep コマンド)は計画ドキュメントの軽微な訂正。nitpick 相当は PR CI に委譲。
