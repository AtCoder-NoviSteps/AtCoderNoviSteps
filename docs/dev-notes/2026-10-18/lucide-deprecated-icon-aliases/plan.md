# @lucide/svelte の非推奨アイコン別名を推奨名へ置き換える

## 概要

[upstream-pr-review/plan.md](../../2026-06-28/upstream-pr-review/plan.md) の宿題11を解消する。
@lucide/svelte 1.59.0 で、使用中の `circle-help` と `trash-2` は推奨名を re-export するだけの非推奨別名になっている。次のメジャーで別名が削除されるとビルドエラーになるため、先に import を推奨名へ置き換える。
`#4186`（`user_edit.spec.ts` の修正）とは別のブランチ・PR にする。ブランチは `origin/staging`（`395a5424`）から切る。

## 変更内容

| 旧（非推奨別名）                                     | 新（推奨名）                                                          | ファイル                                                                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `CircleHelp` from `@lucide/svelte/icons/circle-help` | `CircleQuestionMark` from `@lucide/svelte/icons/circle-question-mark` | `src/lib/components/LabelWithTooltips.svelte`・`src/lib/components/TooltipWrapper.svelte`・`src/lib/components/Tabs/TabItemWrapper.svelte` |
| `Trash2` from `@lucide/svelte/icons/trash-2`         | `Trash` from `@lucide/svelte/icons/trash`                             | `src/features/workbooks/components/detail/WorkBookTasksTable.svelte`                                                                       |

- 各ファイルで、import 文とテンプレート内のコンポーネント名の2か所を置き換える。props（`class`・`id`）は変えない。
- 別名は推奨名のコンポーネントをそのまま re-export しているため、描画される SVG は変わらない。

## 設計判断

- **import 名も推奨名に揃える:** パスだけ変えて `CircleHelp` という名前を残すと、grep したときに非推奨名が残っているように見えるため。
- **テストは追加しない:** 分岐のない置き換えで、描画も変わらない。既存の unit test・`pnpm check`・build で、import の解決と型を確かめる。
- **非推奨別名を検出する lint ルールは追加しない:** 該当は今回の4ファイルだけで、新しい別名は Renovate PR のレビュー（注意事項9の手順）で拾えるため（YAGNI）。

## 採用しなかった案

- **次のメジャーまで待つ:** ビルドエラーになってから直すことになり、メジャー更新の PR に無関係な変更が混ざる。
- **`@lucide/svelte` の barrel から名前付き import に変える:** 現行の29か所すべてがサブパス import で、tree-shaking の前提も変わるため。

## フェーズ

### Phase 1: ブランチの作成

```bash
git switch -c <ブランチ名> origin/staging
```

### Phase 2: 4ファイルの置き換え

上の表のとおりに置き換える。

### Phase 3: 検証

```bash
rg -n "circle-help|trash-2|CircleHelp|Trash2" src e2e   # 0 件
pnpm format && pnpm lint && pnpm check
pnpm test:unit
pnpm build
git diff --check
```

- 置き換えた4コンポーネントのアイコンが表示されることを、dev サーバーで目視確認する（ツールチップのアイコン、タブのヘルプアイコン、問題集編集の削除ボタン）。

### Phase 4: 記録

- [upstream-pr-review/plan.md](../../2026-06-28/upstream-pr-review/plan.md) の宿題11を削除し、注意事項9の追記と台帳 #4185 の行に、置き換えが済んだことを書き足す。
- 本計画を完了記録に書き直す。
