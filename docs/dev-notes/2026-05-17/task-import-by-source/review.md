# PR #3525 CodeRabbit レビュー結果（staging vs #3525）

CodeRabbit CLI v0.4.4 にて2回実行。26ファイル、約21,444行追加・2,752行削除。

---

## ~~セキュリティ（SHA256 衝突）~~ → 対応不要

**`src/routes/(admin)/tasks/+page.server.ts:86`**

`sha256(contest_id + task.title)` の単純連結による境界曖昧化は、AtCoder/AOJ のコンテスト ID が固定形式（`ABC001`, `PCK2023PRELIM` など）であり task title と文字種・構造が異なるため、実際の衝突シナリオが存在しない。理論的指摘だが、このドメインでは実害なし。

---

## エラーハンドリング不整合（potential_issue、3箇所）

### `updateTask` null 時に `fail()` 未使用
**`src/routes/(admin)/tasks/[task_id]/+page.server.ts:72-76`**

```ts
// 現在
return { success: false };
// 修正案
return fail(INTERNAL_SERVER_ERROR, { success: false });
```

### import アクションの catch も `fail()` 未使用
**`src/routes/(admin)/tasks/+page.server.ts:96-98`**

fetch アクションは `fail()` を使っているが、import アクションは plain object を返している。DB エラー時にユーザーへのフィードバックがなく、無反応になる。

修正は2セット必要：

1. **`+page.server.ts`（create action）**: `return { success: false }` → `return fail(INTERNAL_SERVER_ERROR, { success: false })`
2. **`TaskTableForImport.svelte`（`makeImportHandler`）**: `result.type === 'failure'` 時のエラー表示を追加（現状は成功時の分岐しかなく、失敗が無反応になる）

### エラー詳細が破棄されている
**`src/routes/(admin)/tasks/+page.server.ts:48-50`**（両回で一致検出）

```ts
// 現在
} catch {
// 修正案
} catch (error) {
  console.error('Failed to fetch contests/tasks:', error);
```

---

## 冗長な記述（nitpick）

### ~~型定義の重複~~ → 対応不要

**`src/lib/clients/contest_task_fetcher.ts:6-22`**

各型は対応する関数の引数として1箇所ずつしか使われない。contests と tasks はドメイン上の別概念であり、形が似ているのは偶然の一致。共通基底型に統合すると型パラメータが増えて読みにくくなる上、将来の分岐にも対応しにくくなる。YAGNI。

### ~~`currentPage` リセットの重複~~ → 対応不要

**`src/routes/(admin)/tasks/+page.svelte:88-90`**

CodeRabbit の「重複」という判定は誤り。`filteredContests` は `importContests` と `searchQuery` にのみ依存しており（line 51）、`selectedSource` には依存していない。そのため `$effect` はドロップダウン変更時に発火しない。

- `onchange`: ソース種別ドロップダウン変更時（フェッチ前）にリセット
- `$effect`: フェッチ完了（`importContests` 変更）または検索入力（`searchQuery` 変更）時にリセット

トリガーが異なるため、両方必要。

### `console.debug` が本番に残る
**`src/lib/clients/contest_task_fetcher.ts:37, 56`**（2回目のみ検出）

環境変数ガードまたは共通ロガー経由に変更を検討。

---

## データ品質（potential_issue）

JSONフィクスチャ内の末尾空白・制御文字・タイポ。importパイプライン側で `trim()` するのが本命。

| ファイル | 行 | 内容 |
|---|---|---|
| `fixtures/aizu_online_judge/challenges/pck_final/contests.json` | 2079, 2295, 4353 | 末尾スペース in `name` |
| `fixtures/aizu_online_judge/challenges/jag_regional/contests.json` | 1620 | 末尾タブ `\t` in `name` |
| `fixtures/aizu_online_judge/challenges/pck_prelim/contests.json` | 1935, 3924 | 末尾スペース in `name` |
| `fixtures/atcoder_problems/tasks.json` | 153-154 | 末尾スペース in `name`/`title` |
| `fixtures/aizu_online_judge/courses/contests.json` | 72 | typo: "descrete" → "discrete" |
| `fixtures/atcoder_problems/contests.json` | 全体 | 並び順が非決定的（2回目のみ） |

---

## 対応優先度

| 優先度 | 項目 |
|---|---|
| 推奨 | `fail()` 不整合 3箇所、エラーログ欠落 |
| 推奨 | importパイプラインで `trim()` によるクリーニング（下記参照） |
| 任意 | 型定義重複、`currentPage` 重複リセット、`console.debug` ガード |
| 対応不要 | JSONフィクスチャの末尾空白・typo（実APIの再現として保持） |

---

## trim() 対応方針（データ品質）

APIレスポンスの `name`/`title` フィールドに末尾空白・タブが混入している。DBに入る前にクリーニングする。

### 変更箇所

**`src/lib/clients/aizu_online_judge/utils.ts`**

```ts
// mapToContest
title: title.trim(),

// mapToTask
title: problem.name.trim(),
```

**`src/lib/clients/atcoder/atcoder_problems.ts`**

transformer がなく生データを返しているので `.map()` を追加：

```ts
// getContests
return contests.map((contest) => ({ ...contest, title: contest.title.trim() }));

// getTasks
return tasks.map((task) => ({ ...task, title: task.title.trim() }));
```

### テスト方針

- フィクスチャは汚いデータのまま保持（実APIの再現）
- `utils.test.ts` と `atcoder_problems.test.ts` に末尾空白を含む入力 → trimされた出力をassertするケースを各1件追加
