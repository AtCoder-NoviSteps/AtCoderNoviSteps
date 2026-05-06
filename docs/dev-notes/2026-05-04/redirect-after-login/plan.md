# ログイン後リダイレクト実装計画

## 概要

ログイン後のリダイレクト先をハードコード（`/`）から、ログイン前に訪問しようとしていたページへ戻す仕組みを実装する。

**目的：**

- ログイン必須ページ（例：`workbooks/create`）にアクセス後、ログインして同ページへ戻るUXを実現
- 登録フロー（signup）でも同様の動作を提供
- 将来の保護ルートにも一貫して適用できる汎用的な仕組みとして設計

**方針：** URLクエリパラメータ `?redirectTo=...` を使用（SvelteKit公式docs Form Actionsページのコード例にも記載のパターン）

---

## 設計方針

### セキュリティ：Open Redirect 対策

`redirectTo` は外部URLへの誘導（フィッシング等）に悪用可能なため、**同一オリジンの相対パスのみ**を許可する。

`isSameOriginRedirect` を `src/lib/utils/url.ts` に追加：

```typescript
export function isSameOriginRedirect(redirectTarget: string, requestOrigin: string): boolean {
  try {
    const targetUrl = new URL(redirectTarget, requestOrigin);
    return targetUrl.origin === requestOrigin;
  } catch {
    // new URL() throws TypeError on malformed input; treat as unsafe.
    return false;
  }
}
```

- 標準 `URL` API のみ使用（外部ライブラリ不要）
- `//danger.com` 等のプロトコル相対URL、絶対URLを確実に弾く
- `startsWith('/')` だけでは `//danger.com` を突破されるため不十分

### ヘルパー関数の修正方針

既存の `ensureSessionOrRedirect` / `getLoggedInUser` に `url?: URL` オプショナルパラメータを追加。既存呼び出しとの互換性を維持しつつ、`url` を渡した場合のみ `?redirectTo=` を付与する。

```typescript
// src/lib/utils/authorship.ts（変更後）
export const getLoggedInUser = async (
  locals: App.Locals,
  url?: URL,
): Promise<App.Locals['user'] | null> => {
  await ensureSessionOrRedirect(locals, url);
  const loggedInUser = locals.user;

  if (!loggedInUser) {
    redirect(TEMPORARY_REDIRECT, buildLoginPath(url));
  }

  return loggedInUser;
};

export const ensureSessionOrRedirect = async (locals: App.Locals, url?: URL): Promise<void> => {
  const session = await locals.auth.validate();

  if (!session) {
    redirect(TEMPORARY_REDIRECT, buildLoginPath(url));
  }
};

function buildLoginPath(url?: URL): string {
  let path = '/login';

  if (url) {
    path += `?redirectTo=${encodeURIComponent(url.pathname + url.search)}`;
  }

  return path;
}
```

### ログイン・登録アクションの変更

両アクションで `redirectTo` を読み取り、検証後にリダイレクト：

```typescript
// login/signup action内（共通）
const redirectTo = url.searchParams.get('redirectTo');
let destination = HOME_PAGE;

if (redirectTo && isSameOriginRedirect(redirectTo, url.origin)) {
  destination = redirectTo;
}

redirect(SEE_OTHER, destination);
```

### votes/[slug] の扱い

`votes/[slug]` はログインなしでも閲覧可能なページ。未ログイン時はページ内に「ログイン」「新規登録」ボタンを表示する設計になっている。これらのリンクに `?redirectTo=/votes/[slug]` を付与することで、ログイン後に投票ページへ戻れるようにする（ページ自体のガードは追加しない）。

---

## 実装フェーズ

### Phase 1: `isSameOriginRedirect` テスト（先に書く）

`src/lib/utils/url.test.ts` に追加（実装前に書いてREDにする）。

**通過すべきケース（`true`）:**

- `/workbooks/bfs`（同一オリジンの相対パス）
- `/workbooks/bfs?tab=foo`（クエリ付き相対パス）
- `/%2F%2Fexternal.example.com`（`%2F` はパス区切りでなくパス文字として解釈→ドメインでなくパスとして扱われるため同一オリジン内の遷移）
- `/../../../external.example.com`（パストラバーサルはURL パーサーが正規化→ドメインでなくパスとして扱われるため同一オリジン内の遷移）

**弾くべきケース（`false`）:**

- `https://danger.com`（異オリジンの絶対URL）
- `//danger.com`（プロトコル相対URL）
- `https://app.com@danger.com/path`（`app.com` がusernameに解釈され origin は `danger.com`）
- `javascript:alert()`（opaque origin `"null"`）
- `data:text/html,<script>alert()</script>`（opaque origin `"null"`）
- `not-a-url!!!`（不正な文字列、`new URL` がthrowし `false`）

### Phase 2: `isSameOriginRedirect` 実装

- `src/lib/utils/url.ts` に `isSameOriginRedirect` を追加
- `pnpm test:unit` でPhase 1のテストがGREENになることを確認

### Phase 3: 認証ヘルパーのテスト（先に書く）

`src/lib/utils/authorship.test.ts`（既存があれば追記）に追加。`locals.auth` は `vi.mock` でモック。

- `url` を渡した場合 → `/login?redirectTo=%2Fworkbooks%2Fbfs` へリダイレクトすること
- `url` を渡さない場合 → `/login` へリダイレクトすること（既存動作の維持確認）

### Phase 4: 認証ヘルパー実装

- `src/lib/utils/authorship.ts` の `ensureSessionOrRedirect` / `getLoggedInUser` に `url?: URL` を追加
- `src/routes/(admin)/_utils/auth.ts` の `validateAdminAccess` にも同様の修正
- `pnpm test:unit` でGREENを確認

### Phase 5: ログイン・登録アクションのテスト（先に書く）

`src/routes/(auth)/login/` および `signup/` に隣接するテストファイルに追加。

- 有効な `redirectTo`（`/workbooks/bfs`）→ ログイン後そのパスへリダイレクト
- 無効な `redirectTo`（`https://danger.com`）→ ホーム (`/`) へリダイレクト
- `redirectTo` なし → ホームへリダイレクト

### Phase 6: ログイン・登録アクション実装

- `src/routes/(auth)/login/+page.server.ts` で `redirectTo` を読み取り・検証・リダイレクト
- `src/routes/(auth)/signup/+page.server.ts` で同じ処理を実装
- `pnpm test:unit` でGREENを確認

### Phase 7: E2E テスト（先に書く・Playwright）

Phase 6完了時点でログイン機構が `redirectTo` を処理できる状態になる。
ここでE2Eテストを書いて **RED** にし、Phase 8・9の実装で **GREEN** にする。

`e2e/` 以下に新規テストファイルを追加。

**各ルートの `redirectTo` 付与確認（Phase 8・9 で変更する全ルート）**

未ログイン状態でアクセスしたとき、`/login?redirectTo=<そのパス>` にリダイレクトされることを確認する。
ログイン後に元のページへ戻ることを確認するのは代表ルートのみで十分（機構は共通のため）。

| ルート                    | 確認内容                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `/workbooks`              | `?redirectTo=%2Fworkbooks` が付与される                                                       |
| `/workbooks/<slug>`       | `?redirectTo=%2Fworkbooks%2F<slug>` が付与される ★ログイン後の復帰もここで確認                |
| `/workbooks/create`       | `?redirectTo=%2Fworkbooks%2Fcreate` が付与される                                              |
| `/problems/<slug>`        | `?redirectTo=...` が付与される                                                                |
| `/users/edit`             | `?redirectTo=%2Fusers%2Fedit` が付与される                                                    |
| `/users/<username>`       | `?redirectTo=...` が付与される                                                                |
| `/votes/<slug>`           | ログイン・アカウント作成ボタンをクリックした際のリンク href に `?redirectTo=...` が付与される |
| `/admin/account_transfer` | `?redirectTo=...` が付与される（管理者ユーザーでログイン後に復帰も確認）                      |
| `/admin/tasks`            | `?redirectTo=...` が付与される                                                                |
| `/admin/tasks/<task_id>`  | `?redirectTo=...` が付与される                                                                |
| `/admin/tags`             | `?redirectTo=...` が付与される                                                                |
| `/admin/tags/<tag_id>`    | `?redirectTo=...` が付与される                                                                |

**登録フロー（一般ユーザーの典型的なユースケース）：**

- 未ログイン → `/workbooks/<slug>` → ログインページ → 登録ページへ遷移した場合 `redirectTo` が引き継がれること
- 登録成功後 → `/workbooks/<slug>` に戻ること

**votes/[slug] のログインボタン経由フロー：**

`/votes/[slug]` はページ自体は公開だが、ページ内のログイン・登録リンクに `redirectTo` が付与される。

- 未ログイン状態で `/votes/<slug>` を表示 → ログインリンクのhrefに `?redirectTo=%2Fvotes%2F<slug>` が含まれること
- 未ログイン状態で `/votes/<slug>` を表示 → アカウント作成リンクのhrefに `?redirectTo=%2Fvotes%2F<slug>` が含まれること
- ログインリンクからログイン → ログイン後 `/votes/<slug>` に戻ること
- 登録リンクから登録ページへ遷移した場合も `redirectTo` が引き継がれ、登録後 `/votes/<slug>` に戻ること

※「ログイン・アカウント作成ボタンが表示されること」自体はvotes機能のテストの責務。このプランではリンクの `href` に `redirectTo` が正しく付与されているかのみを検証する。

**open redirect 防止（不正な `redirectTo`）：**

- `?redirectTo=https://danger.com` → ログイン後はホーム (`/`) に遷移すること
- `?redirectTo=//danger.com` → 同上
- `?redirectTo=javascript:alert()` → 同上

### Phase 8: ロード関数の一括更新

`getLoggedInUser(locals)` → `getLoggedInUser(locals, url)` に変更。
対象ルート（`load` 関数のシグネチャに `url` を追加する必要あり）：

| ファイル                                      | 現在の呼び出し            |
| --------------------------------------------- | ------------------------- |
| `src/routes/workbooks/[slug]/+page.server.ts` | `getLoggedInUser(locals)` |
| その他 `ensureSessionOrRedirect` 呼び出し箇所 | 同様                      |

- `pnpm test:e2e` で対象ルートのテストがGREENになることを確認

### Phase 8.5: 既存E2Eテストの修正

Phase 8実装後、`/login` への完全一致アサーションが `/login?redirectTo=...` にマッチしなくなるため修正が必要。

| ファイル                     | 行  | 変更内容                                       |
| ---------------------------- | --- | ---------------------------------------------- |
| `e2e/votes.spec.ts`          | 169 | `toHaveURL('/login')` → `toHaveURL(/\/login/)` |
| `e2e/workbook_order.spec.ts` | 16  | `toHaveURL('/login')` → `toHaveURL(/\/login/)` |
| `e2e/workbooks_list.spec.ts` | 32  | `toHaveURL('/login')` → `toHaveURL(/\/login/)` |

影響なし（変更不要）：

- `e2e/user_edit.spec.ts:13` — すでに `toHaveURL(/\/login/)` を使用
- `e2e/helpers/auth.ts:22` — `/login` を直接 `goto` するため `redirectTo` が付かない → `/` アサーションはそのまま正しい

### Phase 9: 直接 `redirect('/login')` の統一

以下のファイルは `ensureSessionOrRedirect` を使わず直接 `redirect(30x, '/login')` を呼び出している。ヘルパー経由に統一する：

| ファイル                                              | 件数 |
| ----------------------------------------------------- | ---- |
| `src/routes/problems/[slug]/+page.server.ts`          | 1    |
| `src/routes/users/edit/+page.server.ts`               | 2    |
| `src/routes/users/[username]/+page.server.ts`         | 2    |
| `src/routes/workbooks/create/+page.server.ts`         | 1    |
| `src/routes/(admin)/account_transfer/+page.server.ts` | 2    |
| `src/routes/(admin)/tasks/+page.server.ts`            | 2    |
| `src/routes/(admin)/tasks/[task_id]/+page.server.ts`  | 2    |
| `src/routes/(admin)/tags/+page.server.ts`             | 2    |
| `src/routes/(admin)/tags/[tag_id]/+page.server.ts`    | 2    |

- `pnpm test:e2e` で全ルートのテストがGREENになることを確認

### Phase 10: auth.md 更新

`.claude/rules/auth.md` に「Redirect After Login Pattern」セクションを追加し、今後の実装が一貫した書き方になるよう文書化。

### Phase 11: ルール・ドキュメント追加

今回の実装で得られた、既存ルールに存在しない知見を英語で簡潔に追記する。

**1. `auth.md`（またはルート `security.md` 新規作成）: Open Redirect 防止パターン**

- `startsWith('/')` だけでは `//danger.com`（プロトコル相対URL）を突破されるため不十分
- 正しい検証は `new URL(redirectTarget, origin).origin === origin`
- 適用範囲：ユーザー入力のURLを受け取って `redirect()` する箇所すべて

**2. `sveltekit.md`: `redirect()` は origin 検証を行わない**

- SvelteKit の `redirect()` は宛先URLの origin を検証しない（フレームワーク側に保護なし）
- ユーザー由来の redirect 先を使う場合は必ず開発者側で検証する

**3. `testing-e2e.md`: インフラ変更時の E2E テスト配置**

- 複数ルートへ段階的に展開するインフラ変更では、「機構が動く Phase の後・全ルート適用 Phase の前」に E2E を書いて RED にする
- 機構が整っていない状態で E2E を書いても通らないため、通常のユニットテストより一段遅らせるのが正しい順序

---

## 影響ファイル一覧

**修正（既存）:**

- `src/lib/utils/authorship.ts`
- `src/routes/(admin)/_utils/auth.ts`
- `src/routes/(admin)/account_transfer/+page.server.ts`
- `src/routes/(admin)/tasks/+page.server.ts`
- `src/routes/(auth)/login/+page.server.ts`
- `src/routes/(auth)/signup/+page.server.ts`
- `src/routes/workbooks/[slug]/+page.server.ts`
- `src/routes/workbooks/create/+page.server.ts`
- `src/routes/problems/[slug]/+page.server.ts`
- `src/routes/users/edit/+page.server.ts`
- `src/routes/users/[username]/+page.server.ts`
- `src/routes/(admin)/tasks/[task_id]/+page.server.ts`
- `src/routes/(admin)/tags/+page.server.ts`
- `src/routes/(admin)/tags/[tag_id]/+page.server.ts`
- `.claude/rules/auth.md`

**追加（新規）:**

- `src/lib/utils/url.test.ts`（`isSameOriginRedirect` のユニットテスト）
- `e2e/redirect_after_login.spec.ts`（ログイン・登録後リダイレクトのE2Eテスト）

**修正（既存E2E）:**

- `e2e/votes.spec.ts`（`/login` 完全一致 → 正規表現に変更）
- `e2e/workbook_order.spec.ts`（同上）
- `e2e/workbooks_list.spec.ts`（同上）

---

## 却下した代替案

### URLクエリパラメータ以外のアプローチ

| 案                  | 却下理由                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------ |
| **短命Cookie**      | 「ストレージへの保存を避けたい」というプロジェクト方針に反する。管理コストも増大           |
| **Refererヘッダー** | ブラウザによって送信されないケースが多く信頼性が低い。ブックマーク・直リンクでは機能しない |

### `startsWith('/')` のみの検証

`//danger.com` はプロトコル相対URLとしてブラウザが `https://danger.com` に解釈するため、この検証では open redirect を防げない。標準 `URL` API による origin 比較が必要。
