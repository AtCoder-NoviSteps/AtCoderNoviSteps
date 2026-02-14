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

## 検証

1. `pnpm test:unit` でテストが全て通ること
2. `pnpm check` で型エラーがないこと
3. `pnpm build` でビルドが通ること
4. `/problems` ページで TaskTable が正常に表示されること（開発サーバー確認）

---

## 教訓

1. **`git mv` でファイルを移動する**: `cp` + `rm` より git 履歴が追跡しやすい。`Write` ツールで新規作成しない。

2. **`$features` エイリアスを先に設定してからインポートを書く**: エイリアス未設定のまま移動ファイルを参照すると型チェックが壊れる。設定ファイル変更 → ファイル移動 → import 修正の順が安全。

3. **共有 test_cases は使用元を grep で確認してから移動判断する**: `contest_name_and_task_index.ts` 等は `contest.test.ts` からも参照されており、フィクスチャに移動すると `src/test/lib` 残存テストが壊れる。

4. **同一ディレクトリ内の相対 import は `./` を使う**: `TaskTable.svelte` → `TaskTableBodyCell.svelte` のように同じディレクトリに移動したコンポーネントは `$features/...` より `./` の方が明確。

5. **`pnpm check` の既存エラーは事前に把握しておく**: リファクタ起因か既存問題かを切り分けるために、作業前の状態を確認しておくとよい。
