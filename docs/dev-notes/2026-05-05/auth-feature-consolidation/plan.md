# Auth Feature 統合計画

## 概要

現在、認証関連のロジックが散在している状態を、`src/features/auth/` への feature-scoped 設計に統合する。

**目的：**

- 認証関連のコード（services, utils, types）を一箇所に集約
- AGENTS.md の feature-scoped 設計に準拠
- テストの co-location を実現
- 技術負債（分散したコード）の解消

**現状の問題：**

- `src/lib/utils/authorship.ts` - login 関連の関数と authorship 権限判定が混在
- `src/routes/(admin)/_utils/auth.ts` - admin 専用の auth ロジック
- `buildLoginPath()` - 2 箇所で重複実装
- login/signup ロジックは route handlers に直接記述

---

## 設計方針

### 新規作成: `src/features/auth/`

```
src/features/auth/
├── services/
│  ├── login.ts           # ログイン処理
│  ├── signup.ts          # 登録処理
│  ├── session.ts         # セッション管理・検証
│  ├── admin_access.ts    # admin 権限検証（API用も含む）
│  └── _.test.ts
├── utils/
│  ├── login.ts  # ← buildLoginPath() をここに統合
│  └── _.test.ts
├── types/
│  ├── auth_status.ts     # AdminStatus enum
│  └── session.ts         # Session type
└── constants/
   └── messages.ts        # エラーメッセージなど
```

### 既存コードの移行

#### Phase 1: Service層を抽出（新規ファイル）

**`src/features/auth/services/session.ts`** - セッション検証の共通化

```typescript
// 既存の authorship.ts から移動・リネーム
export async function validateSession(locals: App.Locals): Promise<{ valid: boolean }> {
  const session = await locals.auth.validate();
  return { valid: !!session };
}

export async function getLoggedInUser(
  locals: App.Locals,
  url?: URL,
): Promise<App.Locals['user'] | null> {
  const session = await locals.auth.validate();
  if (!session) {
    const loginPath = buildLoginPath(url);
    redirect(TEMPORARY_REDIRECT, loginPath);
  }

  if (!locals.user) {
    redirect(TEMPORARY_REDIRECT, buildLoginPath(url));
  }

  return locals.user;
}

export async function ensureSessionOrRedirect(locals: App.Locals, url?: URL): Promise<void> {
  const session = await locals.auth.validate();
  if (!session) {
    redirect(TEMPORARY_REDIRECT, buildLoginPath(url));
  }
}
```

**`src/features/auth/services/admin_access.ts`** - admin 権限検証

```typescript
// 既存の (admin)/_utils/auth.ts から移動
export enum AdminStatus {
  OK = 'ok',
  UNAUTHENTICATED = 'unauthenticated',
  UNAUTHORIZED = 'unauthorized',
}

export async function validateAdminStatus(locals: App.Locals): Promise<AdminStatus> {
  // 既存実装
}

export async function validateAdminAccess(locals: App.Locals, url?: URL): Promise<void> {
  if ((await validateAdminStatus(locals)) !== AdminStatus.OK) {
    const loginPath = buildLoginPath(url);
    redirect(TEMPORARY_REDIRECT, loginPath);
  }
}

export async function validateAdminAccessForApi(locals: App.Locals): Promise<void> {
  // 既存実装（error() 返却）
}
```

**`src/features/auth/utils/login.ts`**

```typescript
// 2 箇所の重複を統合
import { LOGIN_PAGE } from '$lib/constants/navbar-links';

export function buildLoginPath(url?: URL): string {
  if (!url) {
    return LOGIN_PAGE;
  }

  return `${LOGIN_PAGE}?redirectTo=${encodeURIComponent(url.pathname + url.search)}`;
}
```

#### Phase 2: Authorship 権限判定の分離

**`src/lib/utils/authorship.ts`** - 権限判定に特化（削減版）

```typescript
// ログイン関連は削除、権限判定のみ残す
export const isAdmin = (role: Roles): boolean => {
  return role === Roles.ADMIN;
};

export const hasAuthority = (userId: string, authorId: string): boolean => {
  return userId.toLowerCase() === authorId.toLowerCase();
};

export const canRead = (...) => { ... };
export const canEdit = (...) => { ... };
export const canDelete = (...) => { ... };
```

新しいエクスポート：

```typescript
// src/features/auth/index.ts
export { validateSession, getLoggedInUser, ensureSessionOrRedirect } from './services/session';

export { validateAdminAccess, validateAdminAccessForApi } from './services/admin_access';

export { buildLoginPath } from './utils/login';
```

---

## スコープの限定：含めないもの（後のフェーズ）

### ❌ 今回は含めない

**AuthForm.svelte などのコンポーネント**

- 現在：`src/lib/components/AuthForm.svelte`（共有コンポーネント）
- 理由：
  - UI コンポーネントは**全プロジェクトで共有資産**
  - feature-scoped にするとインポートパスが深くなる（`$features/auth/components/AuthForm.svelte`）
  - Props/API 変更に伴うリスク > メリット
  - ルート層（login, signup ページ）でのみ使用だが、独立した UI 部品として価値あり

**Component 関連の E2E テストの大規模変更**

- テストセレクタの変更リスク
- スクリーンショット差分が大量に生成される可能性

**Lucia auth ライブラリの統合層**

- `locals.auth.validate()` など、ライブラリ提供 API は `src/hooks.server.ts` に留める
- フロントエンドロジックのみを feature-scoped にする

### ✅ 後のフェーズで検討

**Phase 1（次の iteration 以降）：Component 統合の再評価**

- AuthForm.svelte が十分に「auth 機能特化」か確認
- login form と signup form のニーズが同じかどうか
- その時点で移行するなら、十分なテストカバレッジがある状態で実施
- 段階的マイグレーション：リスク評価 → テスト準備 → 移行実行

---

#### Phase 3: Route handlers の更新

**`src/routes/(auth)/login/+page.server.ts`**

```typescript
// 既存: auth.createSession() 直後にredirect
// 修正: buildLoginPath を import して使用

import { buildLoginPath } from '$features/auth/utils/login';

// ...existing login logic...
redirect(SEE_OTHER, destination); // dest = buildLoginPath() の結果
```

**`src/routes/(auth)/signup/+page.server.ts`** - 同様

**`src/routes/workbooks/create/+page.server.ts`** など

```typescript
import { ensureSessionOrRedirect } from '$features/auth/services/session';

export const load = async ({ locals, url }) => {
  await ensureSessionOrRedirect(locals, url);
  // ...
};
```

**`src/routes/(admin)/_utils/auth.ts`** - 削除（すべて `$features/auth` に移行）

---

## マイグレーション検査リスト

- [ ] `src/features/auth/` ディレクトリ作成
- [ ] `session.ts` を新規作成（既存 authorship.ts から関数を移動）
- [ ] `admin_access.ts` を新規作成（既存 (admin)/\_utils/auth.ts から移動）
- [ ] `login.ts` を新規作成（2 箇所から統合）
- [ ] `src/lib/utils/authorship.ts` を権限判定のみに削減
- [ ] `src/features/auth/index.ts` でエクスポート
- [ ] Route handlers で新しい import パス に更新
  - `src/routes/(auth)/login/+page.server.ts`
  - `src/routes/(auth)/signup/+page.server.ts`
  - `src/routes/workbooks/create/+page.server.ts`
  - その他保護ルート
- [ ] `src/routes/(admin)/_utils/auth.ts` を削除
- [ ] 単体テストを `src/features/auth/**/*.test.ts` に移行
  - `authorship.test.ts` から auth 関連を分離
  - `session.test.ts`, `admin_access.test.ts` を新規作成
- [ ] E2E テストが新しい redirect_after_login フローをカバーしているか確認
- [ ] 型チェック・linting を実行

---

## 検証方法

1. **ビルド確認** - `pnpm build` で型エラーがないか
2. **テスト確認** - `pnpm test:unit` で既存テストが引き続き pass
3. **E2E確認** - `pnpm test:e2e` で redirect フローが正常に動作
4. **インポート確認** - grep で旧パスのインポートが残っていないか

---

## 技術負債削減の効果

✅ **コード重複の排除** - `buildLoginPath()` の 2 重複を統合
✅ **責任の明確化** - auth と authorship 権限判定を分離
✅ **テスト構造の改善** - co-located テストで保守性向上
✅ **拡張性の向上** - OAuth, 2FA 等の新しい auth 機能追加時に `src/features/auth/` に集約可能
✅ **AGENTS.md 準拠** - feature-scoped 設計への段階的移行

---

## 注意点

### 破壊リスク最小化

- **段階的実行が必須** - すべてを一度に移行しない
  - Phase 1: services のみ → テスト → デプロイ
  - Phase 2: utils のみ → テスト → デプロイ
  - Phase 3: route handlers 更新 → テスト → デプロイ
- **各 phase ごとに git commit** - ロールバック可能にする
- **E2E テストを各段階で実行** - redirect フロー が壊れていないか確認

### 実装上の注意

- 既存の `src/lib/utils/authorship.ts` は「著者権」関連の関数をコアとしているため、完全には削除しない
- Route handlers が `src/features/auth` を import する際、アクセス権の問題がないか確認（通常は問題なし）
- Lucia auth ライブラリの API は変更しない（`locals.auth.validate()` は継続使用）
- **コンポーネント移行は今回のスコープ外** - Phase 1 で必要性を再評価
