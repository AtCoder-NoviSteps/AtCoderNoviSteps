# Auth Feature Consolidation (#1582) - 総合レビューレポート

**実施日:** 2026-05-06
**ブランチ:** #1582
**実施内容:** Security Review + CodeRabbit ×2

---

## 📋 Executive Summary

### セキュリティレビュー結論

**⚠️ 残存課題（Phase 2 以降）：MEDIUM-HIGH リスク**

- Service 層が redirect()/error() を呼び出し（設計違反）
- Null チェック不足による NPE リスク（HIGH）

---

## 🔒 Security Findings

### ⚠️ HIGH: Non-null Assertion での NPE

**Files:**

- `src/routes/problems/[slug]/+page.server.ts:12-13, 23-24`
- `src/routes/workbooks/edit/[slug]/+page.server.ts:25`

**Issue:**

```typescript
// ❌ loggedInUser が null でも !.id でアクセス
const userId = loggedInUser!.id;
```

**Recommendation:**

```typescript
// ✅ Null チェック後に安全にアクセス
if (!loggedInUser) {
  return fail(BAD_REQUEST, { error: 'Unauthorized' });
}
const userId = loggedInUser.id;
```

---

### ⚠️ MEDIUM: Service 層の設計違反

**Files:**

- `src/features/auth/services/session.ts:13-25` - `redirect()` を呼び出し
- `src/features/auth/services/admin_access.ts:28-32` - `redirect()` を呼び出し
- `src/features/auth/services/admin_access.ts:38-48` - `error()` を呼び出し

**Issue:** AGENTS.md ガイドラインに違反

> Service functions return data or null; never call error() or redirect(). HTTP error translation belongs in route handlers.

**Current (❌):**

```typescript
export async function validateAdminAccess(locals: App.Locals, url?: URL): Promise<void> {
  if ((await validateAdminStatus(locals)) !== AdminStatus.OK) {
    redirect(TEMPORARY_REDIRECT, buildLoginPath(url)); // ❌ Service で redirect
  }
}
```

**Recommended (✅): Wrapper パターン**

Service 層は純粋、Route helper で framework 処理を集約：

```typescript
// src/features/auth/services/admin_access.ts （純粋、テスト可能）
export async function validateAdminStatus(locals: App.Locals): Promise<AdminStatus> {
  // ...
}

// src/features/auth/utils/admin_access.ts （Route helper）
export async function ensureAdminOrRedirect(locals: App.Locals, url?: URL): Promise<void> {
  const status = await validateAdminStatus(locals);
  if (status !== AdminStatus.OK) {
    redirect(TEMPORARY_REDIRECT, buildLoginPath(url));
  }
}
```

**呼び出し側：**

```typescript
// Route handler
await ensureAdminOrRedirect(locals, url);

// Form action
await ensureAdminOrRedirect(locals);
```

利点：Service は純粋 + 呼び出し側は冗長性ゼロ

---

### ⚠️ MEDIUM: Module-scope Mutable State

**File:** `src/routes/(admin)/account_transfer/+page.server.ts:14`

```typescript
let accountTransferMessages: FloatingMessage[] = []; // ❌ 全リクエスト間で共有
```

**Risks:**

- 競合状態（複数ユーザーが同時実行時に値が上書き）
- 情報漏洩（ユーザーAの結果がユーザーBに表示）

**Recommendation:** Superforms の message 機能または cookies を使用してリクエスト単位に管理

---

## 🐛 CodeRabbit Findings（×2回実施）

### HIGH Issues（残存）

| Issue                 | File                                                 | Line         | Count  |
| --------------------- | ---------------------------------------------------- | ------------ | ------ |
| Null チェック漏れ     | `src/routes/problems/[slug]/+page.server.ts`         | 12-13, 23-24 | 2      |
| Service で redirect() | `src/features/auth/services/session.ts`              | 13-25        | 2 箇所 |
| Service で error()    | `src/features/auth/services/admin_access.ts`         | 38-48        | 1      |
| Task 型不整合         | `src/routes/(admin)/tasks/[task_id]/+page.server.ts` | 14, 44-45    | 2      |

---

### MEDIUM Issues

| Issue                    | File                                                  | Line          | Detail                                       |
| ------------------------ | ----------------------------------------------------- | ------------- | -------------------------------------------- |
| テストアサーション不完全 | `src/features/auth/services/session.test.ts`          | 52            | `.resolves` にマッチャーなし                 |
| テストアサーション不完全 | `src/features/auth/services/admin_access.test.ts`     | 54-55, 99-100 | `.resolves` にマッチャーなし                 |
| Module-scope mutable     | `src/routes/(admin)/account_transfer/+page.server.ts` | 14            | 情報漏洩リスク                               |
| 型不整合                 | `src/routes/(admin)/tags/[tag_id]/+page.server.ts`    | 13            | `getTag` が Tags 返却 → Tag 単一返却が正しい |
| E2E パスワード不一致     | `e2e/helpers/auth.ts`                                 | 6-11          | signup 'TestPass123' vs login 'Ch0kuda1'     |

---

### NITPICK Issues（オプション）

| Issue                 | File                                                             | Count            |
| --------------------- | ---------------------------------------------------------------- | ---------------- |
| テストファイル不足    | `src/features/auth/utils/login.ts`, `signup.ts`                  | 2                |
| Helper 関数重複       | `src/lib/utils/url.test.ts`                                      | 3 箇所           |
| 冗長な型キャスト      | `src/features/auth/services/session.test.ts`                     | 2                |
| 型キャスト `as never` | `src/features/auth/services/admin_access.test.ts`                | 4                |
| 型安全性低下          | `src/lib/components/AuthForm.svelte:31`                          | string に拡張    |
| Reactive 漏れ         | `src/lib/components/SubmissionStatus/UpdatingDropdown.svelte:47` | const → $derived |

---

## 📊 優先度別修正スケジュール

### 完了済み（本レビュー対応）

```markdown
- [x] Account Transfer actions.default に validateAdminAccess(locals, url) 追加
      → src/routes/(admin)/account_transfer/+page.server.ts
```

### Phase 2: Service 層リファクタ（短期）

```markdown
- [ ] NPE リスク → null チェックに変更（3 箇所
- [ ] ensureSessionOrRedirect → 純粋関数 + Wrapper パターン
- [ ] getLoggedInUser の戻り値型を正確に
- [ ] validateAdminStatus → 純粋関数、ensureAdminOrRedirect Wrapper を提供
- [ ] validateAdminAccessForApi → 純粋関数化、error() は Route に移動
```

**見積:** 3-4 時間 + テスト修正 | **パターン:** Wrapper 関数で Service 純粋性 + Route 簡潔性を両立

### Phase 3: テスト・ドキュメント（並行可）

```markdown
- [ ] テストアサーション補完（.resolves → .resolves.toBeUndefined()）
- [ ] login.test.ts, signup.test.ts を追加
- [ ] E2E パスワード統一
- [ ] Module-scope state をリクエスト単位に変更
```

**見積:** 2-3 時間

### Phase 4: 最適化（オプション）

```markdown
- [ ] runTests helper 統一
- [ ] 型安全性改善
- [ ] Reactive store 修正
```

**見積:** 1-2 時間

---

## 🔍 Critical Code Review - レビュー指摘事項の批判的検討

### 新規追加: HIGH セキュリティ問題（ドキュメント未記載）

#### ✅ Issue 1: 指摘は誤り — 現状は正しい（将来の要件変更への懸念あり）

**File:** `src/routes/workbooks/[slug]/+page.server.ts:17, 35`

**レビューツールの指摘（却下）:**

> `loggedInUser === null` の場合、未発行 workbook にゲストがアクセス可能。

**現状:** このページはログインユーザー専用の設計方針。`getLoggedInUser()` はセッションなしなら必ず redirect を throw するため（`session.ts` のコントラクト）、ゲストは 35 行に到達しない。セキュリティギャップなし。

**将来の懸念（ゲスト閲覧を許可したい要件が来た場合）:**

現在のコードはゲスト対応に変更しにくい構造になっている：

- `getLoggedInUser()` を `getLoggedInUserOptional()` に変えると、35 行の `canRead(isPublished, loggedInUser.id, authorId)` が型エラー（`userId: string` が null/undefined を受け取れない）
- `canRead()` の型シグネチャ変更 + 35 行の null-guard 調整が同時に必要
- 42 行の `loggedInUser?.id as string` という型強制キャストも問題になる

「ゲストでも公開 workbook を見せる」変更は、単純な1行修正では済まない。

---

#### ✅ Issue 2: 指摘は誤り — 現状は正しい（Phase 2 refactor 時に高リスクの落とし穴あり）

**File:** `src/routes/workbooks/+page.server.ts:104-121`

**レビューツールの指摘（却下）:**

> 匿名リクエストが delete ハンドラーを通過できる。

`getLoggedInUser()` はセッションなしなら必ず redirect を throw するため、匿名ユーザーは到達しない。現状セキュリティギャップなし。

**Phase 2 refactor 時の高リスク懸念:**

`getLoggedInUser` を pure 化（`User | null` 返却）すると、119 行の null-guard が問題になる：

```typescript
if (loggedInUser && !canDelete(loggedInUser.id, workBook.authorId)) {
  error(FORBIDDEN, ...);
}
// loggedInUser が null → 条件が false → guard をスキップ → 誰でも削除可能
```

閲覧と違い、**削除は非可逆操作**。Phase 2 で pure 化する際に、この null-guard を `if (!loggedInUser || !canDelete(...))` に修正するか、手前で `ensureSessionOrRedirect` を呼ぶことをセットで行う必要がある。Phase 2 チェックリストに明記しておくこと。

---

#### ✅ Issue 3: Account Transfer Action が admin 認可チェックなし（対処済み）

**File:** `src/routes/(admin)/account_transfer/+page.server.ts:33-68`

**問題（正当）:**

実際のコードは `actions.default` が `{ request }` のみ受け取っており `locals` を省略している。`load()` の `validateAdminAccess` は form への直接 POST で bypass 可能（load は form action 実行時には呼ばれない）。**unauthenticated POST が task results を複写できる。**

**レビューツールの修正案（誤り）:**

```typescript
await validateAdminAccessForApi(locals); // ❌ +server.ts 用のメソッド
```

auth.md のルール：

- `validateAdminAccess` — **page routes 用**（`+page.server.ts`）、未認証・非 admin どちらも `/login` へ redirect
- `validateAdminAccessForApi` — **API routes 用**（`+server.ts`）、`error(401/403)` を throw

ここは `+page.server.ts` の form action なので `validateAdminAccess` が正しい。

**正しい修正案:**

```typescript
export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    await validateAdminAccess(locals, url); // ← page route 用
    // ...
  },
};
```

---

### 新規追加: MEDIUM 問題（優先度順）

#### ✅ Issue 4: SvelteKit ドキュメント記述が不正確（対処済み）

**File:** `.claude/rules/sveltekit.md:54-56`

**指摘（正当）:** `url` は form actions の RequestEvent の標準プロパティとして保証されており、null にならない。公式ドキュメントでも `url.searchParams` を直接使う例が示されている。旧ルール「`url` は受け取れない」は誤りだった。

**対処:** sveltekit.md を修正済み。`url` は destructure して直接使える、`new URL(request.url)` は等価な代替手段と記載。

---

#### ✅ Issue 5 & 6: Signup Helper のドキュメント漏れ・API 非対称（対処済み）

- `buildSignupPath` の型シグネチャを `string | URL | null` に統一（`buildLoginPath` と同一）
- `auth.md` の Key Files セクションに `buildSignupPath` を追記

---

#### Issue 7: Testing.md の `.resolves` マッチャー説明が不正確

**File:** `.claude/rules/testing.md:35-43`

**現状 (❌ 不完全):**

```typescript
// ✓ Correct: confirms promise resolves without throwing
await expect(ensureSessionOrRedirect(mockLocals)).resolves;

// ✗ Avoid: toBeUndefined() is redundant for Promise<void>
await expect(ensureSessionOrRedirect(mockLocals)).resolves.toBeUndefined();
```

**問題:** Vitest では `.resolves` だけではアサーションが完成しない。以下いずれかが必須：

1. `.resolves.toBeUndefined()` （Promise\<void\> の場合）
2. `await ensureSessionOrRedirect(mockLocals)` （throw しないことで成功）

**ユーザーコメント:** 「toBeUndefined をつかうことに違和感があってあえて外した」
→ **これは誤解**。Vitest 構文上、matcher が必須。

**修正案:**

```typescript
// ✓ Option 1: Explicit matcher (Promise<void>)
await expect(ensureSessionOrRedirect(mockLocals)).resolves.toBeUndefined();

// ✓ Option 2: No expectation wrapper (rely on throw)
await ensureSessionOrRedirect(mockLocals); // Asserts it doesn't throw
```

---

#### Issue 8: Users/Edit ハンドラーのエラーマスキング

**File:** `src/routes/users/edit/+page.server.ts:41-44`

**現状 (❌):**

```typescript
try {
  const user = await userService.getUser(userId);
  // ...
} catch (e) {
  redirect(buildLoginPath(...)); // ❌ getUser の失敗を login に誤誘導
}
```

**問題:** `ensureSessionOrRedirect()` で auth 済みなので、catch ブロックは `getUser` の **DB エラー** を捕捉しているはずだが、redirect(login) で隠蔽。リクエストログやエラートレースが失われる。

**批判的評価:**

- 「エラーをログイン画面で隠す」はセキュリティと UX の両面で悪い
- ユーザーは意味不明なログイン画面に誘導される（既にログイン済みなのに）
- 実装者は何が失敗したか分からない

**修正案:**

```typescript
try {
  const user = await userService.getUser(userId);
  // ...
} catch (e) {
  console.error('Failed to fetch user:', e);
  error(500, 'ユーザー情報の取得に失敗しました。');
}
```

---

#### Issue 9: Phase 1 の見出し vs チェックリスト矛盾

**File:** Review doc lines 195-199

**現状 (❌ 矛盾):**

```markdown
### Phase 1: CRITICAL & HIGH（✅ 完了）

- [ ] NPE リスク → null チェックに変更（3 箇所）← Phase 2へ延期
```

**問題:** 見出しは「完了」だが、チェックリストは「未完了（延期）」。どちらが true か不明。

**批判的評価:**

- PR の「完了」判定が曖昧
- 責任者が Phase 2 に進むべき判断ができない

**修正案:** いずれかを選択：

1. 見出しを「Phase 1: 部分完了」に修正
2. NPE チェックリストを Phase 2 セクションに移動

---

### 議論が必要な案件

#### ❓ Issue 10: Guest Login の Redirect 対応は必要か？

**File:** `src/lib/components/AuthForm.svelte:89-92`

**ユーザー質問:** 「ゲストログインもリダイレクトに対応すべき？自分のアカウント作らないのに、そこまでする必要はなくない？」

**批判的分析:**

- **Pro:** UI/UX の一貫性（ゲスト login も admin login も同じ flow）
- **Con:** ゲスト = セッションレス、`redirectTo` 保持の意味が薄い。セッション破棄時に `redirectTo` も消える可能性
- **設計質問:** ゲストが「ログイン前のページに戻る」動作は要件か？

**提案:** 要件確認 → 不要なら NITPICK、必要なら MEDIUM に格上げ

---

#### ❓ Issue 11: workbooks/create の null-check は本当に不要か？

**File:** `src/routes/workbooks/create/+page.server.ts:36-47`

**指摘:** `getLoggedInUser()` が常に throw するので、その下の `if (!author)` は unreachable。

**批判的評価:**

- 指摘は **技術的に正確**
- ただし「この check は将来の refactor 時の safeguard」という観点もある
- Service 層が pure 化される Phase 2 では、`getLoggedInUser()` は `User | null` を返す可能性 → 再度必要になる
- 今削除 → Phase 2 で復活するデッド・コードの往復

**提案:** Phase 2 roadmap が確定まで保留、またはコメント付きで明示的に「Phase 2 refactor 後に復活する可能性」と注記

---

## 参考

- [AGENTS.md - Service Layer Guidelines](../../AGENTS.md)
- [.claude/rules/auth.md - Authentication Rules](../../.claude/rules/auth.md)
