# Phase 4 Server Cache: Review + Simplify 対応計画（3rd）

**Goal:** `staging` vs `#3706` の review / simplify 指摘事項を修正する

---

## 優先度 Medium

### 1. `cache_strategy.ts` の `getCachedOrFetch` 不要ラッパーを削除

- **箇所**: `src/lib/clients/cache_strategy.ts:37-43`
- **内容**: `getCachedOrFetch<T>()` が `cache.getOrFetch(key, fetchFunction)` への単純委譲のみ。`getCachedOrFetchContests()` / `getCachedOrFetchTasks()` が直接 `this.contestCache.getOrFetch()` / `this.taskCache.getOrFetch()` を呼べば足りる
- **修正**: `getCachedOrFetch` を削除し、呼び出し元を直接 `getOrFetch()` に向ける

---

## 優先度 Low

### 2. `HOUR_MS` 定数の重複を解消

- **箇所**: `src/lib/server/tasks/cache.ts:6`, `src/features/workbooks/server/cache.ts:6`
- **内容**: `const HOUR_MS = 60 * 60 * 1000` が2ファイルに独立定義。`cache.ts` の `DEFAULT_CACHE_TTL` が未 export
- **修正案A**: `src/lib/clients/cache.ts` の `DEFAULT_CACHE_TTL` を export し、両ファイルで import
- **修正案B**: `src/lib/constants/` に `CACHE_TTL` 定数ファイルを新設
- **推奨**: 案A（既存定数を活用、ファイル追加なし）

### 3. `buildPlacementKey` をキャッシュ層から分離

- **箇所**: `src/features/workbooks/server/cache.ts:3,12-18`
- **内容**: `buildPlacementKey()` が `WorkBookType` のドメイン判定ロジックを持つ。キャッシュ層はストレージのみを担うべきで、ドメイン型の分岐知識はサービス層の責務
- **修正**: `buildPlacementKey()` を `src/features/workbooks/utils/` か `workbooks.ts` に移動し、`getCachedWorkbooksByPlacement()` はキー文字列を引数で受け取るシグネチャに変更

---

## 優先度 Nit

### 4. `byUserCache.clear()` → `delete(BY_USER_KEY)`

- **箇所**: `src/features/workbooks/server/cache.ts:36`
- **内容**: 単一キーのみなのに `clear()` を使用。`delete(BY_USER_KEY)` の方が意図が明確
- **修正**: `byUserCache.clear()` → `byUserCache.delete(BY_USER_KEY)`

### 5. what コメント削除

- **箇所**: `src/lib/clients/cache.ts:1-67`（TSDoc 各所）
- **内容**: `size` / `health` / `set` などのコードを言い換えただけのコメント。AGENTS.md の「why のみコメント」規約に違反
- **修正**: メソッド名から自明な TSDoc を削除。非自明な制約（例: `set()` の key 長制限の `@throws`）は残す

### 6. 不要な `console.log` 削除

- **箇所**: `src/features/workbooks/services/workbooks.ts:282`
- **内容**: `createWorkBook` 成功時のログ。`updateWorkBook` には同等ログなく一貫性がない
- **修正**: 削除

---

## 対応不要（確認済み）

- **invalidate タイミング**: 全ドメインで DB 書き込み成功後のみ（`finally` 内ではない）
- **キャッシュキー衝突**: `buildPlacementKey` のプレフィックス区別、インスタンス分離とも問題なし
- **メモリリーク**: `inflight` Map はエラー時も必ず `delete`、`maxSize` による evictioneviction あり
- **並列化**: `getMergedTasksMap` では `Promise.all` で適切に並列化済み
- **ドメインモジュールの同一パターン**: `server-cache.md` ルールへの準拠であり抽象化不要
