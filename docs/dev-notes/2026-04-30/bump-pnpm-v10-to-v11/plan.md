# pnpm 10.x → 11.x 移行調査

## 概要

本プロジェクト（`pnpm@10.33.1`）を pnpm 11 へ移行する際の破壊的変更の影響調査と、採用すべき新機能の推薦。

---

## 破壊的変更と本プロジェクトへの影響

### ✅ 影響なし

| 変更点                                   | 理由                                                              |
| ---------------------------------------- | ----------------------------------------------------------------- |
| Node.js 22+ 必須                         | `engines: "node 24.x"` — すでに満たしている                       |
| Pure ESM 配布                            | `package.json` に `"type": "module"` 設定済み                     |
| `auditConfig.ignoreCves` → `ignoreGhsas` | 本プロジェクトに `auditConfig` 設定なし                           |
| `npm_config_*` 環境変数廃止              | コードベース内に `npm_config_*` の使用なし（CI 設定は別途要確認） |
| グローバルインストール変更               | `pnpm add -g` を使用していない                                    |
| Lockfile 自動マイグレーション            | 初回 `pnpm install` で v9 → v11 へ自動移行                        |
| セキュリティデフォルト強化               | `minimumReleaseAge: 1440` / `blockExoticSubdeps: true` は設定済み |

---

### ⚠️ 要対応：`onlyBuiltDependencies` → `allowBuilds`

`onlyBuiltDependencies` / `neverBuiltDependencies` / `ignoredBuiltDependencies` / `ignoreDepScripts` は廃止。単一の `allowBuilds` マップに統合。

**現状 (`pnpm-workspace.yaml`):**

```yaml
onlyBuiltDependencies:
  - '@prisma/client'
  - '@prisma/engines'
  - esbuild
  - lefthook
  - prisma
  - puppeteer
```

**移行後:**

```yaml
allowBuilds:
  '@prisma/client': true
  '@prisma/engines': true
  esbuild: true
  lefthook: true
  prisma: true
  puppeteer: true
```

`strictDepBuilds` が v11 でデフォルト `true` になるため、リスト外パッケージがビルドスクリプトを持つ場合は install 時にエラー。初回 install 後に `pnpm approve-builds` で確認・調整が必要になる可能性がある。

---

### ⚠️ 要対応：`.npmrc` の pnpm 固有設定を `pnpm-workspace.yaml` へ移行

v11 以降、`.npmrc` は **認証・レジストリ設定のみ** 読み込む。

**現状の `.npmrc`（pnpm 固有設定 4 行）:**

```ini
engine-strict=true
resolution-mode=highest
strict-peer-dependencies=false
package-import-method=clone-or-copy
```

**移行後の `.npmrc`（認証・レジストリのみ残す）:**

```ini
# 現在、認証・レジストリ設定なし → 空ファイル or 削除
```

**移行後の `pnpm-workspace.yaml`（追記）:**

```yaml
engineStrict: true
resolutionMode: highest
strictPeerDependencies: false
packageImportMethod: clone-or-copy
```

---

## 変更ファイル一覧

| ファイル              | 変更内容                                                                     |
| --------------------- | ---------------------------------------------------------------------------- |
| `pnpm-workspace.yaml` | `onlyBuiltDependencies` → `allowBuilds` 書き換え、`.npmrc` から 4 設定を移行 |
| `.npmrc`              | pnpm 固有設定 4 行を削除                                                     |
| `package.json`        | `packageManager: pnpm@10.33.1` → `pnpm@11.x.x` に更新                        |

---

## 移行手順

```bash
# 1. 設定ファイル更新（上記の変更を適用）

# 2. インストールと検証
pnpm install           # lockfile 自動マイグレーション（v9 → v11）
pnpm approve-builds    # allowBuilds 対象外パッケージがあれば確認・許可
pnpm lint
pnpm check
pnpm test:unit
pnpm build
```

codemod を使う場合:

```bash
pnpx codemod run pnpm-v10-to-v11
```

---

## 推薦する新機能

### 高優先度

**`pnpm ci`（`pnpm clean-install`）**
`node_modules` を削除してから `--frozen-lockfile` で再インストール。CI 環境の冪等性が向上。

```bash
# CI の install ステップに使用
pnpm ci
```

**`pnpm peers check`**
lockfile から unmet peer dependency を確認。`pnpm install` の警告ツリーの代替として便利。

```bash
pnpm peers check
```

**`dedupePeers: true`（`pnpm-workspace.yaml`）**
peer dependency のサフィックスを短縮し、Prisma 等の peer 依存が多いパッケージのインスタンス数を削減。パッケージ数の多いプロジェクトで特に効果あり。

```yaml
# pnpm-workspace.yaml
dedupePeers: true
```

### 中優先度

**`pnpm clean`**
workspace 全プロジェクトの `node_modules` を安全に一括削除。`rm -rf node_modules` の代替。

```bash
pnpm clean            # node_modules のみ削除
pnpm clean --lockfile # lockfile も削除
```

**`pnpm audit --fix=update`**
脆弱性修正を overrides 追加ではなく lockfile の更新で対応できる。

**`-F` エイリアス**
`--filter` の短縮形。将来 monorepo 化した場合に便利。

### 低優先度

| 機能                             | 説明                                         |
| -------------------------------- | -------------------------------------------- |
| `pnpm sbom`                      | CycloneDX / SPDX 形式の SBOM 生成            |
| `pn` / `pnx` エイリアス          | `pnpm` / `pnpm dlx` の短縮形                 |
| `pnpm audit --fix --interactive` | 修正対象の advisory をインタラクティブに選択 |

---

## 設計上の判断

- **codemod 推奨**: `pnpx codemod run pnpm-v10-to-v11` で `.npmrc` 移行と `allowBuilds` 変換を自動化できる。手動適用と比較して漏れが少ない。
- **`dedupePeers` の即時採用は慎重に**: lockfile の大幅変更を伴うため、別 PR で検証してから採用を判断する。

---

## 参考

- [pnpm v11 Migration Guide](https://pnpm.io/11.x/migration)
- [pnpm v11 Changelog](https://github.com/pnpm/pnpm/blob/main/pnpm/CHANGELOG.md)
