# pnpm exec tsx を使用する決定

## 概要

Prisma seed スクリプト実行時に、従来の `pnpm dlx vite-node` から `pnpm exec tsx` への切り替えを実施しました。

## 背景：vite-node が非推奨となった理由

vite-node は本来、Nuxt 3 の SSR PoC として作成されました。その後、Vitest を実現させるための手段として機能していましたが、Vitest は Vite の公式なビルトイン Environment Module Runner に移行しました。

> "This project is firstly inspired by Nuxt 3's SSR implementation made by @pi0, as a PoC. Later, it made Vitest possible by providing the same pipeline as in Vite. It served the ecosystem well for a few years and later became a more generalized built-in solution as Vite Environment Module Runner. Vitest has migrated to the new official solution, which means vite-node has finished its mission. We will still keep it around for the ecosystem that built around it, but for new projects, please consider using the builtin Vite one instead."

**出典:** [vite-node GitHub Repository](https://github.com/vitest-dev/vitest)

## 検討した代替手段

### 1. Node.js ビルトイン TypeScript サポート（`--experimental-transform-types`）

**要件への適合度:**

- ✅ 高速に動作（ネイティブ処理）
- ✅ TypeScript をサポート
- ✅ サードパーティツール不要

**実装:**

```json
"db:seed": "node --experimental-transform-types ./prisma/seed.ts"
```

**トラブル:**

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '$lib' imported from /usr/src/app/src/lib/utils/contest.ts
```

Node.js v22.17.0 ではビルトイン TypeScript サポートは存在しますが、`vite.config.ts` で定義されたエイリアス（`$lib` など）を解決できません。

**出典:** [Node.js TypeScript Support Documentation](https://nodejs.org/api/typescript.html#type-stripping)

### 2. tsx（選定）✅

**要件への適合度:**

- ✅ 高速に動作（v24.0.0 以降の Node.js より高速）
- ✅ TypeScript をサポート
- ⚠️ サードパーティツール（ただし既に依存パッケージから利用可能）

**実装:**

```json
"db:seed": "pnpm exec tsx ./prisma/seed.ts"
```

**利点:**

- Vite の設定（エイリアス、resolve 設定など）を活用可能
- 既に `node_modules` 内に存在（peer dependency）
- 実行速度が高速

**出典:** [tsx GitHub Repository](https://tsx.is/)

## 決定理由

以下の理由から `pnpm exec tsx` を選定：

1. Vite のエイリアス設定と互換性がある
2. 既に依存パッケージから利用可能（追加インストール不要）
3. 実行速度が高速
4. TypeScript サポートが完全

## Q&A

### Q1: なぜ `pnpm exec` を使うのか（`pnpm dlx` との違い）

**A:** `pnpm dlx` は毎回最新版をレジストリからダウンロードして実行するため、オーバーヘッドが大きいです。一方、`pnpm exec` は `node_modules/.bin/` にインストール済みのバージョンを実行するため、高速です。

```bash
# 毎回最新版をダウンロード（遅い）
pnpm dlx vite-node ./prisma/seed.ts

# インストール済みバージョンを実行（高速）
pnpm exec tsx ./prisma/seed.ts
```

**出典:** [pnpm CLI Documentation](https://pnpm.io/cli/dlx)

### Q2: tsx が既にインストール済みである理由

**A:** tsx は明示的にインストールしていないにもかかわらず、動作します。これは以下の依存パッケージが peer dependency として tsx を指定しているため：

- `@mermaid-js/mermaid-cli` → `postcss-load-config` → `tsx 4.19.2 (peer)`
- `@testing-library/svelte` → `vite` → `tsx 4.19.2 (peer)`
- `vitest` → ... → `tsx 4.19.2 (peer)`

pnpm は peer dependency を自動的にインストール・管理するため、明示的なインストールなしに利用可能です。

**出典:** [pnpm Peer Dependencies Resolution](https://pnpm.io/how-peers-are-resolved)

### Q3: Node.js ネイティブの `--experimental-transform-types` ではダメな理由

**A:** Node.js ネイティブの TypeScript サポートは、型情報を削除するのみで、Vite のビルドツール機能（モジュール解決、エイリアス、ローダーなど）を提供しません。

本プロジェクトの `seed.ts` では以下が必要です：

- **Vite のエイリアス:** `$lib` → `src/lib`
- **ディレクトリインポート:** `./.fabbrica` → `./.fabbrica/index.ts`
- **相対パス解決:** `../src/lib/types/task`

Node.js 単体ではこれらを解決できないため、Vite 互換のツール（tsx など）が必要です。

**出典:**

- [Node.js TypeScript Type Stripping](https://nodejs.org/api/typescript.html#type-stripping)
- [Vite Config Reference](https://vite.dev/config/)

## 実装内容

### package.json の変更

```json
{
  "scripts": {
    "db:seed": "pnpm exec tsx ./prisma/seed.ts"
  }
}
```

### 実行方法

```bash
pnpm db:seed
```

## 参考資料

- vite-node: https://github.com/vitest-dev/vitest
- tsx: https://tsx.is/
- pnpm CLI: https://pnpm.io/cli
- Node.js TypeScript: https://nodejs.org/api/typescript.html
- Vite Configuration: https://vite.dev/config/
