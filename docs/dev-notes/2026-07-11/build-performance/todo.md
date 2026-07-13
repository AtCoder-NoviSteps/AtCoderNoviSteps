# pnpm build / vitest 低速問題: 対策 TODO

調査: [survey.md](./survey.md)
実施記録: [下部の「実施記録（2026-07-13）」](#実施記録2026-07-13)

## vitest 設定（効果: 大・実測済み）

- [x] デフォルト環境を `node` に変更 + DOM 参照のある 3 ファイルの先頭に `// @vitest-environment jsdom` を追加（実測で wall clock 2m19s → 25.4s、environment 累積 687s → 0.12s）。3 ファイルは node 環境でもパスするが、ブラウザ側分岐のカバレッジを保つためアノテーションを付ける。将来のコンポーネントテストも同方式 → **2026-07-13 実施。平常負荷でも wall clock 33.3s → 11.3s、environment 累積 161s → 5.7s。全 80 ファイル / 2745 パスで不変**
- [ ] `isolate: false` の実験: テスト本体 21.9s に対し import 130s のため、分離をやめれば大幅短縮の可能性。ただしグローバル状態（モジュールスコープの可変状態、シングルトン store）に依存するテストが壊れるリスクがあるため、全パス確認とセットで実施 → **見送り（2026-07-13）。まず環境変更の効果を確定させ、global 状態依存テストの破損リスクを一度に混ぜない方針**

## 環境（効果: 中〜大、追加効果は未実測）

- [x] node_modules を named volume 化: compose.yaml で `node_modules:/usr/src/app/node_modules`（named volume）に変更。virtiofs 越えのファイルアクセスを解消。OrbStack / Docker Desktop 共通の記法でどちらにも有効 → **2026-07-13 compose.yaml 設定変更済み。効果反映には後述のコンテナ再構築が必要（追加効果は A/B 未計測）**
- [ ] メモリの見直し: OrbStack のメモリ割当と常駐プロセスの整理でスワップ常用を解消。即効性があるのは長期常駐の `vite dev` の再起動（約 650MB）。`free -h` でスワップ使用量ゼロが目標 → **今回対象外（ホスト設定・運用作業でリポジトリ変更ではない）。計測時点でスワップは既にほぼゼロ（61Mi）**

## その他（効果: 小）

- [x] `@testing-library/svelte` が import 0 件（未使用）。削除するかはユーザー判断（dead dependency の三条件確認の上で） → **2026-07-13 削除。リポジトリ全体で参照は package.json のみ（import 0・jest-dom マッチャ 0）を確認し、`@testing-library/jest-dom` も未使用だったため併せて削除（計 20 パッケージ prune）。※ `@types/jest` も未使用を確認したが今回はスコープ外で保留**
- [ ] 高負荷時のみ失敗する flaky テスト 1 件の特定と修正（通常負荷では再現しない） → **未着手。計測時点でスワップほぼゼロのため再現せず（全 3 回の実行で全パス）。特定は高負荷再現が前提**
- [ ] `prisma generate` 5.2s は build スクリプトに毎回含まれる。スキーマ変更時のみ実行する運用にすれば毎ビルド 5 秒短縮（ただし生成漏れ事故とのトレードオフ） → **今回対象外（ユーザー未選択）**

## 計測（各対策の実施後）

- [x] `time pnpm exec vitest run` で wall clock と Duration 内訳（transform / import / environment / tests）を記録 → 下表
- [ ] `time pnpm exec vite build` で wall clock を記録 → **未実施（build は今回の変更対象外。kit 3.0 待ちの guard プラグインが支配的なため本セッションでは測定省略）**
- [x] `free -h` でスワップ使用量を記録 → 計測前後ともスワップ 61Mi（ほぼゼロ）
- [x] 対策前のベースライン（survey.md の実測値）と比較し、改善幅を確認 → 下表

## 実施記録（2026-07-13）

### vitest 環境変更の実測（平常負荷・スワップほぼゼロ）

| 指標                | Before (jsdom 全ファイル)     | After (node + 3 ファイルのみ jsdom) |
| ------------------- | ----------------------------- | ----------------------------------- |
| wall clock (real)   | 33.3s                         | **11.3s**（約 2.9 倍）              |
| Duration            | 29.99s                        | 8.87s                               |
| environment（累積） | 161.06s                       | **5.71s**                           |
| import（累積）      | 14.85s                        | 21.66s ※                            |
| transform（累積）   | 8.50s                         | 13.09s ※                            |
| tests（累積）       | 2.71s                         | 2.98s                               |
| sys                 | 1m8.0s                        | 12.3s                               |
| 結果                | 80 files / 2745 pass / 1 skip | 同左（不変）                        |

※ import / transform の「累積値」は環境間で単純比較できない。jsdom を外すとワーカーが早く空くぶん各ワーカーの担当ファイルが増え、per-worker 累積が増えて見えることがある。判断は wall clock（33.3s → 11.3s）と environment（161s → 5.7s）で行う。

補足: survey.md のベースライン（wall 2m19s 等）はスワップ 8GiB 使用の高負荷時。本記録は平常負荷での再計測で、改善は高負荷特有ではなく構造的であることを確認した。

### compose.yaml named volume 化: 反映に必要な手順（未実行）

named volume は初回マウント時に**空**で作成されるため、現行の bind マウント node_modules は引き継がれない。反映にはコンテナ内での再インストールが必須:

```bash
docker compose down
docker compose up -d
docker compose exec web pnpm install   # 空の named volume に node_modules を再構築
```

- 効果（import 短縮）の A/B は再構築後に `time pnpm exec vitest run` で要計測
- チーム共有ファイルの変更。Docker Desktop 利用者にも記法は有効（survey.md の Q&A 参照）
- 本セッションでは稼働中環境を壊さないため `docker compose` は実行していない

### 後続候補（未実施）

- `isolate: false` 実験（global 状態依存テストの全パス確認とセット）
- flaky テスト 1 件の特定（高負荷再現が前提）
- `prisma generate` の build 分離（stale client トレードオフ）
- `@types/jest` 削除（未使用を確認済み・スコープ外で保留）
- vite build の測定（kit 3.0 で guard プラグイン解消見込み）
