# PR #3319 × staging コンフリクト解消

## 概要

`feature/atcoder-verified-voting`（PR #3319）と `staging` のコンフリクトを解消する。

**原因**: PR #3319 の作成後に `feature/atcoder-account-model`（PR #3324）が staging にマージされ、PR #3319 が参照していたファイルが移動・リネームされた。

- マージベース: `8a15fce7`（fix: address remaining CodeRabbit/Copilot findings on PR #3316）
- staging 先端: `8757704d`（Merge pull request #3328 feature/atcoder-account-model）

## コンフリクトファイル

| ファイル                                              | staging の変更                                                                       | PR #3319 の変更                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `src/lib/components/AtCoderUserValidationForm.svelte` | `src/features/account/components/settings/AtCoderVerificationForm.svelte` にリネーム | `$bindable()` 除去 + `editableAtcoderId` local state パターンに変更 |
| `src/routes/users/edit/+page.server.ts`               | 新サービスパス・新DBスキーマ・`requireSelf()` 認可・`openAtCoderTab` 追加            | `openAtCoderTab` のみ追加（旧パス・旧スキーマのまま）               |
| `src/routes/users/edit/+page.svelte`                  | AtCoder タブをコメントアウトしたまま                                                 | `$derived()` でリアクティブなタブ切り替えを実装して有効化           |

## 設計方針

`feature/atcoder-verified-voting` ブランチで `git merge origin/staging` を実行し、3件のコンフリクトを手動解消する。

**rebase ではなく merge を選択した理由**: 履歴に merge commit が残るが、コンフリクト解消の文脈が追跡しやすい。rebase と作業量は同じため、単純さを優先した。

**却下した代替案**:

- PR #3319 を closing して新ブランチを作り直す: 変更量が多く、レビュー履歴が失われる
- staging を rebase: PR #3319 の各コミットにコンフリクト解消が必要になり煩雑

---

## Phase 1: ドキュメント整備（低リスク）

- [x] `docs/dev-notes/2026-03-29/pr-3319-conflict-resolution/plan.md` を作成（本ファイル）

## Phase 2: merge 実行（中リスク）

- [x] `feature/atcoder-verified-voting` ブランチに checkout
- [x] `git merge origin/staging` を実行（3件のコンフリクトが発生する）
  - 実際のコンフリクト: `+page.svelte` の1件のみ（`+page.server.ts` と `AtCoderVerificationForm.svelte` は自動マージ）

## Phase 3: Conflict 2 解消 ― `+page.server.ts`（低リスク）

- [x] 完了

対象: `src/routes/users/edit/+page.server.ts`

staging 版をベースに採用し、`AtCoderAccount` モデルのフィールド名に揃えるためにキー名を rename する。
（実際には git が自動マージ済みだったため `git checkout` は不要だった。設計変更のみ適用した。）

その後、以下の変更を適用する:

**load() の戻り値 ― AtCoderAccount フィールドをオブジェクトにまとめる:**

`AtCoderAccount` モデルのフィールドをグループとして返すことで、モデル変更時の変更箇所を load() の 1 か所に限定できる。フロントは `$derived` で一度展開すれば以降はフラットに使える（後述）。

```typescript
// Before (staging)
atcoder_username: user?.atCoderAccount?.handle ?? '',
atcoder_validationcode: user?.atCoderAccount?.validationCode ?? '',
is_validated: user?.atCoderAccount?.isValidated ?? false,

// After
atCoderAccount: {
  handle:         user?.atCoderAccount?.handle         ?? '',
  validationCode: user?.atCoderAccount?.validationCode ?? '',
  isValidated:    user?.atCoderAccount?.isValidated    ?? false,
},
```

デフォルト値（`?? ''` / `?? false`）を load() 側で吸収するため、フロントは nullable を考慮しなくてよい。`AtCoderAccount` レコード未作成のユーザー（`user?.atCoderAccount` が `undefined`）も `status === 'nothing'` に自然に収束する。

**actions の formData 読み取りと戻り値 ― フォームフィールド名を AtCoderAccount モデルに揃える:**

コンポーネントの hidden input の `name` 属性と action の `formData.get()` キーを一致させる必要があるため、両方を rename する。

| Before                                                   | After                            |
| -------------------------------------------------------- | -------------------------------- |
| `formData.get('atcoder_username')`                       | `formData.get('handle')`         |
| `formData.get('atcoder_validationcode')`                 | `formData.get('validationCode')` |
| `return { atcoder_username, ... }`                       | `return { handle, ... }`         |
| `return { atcoder_validationcode: validationCode, ... }` | `return { validationCode, ... }` |

## Phase 4: Conflict 1 解消 ― `AtCoderVerificationForm.svelte`（中リスク）

- [x] 完了

対象: `src/features/account/components/settings/AtCoderVerificationForm.svelte`

staging がリネームした先のファイルに、PR #3319 の one-way binding パターンを適用し、Props を `AtCoderAccount` モデルのフィールド名に揃える。

変更内容:

1. `import { untrack } from 'svelte'` を追加
2. Props を rename + `$bindable()` 全除去 + `isValidated` 追加 / `status` 削除:

   `atCoderAccount` オブジェクトをひとつの prop として受け取る。`status` は導出値なのでコンポーネント内で `$derived` する。`$bindable()` は全除去。

   ```typescript
   // Before (staging)
   interface Props {
     username: string;
     atcoder_username: string;
     atcoder_validationcode: string;
     status: string;
   }
   let {
     username = $bindable(),
     atcoder_username = $bindable(),
     atcoder_validationcode = $bindable(),
     status,
   }: Props = $props();

   // After
   interface Props {
     username: string;
     atCoderAccount: {
       handle: string;
       validationCode: string;
       isValidated: boolean;
     };
   }
   let { username, atCoderAccount }: Props = $props();
   ```

3. `editableHandle` local state と `status` の `$derived` を追加:

   ```typescript
   let editableHandle = $state(untrack(() => atCoderAccount.handle));

   const status = $derived(
     atCoderAccount.isValidated
       ? 'validated'
       : atCoderAccount.handle.length > 0 && atCoderAccount.validationCode.length > 0
         ? 'generated'
         : 'nothing',
   );
   ```

4. reset 後に入力欄を再同期する `$effect` を追加:
   ```typescript
   $effect(() => {
     if (status === 'nothing') {
       editableHandle = atCoderAccount.handle;
     }
   });
   ```
5. テンプレート内の参照を更新:
   - `atcoder_username` → `atCoderAccount.handle`、`atcoder_validationcode` → `atCoderAccount.validationCode`
6. フォーム input の `name` 属性を rename（サーバ側の formData キーと一致させる）:
   - `name="atcoder_username"` → `name="handle"`
   - `name="atcoder_validationcode"` → `name="validationCode"`
7. `status === 'nothing'` の可視 AtCoder ID 入力: `bind:value={editableHandle}`
8. hidden inputs を one-way に変更:
   - `bind:value={username}` → `value={username}`
   - `bind:value={atcoder_username}` → `value={atCoderAccount.handle}`
   - `bind:value={atcoder_validationcode}` → `value={atCoderAccount.validationCode}`

旧ファイル `src/lib/components/AtCoderUserValidationForm.svelte` は git の rename として処理済みのため削除扱い（`git rm` は不要）。

## Phase 5: Conflict 3 解消 ― `+page.svelte`（中リスク）

- [x] 完了

対象: `src/routes/users/edit/+page.svelte`

PR #3319 のリアクティブロジックを採用し、import パスと型を staging ベースに更新する。

変更内容:

1. import を更新:

   ```typescript
   // Before (PR #3319)
   import AtCoderUserValidationForm from '$lib/components/AtCoderUserValidationForm.svelte';
   // After
   import AtCoderVerificationForm from '$features/account/components/settings/AtCoderVerificationForm.svelte';
   ```

2. Props を更新（`atCoderAccount` オブジェクト化、`openAtCoderTab` と `form` を追加）:

   ```typescript
   interface Props {
     data: {
       userId: string;
       username: string;
       role: Roles;
       isLoggedIn: boolean;
       atCoderAccount: {
         handle: string;
         validationCode: string;
         isValidated: boolean;
       };
       message_type: string;
       message: string;
       openAtCoderTab: boolean;
     };
     form: Record<string, unknown> | null;
   }
   let { data, form }: Props = $props();
   ```

3. `$derived` で `atCoderAccount` を取得し、`shouldOpenAtCoderTab` を計算:

   `$derived` を使う理由: `data` は SvelteKit がアクション後に再実行した load() の結果で更新される。単純な `const atCoderAccount = data.atCoderAccount` だと更新を受け取れないが、`$derived` にすれば `data` の変化に追従できる。

   `status` はコンポーネント内で導出するためページ側では不要。

   ```typescript
   const atCoderAccount = $derived(data.atCoderAccount);

   const shouldOpenAtCoderTab = $derived(
     data.openAtCoderTab ||
       atCoderAccount.isValidated ||
       (atCoderAccount.handle.length > 0 && atCoderAccount.validationCode.length > 0) ||
       form?.is_tab_atcoder === true,
   );
   ```

4. AtCoder タブを有効化（コメントを外し `open={shouldOpenAtCoderTab}` を追加）:

   ```svelte
   <TabItem open={!shouldOpenAtCoderTab}>...</TabItem>

   <TabItem open={shouldOpenAtCoderTab}>
     {#snippet titleSlot()}
       <span class="text-lg">AtCoder IDを設定</span>
     {/snippet}
     <AtCoderVerificationForm {username} {atCoderAccount} />
   </TabItem>
   ```

   （`$bindable()` 除去により `bind:` は不要。`status` はコンポーネント内で導出するため渡さない）

## Phase 6: rules 追記（低リスク）

- [x] 完了

### `.claude/rules/sveltekit.md` に追加

load() でモデルフィールドをオブジェクトとしてグループ化するパターン:

`````markdown
## load() — Group Related Model Fields as Objects

When a `load()` function returns fields from the same domain model (e.g., `AtCoderAccount`),
group them as an object rather than flattening to top-level keys.
Apply default values at this boundary so the page component never needs to handle `undefined`.

```typescript
// Bad: flat, scattered across top-level keys
atcoder_username: user?.atCoderAccount?.handle ?? '',
atcoder_validationcode: user?.atCoderAccount?.validationCode ?? '',
is_validated: user?.atCoderAccount?.isValidated ?? false,

// Good: grouped by model, defaults absorbed here
atCoderAccount: {
  handle:         user?.atCoderAccount?.handle         ?? '',
  validationCode: user?.atCoderAccount?.validationCode ?? '',
  isValidated:    user?.atCoderAccount?.isValidated    ?? false,
},
```

When consuming in `+page.svelte`, use `$derived` to maintain reactivity (see svelte-runes.md).

### `.claude/rules/svelte-components.md` に追加

コンポーネント Props 設計のパターン:

````markdown
## Props — Pass Domain Model Objects; Derive Computed Values Internally

When a component's data comes from a domain model, pass the model object as a single prop
rather than individual fields. This keeps the call site in sync with the model automatically.

Computed values (status, labels, flags derived from multiple fields) must NOT be props —
they belong inside the component as `$derived`.

```typescript
// Bad: individual fields + derived value as prop
interface Props {
  handle: string;
  validationCode: string;
  isValidated: boolean;
  status: string;  // derived — should not be a prop
}

// Good: model object as prop; status derived inside
interface Props {
  username: string;
  atCoderAccount: { handle: string; validationCode: string; isValidated: boolean };
}

let { username, atCoderAccount }: Props = $props();
const status = $derived(atCoderAccount.isValidated ? 'validated' : ...);
```

Call site passes the object directly from `$derived(data.atCoderAccount)`.

## Phase 7: 検証（低リスク）

- [x] 完了

```bash
pnpm check        # Svelte 型チェック → WARNINGS のみ（login/signup の AuthForm 型エラーはプリエグジスティング）
pnpm test:unit    # ユニットテスト → 2007 passed / 1 skipped ✅
pnpm lint         # linter → 警告1件（auth_forms.test.ts、プリエグジスティング）・エラー0 ✅
```

手動確認項目:

- `/users/edit` で AtCoder タブが表示・機能すること
- AtCoder ID 生成 → 認証 → リセット の一連フローが動作すること
- リセット後に入力欄が空になること（`editableHandle` の resync 確認）
- `?tab=atcoder` クエリパラメータで AtCoder タブが自動オープンすること
- 未ログイン・AtCoder 未認証ユーザが投票できないこと（vote_actions.ts の確認）

## 追加タスク: `+page.server.ts` ― 共通パターンの抽出（低リスク）

- [x] 完了（`parseUsernameAndAuthorize` として抽出済み）

4つのアクション（generate / validate / reset / delete）が以下の完全に同一のブロックを繰り返している:

```typescript
const formData = await request.formData();
const username = formData.get('username')?.toString();
if (!username) {
  return fail(BAD_REQUEST, { message: 'Username is required.' });
}
const authError = await requireSelf(locals, username);
if (authError) {
  return authError;
}
```

DRY 原則に基づき `parseUsernameAndAuthorize(request, locals)` として抽出した。戻り値は `ParseResult` 型（成功: `{ ok: true; formData; username }` / 失敗: `{ ok: false; error }`）。

## CodeRabbit Findings

`coderabbit review --plain` 実行済み（2026-03-29）。`potential_issue` 3件を以下に記録。`nitpick` / `refactor_suggestion` は PR CI に委ねる。

### potential_issue: `src/routes/problems/+page.server.ts` line 37 — **対応不要（false positive）**

> ユーザーデータのアクセス元が不整合。isAtCoderVerified は locals.user を参照しているが、他は session?.user を参照している。

`locals.user.is_validated` は `hooks.server.ts` で `user.atCoderAccount?.isValidated` から設定される。`session?.user` にはこのフィールドが存在しないため、`locals.user` 参照は正しい。不整合ではない。

### potential_issue: `src/routes/users/edit/+page.svelte` line 32–35

> message / message_type がフォームアクション後に更新されない
>
> let message = data.message は初期値のみキャプチャ。アクション後は form?.message を参照する必要がある。

### potential_issue: `docs/dev-notes/2026-03-26/pr-3316-review/review.md` line 196

> 誤字: updateValicationCode → updateValidationCode
