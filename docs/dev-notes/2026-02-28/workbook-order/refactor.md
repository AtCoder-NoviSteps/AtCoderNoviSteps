# リファクタリング

## 方針・指針

### フェーズ設計

- 変更リスクの低い順（局所的・最小リスク → 構造的・広範囲）にフェーズを並べる
- 各フェーズの依存関係を明示し、後続フェーズの前提条件を明確にする

### snippet vs コンポーネントの判断軸

snippet を第一選択とする条件:

1. 親の `$state` に直接アクセスが必要（コンポーネント化すると props が多数必要になる）
2. 独自の状態やライフサイクルを持たない純粋な表示ロジック
3. 同一ファイル内の限定的な DRY 化が目的（他ファイルからの再利用なし）

コンポーネントに昇格する条件:

- 独自の状態管理・ライフサイクルが必要になった場合
- 約30行を超えた場合（認知負荷の閾値）

### DB への CRUD は service 層に集約

- seed・ルートハンドラは service を呼ぶだけにする
- HTTP 層のエラー処理を service 層で引き取る際は `Response` / `json()` を持ち込まず、`{ error: string } | null` の純粋な値を返す設計にする

### やらないと決めた方針

- ページファイルが小さい（25行程度）場合は snippet 化しない
- seed は統合テスト相当のため単体テスト対象外
- DnD UI の Playwright テストは mouse + @dnd-kit が不安定なため除外
- 型制約で安全なハードコード定数の置換は優先度を下げる

---

## 技術的教訓

### TypeScript

- Prisma enum とアプリ enum は構造が同じでも TypeScript は別型として扱う。キャストが必要な箇所は残すこと
- `as never` の代替: `as unknown as Awaited<ReturnType<typeof prisma.xxx.findMany>>`
- 関数引数の `as never` は構造的部分型付けで除去できることが多い（余剰プロパティは変数経由なら許容）
- ユーティリティ関数の引数型は「実際に使うフィールドの最小型」に絞る → 呼び出し元のキャストが不要になる
- `Parameters<typeof fn>[0]` で型定義の二重管理を避ける

### Svelte 5

- `$state()` の初期化式で `$props()` の値を参照すると「This reference only captures the initial value」警告が出る。意図的な場合は `untrack(() => ...)` でラップする
- `{#snippet}` はコンポーネントタグの外（トップレベル）に定義する。タグ内に書くと named slot として解釈されて型エラーになる
- `{#each}` 内で同じ式を複数回参照する場合は `{@const}` で単一評価にまとめる
- コンポーネントが内部で `{#if}` を持つ場合、呼び出し元でのラッパーは不要

### 状態管理

- タブ系の状態は `Record<string, T>` に統合すると `if (activeTab === '...')` 分岐が消える
- タブごとに変わる「純粋な設定値（state でないもの）」は `TabConfig` に集約し、プロパティアクセスで分岐を排除する
- `onDragEnd` 等で影響範囲を手動管理する代わりに、ドラッグ開始時の snapshot と現在の Record を比較して変更箇所を検出する

### テスト

- テストデータには抽象的な値（`'t1'`, `'t2'`）より実際の fixture に存在する値を使う。仕様変更時に整合性チェックになる
- URL 同期は初回ロード時には発生しないため、URL パラメータより UI 状態（表示されるべき要素の存在）で検証する
- E2E でセッション Cookie が必要な fetch テストは、`beforeEach` でページを goto してセッションを確立してから発行する

### seed

- seed 固有の知識は service 層に持ち込まない
- service は汎用的な初期値で初期化し、seed 側でオーバーライドするパターンで関心の分離を保つ

### CSS / Tailwind

- 同じ CSS プロパティを複数クラスで指定すると競合警告が出る。置換後は VSCode の cssConflict 診断で即時確認する
- 競合するクラスは片方だけでなく両方を削除して、意図するクラスだけを残す

---

## TODO

- [ ] `docs/guides/architecture.md` に `_types/`, `_utils/` ディレクトリの規約を追記
- [ ] service 層以外での CRUD 直書きを禁止するルール（`.claude/rules/` など）を明記
- [ ] Claude Code の拡張ポイント（`.claude/rules/`, subagents, custom commands, skills）を調査し、このリファクタリングで特定された繰り返しパターンに対する rules/自動化を作成

---

## 出典

- [SvelteKit Form Actions](https://svelte.dev/docs/kit/form-actions) — フォームアクションの仕組み（fetch vs form action の判断根拠）
- [SvelteKit Routing - server](https://svelte.dev/docs/kit/routing#server) — `+server.ts` の仕様（JSON API エンドポイントの採用根拠）
- [Svelte 5 Snippets](https://svelte.dev/docs/svelte/snippet) — snippet の仕様（snippet vs コンポーネント判断）
- [Svelte 5 Component Basics](https://svelte.dev/docs/svelte/svelte-components) — コンポーネント分割の基準
- [@dnd-kit/helpers `move()`](https://github.com/clauderic/dnd-kit/tree/master/packages/helpers) — flat array vs Record の挙動の違い
- [dnd-kit-kanban 参照リポジトリ](https://github.com/KATO-Hiro/dnd-kit-kanban) — Record ベースのカンバン実装例
- [Playwright Locators](https://playwright.dev/docs/locators) — ロケータの優先順位（E2E テストの設計方針）
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) — テスト設計のベストプラクティス
- [Superforms Nested Data](https://superforms.rocks/concepts/nested-data) — `dataType: 'json'` の仕様（不採用の根拠）
