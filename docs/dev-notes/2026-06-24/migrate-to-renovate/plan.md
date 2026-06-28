# Dependabot → Renovate 移行計画

## 背景

Dependabot で依存関係の自動更新が停止している。

### エラー内容

```
Error whilst updating svelte in /pnpm-lock.yaml:
[ERR_PNPM_NO_MATCHING_VERSION] No matching version found for @types/jsdom@28.0.3
while fetching it from https://npm.pkg.github.com/
```

- `@types/jsdom@28.0.3` は npmjs.com には存在するが、GitHub Packages レジストリには `16.2.14` までしかミラーされていない
- `@types/node`, `@types/jest` でも同様のエラーが発生
- プロジェクト側には `.npmrc` がなく、レジストリ設定に問題はない。Dependabot が `npm.pkg.github.com` を base registry として注入しているのが原因（後述）

### 根本原因

Dependabot の pnpm サポートが不十分（2つの独立したバグ）。

**① GitHub Packages の誤注入（直接原因）**

- Dependabot は組織内に GitHub Packages のパッケージが 1 つでもあると、その組織の全リポジトリに対して `npm.pkg.github.com` を base registry として能動的に注入する
- pnpm v11.6 以降はレジストリ間フォールバックを行わないため、GitHub Packages にミラーされていないバージョンで即死する（npm はフォールバックするため同条件で影響が出ない）。**v11.5 まで正常動作を確認しており、11.6 から挙動が変わったとみられる**
- `.npmrc` への明示設定や `dependabot.yml` の `registries` 設定を試みても Dependabot の注入に上書きされるため回避不可
- 同一症状が [dependabot-core #15415](https://github.com/dependabot/dependabot-core/issues/15415)（2026-06-26 オープン）・[#15411](https://github.com/dependabot/dependabot-core/issues/15411) で複数報告されており、修正 PR は未存在
- 暫定回避策として [PR #13709](https://github.com/dependabot/dependabot-core/pull/13709)（スコープドパッケージを replaces-base レジストリから除外）がドラフト段階にあるが、Copilot 生成でレビュー前
- **暫定ダウングレード（pnpm 11.5）も有効な選択肢**だが、Renovate 移行と比べてコストに差がないため本プロジェクトでは採用せず

**② pnpm v9+ lockfile パース問題（付随原因）**

- `package-ecosystem: 'pnpm'` は存在せず、`npm` を指定して lockfile から自動検出する方式のみ
- pnpm v9+ の lockfile（`lockfileVersion: '9.0'`）のパース問題が未解決（[dependabot-core #10871](https://github.com/dependabot/dependabot-core/issues/10871)）
- パーサー修正の [PR #15367](https://github.com/dependabot/dependabot-core/pull/15367) は 2026-06-22 時点で未マージ
- このプロジェクトは pnpm v11.6.0（lockfileVersion 9.0）を使用しており、Dependabot の対応範囲外

## 代替ツール比較

pnpm v11 対応・GitHub Actions 連携・無料枠・安定性の4点で評価。

| ツール         | pnpm v11 | GitHub 連携                  | 無料枠                         | 安定性                        | 総合 |
| -------------- | -------- | ---------------------------- | ------------------------------ | ----------------------------- | ---- |
| **Renovate**   | ✅       | GitHub App（設定不要に近い） | 公開/私有とも無制限            | ◎ 90+パッケージマネージャ対応 | ◎    |
| **Snyk**       | ✅       | App + CLI + Actions          | OSS 無制限、私有 200 テスト/月 | ◎ セキュリティ特化            | ○    |
| **Depfu**      | ✅       | GitHub App                   | OSS 無料、私有は有料           | ○ コミュニティ小さめ          | △    |
| **ncu**        | ✅       | 自前で Actions 構築が必要    | 完全無料（OSS）                | ○ CLI 単体                    | △    |
| **Dependabot** | ❌       | 組み込み                     | 無料                           | ✗ pnpm v9+ 停滞中             | ✗    |

**結論: 4条件を全て満たすのは Renovate のみ。**

- Snyk はセキュリティスキャン寄りで、バージョン更新の自動化は副次機能。GitHub Cloud App が pnpm 未対応
- Depfu は私有リポで有料
- ncu は DIY 前提で PR 作成も別途必要

## Renovate の pnpm v11 対応状況

### `overrides`（pnpm-workspace.yaml）

**対応済み。**

- [Issue #36834](https://github.com/renovatebot/renovate/issues/36834) → [PR #42247](https://github.com/renovatebot/renovate/pull/42247)、2026-04-08 マージ済み
- 公式ドキュメントに `pnpm-workspace.overrides` が depType として明記
- `package.json` の `pnpm.overrides`（旧形式）と `pnpm-workspace.yaml` の `overrides`（v11 形式）の両方を抽出可能

### `patchedDependencies`

**Renovate の depType 一覧に未記載。** ただし以下の理由でブロッカーにはならない:

- `patchedDependencies` はパッチファイルへのパスを定義するフィールドであり、バージョン更新の対象ではない
- `pnpm-workspace.yaml` の設定であり lockfile ではないため、Renovate が書き換える対象外
- パッチ対象パッケージが更新された際にパッチ適用が失敗すれば CI で検知できる

**現状このプロジェクトでは `overrides` も `patchedDependencies` も未使用。** 近い将来 `patchedDependencies` を導入予定だが、上記の理由で Renovate との共存に問題はない。

## Q&A 要約

| 質問                                                                                                     | 回答                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.npmrc` に `registry=` を追加すれば解決するのでは？                                                     | Dependabot の pnpm v11 非対応は残るため、レジストリ問題だけの小手先修正にしかならない                                                                                                                                         |
| pnpm 固有のレジストリ設定はないのか？                                                                    | pnpm のレジストリ設定は `.npmrc` が正規の方法。`pnpm-workspace.yaml` には置けない                                                                                                                                             |
| `.npmrc` をあえて追加する意義は？                                                                        | このプロジェクトは `.npmrc` なしで全環境が動いている。問題は Dependabot 環境だけなので、プロジェクト全体の設定を変えるのは過剰                                                                                                |
| `dependabot.yml` に `registries` を追加すれば？                                                          | レジストリ問題は回避できるかもしれないが、pnpm v11 lockfile 非対応の問題は残る                                                                                                                                                |
| Dependabot で `package-ecosystem: 'pnpm'` を指定できないのか？                                           | 存在しない。`npm` を指定して lockfile から自動検出する方式のみ                                                                                                                                                                |
| [dependabot-core PR #15367](https://github.com/dependabot/dependabot-core/pull/15367) で解決するのでは？ | pnpm v9+ lockfile のパースクラッシュ修正だが未マージ。レジストリ解決の問題を直接修正する PR ではない                                                                                                                          |
| `patchedDependencies` と `overrides` の違いは？                                                          | `overrides`: transitive dep のバージョン強制上書き。`patchedDependencies`: ソースコードにパッチファイルを適用。用途は異なるが、上流がセキュリティ修正を取り込まない場合にパッチで対処するという点では本質的に同じ問題への対応 |

## 移行手順

## 進捗

| Phase   | 内容              | 状態                                         |
| ------- | ----------------- | -------------------------------------------- |
| Phase 1 | Renovate 導入     | ✅ 完了                                      |
| Phase 2 | Dependabot 無効化 | ✅ 完了                                      |
| Phase 3 | 動作確認          | 🔄 進行中（Renovate 導入済みだが PR 未作成） |

### Phase 1: Renovate 導入

1. GitHub に [Renovate GitHub App](https://github.com/apps/renovate) をインストール（「Renovate only」を選択、「Scan and Alert」モードを選択）
2. リポジトリルートに `renovate.json` を追加:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "minimumReleaseAge": "1 day",
  "rangeStrategy": "increase",
  "packageRules": [
    {
      "matchPackageNames": ["prisma", "@prisma/client", "tsx", "vercel"],
      "minimumReleaseAge": "0 days"
    }
  ]
}
```

設定の根拠:

| 設定                         | 対応する既存設定                                    | 理由                                                                                                         |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `minimumReleaseAge: "1 day"` | `pnpm-workspace.yaml` の `minimumReleaseAge: 1440`  | リリース後1日未満のパッケージで PR を作らない。pnpm 側でも拒否されるため、整合性を取ることで無駄な PR を防ぐ |
| `packageRules` で除外        | `minimumReleaseAgeExclude`                          | prisma, tsx, vercel は即時更新を許可                                                                         |
| `rangeStrategy: "increase"`  | `dependabot.yml` の `versioning-strategy: increase` | semver range の下限を上げる（`^1.0.0` → `^1.1.0`）                                                           |

- `github-actions` の更新は `config:recommended` に含まれるため追加設定不要
- スケジュールはデフォルト（rate limit 付きで随時更新）で十分

3. Renovate が自動で Onboarding PR を作成するので、内容を確認してマージ

### Phase 2: Dependabot 無効化

1. `.github/dependabot.yml` の npm セクションを削除（github-actions セクションも `config:recommended` でカバーされるため全体を削除可能）
2. Dependabot が作成済みの未マージ PR をクローズ

### Phase 3: 動作確認

- Onboarding PR マージ後、Renovate が依存関係更新の PR を作成することを確認
- CI が正常に通ることを確認（`minimumReleaseAge` の整合性により `pnpm install` が失敗しないこと）
