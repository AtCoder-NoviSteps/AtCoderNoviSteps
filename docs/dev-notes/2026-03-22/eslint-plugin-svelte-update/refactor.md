# eslint-plugin-svelte v3.10.1 → v3.16.0 アップデート: リファクタリングノート

## 設計決定事項

### `resolve()` の TypeScript 型エラーへの対応

**問題**: `resolve()` の呼び出しで `pnpm check` が "Expected 2 arguments, but got 1." を報告した。

**根本原因**: TypeScript の interface declaration merging の評価順序の問題。`ReturnType<AppTypes['RouteId']>` が評価される際、`@sveltejs/kit/types/index.d.ts` のデフォルト宣言（`RouteId(): string`）が、`non-ambient.d.ts` の具体的な宣言（`RouteId(): "/(auth)" | ...`）よりも後にマージされるため、`ReturnType<>` が `string` を返す。これにより `RouteParams<T>` が常に `Record<string, string>` となり、すべてのルートで 2 引数が必要とされる。

**対応**:

- **動的パラメータ付きルート**: `resolve(\`/workbooks/${slug}\`)`→`resolve('/workbooks/[slug]', { slug })` の形式に変換（型安全）
- **静的ルート・動的文字列**: `// @ts-expect-error svelte-check TS2554` コメントで抑制（実行時動作は正しい）

### `SvelteMap` の型パラメータ追加

`new SvelteMap()` → `new SvelteMap<TaskGrade, TaskResults>()` に変更し、`.get()` の戻り値型を明確化。`countTasks()` では `?.length ?? 0` を使用（防御的）、テンプレートの `taskResults=` は `{#if countTasks(taskGrade)}` で null チェック済みのため `!` を維持。

### `users/edit/+page.svelte` の Props 整理

`status?: string` プロップ（`svelte/valid-prop-names-in-kit-pages` 違反）と、それに依存するコード（`status` への代入処理、`no-global-assign` エラーの原因）を削除。コメントアウト済みの AtCoder 認証機能コードは意図的に未公開状態として保持しており、削除していない。近く機能を修正・拡張予定のため残課題とする（下記参照）。

### `@ts-expect-error` の使用方針

`@typescript-eslint/ban-ts-comment` ルールは `'ts-expect-error': 'allow-with-description'` で設定されているため、説明付きの `@ts-expect-error` は使用可能。`@ts-ignore` は使用不可。

## 明示的に却下した変更

| 変更案                             | 却下理由                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `resolve` を `resolveRoute` に変更 | SvelteKit 2.55.0 では `resolve` が正式 API、`resolveRoute` は deprecated |
| `base + '/path'` パターンの使用    | `svelte/no-navigation-without-resolve` ルールを満たさない可能性          |
| `resolve` のラッパー関数作成       | ESLint ルールがラッパー内の `resolve` 呼び出しを認識しない可能性         |
| `@ts-ignore` の使用                | ESLint 設定で禁止されている                                              |

## 残課題

**`users/edit/+page.svelte` — AtCoder 認証機能の再公開**

コメントアウト済みの AtCoder ID 認証・バリデーションフォームおよびインポートタブは、未公開（実装未完）のまま保持している。`status` プロップは `svelte/valid-prop-names-in-kit-pages` 制約のため削除済みのため、機能を再公開する際は Props 設計（`data` prop 経由への一本化など）も合わせて再検討すること。

## 各フェーズの学び

### Phase 1: SvelteMap 置き換え

- `$state(new SvelteMap())` → `new SvelteMap()`: SvelteMap 自体がリアクティブなため `$state` ラッパーは不要（`svelte/no-unnecessary-state-wrap`）
- 再代入を避け `.clear()` でリセット

### Phase 2: rel="external" 追加

- 外部リンクには `rel="noreferrer external"` を設定することで `svelte/no-navigation-without-resolve` を満たす

### Phase 3-4: resolve() 適用

- 動的パラメータ付きルート: `resolve('/route/[param]', { param: value })` — TypeScript 安全
- 静的ルート: `@ts-expect-error` で抑制（declaration merging の型推論問題）
- 動的文字列 URL: 同様に `@ts-expect-error` で抑制

### Phase 5: {#each} キー追加

- Svelte 5 の `{#each}` は全ブロックにキーが必要（`svelte/require-each-key`）
- ユニークなフィールド（ID、名前など）を優先、なければインデックス `(i)` を使用

### Phase 6: $derived リファクタリング

- `$state([]) + $effect(() => { var = expr; })` → `$derived(expr)` の変換
- Svelte 5 では `$derived(expr)` は `$derived(() => expr)` と等価（アロー関数なし）

### Phase 7: any 型の解消

- `metadata: any` → `metadata: ContestTableMetaData`（既存の型を探してから使用）

### Phase 8: valid-prop-names-in-kit-pages

- SvelteKit ページコンポーネントでは `data` と `form` のみが有効なプロップ名
- コメントアウト済みのコードが参照するプロップは、機能が未公開なだけで削除対象ではない。lint 違反の `status` プロップのみ削除し、コメントアウトされた機能コード自体は保持すること

## CodeRabbit Findings

### potential_issue（medium）以上

**src/features/workbooks/components/list/WorkbookAuthorActionsCell.svelte**

> resolve は $app/paths に存在しない可能性があります。SvelteKit の標準 API では resolveRoute が正しい関数名です。

→ **False positive**: `resolve` は SvelteKit 2.55.0 で追加された正式 API（`resolveRoute` は deprecated）。修正不要。

**src/lib/components/TagListForEdit.svelte**

> resolve は $app/paths に存在しない。resolveRoute を使用すべき。

→ **False positive**: 同上。CodeRabbit のトレーニングデータが古い。修正不要。

**src/features/workbooks/components/list/TitleTableBodyCell.svelte**

> $app/paths から resolve をエクスポートしていない可能性あり。また、resolve が route パラメータを第 2 引数として受け取らない可能性。

→ **False positive**: `resolve` は SvelteKit 2.55.0 の公式 API。`resolve('/route/[param]', { param })` は文書化された使用法。修正不要。

**src/lib/components/LabelWithTooltips.svelte** (Line 28-30)

> 配列インデックスをキーとして使用しないでください。重複する文字列がある場合、レンダリングの問題が発生する可能性があります。`${tooltipContent}-${i}` のような安定した一意のキーを生成することを推奨。

→ **有効な指摘**: `tooltipContents` の内容に重複がある場合は問題になりうる。ただし現状の用途（静的なツールチップ文字列）では `i` で十分。ユーザーが判断。

**src/lib/components/TaskGradeList.svelte** (Line 34)

> 非 null アサーション (`!`) のリスク。`?.length ?? 0` がより安全。

→ **修正済み**: `?.length ?? 0` に変更。

**src/lib/components/AuthForm.svelte**

> 型アサーション `as '/login'` が不正確。`alternativePageLink` は `/login` 以外の値も取りうる。

→ **有効な指摘**: `@ts-expect-error` がある場合、`as '/login'` キャストは不要で misleading。`resolve(alternativePageLink)` のみで十分。ただし機能的な差異はなし。ユーザーが判断。
