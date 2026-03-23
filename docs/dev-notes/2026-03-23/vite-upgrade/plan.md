# Vite 7 → 8 アップグレード計画

## 概要

`vite` を 7.3.1 から 8.0.1 へアップグレードする。
Vite 8 は esbuild/Rollup を Rolldown/Oxc に置き換える大型メジャーバージョン。

コンパニオンパッケージも合わせてアップグレード対象：

| パッケージ                     | 現行バージョン | 目標バージョン | 理由                                  |
| ------------------------------ | -------------- | -------------- | ------------------------------------- |
| `vite`                         | 7.3.1          | 8.0.1          | 主対象                                |
| `@sveltejs/vite-plugin-svelte` | 6.2.4          | 7.0.0          | v7 が Vite 8 を peerDep として要求    |
| `vitest`                       | 4.0.18         | 4.1.0          | 4.1.0 で `^8.0.0-0` を peerDep に追加 |
| `@vitest/coverage-v8`          | 4.0.18         | 4.1.0          | vitest と同一バージョンを維持         |
| `@vitest/ui`                   | 4.0.18         | 4.1.0          | vitest と同一バージョンを維持         |
| `@sveltejs/kit`                | 2.55.0         | 変更なし       | v2.53.0 で既に Vite 8 対応済み        |

---

## 背景：なぜ Rolldown/Oxc に移行するのか

### dev/prod の分裂問題

Vite 7 以前は dev と prod で異なるバンドラーを使っていた：

```
dev サーバー  → esbuild（Go製）：高速だが Rollup と動作が異なる
本番ビルド   → Rollup（JS製）：バンドル品質は高いが遅い
```

2 つの異なるバンドラーが同居していたため「dev では動くが prod でクラッシュ」という再現困難なバグが構造的に発生していた。Vite 8 はこれを **Rolldown で一本化**することで解消する。

### VoidZero エコシステム

Rolldown と Oxc はどちらも **VoidZero**（Evan You が設立）が開発している Rust 製ツールチェーン：

```
VoidZero
├── Oxc    — JS ツールチェーンのコア（パーサー・トランスパイラー・ミニファイアー・oxlint・oxfmt）
├── Rolldown — Oxc の上に乗る Rust 製バンドラー（Rollup 後継）
└── Vite   — Rolldown + Oxc transformer/minifier を dev/prod 両方で採用
```

oxlint（ESLint 互換リンター）や oxfmt（フォーマッター）も同じ Oxc モノレポに属し、**同一のパーサーと AST を共有**している。Vite 8 に乗ることは「Oxc エコシステムの土台に立つ」ことを意味し、各ツールは独立して・好きなタイミングで追加移行できる。

### エコシステム一元化のメリット・デメリット

**メリット**

| 項目                | 内容                                                                        |
| ------------------- | --------------------------------------------------------------------------- |
| dev/prod の動作一致 | 同一バンドラー（Rolldown）を使うことで prod 限定バグが原理的になくなる      |
| 一貫した高速化      | 全ツールが Rust 製。ビルド・lint・フォーマットがまとめて速くなる            |
| 段階移行が可能      | oxlint・oxfmt は ESLint/Prettier と互換性を持たせた設計で、一括移行不要     |
| 統一されたコア      | 全ツールが同じ AST を共有するため、パース結果のずれによる不整合が起きにくい |

**デメリット・リスク**

| 項目                   | 内容                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| 単一障害点             | VoidZero 1 社への依存度が高まる。組織・方針変更の影響を受けやすい                                     |
| 成熟度                 | Rolldown/Oxc はまだ新しく、Rollup/esbuild に比べてエッジケースのバグが潜在する可能性がある            |
| プラグインエコシステム | Rollup プラグインの一部は Rolldown で未対応（本プロジェクトはカスタムプラグイン未使用のため影響なし） |
| ロックイン             | 将来 Oxc スタックで標準化するほど、他のツールチェーンへの乗り換えコストが上がる                       |

---

## 破壊的変更の影響調査結果

### 問題なし（対応不要）

| 確認項目                                                            | 根拠                                                                         |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| ブラウザターゲット引き上げ (Chrome 111 / Firefox 114 / Safari 16.4) | AtCoder ユーザー向けで最新ブラウザ前提。影響なし                             |
| `optimizeDeps.esbuildOptions` → `rolldownOptions`                   | `vite.config.ts` で `esbuildOptions` 未使用。`optimizeDeps.exclude` のみ使用 |
| `esbuild` config → `oxc`                                            | `vite.config.ts` に `esbuild` オプション未使用                               |
| `build.rollupOptions` → `build.rolldownOptions`                     | `vite.config.ts` で `build.rollupOptions` 未使用                             |
| `import.meta.hot.accept()` URL引数削除                              | `src/` 全体に `import.meta.hot` 使用なし (grep 確認済み)                     |
| `transformWithEsbuild` deprecation                                  | `src/` 内で未使用                                                            |
| `parseAst`/`parseAstAsync` → `parseSync`/`parse`                    | 未使用                                                                       |
| `format: 'system'`/`'amd'` 削除                                     | 未使用                                                                       |
| `manualChunks` オブジェクト形式削除                                 | 未使用                                                                       |
| `build.rollupOptions.watch.chokidar` 削除                           | 未使用                                                                       |
| Parallel plugin hooks → sequential                                  | カスタム Vite プラグイン未作成                                               |
| `build.commonjsOptions` no-op                                       | 未使用                                                                       |

### 要対応

| 項目                                              | 内容                                                                                                                                                                                           | リスク |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| CJS Interop 挙動変更                              | `"type": "module"` プロジェクトでは CJS モジュールの default import が strict になる。`@prisma/client` 等は `optimizeDeps.exclude` 設定済みだが、`pnpm build` で実際の動作を確認する必要がある | Low    |
| `@sveltejs/vite-plugin-svelte` 6→7 メジャーバンプ | svelte 5 を peerDep として要求 (`^5.46.4`)。現行は 5.54.1 なので問題なし。その他の breaking changes は `pnpm check` と `pnpm test:unit` で検出する                                             | Low    |

---

## 設計方針

- コンパニオンパッケージ 5 本を 1 コミットで一括アップグレードする（バージョン不整合を防ぐため）
- `vite.config.ts` の変更は不要（esbuildOptions/rollupOptions いずれも未使用）
- CJS Interop は `pnpm build` でビルド成果物を確認することで検証する

---

## 却下した代替案

- `vite` のみアップグレードして `@sveltejs/vite-plugin-svelte` は据え置く → `^7.0.0 || ^8.0.0` の peerDep 範囲を超えるため不可
- `vitest` を 4.0.18 のままにする → peerDep が `^6.0.0 || ^7.0.0` で Vite 8 非対応のため不可

---

## 便利な新機能（採用検討）

| 機能                  | 説明                                                                  | 推奨度                  |
| --------------------- | --------------------------------------------------------------------- | ----------------------- |
| Rolldown + Oxc ビルド | esbuild/Rollup を置き換え。設定変更なしで自動的に高速化               | High（自動適用）        |
| Lightning CSS         | CSS ミニファイが esbuild から Lightning CSS に変更。設定なしで適用    | High（自動適用）        |
| `oxc` 設定オプション  | JSX や decorator 等の変換設定を `esbuild` の代わりに `oxc` で指定可能 | Low（現時点で設定不要） |

---

## 実装フェーズ

- [ ] Phase 1: `package.json` の対象パッケージバージョンを更新する
- [ ] Phase 2: `pnpm install` でロックファイルを更新する
- [ ] Phase 3: `pnpm lint` を実行して ESLint エラーがないことを確認する
- [ ] Phase 4: `pnpm check` を実行して型エラーがないことを確認する
- [ ] Phase 5: `pnpm test:unit` を実行してテストが全通過することを確認する
- [ ] Phase 6: `pnpm build` を実行して CJS Interop 問題がないことを確認する

---

## 検証手順

```bash
pnpm install
pnpm lint
pnpm check
pnpm test:unit
pnpm build
```

> **`pnpm check` 注意事項**: 型エラーが出た場合は `git stash && pnpm check 2>&1 | tail -5` でアップグレード前と比較して pre-existing エラーでないかを確認する。
