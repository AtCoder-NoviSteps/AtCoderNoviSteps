# ContestTableDisplayConfig に columnWrapThreshold を追加

## 概要

`getBodyRowClasses(totalColumns)` が列数 > 8 のときレイアウトを切り替えるマジックナンバー `8` をハードコードしている。AOJ ICPC Prelim は6列固定になるため、provider ごとに閾値を設定できるようにする。

## 設計方針

`ContestTableDisplayConfig` に `columnWrapThreshold?: number` を追加し、AOJ 系 provider のみ `6` を明示する。

`getBodyRowClasses` はコンポーネントから `_utils/` に切り出してテスト可能にする。デフォルト `8` の動作（`undefined` 渡し時を含む）はこのユーティリティのテストで保証する。

### 却下した代替案

- **`ContestTableMetaData` に置く**: 同型は「コンテストの同一性・見出し」の責務。レイアウト閾値は無関係。
- **変更 provider だけに定数を局所定義**: `ContestTableDisplayConfig` が既にレイアウト設定の責務を担うため、ここに集約するほうが一貫性がある。

---

## 変更ファイル

### Phase 1: 型定義

**`src/features/tasks/types/contest-table/contest_table_provider.ts`**

`ContestTableDisplayConfig` に追加:

```typescript
/**
 * @property {number} [columnWrapThreshold] - Column count above which rows always flex-wrap
 *   (xl:table-row is suppressed). Defaults to 8 at render when unset.
 */
columnWrapThreshold?: number;
```

### Phase 2: AOJ ICPC provider + テスト更新

**`src/features/tasks/utils/contest-table/aoj_icpc_providers.ts`**

`AojIcpcPrelimProvider.getDisplayConfig()` の返り値に追加:

```typescript
columnWrapThreshold: 6,
```

**`src/features/tasks/utils/contest-table/aoj_icpc_providers.test.ts`**

既存の `getDisplayConfig` describe ブロックにアサーションを追加:

```typescript
expect(provider2023.getDisplayConfig().columnWrapThreshold).toBe(6);
```

> `contest_table_provider.ts` は型定義のみ（ランタイム挙動なし）のためテスト不要。`pnpm check` が型検査を担う。

**`src/features/tasks/utils/contest-table/contest_table_provider_base.test.ts`**

基底クラスが `columnWrapThreshold` を持たない（`undefined`）ことを明示するテストを追加。コンポーネント側のデフォルト `8` と合わせて「デフォルト = 8」の契約を両端でテストする:

```typescript
test('columnWrapThreshold is undefined by default (component falls back to 8)', () => {
  const provider = new ABSProvider(ContestType.ABS);
  expect(provider.getDisplayConfig().columnWrapThreshold).toBeUndefined();
});
```

### Phase 3: ユーティリティ切り出し + テスト

**新規: `src/features/tasks/components/contest-table/_utils/contest_table_layout.ts`**

```typescript
export function getBodyRowClasses(totalColumns: number, wrapThreshold = 8): string {
  return totalColumns > wrapThreshold ? 'flex flex-wrap' : 'flex flex-wrap xl:table-row';
}
```

**新規: `src/features/tasks/components/contest-table/_utils/contest_table_layout.test.ts`**

テストケース:

- `wrapThreshold` 省略時（`undefined`）は `8` と同じ挙動になること
- `totalColumns <= wrapThreshold` → `'flex flex-wrap xl:table-row'`
- `totalColumns > wrapThreshold` → `'flex flex-wrap'`
- `wrapThreshold: 6` で境界値（6列・7列）が正しく分岐すること

### Phase 4: コンポーネント更新

**`src/features/tasks/components/contest-table/TaskTable.svelte`**

`getBodyRowClasses` をインポートに切り替え、インライン定義を削除:

```typescript
import { getBodyRowClasses } from './_utils/contest_table_layout';
```

呼び出し箇所を変更:

```svelte
<TableBodyRow class={getBodyRowClasses(totalColumns, contestTable.displayConfig.columnWrapThreshold)}>
```

### Phase 5: ドキュメント更新

**`docs/guides/how-to-add-contest-table-provider.md`** の4箇所を更新する:

| 箇所                                                   | 内容                                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| L99–103: スケルトン Provider 最小例                    | `getDisplayConfig()` の返り値に `columnWrapThreshold` をオプション欄として追記（デフォルト 8、AOJ は 6） |
| L361: 必須テスト項目（全 Provider 共通）               | ディスプレイ設定確認の説明に `columnWrapThreshold` を追記                                                |
| L395–399: Vitest テスト例                              | `columnWrapThreshold` のアサーション例を追加                                                             |
| L498–514: よくある間違い `getDisplayConfig()` 属性漏れ | コードブロックに `columnWrapThreshold?: number` をオプション例として追加（コメントでデフォルト値を明記） |

**`.claude/skills/add-contest-table-provider/instructions.md`**

Layer 4 Pattern 4（L107）に `titleStyle` と同形式で追記:

```
- [ ] If column wrap threshold differs from default (8): return `columnWrapThreshold: N`
  from `getDisplayConfig()`; include it in the `getDisplayConfig` assertion
```

`SKILL.md` 本体はエントリポイントのみのため更新不要。`rules/`・`AGENTS.md` は該当記述なし。

---

## 検証

```bash
pnpm test:unit aoj_icpc   # getDisplayConfig スナップショットがあれば columnWrapThreshold: 6 を追加
pnpm test:unit            # 全ユニットテスト通過
pnpm check                # 型エラーなし
```
