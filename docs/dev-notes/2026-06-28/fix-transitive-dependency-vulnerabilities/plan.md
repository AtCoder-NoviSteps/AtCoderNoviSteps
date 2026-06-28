# Dependabot セキュリティ脆弱性の対処計画

調査結果・リスク評価・リリースノート確認は [survey.md](survey.md) を参照。

## 対処方針

### 方法: pnpm-workspace.yaml の overrides で transitive dependency を強制的に安全なバージョンに引き上げる

`pnpm-workspace.yaml` に `overrides` セクションを追加し、脆弱な transitive dependency のバージョンを上書きする。

```yaml
# pnpm-workspace.yaml に追加
overrides:
  # high
  'path-to-regexp@>=6.0.0 <6.3.0': '6.3.0'
  'path-to-regexp@>=8.0.0 <8.4.0': '8.4.0'
  'tar@>=7.0.0 <7.5.8': '7.5.16'
  'minimatch@>=10.0.0 <10.2.3': '10.2.3'
  'undici@>=5.0.0 <5.28.5': '5.28.5'
  'undici@>=6.0.0 <6.27.0': '6.27.0'
  'undici@>=7.0.0 <7.28.0': '7.28.0'
  'effect@>=3.0.0 <3.20.0': '3.20.0'
  'defu@<6.1.5': '6.1.5'
  'devalue@<5.8.1': '5.8.1'
  # moderate
  'ajv@>=8.0.0 <8.18.0': '8.18.0'
  'brace-expansion@>=1.0.0 <1.1.13': '1.1.13'
  'js-yaml@>=4.0.0 <=4.1.1': '4.2.0'
  'postcss@>=8.0.0 <8.5.10': '8.5.10'
  'smol-toml@>=1.0.0 <1.6.1': '1.6.1'
  # low
  'cookie@<0.7.0': '0.7.0'
  '@tootallnate/once@>=2.0.0 <2.0.1': '2.0.1'
```

**対処しないもの**: `ts-deepmerge`（メジャー）、`uuid`（メジャー×2）、`srvx`（0.x マイナー）は override で親ライブラリが壊れるリスクが高いため上流の修正待ち。`joi` はパッチ範囲だが superforms の validation 挙動に影響する可能性があるためペンディング。詳細は [survey.md](survey.md) の「overrides で対処が難しいもの」を参照。

### 実施手順

1. `pnpm-workspace.yaml` に `overrides` セクションを追加
2. `pnpm install` で lockfile を更新
3. `pnpm audit` で脆弱性が解消されたことを確認
4. `pnpm build` + `pnpm test:unit` で互換性を確認

### 実施結果

**high 脆弱性: 17件 → 3件**（14件解消）

解消済み:

- path-to-regexp (2件) → 6.3.0 / 8.4.0 に override ✓
- tar (3件) → 7.5.16 に override ✓
- minimatch (3件) → 10.2.3 に override ✓
- undici 6.x → 6.27.0 に override ✓
- undici 7.x → 7.28.0 に override ✓
- effect → 3.20.0 に override ✓
- defu → 6.1.5 に override ✓
- devalue → 5.8.1 に override ✓

残存（対処不能）:

- **undici 5.x** (5.28.5 / 5.29.0) — 3件残存。advisory の patched version が `>=6.24.0` / `>=6.27.0` であり、5.x 系にはバックポートされていない。`@vercel/node` と `vercel` が undici 5.x に依存しており、メジャーバージョンの override（5.x → 6.x）は互換性破壊のリスクが高い。全て devDependency 経由のため**本番影響なし**。vercel 側で undici 6.x+ に移行されるまで解消不可

**moderate/low 脆弱性: 21件 → 10件**（11件解消）

解消済み:

- undici 7.x → 7.28.0 に override ✓（high の override で兼ねる）
- ajv → 8.18.0 に override ✓
- brace-expansion → 1.1.13 に override ✓
- js-yaml → 4.2.0 に override ✓
- postcss → 8.5.10 に override ✓
- smol-toml → 1.6.1 に override ✓
- cookie → 0.7.0 に override ✓
- @tootallnate/once → 2.0.1 に override ✓

残存（対処保留）:

- ts-deepmerge / uuid / srvx / joi（上記「対処しないもの」参照）

検証結果:

- `pnpm build`: ✓ pass（SvelteKit + adapter-vercel ビルド成功）
- `pnpm test:unit`: ✓ 78 ファイル / 2662 テスト全 pass
- vercel: 54.14.5 → 54.18.0 に更新（54.18.1 は `minimumReleaseAge` 制限により翌日以降に更新可能）

## 検証方法

単体テスト以外にも複数の検証手段がある。特に `pnpm build` が最重要 — vercel 系の脆弱性は全て `@sveltejs/adapter-vercel` → `vercel` 経由のビルドパイプラインで使われるため、ビルドが通れば実用上の互換性は保証される。

```bash
pnpm install          # lockfile 更新時点でバージョン不整合があればエラー
pnpm check            # TypeScript 型レベルの互換性チェック
pnpm build            # SvelteKit ビルド（vercel adapter 経由）→ vercel 系 override の互換性検証
pnpm test:unit        # サービス層・ユーティリティ（prisma-fabbrica / superforms 経由の devalue も間接的にカバー）
pnpm test:e2e         # ブラウザ経由の統合テスト
pnpm db:seed          # prisma-fabbrica が effect 経由で壊れていればここで検出
pnpm audit            # 残存脆弱性を確認
```
