# セキュリティ監査：認証・認可の影響箇所特定

## 概要

survey.md の TODO リストに基づき、以下4項目をコードベース全体で調査した。

1. `+page.server.ts` / `+server.ts` の `load` 関数：認証チェックなしで全件返していないか
2. API ルート（`+server.ts`）：未認証でアクセスできるエンドポイントがないか
3. service 層：ユーザーが他ユーザーのデータを取れる経路がないか
4. `$queryRaw` / `$executeRaw` 使用箇所：ユーザー入力の直接埋め込みがないか

---

## 調査結果

### 項目2: API ルート（`+server.ts`）— 問題なし

全 4 エンドポイントを確認した。

| ファイル                             | メソッド | 認証                        | 判定 |
| ------------------------------------ | -------- | --------------------------- | ---- |
| `(admin)/workbooks/order/+server.ts` | POST     | `validateAdminAccessForApi` | OK   |
| `problems/getMedianVote/+server.ts`  | GET      | `locals.auth.validate()`    | OK   |
| `problems/getMyVote/+server.ts`      | GET      | `locals.auth.validate()`    | OK   |
| `sitemap.xml/+server.ts`             | GET      | なし（公開情報、意図的）    | OK   |

---

### 項目4: `$queryRaw` / `$executeRaw` — 問題なし

`src/` 配下に使用箇所ゼロ。全 DB アクセスが Prisma の型付き API 経由のため、SQL インジェクションの危険なし。

---

### 項目1: `+page.server.ts` の load 関数

**前提確認**：`getLoggedInUser(locals, url)` は未認証の場合必ず `redirect(307, '/login?redirectTo=...')` を投げる（null を返さない）。この保証は `src/features/auth/services/session.ts` の JSDoc に明示されている。

#### 確認済みルート一覧

| ファイル                                   | 認証方式                                                     | 判定 |
| ------------------------------------------ | ------------------------------------------------------------ | ---- |
| `routes/+page.server.ts`                   | `locals.auth.validate()`（任意）                             | OK   |
| `(auth)/login/+page.server.ts`             | 認証不要（ログインページ）                                   | OK   |
| `(auth)/signup/+page.server.ts`            | 認証不要（サインアップページ）                               | OK   |
| `(auth)/logout/+page.server.ts`            | リダイレクトのみ                                             | OK   |
| `forgot_password/+page.server.ts`          | ログイン済みをブロック                                       | OK   |
| `problems/+page.server.ts`                 | `locals.auth.validate()`（任意）、userId 未設定時は答えなし  | OK   |
| `problems/[slug]/+page.server.ts`          | `getLoggedInUser()`                                          | OK   |
| `votes/+page.server.ts`                    | `locals.auth.validate()`（任意）、集計データのみ             | OK   |
| `votes/[slug]/+page.server.ts`             | `locals.auth.validate()`（任意）、myVote は session 有時のみ | OK   |
| `users/edit/+page.server.ts`               | `getLoggedInUser()`                                          | OK   |
| `workbooks/create/+page.server.ts`         | `ensureSessionOrRedirect()` + admin チェック                 | OK   |
| `(admin)/account_transfer/+page.server.ts` | `validateAdminAccess()`                                      | OK   |
| `(admin)/tags/+page.server.ts`             | `validateAdminAccess()`                                      | OK   |
| `(admin)/tags/[tag_id]/+page.server.ts`    | `validateAdminAccess()`                                      | OK   |
| `(admin)/tasks/+page.server.ts`            | `validateAdminAccess()`                                      | OK   |
| `(admin)/tasks/[task_id]/+page.server.ts`  | `validateAdminAccess()`                                      | OK   |
| `(admin)/tasks/grade/+page.server.ts`      | `validateAdminAccess()`                                      | OK   |
| `(admin)/workbooks/order/+page.server.ts`  | `validateAdminAccess()`                                      | OK   |

#### 問題あり

**[Critical] `workbooks/edit/[slug]/+page.server.ts` — `default` action に認証チェックなし**

- ファイル：`src/routes/workbooks/edit/[slug]/+page.server.ts`
- 行：80〜120
- 内容：`load()` は `getLoggedInUser(locals, url)` + `canEdit` チェックで保護されているが、`actions.default` は `({ request, params })` のみを受け取り `locals` を使わない。認証チェックも所有権チェックも一切ない。
- 影響：未認証ユーザーが任意のスラッグに対して POST することで、任意のワークブックを上書き可能。

```typescript
// 現状（脆弱）
default: async ({ request, params }) => {
  // locals なし、認証チェックなし
  await workBooksCrud.updateWorkBook(workBookId, { ... });
}
```

修正方針：

```typescript
default: async ({ request, params, locals, url }) => {
  const loggedInUser = await getLoggedInUser(locals, url);
  // workBookWithAuthor 取得後に canEdit チェックを追加
  if (!canEdit(loggedInUser.id, workBookWithAuthor.workBook.authorId, loggedInUser.role as Roles, workBookWithAuthor.workBook.isPublished)) {
    error(FORBIDDEN, `問題集id: ${slug}にアクセスする権限がありません。`);
  }
}
```

---

**[要確認] `users/[username]/+page.server.ts` — `getLoggedInUser` の redirect が try-catch に吸い込まれる**

- ファイル：`src/routes/users/[username]/+page.server.ts`
- 行：14〜50
- 内容：try ブロック内で `getLoggedInUser(locals, url)` を呼んでいる。この関数は未認証時に `redirect()` を投げるが、catch ブロックがそれを吸い込み、`load()` は undefined を返す。未認証ユーザーが `/login` にリダイレクトされない。
- 判定が必要：このページを「公開プロフィール（未認証でもタスク結果を見せる）」として設計しているなら、`getLoggedInUser` ではなく `locals.user` を直接使うべき。認証必須にするならリダイレクトを catch 外に出す必要がある。

```typescript
// 現状
try {
  loggedInUser = await getLoggedInUser(locals, url); // redirect を投げるが...
  ...
} catch (e) {
  // ...redirect を含む全例外をキャッチしてしまう
  //500を投げたい
}
```

→ **プロダクト要件の確認が必要**：ユーザープロフィールページは未認証アクセスを許可するか？

---

### 項目3: service 層（IDOR 調査）— 問題なし（既知の Critical 問題の根因を確認）

`src/lib/services/` および `src/features/*/services/` の全 19 ファイルを確認した。

| ファイル                                                                                                             | 概要                                                                                                                     | IDOR リスク                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `answers.ts`                                                                                                         | TaskAnswer の CRUD。全関数が `user_id` パラメータでスコープ                                                              | なし                                                                                                          |
| `task_results.ts`                                                                                                    | Task + Answer の結合。`userId` 未指定時は明示的に空 Map を返す設計                                                       | なし                                                                                                          |
| `users.ts`                                                                                                           | User の取得・削除。認証は呼び出し側で担保（`users/edit` は `requireSelf` で保護）                                        | なし                                                                                                          |
| `workbooks.ts`                                                                                                       | WorkBook の CRUD。`updateWorkBook(id, data)` / `deleteWorkBook(id)` は ID のみ受け取り、所有権チェックは呼び出し側の責任 | `updateWorkBook` の呼び出し側（`workbooks/edit/[slug]` の `default` action）が認証なし → **Critical（既知）** |
| `vote_grade.ts`                                                                                                      | 投票の upsert。`userId + taskId` 複合キー、呼び出し側の API ルートで認証済み                                             | なし                                                                                                          |
| `atcoder_verification.ts`                                                                                            | AtCoder 連携。`username` ベース、呼び出し側（`users/edit`）は `requireSelf` で保護                                       | なし                                                                                                          |
| `workbook_tasks.ts`                                                                                                  | WorkBookTask の抽出・検証ユーティリティ（DB アクセスなし）                                                               | N/A                                                                                                           |
| `workbook_placements/crud.ts`                                                                                        | Placement の CRUD。管理者専用 API ルート経由のみ                                                                         | なし                                                                                                          |
| `workbook_placements/initializers.ts`                                                                                | Placement の初期化。管理者専用                                                                                           | なし                                                                                                          |
| `votes/vote_statistics.ts`                                                                                           | 投票統計の読み取り。公開情報                                                                                             | なし                                                                                                          |
| `auth/session.ts` / `auth/admin_access.ts`                                                                           | 認証ガード。問題なし                                                                                                     | なし                                                                                                          |
| `task_tags.ts` / `tags.ts` / `tasks.ts` / `contest_task_pairs.ts` / `submission_status.ts` / `tasktagsApiService.ts` | 公開マスタデータのみ                                                                                                     | なし                                                                                                          |

**補足**：`workbooks/+page.server.ts` の `delete` action・`workbooks/create` の `default` action はどちらも `getLoggedInUser` を最初に呼んでおり保護済み。`workbooks/edit/[slug]` の `default` action だけが `locals` を受け取らず `getLoggedInUser` を呼んでいないため、Critical 問題となっている。

---

## E2E テスト計画

### 対象ファイル

`e2e/workbook_edit.spec.ts`（新規作成）

### テスト順序と理由

`load()` 側の認証チェックは既存の E2E テストでカバーされていない（`workbooks_list.spec.ts` はリスト画面のみ）。
`default` action は UI を経由しない直接 POST で `load()` のガードを完全に迂回できるため、action 専用のアクセス制御テストが必要。

**実装順序**：action に認証チェックを追加（fix）→ E2E テストを書く（RED → GREEN で確認）

### テストケース

#### ケース1：未認証ユーザーによる直接 POST → ログインリダイレクト

```typescript
test('unauthenticated user is redirected when POSTing directly', async ({ page }) => {
  const response = await page.request.post('/workbooks/edit/test-slug', {
    form: {
      /* 最小限の有効フォームデータ */
    },
  });
  // SvelteKit の form action は redirect を follow するため、最終 URL で判定
  expect(response.url()).toMatch(/\/login/);
});
```

#### ケース2：非オーナーの認証済みユーザーによる直接 POST → 403

```typescript
test('non-owner cannot edit workbook via direct POST', async ({ page }) => {
  await loginAsUser(page); // オーナーではないユーザーでログイン
  const response = await page.request.post('/workbooks/edit/[admin-owned-slug]', {
    form: {
      /* 最小限の有効フォームデータ */
    },
  });
  expect(response.status()).toBe(FORBIDDEN); // 403
});
```

#### ケース3（任意）：オーナー本人による編集 → 成功リダイレクト

```typescript
test('owner can update their workbook', async ({ page }) => {
  await loginAsUser(page);
  await page.goto('/workbooks/edit/[user-owned-slug]');
  // フォームを操作して送信
  await page.getByRole('button', { name: '更新' }).click();
  await expect(page).toHaveURL('/workbooks', { timeout: TIMEOUT });
});
```

### 優先度

| ケース                           | 優先度   | 理由                                                                                |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| ケース2（非オーナーの直接 POST） | **必須** | `load()` のリダイレクトを迂回する。ユニットテストでは検証不可。最も回帰リスクが高い |
| ケース1（未認証の直接 POST）     | **必須** | 同上。未認証ユーザーも UI を使わず action を叩ける                                  |
| ケース3（オーナーによる編集）    | 任意     | 既存の手動テストと重複。ハッピーパスの保証として追加しても良い                      |

### 技術的注意点

- `page.request.post()` は Playwright の API Request コンテキストを使用（UI 操作なし）
- SvelteKit の form action は `fetch` でリクエストするとリダイレクト先を follow する挙動があるため、`response.url()` で最終 URL を確認する
- フォームデータは `workBookSchema` の最小限の必須フィールドを渡す（バリデーションエラーで先に止まらないよう）
- テストデータ（スラッグ）は seed データ内の既存ワークブックを参照する

---

## アクションリスト

### TODO

- [ ] `workbooks/edit/[slug]` の `default` action に認証・所有権チェックを追加（Critical）
- [ ] E2E テスト `e2e/workbook_edit.spec.ts` を作成（上記ケース1・2 は必須）
- [ ] `users/[username]` の設計方針を確認：公開プロフィールか認証必須か（要確認）
- [x] service 層の IDOR 調査：問題なし（Critical 問題の根因は既知の `workbooks/edit` action）

### 確認済み・対応不要

- `+server.ts` 全 4 エンドポイント：問題なし
- `$queryRaw` / `$executeRaw`：使用箇所なし
- 管理者ルート（`(admin)/`）：全て `validateAdminAccess` / `validateAdminAccessForApi` で保護済み
- 投票エンドポイント：session スコープで正しく保護済み
