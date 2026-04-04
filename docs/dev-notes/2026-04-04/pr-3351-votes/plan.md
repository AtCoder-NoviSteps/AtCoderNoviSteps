# PR #3351 レビュー対応メモ

実装完了。以下に意思決定・却下案・未解決事項を記録する。

---

## 対応概要

| #    | 指摘                                             | 分類     | 対応方針                                             |
| ---- | ------------------------------------------------ | -------- | ---------------------------------------------------- |
| 1    | SVG arc 100% セグメント描画不可                  | Critical | `buildArcPath()` でフルサークル検出 → デュアルアーク分割  |
| 2    | ナビバー「投票」 vs パンくず「グレード投票」     | Critical | パンくずを「投票」に統一                             |
| 3    | 空リング半径計算誤り                             | Major    | `r={OUTER_RADIUS}` → `r={RING_MID_RADIUS}`           |
| 4    | PENDING フォールバックがルートテンプレートに存在 | Major    | `resolveDisplayGrade()` を `grade_options.ts` に抽出 |
| 5    | フラスコアイコンのツールチップがキーボード非対応 | Major    | `votes/+page.svelte` を Flowbite `<Tooltip>` に置換  |
| 6    | 外部リンクに `noopener` 未設定                   | Minor    | `rel` に `noopener` を追加                           |
| 7    | 仮グレードロジック重複                           | Minor    | Task 4（`resolveDisplayGrade` 抽出）で同時解消       |
| 8    | TSDoc coverage 未達                              | Minor    | 追加された関数と既存 exports に TSDoc 補完           |
| UI-1 | テーブルのヘッダー＋本文フォントが小さい         | UI       | Flowbite override クラスでサイズアップ               |
| UI-2 | グレードアイコンが小さい                         | UI       | `GradeLabel` の非デフォルト props を削除             |
| UI-3 | フラスコアイコンがグレードの右にある             | UI       | `VotableGrade.svelte` で順序入れ替え                 |

---

## 却下した代替案

| 提案 | 却下理由 |
| ---- | -------- |
| SVG arc の epsilon 丸め（`endAngle -= 0.0001`） | 形状が微妙にずれる。デュアルアークが標準解。 |
| `+page.svelte` 内 inline 関数で PENDING フォールバック | ユニットテスト不可になるため却下。 |
| Flask tooltip を `<span tabindex role aria-label>` のみで対応 | `[slug]/+page.svelte` は Flowbite Tooltip 使用済み。一覧ページも揃えるため却下。 |
| `Point` 型を `votes/types/` に移動 | `donut_chart.ts` の内部補助型。外部参照の理由がなく、機能スコープに汎用幾何型が混入するため却下。 |
| `Angle` 型（`{ start, end, mid }`）を導入 | `DonutSegment` の3フィールドは呼び出し側で個別参照が主。包んでも可読性向上がない。YAGNI。 |

---

## 非自明な実装ポイント

- **SVG arc degeneracy**: 全票が1グレードに集中すると始点・終点が同一座標になり arc コマンドが省略される。`endAngle - startAngle >= 2π - 1e-9` を検出して半周ずつのデュアルアークに分割して回避。
- **空リング半径**: `stroke-width` 付き `<circle>` の中心線は `(outerRadius + innerRadius) / 2`（`RING_MID_RADIUS`）が正しい。`OUTER_RADIUS` のままだと外縁がはみ出す。
- **`resolve('/votes', {})` の第2引数 `{}`**: TypeScript 宣言マージによる型エラー回避のためプロジェクト規約で静的ルートに付与している（`.claude/rules/sveltekit.md` 参照）。CodeRabbit の「不要」指摘は誤検知。
- **パーセンテージ計算**: `Math.round(ratio * 100)` は3等分等で合計が99になる。`Math.round(ratio * 1000) / 10` に変更し小数点1桁表示（33.3%）。

---

## CodeRabbit 判断メモ

| ファイル | 指摘 | 判断 |
| -------- | ---- | ---- |
| `donut_chart.ts` | `buildDonutSegments` / `buildArcPath` のテストがない | **誤検知**。`donut_chart.test.ts` に37件のテストあり |
| `votes/+page.svelte` | `#flask-{task.task_id}` の CSS セレクタ特殊文字リスク | **対応不要**。task_id は英数字＋アンダースコア＋ハイフンのみ（3回指摘、全て却下）|
| `votes/[slug]/+page.svelte` | `resolve()` の第2引数 `{}` は不要 | **誤検知**（上記参照）|
| `donut_chart.ts` | `Math.round(ratio * 100)` の合計ズレ | **対応済み**（`* 1000 / 10` に変更）|
| `VoteDonutChart.svelte` | `VotedGradeCounters` は一度しか使わない局所エイリアスで冗長 | **規約優先**。plural alias ルール（AGENTS.md）に従い維持 |
| `donut_chart.test.ts` | `getColor` / `getLabel` の引数型を `TaskGrade` に | **妥当**。対応済み |

---

## 未対応 TODO

- **検索フィルターの不整合**: `votes/+page.svelte` の検索は `contest_id` の生値でマッチしており、`getContestNameLabel()` が返す表示名（例: "ABC 100"）では検索できない。プレースホルダーが「出典」と表示されているため誤解を招く。
  - 選択肢A: フィルターに `getContestNameLabel(t.contest_id).toLowerCase()` を追加
  - 選択肢B: プレースホルダーを実態に合わせて変更
