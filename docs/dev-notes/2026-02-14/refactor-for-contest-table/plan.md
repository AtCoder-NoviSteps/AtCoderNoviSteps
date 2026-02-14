# 計画: src/features/tasks/contest-table への再構成

## 移動しないファイル

以下は `contest.test.ts` からも参照されるため `src/test/lib` に残す:

- `src/test/lib/utils/test_cases/contest_name_and_task_index.ts`
- `src/test/lib/utils/test_cases/contest_name_labels.ts`
- `src/test/lib/utils/test_cases/contest_type.ts`

---

## 今回は対象外

- `src/lib/utils/contest_task_pair.ts` / `src/test/lib/utils/contest_task_pair.test.ts`
  → tasks ドメインへの移行候補（第二段階以降で検討）
- `src/lib/stores/active_problem_list_tab.svelte.ts`
  → architecture.md で tasks 抽出候補に記載あり

---

## 教訓

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
