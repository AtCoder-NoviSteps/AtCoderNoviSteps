# contest モジュール再編

`src/lib/utils/contest.ts`（826行）を `src/lib/contests/` に集約し、if hell を Map/Record ルックアップに置換、ラベル生成をコンテスト種別ごとにファイル分割。3フェーズ × 3ブランチ × 3 PR。全フェーズ完了済み。

---

## 設計判断

### 配置: `src/lib/contests/`（`src/features/contests/` ではなく）

コンテスト分類・ラベル生成は tasks, workbooks, votes, admin の4+ feature から横断的に参照される共有ロジック。architecture.md の判定基準「複数の機能ドメインで使う → `lib/` に配置」に該当。PR #3194 の workbooks 移動は単一ドメインだったが、contests は共通基盤。

class ベースの Strategy パターンも検討したが、TypeScript では冗長。Map dispatch + 小関数群の方がテストしやすく tree-shaking にも有利。

### フェーズ順序: ロジック変更（Phase 2）→ ファイル分割（Phase 3）

- Phase 2 で `classifyContest` / `getContestNameLabel` の内部構造が確定してから分割すれば二度手間を避けられる
- 各 PR の diff が「ロジック変更」と「ファイル移動」に明確に分離される

### スコープ外

- `src/lib/clients/`（API 通信層）: 別レイヤーなので `clients/` に残す
- `src/lib/utils/task.ts` の `getTaskUrl` / `compareByContestIdAndTaskId`: task 側の責務
- `src/lib/utils/contest_task_pair.ts`: タスク識別キー生成であり contest の責務ではない
- `src/features/tasks/utils/contest-table/` の provider 群: 既に適切に分割済み。import パスのみ更新

---

## 実装時に発見した落とし穴

### `classifyContest` と `getContestNameLabel` の不整合

Phase 2 以前、`getContestNameLabel` は `classifyContest` を経由**せず**、独自の if 連鎖で直接ラベルを生成していた。不整合の例:

- `atc001`: `classifyContest` → `ContestType.OTHERS` だが、`getContestNameLabel` → `'ATC 001'`（`regexForAxc` で先に捕捉）
- `chokudai_S001`: `classifyContest` → `ContestType.OTHERS` だが、`getContestNameLabel` では `startsWith('chokudai_S')` 分岐で `'Chokudai SpeedRun 001'`

`getContestNameLabel` を `classifyContest` の結果で dispatch する設計に変更した際、`ContestType.OTHERS` のラベル生成関数にフォールバックチェーンを組み込んで解決:

1. `regexForAxc` による ATC 形式チェック
2. ATCODER_OTHERS 辞書の完全一致
3. `chokudai_S` prefix マッチ
4. `contestId.toUpperCase()` フォールバック

---

## リスクと対策

| リスク                               | 対策                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| import 書き換え漏れ                  | re-export を一時的に残して検証 → 削除時に `pnpm build` で検出                                |
| Phase 2 で挙動変化                   | 既存テスト 825 件が退行検知。テスト件数の前後比較を必須とした                                |
| barrel export の circular dependency | `index.ts` は公開 API のみ re-export。内部ファイル間は直接 import を使い barrel を経由しない |
