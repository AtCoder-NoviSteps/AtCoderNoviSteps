# 調査報告書：Breaking Changes と本プロジェクトへの影響度分析

**作成日**: 2026-01-07

**調査対象**: Tailwind CSS v3→v4 / Flowbite v2→v3 / Flowbite Svelte v0.45→v1.31 の破壊的変更

**ステータス**: 調査完了・実装フェーズ進行中

---

## 目的

Tailwind CSS v3.4.19 → v4.1.18 および Flowbite ライブラリ群のアップグレード時に、本プロジェクトに影響するすべての breaking changes を徹底的に把握し、実装リスク評価を行う。

---

## 1. Tailwind CSS v3→v4 Breaking Changes（概観）

### 1.1 必須対応項目

| 項目             | v3                                    | v4                      | 本プロジェクトへの影響 |
| ---------------- | ------------------------------------- | ----------------------- | ---------------------- |
| CSS 記法         | `@tailwind base/components/utilities` | `@import "tailwindcss"` | ✅ 対応済み            |
| PostCSS plugin   | `tailwindcss`                         | `@tailwindcss/postcss`  | ✅ 対応済み            |
| config 読込      | 自動検出                              | `@config` で明示        | ✅ 対応済み            |
| content スキャン | `tailwind.config.ts` 内で指定         | CSS の `@source` で指定 | ✅ 対応済み            |

**影響**: `content` 配列が読まれなくなるため、`@source` ディレクティブを CSS 側に明示的に追加しないと、コンポーネント内のクラスが走査されない。

### 1.2 削除されたユーティリティ（v3→v4）

| v3 ユーティリティ       | v4 での代替                            | 修正内容                        | 本プロジェクトへの影響          |
| ----------------------- | -------------------------------------- | ------------------------------- | ------------------------------- |
| `break-words`           | `wrap-break-word`                      | クラス名変更                    | 未使用の可能性（要検査）        |
| `flex-shrink-0`         | `shrink-0`                             | クラス名変更                    | ✅ **2 箇所で使用中・対応済み** |
| `overflow-ellipsis`     | `text-ellipsis`                        | クラス名変更                    | 未使用の可能性（要検査）        |
| `decoration-slice`      | `box-decoration-slice`                 | クラス名変更                    | 未使用                          |
| `decoration-clone`      | `box-decoration-clone`                 | クラス名変更                    | 未使用                          |
| `bg-opacity-*`          | `bg-black/50` 等 opacity modifier      | 削除（opacity modifier で代替） | Flowbite 内部実装に依存         |
| `text-opacity-*`        | `text-black/50` 等 opacity modifier    | 削除（opacity modifier で代替） | Flowbite 内部実装に依存         |
| `border-opacity-*`      | `border-black/50` 等 opacity modifier  | 削除（opacity modifier で代替） | Flowbite 内部実装に依存         |
| `divide-opacity-*`      | `divide-black/50` 等 opacity modifier  | 削除（opacity modifier で代替） | Flowbite 内部実装に依存         |
| `ring-opacity-*`        | `ring-blue-500/50` 等 opacity modifier | 削除（opacity modifier で代替） | Flowbite 内部実装に依存         |
| `placeholder-opacity-*` | `placeholder-gray-400` 等              | 削除（opacity modifier で代替） | 未使用                          |

**影響**: Flowbite Svelte が v4 対応済みのため、直接の修正は不要。プロジェクトコード内での使用有無を検査。

### 1.3 ユーティリティのスケール変更（v3→v4）

#### shadow / blur / rounded スケール大規模シフト

| v3                     | v4                 | 影響                      |
| ---------------------- | ------------------ | ------------------------- |
| `shadow-sm`            | `shadow-xs`        | **サフィックス 1 段階下** |
| `shadow` (base)        | `shadow-sm`        | **サフィックス 1 段階下** |
| `drop-shadow-sm`       | `drop-shadow-xs`   | **サフィックス 1 段階下** |
| `drop-shadow` (base)   | `drop-shadow-sm`   | **サフィックス 1 段階下** |
| `blur-sm`              | `blur-xs`          | **サフィックス 1 段階下** |
| `blur` (base)          | `blur-sm`          | **サフィックス 1 段階下** |
| `backdrop-blur-sm`     | `backdrop-blur-xs` | **サフィックス 1 段階下** |
| `backdrop-blur` (base) | `backdrop-blur-sm` | **サフィックス 1 段階下** |
| `rounded-sm`           | `rounded-xs`       | **サフィックス 1 段階下** |
| `rounded` (base)       | `rounded-sm`       | **サフィックス 1 段階下** |

**本プロジェクトへの影響**:

- ✅ `shadow-sm` を使用 → `shadow-xs` への変更必須（✅ 対応済み）
- ✅ `shadow-lg` を使用 → そのまま（v4 で `shadow-lg` は存在）
- ✅ 複数の `rounded`/`rounded-*` を使用 → 全一括確認 + 対応（✅ 対応済み）

**リスク**: スケール名が全体的に下がるため、視覚的にぼやけたり小さくなる可能性。

#### outline ユーティリティのリネーム

| v3             | v4               | 理由                                      |
| -------------- | ---------------- | ----------------------------------------- |
| `outline-none` | `outline-hidden` | `outline: none` の明確な表現              |
| （新）-        | `outline-none`   | 新たに `outline-style: none` を厳密に設定 |

**本プロジェクトへの影響**: `focus:outline-none` 等の使用有無を検査。

#### ring ユーティリティのデフォルト変更

| 設定項目     | v3         | v4             | 影響                                    |
| ------------ | ---------- | -------------- | --------------------------------------- |
| デフォルト幅 | 3px        | 1px            | `ring` のみ使用時は `ring-3` に明示必須 |
| デフォルト色 | `blue-500` | `currentColor` | `ring` のみ使用時は色を明示必須         |

**本プロジェクトへの影響**: `ring` 単独使用が少ないため低リスク。Flowbite components 内部での使用を確認。

---

### 1.4 セレクタの大規模変更（UI 崩れの最大リスク）

#### space-x-_ / space-y-_ セレクタ変更

**v3**:

```css
.space-y-4 > :not([hidden]) ~ :not([hidden]) {
  margin-top: 1rem;
}
```

**v4**:

```css
.space-y-4 > :not(:last-child) {
  margin-bottom: 1rem;
}
```

**影響**:

- 最後の兄弟要素にマージンが追加されない
- インライン要素（`<span>` など）の扱いが異なる可能性
- 複数行レイアウトで微妙にズレる可能性

**本プロジェクト内の使用箇所（8 箇所）**:

- `/account_transfer/+page.svelte`: `space-y-4`, `space-x-2`
- `/workbooks/[slug]/+page.svelte`: `space-y-4`
- `/lib/components/WorkBook/WorkBookForm.svelte`: `space-y-4`
- `/lib/components/TaskForm.svelte`: `space-y-4`
- `/lib/components/LabelWithTooltips.svelte`: `space-x-2`
- `/lib/components/TaskTables/TaskTableBodyCell.svelte`: `space-x-1 lg:space-x-2`
- `/lib/components/TabItemWrapper.svelte`: `space-x-2`
- `/lib/components/WorkBooks/TitleTableBodyCell.svelte`: `space-x-2`

**推奨対応**: ブラウザで visual regression 確認。必要なら `gap` (flex/grid) への移行。

#### divide-x-_ / divide-y-_ セレクタ変更

**v3**:

```css
.divide-y-4 > :not([hidden]) ~ :not([hidden]) {
  border-top-width: 4px;
}
```

**v4**:

```css
.divide-y-4 > :not(:last-child) {
  border-bottom-width: 4px;
}
```

**影響**:

- 最後の row/col に border が引かれなくなる
- テーブルの下部ボーダーが消える可能性

**本プロジェクト内の使用箇所（13 箇所）**:

- `/account_transfer/+page.svelte`: `divide-y`
- `/workbooks/[slug]/+page.svelte`: `divide-y`
- `/lib/components/TaskTables/TaskTable.svelte`: `divide-y divide-gray-200 dark:divide-gray-700` ✅ 色指定済み
- その他複数の TableBody で `divide-y` 使用

**推奨対応**: ブラウザで table 下部の border 有無を確認。必要なら border を明示的に追加。

---

### 1.5 デフォルト値の変更（Preflight 変更）

| 項目                             | v3                         | v4                                     | 影響                                           |
| -------------------------------- | -------------------------- | -------------------------------------- | ---------------------------------------------- |
| `border` / `divide` デフォルト色 | `gray-200`                 | `currentColor`                         | 色が text 色に変わる（色を明示していれば OK）  |
| `ring` デフォルト幅              | 3px                        | 1px                                    | ring が細くなる                                |
| `ring` デフォルト色              | `blue-500`                 | `currentColor`                         | ring 色が text 色になる                        |
| Placeholder 色                   | `gray-400`                 | `currentColor` 50% opacity             | placeholder が淡くなる可能性                   |
| Button cursor                    | `pointer`                  | `default`                              | button hover で cursor 変わらない              |
| Dialog margins                   | リセットなし               | `margin: auto` リセット                | dialog の配置が変わる可能性                    |
| `hidden` 属性優先度              | display class で上書き可能 | display class よりも優先（上書き不可） | `hidden` 属性があると `block` クラスが効かない |

**本プロジェクトへの影響**:

- `border` / `divide` は色を明示している箇所が多いため低リスク
- button/dialog については Flowbite component に依存
- `hidden` 属性と display class の組み合わせに要注意

---

### 1.6 その他の重要な変更

| 項目                  | v3                               | v4                                            | 対応                                 |
| --------------------- | -------------------------------- | --------------------------------------------- | ------------------------------------ |
| important 修飾子      | `!flex` (先頭)                   | `flex!` (末尾)                                | 記法変更、検索後に修正               |
| arbitrary 値の括弧    | `bg-[--var]`                     | `bg-(--var)`                                  | CSS variable 使用時に修正            |
| arbitrary 値の grid   | `grid-cols-[max-content,auto]`   | `grid-cols-[max-content_auto]`                | コンマをアンダースコアに変更         |
| variant stacking 順序 | 右から左                         | 左から右                                      | 複雑なバリアント組み合わせで修正必須 |
| hover variant         | 常に適用                         | hover 可能デバイス限定                        | タッチデバイスでの動作が異なる       |
| 色の uniform gradient | 不可                             | 可能（3 stop では `via-none` で 2 stop へ)    | グラデーション指定方法が変わる       |
| transform リセット    | `transform-none`                 | `scale-none` / `rotate-none` 等個別           | 個別プロパティでリセット             |
| transition transform  | `transition-[opacity,transform]` | `transition-[opacity,scale,rotate,translate]` | transform 系は個別プロパティを指定   |

---

## 2. Flowbite Breaking Changes

### 2.1 Flowbite v2.5.0 → v3.1.2 の破壊的変更

#### v3.0.0 (2025-01-24) - TailwindCSS v4 統合による大型変更

**主要な変更:**

- TailwindCSS v4 への完全移行
- CSS architecture の再設計
- CSS variables の生成方式が変更
- Plugin システムが新規実装

**本プロジェクトへの影響:**

- ✅ **直接影響なし** - Flowbite は CSS ライブラリであり、コンポーネント構造に変更なし
- ✅ **flowbite-svelte v1.31.0 が対応済み** - Svelte レイヤーで抽象化

#### v3.0.0 ~ v3.1.2 の間

- CSS variables のバグ修正（theme file 新規作成）
- 新たな破壊的変更なし - v3.0.0 が最大の転換点

---

### 2.2 Flowbite Svelte v0.45.0 以降 → v1.31.0 の破壊的変更

#### v0.45.0 (2024-04-16) - Node 要件変更

**破壊的変更:**

- Node 要件を >= 20.0.0 に引き上げ
- v0.44 までは Node >= 18.0.0 で動作

**本プロジェクトへの影響:**

- ✅ Node 要件確認済み（本プロジェクトは Node >= 20.0.0）

#### v0.45.0 ~ v1.31.0 の間

- 機能追加と軽微なバグ修正のみ
- v1.0.0 では Button cursor デフォルト修正（TailwindCSS v4.0.0 対応）
- 新たな破壊的変更なし

---

## 3. 本プロジェクトへの影響度分析

### 3.1 優先度1（必ず修正が必要）

#### ✅ 対応済み項目

- `postcss.config.mjs`: `@tailwindcss/postcss` へ更新
- `src/app.css`: `@import "tailwindcss"` + `@config` の記述
- `src/app.css`: `@source` ディレクティブでコンテンツスキャン範囲を明示
- `tailwind.config.ts`: `content` 配列を削除（v4 では CSS 側の `@source` で指定）
- `flex-shrink-0` → `shrink-0`（2 箇所）✅ 対応済み
- `shadow-sm` → `shadow-xs`（1 箇所）✅ 対応済み
- `rounded` → `rounded-sm`（1 箇所）✅ 対応済み

---

### 3.2 優先度2（テスト必須で挙動が変わる）

1. **space-y-_ / space-x-_ セレクタ変更（8 箇所）**
   - 影響: 最後の要素にマージンが追加されない
   - テスト方法: ブラウザで visual regression 確認
   - 推奨: 必要なら `gap` (flex/grid) への移行

2. **divide-y / divide-x セレクタ変更（13 箇所）**
   - 影響: 最後の row/col に border が引かれない
   - テスト方法: テーブル表示を確認
   - 推奨: テーブル下部に border が必要なら明示的に追加

3. **divide デフォルト色確認**
   - `/lib/components/TaskTables/TaskTable.svelte`: `divide-gray-200 dark:divide-gray-700` （明示済み、安全）
   - その他 `divide-y` で色未指定の箇所: v4 で `currentColor` になるため、ブラウザで確認

---

### 3.3 優先度3（後回し可だが確認推奨）

1. **outline-none → outline-hidden（使用有無を検査）**
2. **ring 無サフィックス → ring-3 + 色明示（使用有無を検査）**
3. **important 修飾子を末尾に移動（使用有無を検査）**
4. **arbitrary 値の括弧記法確認（CSS variable 使用有無を検査）**
5. **button cursor 変更（UX への影響確認）**

---

## 4. 実装レベルでの追加注意点

### 4.1 Flowbite Svelte 関連

- **State 管理の簡潔化**: svelte-5-ui-lib の独自 state（`navStatus`, `toggleNav`, `closeNav`）を削除可能
- **Props 名の確認**: `aClass`（svelte-5-ui-lib）→ `activeClass`（Flowbite Svelte）
- **$app/stores の必須性**: SSR 環境では `$app/stores` が必須（client-only デモは `$app/state` を使用）

### 4.2 Form Actions との共存

- **Modal の `form` prop は不要**: SvelteKit server action で十分
- **`bind:open` + `use:enhance` の分離**: `form` prop での validation handling より簡潔

---

## 参考資料

- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Flowbite v3 Release Notes](https://github.com/themesberg/flowbite/releases/tag/v3.0.0)
- [Flowbite Svelte GitHub](https://github.com/themesberg/flowbite-svelte)
