# replace-erd-generator 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `prisma-erd-generator`（Puppeteer依存・メンテ停滞）を `prisma-markdown@1.0.9` に置き換え、不要な依存 `@mermaid-js/mermaid-cli` と `@popperjs/core` を削除する。

**Architecture:** Prisma の generator 設定を差し替えるだけの設定変更。ビジネスロジック・テストへの影響なし。ERD.md の出力形式が変わる（絵文字Mermaid → 標準Mermaid+Markdownセクション）。

**Tech Stack:** prisma-markdown@1.0.9（依存: `@prisma/generator-helper@^5.0.0` のみ）、Prisma 5.22、pnpm

---

## 概要

### 置き換え理由

| パッケージ                        | 問題                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `prisma-erd-generator@2.4.2`      | `@mermaid-js/mermaid-cli` 経由で Puppeteer（Chromium）を同梱。重い・メンテ停滞                      |
| `@mermaid-js/mermaid-cli@11.12.0` | `prisma-erd-generator` 専用。メンテ停滞。postcss-load-config 経由で tsx peer dep を引き込んでいた   |
| `@popperjs/core@2.11.8`           | ソースコードでの直接 import なし。`flowbite` の依存として推移的にインストール済みのため直接宣言不要 |

### 採用候補と却下理由

| 候補                    | 判断                                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `prisma-markdown@1.0.9` | ✅ **採用**。依存1個（`@prisma/generator-helper`）、Puppeteer/mermaid-cli 不使用、Prisma v5 対応、schema.prisma から直接生成 |
| `prisma-markdown@3.x`   | ❌ Prisma >= 6.0 要求                                                                                                        |
| `prisma-markdown@4.x`   | ❌ Prisma >= 7.0 要求                                                                                                        |
| `mermerd`               | ❌ 今回は見送り。Go バイナリで npm 依存ゼロだが DB 直接接続が必要（CI でコンテナ前提になる）                                 |
| `tbls`                  | ❌ 今回は見送り。多機能だが直接依存 43 個と重い                                                                              |

### 注意: 将来の移行パス

Prisma v7 へアップグレードするタイミングで `prisma-markdown@4.x` へ移行する（peer 依存が >= 7.0.0 に変更されたため）。

### 注意: ERD.md への手動記述について

`.claude/rules/prisma-db.md` に「CHECK 制約を `prisma/ERD.md` に `%%` コメントで記録する」ルールがある。
`prisma generate` を実行するたびに ERD.md は上書きされるため、手動コメントは消える（現行ツールでも同様）。
このルールの運用方針（上書き受け入れ or 別ファイルへ移動）は本タスクのスコープ外とし、別途検討する。

---

## フェーズサマリー

| Phase | 内容                                                              | リスク                 |
| ----- | ----------------------------------------------------------------- | ---------------------- |
| 1     | package.json の依存差し替え + pnpm install                        | 低（設定のみ）         |
| 2     | schema.prisma の generator ブロック差し替え + ERD.md 再生成・確認 | 低（出力形式変更のみ） |

---

## 変更ファイル一覧

| ファイル               | 操作   | 内容                                                       |
| ---------------------- | ------ | ---------------------------------------------------------- |
| `package.json`         | 修正   | 3パッケージ削除、1パッケージ追加                           |
| `prisma/schema.prisma` | 修正   | `generator erd` ブロックを `generator markdown` に置き換え |
| `prisma/ERD.md`        | 再生成 | `prisma generate` で自動上書き（手動編集不要）             |

---

## Phase 1: package.json の依存差し替え

**Files:**

- Modify: `package.json`

- [ ] **Step 1-1: 削除するパッケージを確認**

  以下3点がいずれもソースコードで直接 import されていないことを確認済み:
  - `@mermaid-js/mermaid-cli` — `prisma-erd-generator` の実行時依存。他からは参照されていない
  - `@popperjs/core` — `flowbite` が依存として保持しており推移的にインストールされる。直接 import なし
  - `prisma-erd-generator` — 削除対象本体

- [ ] **Step 1-2: package.json を編集**

  `dependencies` から削除:

  ```json
  // 削除
  "@mermaid-js/mermaid-cli": "11.12.0",
  "@popperjs/core": "2.11.8",
  "prisma-erd-generator": "2.4.2",
  ```

  `devDependencies` に追加:

  ```json
  // 追加（アルファベット順で適切な位置へ）
  "prisma-markdown": "1.0.9",
  ```

- [ ] **Step 1-3: pnpm install を実行**

  ```bash
  pnpm install
  ```

  確認ポイント:
  - エラーが出ないこと
  - `node_modules/.pnpm` から `prisma-erd-generator` と `mermaid-js` が消えること（`ls node_modules/.pnpm | grep mermaid` で確認）
  - `@popperjs/core` は `flowbite` 経由で推移的に残っていること

  ```bash
  ls node_modules/.pnpm | grep mermaid     # 空であること
  ls node_modules/.pnpm | grep popperjs    # flowbite 経由で1件残っていること
  ```

- [ ] **Step 1-4: ビルド・テストが壊れていないことを確認**

  ```bash
  pnpm check    # Svelte 型チェック
  pnpm test:unit
  ```

  期待: すべて PASS

---

## Phase 2: schema.prisma 差し替え・ERD.md 再生成

**Files:**

- Modify: `prisma/schema.prisma`
- Regenerate: `prisma/ERD.md`

- [ ] **Step 2-1: schema.prisma の generator erd ブロックを差し替え**

  変更前:

  ```prisma
  // See:
  // https://dev.classmethod.jp/articles/prisma_er_diagram_auto_generation/
  generator erd {
    provider                  = "prisma-erd-generator"
    theme                     = "forest"
    output                    = "ERD.md"
    includeRelationFromFields = true
  }
  ```

  変更後:

  ```prisma
  // See:
  // https://github.com/samchon/prisma-markdown
  generator markdown {
    provider = "prisma-markdown"
    output   = "ERD.md"
    title    = "AtCoder NoviSteps ERD"
  }
  ```

  注: `theme`・`includeRelationFromFields` は prisma-markdown に相当オプションなし。出力は標準 Mermaid ER 形式になる。

- [ ] **Step 2-2: prisma generate を実行して ERD.md を再生成**

  ```bash
  pnpm exec prisma generate
  ```

  確認ポイント:
  - エラーが出ないこと
  - `prisma/ERD.md` が更新されること
  - Mermaid コードブロックとモデルのセクションが含まれること

- [ ] **Step 2-3: 生成された ERD.md を目視確認**

  ```bash
  head -80 prisma/ERD.md
  ```

  期待:
  - `# AtCoder NoviSteps ERD` のような H1 タイトルが先頭にあること
  - `erDiagram` ブロックが含まれること
  - 主要モデル（User, Task, WorkBook など）が図に含まれること

- [ ] **Step 2-4: 最終確認**

  ```bash
  pnpm check
  pnpm test:unit
  pnpm build
  ```

  期待: すべて成功

- [ ] **Step 2-5: コミット**

  ```bash
  git add package.json pnpm-lock.yaml prisma/schema.prisma prisma/ERD.md
  git commit -m "chore: replace prisma-erd-generator with prisma-markdown v1.0.9

  - Remove prisma-erd-generator (Puppeteer/mermaid-cli dependency)
  - Remove @mermaid-js/mermaid-cli (only used by prisma-erd-generator)
  - Remove @popperjs/core (no direct import; installed transitively via flowbite)
  - Add prisma-markdown@1.0.9 (single dep: @prisma/generator-helper, Prisma v5 compatible)
  - ERD.md output format changes from emoji-annotated Mermaid to standard Mermaid + Markdown"
  ```

---

## 完了後チェックリスト

- [ ] `pnpm check` が通る
- [ ] `pnpm test:unit` が通る
- [ ] `pnpm build` が通る
- [ ] `prisma/ERD.md` にすべての主要モデルが含まれている
- [ ] `node_modules/.pnpm` に `mermaid-js` が残っていない
