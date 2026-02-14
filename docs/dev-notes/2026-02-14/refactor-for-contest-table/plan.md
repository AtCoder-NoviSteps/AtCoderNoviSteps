# 計画: src/features/tasks/contest-table への再構成 (第一段階)

## Context

参照ガイド: [`docs/guides/architecture.md`](../../../guides/architecture.md)

---

## 移動しないファイル

以下は `contest.test.ts` からも参照されるため `src/test/lib` に残す:

- `src/test/lib/utils/test_cases/contest_name_and_task_index.ts`
- `src/test/lib/utils/test_cases/contest_name_labels.ts`
- `src/test/lib/utils/test_cases/contest_type.ts`

---

## 今後の候補ファイル (今回対象外)

- `src/lib/utils/contest_task_pair.ts` / `src/test/lib/utils/contest_task_pair.test.ts`
  → tasks ドメインへの移行候補（第二段階以降で検討）
- `src/lib/stores/active_problem_list_tab.svelte.ts`
  → architecture.md で tasks 抽出候補に記載あり

---

# ファイル分割リファクタリング (第二段階)

## Context

第一段階で `src/features/tasks/` 配下へ移動した `contest_table_provider.ts` (1,374行) と
`contest_table_provider.test.ts` (3,147行) が肥大化しており、
コンテスト種別ごとに適切な粒度のファイルへ分割して可読性・保守性を向上させる。

## 批判的レビュー

### 概ね妥当な点

| 分割案                                                                | 評価                                                    |
| --------------------------------------------------------------------- | ------------------------------------------------------- |
| ABC 5プロバイダーをまとめる                                           | ✅ 同一コンテスト種別の範囲バリアント群、自然なまとまり |
| ARC 3プロバイダーをまとめる                                           | ✅ 同上                                                 |
| TessokuBook (base + 3 section) をまとめる                             | ✅ 親子継承関係があり、同一ファイルが適切               |
| ACL 3プロバイダーをまとめる                                           | ✅ ACLシリーズの派生型群                                |
| JOI 4プロバイダーをまとめる                                           | ✅ 同一コンテスト主催の派生型群                         |
| EDPC + TDPC をまとめる                                                | ✅ どちらも DP 教育コンテストで概念的に近い             |
| ContestTableProviderGroup を独立させる                                | ✅ 責務が明確に異なる                                   |
| prepareContestProviderPresets + contestTableProviderGroups をまとめる | ✅ ファクトリと登録簿は同一責務                         |

### 要検討・批判的指摘

1. **単一クラスファイルが7個**

   `abs_provider.ts`, `agc_provider.ts`, `abc_like_provider.ts`, `awc_provider.ts`,
   `typical90_provider.ts`, `math_and_algorithm_provider.ts`, `fps24_provider.ts` が
   各1クラスのみを含むファイルになる。
   → ディレクトリが16ファイル以上になるが、「コンテスト種別 = ファイル」の対応が
   明確になるため1クラスでも独立ファイルにする方針は許容できる。

2. **FPS24Provider の位置づけ**

   教育・固定問題セット系という点で EDPC/TDPC と近いが、contest ID が異なるため
   `dp_providers.ts` への統合は意味的に不自然。単独ファイル (`fps24_provider.ts`) が妥当。

3. **`parseContestRound` の配置（未言及）**

   現在 private な内部ユーティリティ関数で、ABC/ARC/AGC/AWC の複数プロバイダーが使用する。
   ファイル分割後も複数ファイルから参照が必要になるため、
   **`contest_table_provider_base.ts` から named export する**のが最もシンプル。

## 推奨ファイル構成

### ソースファイル (16ファイル + barrel)

```text
src/features/tasks/utils/contest-table/
├── contest_table_provider_base.ts      # ContestTableProviderBase + parseContestRound (export)
├── contest_table_provider_group.ts     # ContestTableProviderGroup
├── contest_table_provider_groups.ts    # prepareContestProviderPresets + contestTableProviderGroups
├── abs_provider.ts                     # ABSProvider
├── abc_providers.ts                    # ABC001ToABC041 ~ ABC319Onwards (5クラス)
├── arc_providers.ts                    # ARC001ToARC057 ~ ARC104Onwards (3クラス)
├── agc_provider.ts                     # AGC001OnwardsProvider
├── axc_like_provider.ts                # ABCLikeProvider
├── awc_provider.ts                     # AWC0001OnwardsProvider
├── typical90_provider.ts               # Typical90Provider
├── tessoku_book_providers.ts           # TessokuBookProvider + For{Examples,Practicals,Challenges}Provider
├── math_and_algorithm_provider.ts      # MathAndAlgorithmProvider
├── dp_providers.ts                     # EDPCProvider, TDPCProvider
├── fps24_provider.ts                   # FPS24Provider
├── acl_providers.ts                    # ACLPracticeProvider, ACLBeginnerProvider, ACLProvider
├── joi_providers.ts                    # JOI 4プロバイダー
└── contest_table_provider.ts           # barrel re-export（外部 import 維持用）
```

### テストファイル (16ファイル, 同粒度)

```
src/features/tasks/utils/contest-table/
├── contest_table_provider_base.test.ts
├── contest_table_provider_group.test.ts
├── contest_table_provider_groups.test.ts
├── abs_provider.test.ts
├── abc_providers.test.ts               # describe.each (ABC319Onwards, ABC212ToABC318, ABC126ToABC211) 含む
├── arc_providers.test.ts
├── agc_provider.test.ts
├── axc_like_provider.test.ts
├── awc_provider.test.ts
├── typical90_provider.test.ts
├── tessoku_book_providers.test.ts
├── math_and_algorithm_provider.test.ts
├── dp_providers.test.ts                # describe.each (EDPC, TDPC) 含む
├── fps24_provider.test.ts
├── acl_providers.test.ts
└── joi_providers.test.ts

元の contest_table_provider.test.ts は全テスト移動後に削除。
```

### Import 構造

**`contest_table_provider_base.ts` → 各 provider ファイル**

```typescript
// arc_providers.ts 等
import { ContestTableProviderBase, parseContestRound } from './contest_table_provider_base';
```

**`contest_table_presets.ts` → 全ての provider + group**

```typescript
import { ContestTableProviderGroup } from './contest_table_provider_group';
import { ABSProvider } from './abs_provider';
import { ABC001ToABC041Provider, ... } from './abc_providers';
// ... 各 provider をインポート
```

**`contest_table_provider.ts` (barrel)**

```typescript
export * from './contest_table_provider_base';
export * from './contest_table_provider_group';
export * from './abs_provider';
// ... 全ての provider
export * from './contest_table_presets';
```

外部ファイル (`active_contest_type.svelte.ts`, `TaskTable.svelte` 等) の import は変更不要。

## vi.mock の取り扱いについて（批判的レビュー追加）

### 問題1: `vi.mock` ブロックの複製は保守性の悪化を招く

**現状**: 135行以上の `vi.mock` ブロック (lines 52-194) が各テストファイルに複製される

- `classifyContest` のモック定義: 54行
- `getContestNameLabel` のモック定義: 77行
- `getTaskTableHeaderName` のモック定義: 4行

**懸念**:

- 複製されたコードは保守負荷が増加（変更時にN箇所修正が必要）
- 定義のズレが発生する可能性

**改善案 (Option A)**: mock データを共有ファイルに抽出

```typescript
// src/features/tasks/utils/contest-table/test-helpers/contest-mocks.ts
export const createClassifyContestMock = () =>
  vi.fn((contestId: string) => {
    if (contestId === 'abs') return ContestType.ABS;
    // ... 共通ロジック
  });
```

各テストファイルから参照。ただし Vitest の `vi.mock()` は module-load time に実行が必要なため、
setup ファイルまたは各テストファイルで呼び出す必要がある。

### 問題2: **`classifyContest` と `getContestNameLabel` をそもそもモックすべきか？**

#### 実装を確認した結果

**`classifyContest(contestId)` (src/lib/utils/contest.ts)**

```typescript
export const classifyContest = (contest_id: string) => {
  if (/^abc\d{3}$/.exec(contest_id)) return ContestType.ABC;
  if (/^arc\d{3}$/.exec(contest_id)) return ContestType.ARC;
  // ... 単純な正規表現と文字列比較のみ
  return null;
};
```

**`getContestNameLabel(contestId)` (src/lib/utils/contest.ts)**

```typescript
export const getContestNameLabel = (contestId: string) => {
  if (regexForAxc.exec(contestId)) {
    return contestId.replace(regexForAxc /* ... */);
  }
  // ... 正規表現ベースの文字列操作のみ
};
```

#### 批判的評価

| 側面               | 評価        | 理由                                                                       |
| ------------------ | ----------- | -------------------------------------------------------------------------- |
| **外部依存**       | ✅ なし     | 両関数とも純粋関数。外部 API 呼び出し・ファイルアクセスなし                |
| **複雑性**         | ✅ 低い     | 正規表現と条件分岐のみ。単純で高速                                         |
| **テストの現実性** | ⚠️ **低下** | モックは実装と異なる可能性がある。実装変更に気づかない                     |
| **保守性**         | ❌ **悪化** | 135行のモック定義を管理する必要。実装との同期を保つ負荷                    |
| **テスト孤立性**   | ❌ **過度** | ContestTableProvider が `classifyContest` を正しく使えるかをテストできない |

#### 結論

**モックを削除し、実装を直接使用すべき。**

**理由**:

1. 純粋関数なので副作用がない
2. 実装の変更に自動追従（テスト更新不要）
3. 統合テストとしての価値が高い（`classifyContest` のバグをキャッチできる）
4. モック保守の負担がゼロになる

**代替案**: もし何らかの理由で隔離が必要な場合は、実装を import して使う方が安全:

```typescript
// 現在のモック（不正確な可能性）
vi.mock('$lib/utils/contest', () => ({
  classifyContest: vi.fn((contestId) => /* 手動定義 */)
}));

// 推奨: 実装を使う
import { classifyContest } from '$lib/utils/contest'; // no mock needed
```

---

## 実装手順

### vi.mock の推奨処理

**推奨判断: モックを廃止し、実装を直接 import**

1. 各テストファイルから `vi.mock('$lib/utils/contest')` と `vi.mock('$lib/utils/task')` を削除
2. 代わりに実装から直接 import:
   ```typescript
   import { classifyContest, getContestNameLabel } from '$lib/utils/contest';
   import { getTaskTableHeaderName } from '$lib/utils/task';
   ```
3. テストコードは変わらず（関数の呼び出し方は同じ）

**副次的利点**:

- テストファイルが大幅に短くなる（135行削減）
- セットアップの複雑さが減少
- 新しいテストファイル作成時の負担が軽い

---

### ファイル分割の実装手順

1. `contest_table_provider_base.ts` 作成 (`parseContestRound` を export)
2. `contest_table_provider_group.ts` 作成
3. 各 provider ファイルを作成 (abs, abc, arc, agc, axc_like, awc, typical90, tessoku_book, math_and_algorithm, dp, fps24, acl, joi)
4. `contest_table_presets.ts` 作成
5. `contest_table_provider.ts` を barrel re-export に変換
6. テストファイルを同粒度で作成（**vi.mock 廃止、実装を直接 import**）
7. `contest_table_provider.test.ts` 削除
8. docs/guides/how-to-add-contest-table-provider.md のパスを参照を更新

## 検証

- `pnpm test:unit` — 全ユニットテストがパス
- `pnpm check` — 型エラーなし
- `pnpm lint` — ESLint エラーなし
- `pnpm build` — ビルド成功
- ブラウザで `/problems` ページの表示確認

## 実装から得た教訓

1. **`git mv` でファイルを移動する**: `cp` + `rm` より git 履歴が追跡しやすい。`Write` ツールで新規作成しない。

2. **`$features` エイリアスを先に設定してからインポートを書く**: エイリアス未設定のまま移動ファイルを参照すると型チェックが壊れる。設定ファイル変更 → ファイル移動 → import 修正の順が安全。

3. **共有 test_cases は使用元を grep で確認してから移動判断する**: `contest_name_and_task_index.ts` 等は `contest.test.ts` からも参照されており、フィクスチャに移動すると `src/test/lib` 残存テストが壊れる。

4. **同一ディレクトリ内の相対 import は `./` を使う**: `TaskTable.svelte` → `TaskTableBodyCell.svelte` のように同じディレクトリに移動したコンポーネントは `$features/...` より `./` の方が明確。

5. **`pnpm check` の既存エラーは事前に把握しておく**: リファクタ起因か既存問題かを切り分けるために、作業前の状態を確認しておくとよい。

6. vi.mock 廃止で発見されたバグ

旧テストでは `classifyContest` や `getContestNameLabel` を mock していたため、実装との乖離が隠れていた。mock を外して直接 import に切り替えたことで以下が発覚：

- **Tessoku sub-provider のメタデータ不一致**: テストでは `"力試し問題"` 等を期待していたが、実装は `"C. 力試し問題"` のように接頭辞付き。`abbreviationName` も `tessoku-book-examples` ではなく `tessoku-book-for-examples`（`for-` 接頭辞）が正しかった。
- **JOI の無効 ID ラベル**: mock では小文字パススルーを期待、実装は `toUpperCase()` で `'INVALID-ID'` を返す。部分一致するパターン（`joi2024yo1d`）では想定外の `'2024d'` が返る。

→ **mock は実装との一致を保証しない。純粋関数は直接テストすべき。**

### 分割の実用的な効果

- 1ファイル 100〜300 行に抑えられ、変更時の影響範囲が明確になった
- テスト実行時間が短縮（vitest の並列実行が効く）
- 新規 provider 追加時に既存ファイルを触る必要がほぼなくなった
