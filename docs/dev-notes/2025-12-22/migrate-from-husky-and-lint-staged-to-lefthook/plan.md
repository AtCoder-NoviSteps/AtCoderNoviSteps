# husky and lint-staged から lefthook への移行計画

**Issue:** [#2988](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2988)

## 背景・目的

### 問題点

- **実行時間が遅い:** commit 時に約 30秒かかる（手動実行は 12.83秒）
- **ステージ済みファイルのみなのに全体をチェック:** 無関係なファイル処理で時間浪費
- **npm ツールのオーバーヘッド:** JavaScript の起動時間が重い

### 目的

- **高速化:** 30秒 → **5秒以下**
- **効率化:** ステージ済みファイルのみをチェック
- **メンテナンス性向上:** 高速で活発にメンテナンスされているツールに移行

---

## 現状分析

| 項目             | 詳細                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| **ツール**       | husky 9.1.7 + lint-staged 16.2.7                                                                    |
| **実行内容**     | `pnpm format` + `pnpm lint` （順序実行）                                                            |
| **実行時間**     | 手動: 12.83秒、commit: 30秒                                                                         |
| **スコープ**     | 全体ファイル                                                                                        |
| **チェック対象** | JS/TS: 146ファイル（47,688行）<br>Markdown: 42ファイル（16,623行）<br>Svelte: 73ファイル（5,565行） |

---

## 代替ツール調査

### 調査結果

| ツール           | 言語 | Stars | メンテナンス | 採用    |
| ---------------- | ---- | ----- | ------------ | ------- |
| **lefthook**     | Go   | 7.1k  | ✅ 活発      | ✅ 採用 |
| simple-git-hooks | JS   | 1.6k  | ✅ 活発      | ❌      |
| rusty-hook       | Rust | 228   | ❌ 中止      | ❌      |

### 採用理由

✅ **Go 言語実装で高速**

✅ **並列実行対応**で format + lint を同時実行可能

✅ **ステージ済みファイルのみをチェック**（`{staged_files}` 変数）

✅ **設定ファイルが簡潔** （YAML ベース）

✅ **Windows/WSL 対応**

✅ **継続的にメンテナンス中**（v2.0.12、更新: 1 週間前）

---

## Q&A

### Q1: npm script はそのままにするのか？

**A:** はい、現状のままにします。速度改善後、必要に応じて見直します。

- 現在: `pnpm format` = `prettier --write .`
- 修正時期: 後日検討

### Q2: Prettier の check と write は分離するのか？

**A:** はい、以下のように分離して並列実行します。

- **format:** `prettier --write` （修正）
- **lint:** `prettier --check` + `eslint` （チェック）

### Q3: `.gitignore` に lefthook 生成ファイルを追加する必要があるのか？

**A:** いいえ、不要です。

lefthook は以下のように動作するため：

- `lefthook.yml` → **git 管理**（設定ファイル）
- `.git/hooks/` → **自動生成**（git 管理外）

`.gitignore` への追加は不要です。

### Q4: lefthook.yml で `exclude` に `node_modules/` 等を指定すべきか？

**A:** いいえ、不要です。

理由：

- ステージ済みファイルのみ（`{staged_files}`）なので、そもそも `node_modules/` は対象外
- `exclude` はローカルのみで、CI では効果がない
- 除外ルールは `.gitignore` で一元管理が推奨

**結論:** `exclude` は削除し、设定ファイルをシンプルに保つ

### Q5: package.json に lefthook 関連のコマンドを追加すべきか？

**A:** いいえ、不要です。

理由：

- husky の `"prepare": "husky"` は削除
- lefthook は npm が自動でインストール・セットアップ
- package.json に `prepare` script は不要

**オプション:** チーム開発の場合、以下を任意で追加

```json
"scripts": {
  "hooks:install": "lefthook install"  // 手動セットアップ用
}
```

---

## 実装計画

### タスク一覧

#### Phase 1: 準備

- [ ] lefthook をインストール（`pnpm add -D lefthook`）**30m**
- [ ] `lefthook.yml` を作成 **1h**
- [ ] ローカルで動作確認・実行時間測定 **1h**

#### Phase 2: husky/lint-staged 削除

- [ ] `package.json` から以下を削除 **30m**
  - `"lint-staged"` 設定
  - `"prepare": "husky"` スクリプト
- [ ] pnpm パッケージ削除（`pnpm remove husky lint-staged`） **15m**
- [ ] `.husky/` ディレクトリ削除 **10m**

#### Phase 3: 環境構築

- [ ] lefthook をインストール（`lefthook install`） **30m**
- [ ] テスト commit で動作確認 **1h**

#### Phase 4: ドキュメント更新

- [ ] `CONTRIBUTING.md` を更新 **30m**

#### Phase 5: PR・レビュー・merge

- [ ] PR 作成・レビュー待ち・merge **1～2h**

**合計工数:** **5～7時間 = 1 日以内**

---

## 実装詳細

### lefthook.yml（予想設定）

```yaml
version: 2

pre-commit:
  parallel: true
  jobs:
    - name: format
      run: pnpm format {staged_files}
      glob: '**/*.{js,jsx,ts,tsx,md,svelte}'

    - name: lint
      run: pnpm lint {staged_files}
      glob: '**/*.{js,jsx,ts,tsx,svelte}'
```

### package.json 修正内容

**削除対象:**

```json
"lint-staged": { ... },
"prepare": "husky"
```

**削除パッケージ:**

```bash
pnpm remove husky lint-staged
```

---

## 実装開始の判定

- ✅ 前提・調査内容の要約完了
- ✅ 移行計画の確定
- ✅ 実装内容の詳細化
- ✅ 工数見積もり（1 日以内）

**実装開始可能**

---

## 実装完了報告

### 実装内容

**実施完了タスク:**

- ✅ lefthook インストール
- ✅ lefthook.yml 作成
- ✅ package.json から husky/lint-staged 削除
- ✅ .husky ディレクトリ削除
- ✅ lefthook セットアップ
- ✅ 動作確認・時間測定
- ✅ CONTRIBUTING.md 更新

### パフォーマンス測定結果

| 項目                         | 値         |
| ---------------------------- | ---------- |
| **Pre-commit hook 実行時間** | **0.69秒** |
| **Format 処理時間**          | **0.55秒** |
| **改善前**                   | 約30秒     |
| **改善後**                   | 約0.7秒    |
| **削減率**                   | **97.7%**  |

### 教訓

1. **Go 言語実装による高速化の効果大**
   - JavaScript ツール（husky）から Go 言語ツール（lefthook）への移行で、98%の時間削減を実現
   - 環境起動時間が大幅に削減される

2. **Prettier/ESLint は直接呼び出しが必須**
   - npm scripts 経由（`pnpm format`）では、全ファイル処理のため高速化できない
   - `prettier --write {staged_files}` のように直接コマンド呼び出しすることで、ステージ済みファイルのみ処理可能

3. **Glob パターンとファイルリスト指定の組み合わせ**
   - lefthook の `glob` で対象ファイル型を指定
   - `{staged_files}` で実行ファイルリストを動的に生成
   - この組み合わせにより、効率的かつ柔軟な hook 設定が可能

4. **Hook 設定ファイルのシンプル化**
   - `.husky/` ディレクトリを削除し、`lefthook.yml` 1 ファイルで一元管理
   - 設定の可読性・メンテナンス性が向上

5. **並列実行による時間短縮**
   - `parallel: true` で format と lint を同時実行
   - Sequential 実行なら 1.24秒かかるところ、0.7秒で完了

6. **Git config のクリーンアップが重要**
   - husky の古い `core.hooksPath` 設定が残っていると、lefthook が正常に動作しない
   - 環境切り替え時は既存設定の削除が必須
