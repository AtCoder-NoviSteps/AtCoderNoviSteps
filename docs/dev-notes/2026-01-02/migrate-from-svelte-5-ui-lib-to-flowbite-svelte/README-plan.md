# UIライブラリ移行：svelte-5-ui-lib → Flowbite Svelte

**作成日**: 2026-01-02 | **最終更新**: 2026-04-04 | **ステータス**: 移行完了（フォローアップタスクあり）

svelte-5-ui-lib から Flowbite Svelte v1.33.0 への移行と、TailwindCSS v3→v4 移行を完了。
フェーズ-1〜3（テスト環境構築、Tailwind v4 移行、コンポーネント置換、旧ライブラリ削除）はすべて完了済み。

---

## フォローアップタスク

### Visual regression テスト（手動確認）

- [ ] `space-y-*` / `space-x-*` セレクタ変更による layout shift 確認（8箇所）
- [ ] `divide-y` / `divide-x` による table border 変更確認（13箇所）
- [ ] デフォルト値変更（border color → `currentColor`、ring size 1px）の visual 確認

### Flowbite-Svelte v2.0 アップグレード検討

- [ ] v2.0 リリース後に検討（[GitHub Issues #1614](https://github.com/themesberg/flowbite-svelte/issues/1614)）

### FormWrapper refactor

- [ ] FormWrapper の purpose（外側のスタイリング用 or 内側のフォーム処理用）を明確化
- [ ] nested form 設計をドキュメント化

---

## 教訓

### 1. Tailwind v4 + Flowbite Svelte の `@source` 設定

Flowbite Svelte コンポーネントのクラスを Tailwind v4 に認識させるには `@source` が**必須**。設定漏れで「色が出ない」問題が発生する。

```css
@source "../node_modules/flowbite-svelte/dist/**/*.{html,js,svelte,ts}";
```

### 2. SvelteKit Form Actions と Flowbite Modal の共存

Flowbite Modal の `form` prop は client-side validation UI に特化しており、SvelteKit server action には不適。正しいパターンは `bind:open`（UI state）+ `use:enhance`（server action）の分離。

### 3. 動的カラーの CSS 変数パターン

Tailwind v4 では動的クラス名（`"bg-" + variable`）が生成されない。インラインスタイル + CSS 変数で解決する:

```typescript
// getTaskGradeColor() returns "var(--color-atcoder-Q4)" etc.
style={`background-color: ${getTaskGradeColor(grade)};`}
```

### 4. テストセレクタはライブラリソースを追って検証する

テストが通らない原因が「ライブラリのバグ」だけでなく「セレクタミス」の可能性を常に考慮。ToolbarButton.svelte → NavHamburger.svelte のコードを追跡し、`name = "Open main menu"` が `aria-label` に変換されることを確認した例。

---

## 参考資料

- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Flowbite Svelte GitHub](https://github.com/themesberg/flowbite-svelte)
- [flowbite-svelte breakpoint fix PR #1928](https://github.com/themesberg/flowbite-svelte/pull/1928)
