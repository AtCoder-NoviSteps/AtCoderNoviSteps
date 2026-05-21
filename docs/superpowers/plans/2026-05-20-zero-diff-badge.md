# ±0 相対評価バッジ表示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** diff=0（ユーザ投票中央値と運営グレードが一致）のとき、グレードアイコン右上に緑色の `±0` バッジを表示する。

**Architecture:** `getRelativeEvaluationLabel` が diff=0 で `'±0'` を返すよう変更し、対応するバッジ色・ツールチップ文言をユーティリティ関数に追加する。`RelativeEvaluationBadge.svelte` は `{#if label}` で表示制御しており `'±0'` は truthy なため、コンポーネント本体の変更は不要。

**Tech Stack:** TypeScript, Svelte 5 (Runes), Vitest, Tailwind CSS v4

---

## File Map

| Action | File                                                   | 変更内容                                                                                                                                                  |
| ------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modify | `src/features/votes/utils/relative_evaluation.ts`      | `getRelativeEvaluationLabel(0)` → `'±0'`、`getRelativeEvaluationBadgeColorClass(0)` → グリーン、`getRelativeEvaluationTooltipText('±0')` → 日本語文言追加 |
| Modify | `src/features/votes/utils/relative_evaluation.test.ts` | diff=0 のアサーション更新・追加                                                                                                                           |

---

### Task 1: テストを更新して失敗させる ✅

**Files:**

- Modify: `src/features/votes/utils/relative_evaluation.test.ts`

- [x] **Step 1: `getRelativeEvaluationLabel(0)` のアサーションを `'±0'` に変更する**
- [x] **Step 2: `getRelativeEvaluationBadgeColorClass(0)` のアサーションをグリーンクラスに変更する**
- [x] **Step 3: `getRelativeEvaluationTooltipText('±0')` のテストを追加する**
- [x] **Step 4: テストを実行して失敗を確認する**

---

### Task 2: 実装を変更してテストを通す ✅

**Files:**

- Modify: `src/features/votes/utils/relative_evaluation.ts`

- [x] **Step 1: `getRelativeEvaluationLabel` の diff=0 分岐を `'±0'` に変更する**
- [x] **Step 2: `getRelativeEvaluationBadgeColorClass` の diff=0 分岐にグリーンを返すよう変更する**
- [x] **Step 3: `getRelativeEvaluationTooltipText` に `'±0'` ケースを追加する**
- [x] **Step 4: テストを実行してすべて通ることを確認する** (38 tests passed)
- [x] **Step 5: ユニットテスト全体を実行してリグレッションがないことを確認する**
- [x] **Step 6: TSDoc コメントを更新する**
- [x] **Step 7: コミットする**

---

## 追加変更（実装後にユーザー要求）

- `prisma/seed.ts`: `addVoteStatisticsDemoData()` 追加 — APG4bPython_co に diff=0 の VotedGradeStatistics を作成してバッジを目視確認できるようにした
- `getRelativeEvaluationBadgeColorClass(0)`: バッジの色合いを `500/600` → `400/500` に修正（sky/orange の既存バッジと統一）
- `getRelativeEvaluationColorClass(0)`: テキスト色を gray → green に変更（diff=0 のニュートラル色を統一）

---

## 教訓（新規・非自明なもの）

### Docker node_modules シンボリックリンク欠損問題

**現象:** `pnpm db:seed` が `Cannot find module '/usr/src/app/node_modules/pnpm/bin/pnpm.mjs'` でクラッシュ。
**原因:** `node_modules/.pnpm-workspace-state-v1.json` に `lastValidatedTimestamp` が記録されていたため、pnpm がインストール済みと判断してスコープなしパッケージ（tsx, pnpm, p-queue, prisma 等）のトップレベルシンボリックリンクを貼り直さなかった。スコープ付きパッケージ（@prisma 等）は正常だったため一見インストール済みに見える。
**修正コマンド:**
```bash
docker compose exec web rm node_modules/.pnpm-workspace-state-v1.json
docker compose exec web /usr/local/share/npm-global/bin/pnpm install
```
この問題は `compose.yaml` の `./node_modules:/usr/src/app/node_modules:cached` マウントでホスト側 node_modules をコンテナに共有しているため、ホスト側で別の Node バージョンを使って操作した際などに発生する。

### `getRelativeEvaluationColorClass` の TSDoc 陳腐化

バッジ色と同じ関数のコメントが古い情報（gray）を残したまま実装だけ緑に更新した。コードレビューで検出。今後: 色変更時は必ず同じ関数の TSDoc 内の色名も同時に確認する。

## CodeRabbit Findings

（PRを開いた後に実施予定）
