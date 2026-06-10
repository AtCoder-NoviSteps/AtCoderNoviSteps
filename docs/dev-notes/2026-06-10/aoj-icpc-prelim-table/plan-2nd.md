# aojIcpcPrelim テーブル UI 調整 + メタデータ階層整理

## Context（背景）

ICPC 国内予選テーブル（#3633, 年度ごとに 28 テーブル）の表示を微調整したい。具体的には:

1. **各年サブ見出し（例「ICPC 国内予選 2025」）とテーブルの隙間を狭めたい**（現状 `pb-3` ハードコード）。
2. **グループ先頭に1回だけメイン見出し「ICPC 国内予選」を h2 で入れたい**。他グループはメイン見出しを持たない（opt-in）。

これらを足すと、1文字違いで紛らわしい `ContestTableMetaData`（プロバイダ単位）/ `ContestTablesMetaData`（グループ単位）に optional フィールドが散らばり dirty になる。そこで **タイトル系スタイルを `titleStyle` オブジェクトに集約**し、メイン見出しはグループ単位メタデータに追加して階層を整理する。

`titleFontSize?` はこの未マージブランチで新規追加されたフィールドのため、後方互換を考えず `titleStyle` へ移行する（YAGNI）。

## 設計

### メタデータ型（`contest_table_provider.ts`）

```typescript
// タイトル表示スタイル（プロバイダ単位）
export type ContestTableTitleStyle = {
  fontSize?: string; // Tailwind, default 'text-2xl'
  bottomGap?: string; // Tailwind padding-bottom, default 'pb-3'
  headingTag?: 'h2' | 'h3'; // default 'h2'
};

// プロバイダ単位（titleFontSize? を titleStyle? に置換）
export type ContestTableMetaData = {
  title: string;
  abbreviationName: string;
  titleStyle?: ContestTableTitleStyle;
};

// グループ単位（mainTitle? を追加）
export type ContestTablesMetaData = {
  buttonLabel: string;
  ariaLabel: string;
  mainTitle?: string; // グループ先頭に1回だけ h2 で表示。未指定なら描画しない
};
```

TSDoc も `titleFontSize` 記述を `titleStyle` に更新。

### レンダリング（`TaskTable.svelte`）

1. ボタン群（L197-215）と provider ループ（L222-）の **間** にグループメイン見出しを1回描画:

```svelte
{@const groupMetadata = providerGroups?.getMetadata()}

{#if groupMetadata?.mainTitle}
  <Heading tag="h2" class="text-2xl pb-3 text-gray-900 dark:text-white">
    {groupMetadata.mainTitle}
  </Heading>
{/if}
```

2. provider ごとの見出し（L227-232）を `titleStyle` 参照に変更（フォールバックでデフォルト維持）:

```svelte
<Heading
  tag={metadata.titleStyle?.headingTag ?? 'h2'}
  class="{metadata.titleStyle?.fontSize ?? 'text-2xl'} {metadata.titleStyle?.bottomGap ??
    'pb-3'} text-gray-900 dark:text-white"
>
  {metadata.title}
</Heading>
```

→ ICPC は メイン h2「ICPC 国内予選」、各年 h3「YYYY」(text-md, pb-2)。他グループは従来どおり h2 / text-2xl / pb-3。

> **決定（user）**: メイン見出しと各年見出しで「ICPC 国内予選」が二重表示になるのを避けるため、各年見出しは年のみ（例「2025」）に短縮する。`getMetadata().title` を `String(year)` へ変更。`getContestRoundLabel` は `isShownRoundLabel: false` のため非表示で、変更不要。

### プロバイダ（`aoj_icpc_providers.ts`）

`getMetadata()` を変更:

```typescript
title: `${this.year}`, // 年のみ（メイン見出しとの二重表示を回避）
titleStyle: { fontSize: 'text-md', bottomGap: 'pb-2', headingTag: 'h3' },
```

### グループ登録（`contest_table_provider_groups.ts`）

`AojIcpcPrelim` グループの metadata に `mainTitle: 'ICPC 国内予選'` を追加。

## 変更ファイル

| ファイル                                                                  | 変更                                                                                                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/tasks/types/contest-table/contest_table_provider.ts`        | `ContestTableTitleStyle` 追加 / `ContestTableMetaData.titleFontSize` → `titleStyle` / `ContestTablesMetaData.mainTitle?` 追加 / TSDoc |
| `src/features/tasks/utils/contest-table/aoj_icpc_providers.ts`            | `getMetadata()` を `titleStyle` に移行                                                                                                |
| `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts` | `AojIcpcPrelim` に `mainTitle` 追加                                                                                                   |
| `src/features/tasks/components/contest-table/TaskTable.svelte`            | グループメイン見出し描画 + provider 見出しを `titleStyle` 参照に                                                                      |

## テスト（TDD: 先にテスト更新 → red → 実装 → green）

- **`aoj_icpc_providers.test.ts`**:
  - `title` を assert している箇所（L230-232）を年のみ（`'2023'`）に更新。
  - `titleFontSize` を assert している箇所（L238-240）を `titleStyle` に更新:
    - `getMetadata().titleStyle.fontSize === 'text-md'`
    - `getMetadata().titleStyle.bottomGap === 'pb-2'`
    - `getMetadata().titleStyle.headingTag === 'h3'`
- **`contest_table_provider_groups.test.ts`**: `AojIcpcPrelim` の `getMetadata()` toEqual に `mainTitle: 'ICPC 国内予選'` を追加（L294-297）。
- 型変更はテストファースト対象外（testing.md の TDD 例外）。
- `TaskTable.svelte` の変更はテンプレート表示のみ（`??` フォールバック）。Vitest は省略し E2E / 手動で確認（svelte-components.md / testing.md のコンポーネント方針に準拠）。

## 検証

1. `pnpm test:unit src/features/tasks/utils/contest-table/aoj_icpc_providers.test.ts src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts` → green
2. `pnpm check`（型整合）/ `pnpm lint`
3. `pnpm dev` で目視:
   - ICPC 国内予選ボタン押下 → 先頭に h2「ICPC 国内予選」が1回表示
   - 各年見出しが h3 / text-md / 隙間 pb-2（やや狭い）
   - 他グループ（ABC, EDPC 等）はメイン見出しなし・従来の h2/text-2xl/pb-3 のまま（リグレッションなし）
