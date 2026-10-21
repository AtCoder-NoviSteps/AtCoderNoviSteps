# アーキテクチャガイド

この文書では、実装済みの構成と将来案を分けて記載する。配置判断では「現在の構成・規約」を正とし、「将来案・未実装」は新規タスクの承認なしに適用しない。

## 現在の構成・規約

### 1. routes / features / lib

コードの配置先は、責務と利用範囲で判断する。

```text
src/
├── routes/      # SvelteKit の route と HTTP 境界
├── features/    # 1つの機能ドメインに閉じるコード
└── lib/         # 2つ以上の機能から使う共通コード
```

```text
SvelteKit の route 自体か？
├── yes → routes/
└── no
    ├── 1つの機能ドメインだけで使う → features/{feature}/
    └── 2つ以上の機能で使う       → lib/
```

- `features/` から `lib/` への参照は許可する。
- `features/A/` から `features/B/` は参照しない。共通化が必要なら `lib/` へ移す。
- `routes/` から `features/` と `lib/` への参照は許可する。
- route は認証・入力・HTTP 応答の変換を担当し、ビジネスロジックを持たない。

### 2. 実装済み feature

```text
src/features/
├── account/
│   ├── components/{delete,settings}/
│   └── services/
├── auth/
│   ├── server/
│   ├── services/
│   └── utils/
├── tasks/
│   ├── components/contest-table/
│   ├── fixtures/contest-table/
│   ├── stores/
│   ├── types/contest-table/
│   └── utils/contest-table/
├── votes/
│   ├── actions/
│   ├── components/
│   ├── constants/
│   ├── internal_clients/
│   ├── server/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── zod/
└── workbooks/
    ├── components/{list,detail,shared}/
    ├── fixtures/
    ├── server/
    ├── services/
    ├── stores/
    ├── types/
    ├── utils/
    └── zod/
```

feature 内は技術的な役割で分ける。必要なディレクトリだけ作り、空の標準構成を先に作らない。

- `components/`: UI。必要なら `list/`、`detail/`、`shared/` で分割する。
- `services/`: framework 非依存のビジネスロジック。値または `null` を返す。
- `server/`: request-scoped handle、cookie、crypto、cache などのサーバ専用コード。
- `internal_clients/`: feature 内だけで使う外部 API client。
- `utils/`: 副作用のない関数。テストを隣接配置する。
- `stores/`: Svelte Runes を使う `.svelte.ts`。

SvelteKit 3 は server-only のモジュールを client から import すると build で失敗させる。ファイル名が `server.*`・`*.server.*` のモジュールは場所を問わず server-only になる。`server/` ディレクトリ内のモジュールは、`src/routes`・`static` 内を除いて server-only になり、`features/{feature}/server/` も対象になる。複数 feature で使うサーバコードは `src/lib/server/` へ移す。

### 3. src/lib

`src/lib/services/` は廃止予定の移行先ではなく、複数 feature から利用する business logic の現行配置である。

```text
src/lib/
├── actions/        # 共通 SvelteKit actions
├── clients/        # 共通の外部 API clients
├── components/     # 共通 UI components
├── constants/      # 共通定数
├── contests/       # コンテスト分類ドメイン
├── server/         # 共通の server-only infrastructure
│   ├── database.ts
│   └── tasks/
├── services/       # 複数 feature で使う business logic
├── stores/         # 共通 stores
├── types/          # 共通 domain types
├── utils/          # 共通 pure utilities
└── zod/            # 共通 validation schemas
```

`src/lib/server/` は SvelteKit の server-only module として client import がビルド時に拒否される。route handler は Prisma を直接 import せず、service を呼び出す。

### 4. admin route の colocation 例外

管理画面の単一ページにだけ属し、認証・認可やページ固有 layout と強く結びつくコードは、route 直下へ colocate してよい。

```text
src/routes/(admin)/workbooks/order/
├── +page.svelte
├── +page.server.ts
├── +server.ts
├── _components/
├── _fixtures/
├── _types/
└── _utils/
    ├── kanban.ts
    └── kanban.test.ts
```

- `_types/` は型だけ、`_utils/` は pure function だけを置く。
- `_utils/` のテストは隣接配置する。
- 他ページから使い始めたら `features/` または `lib/` へ移す。
- 一般 route の標準配置にはしない。

### 5. テストの配置と検出

- feature、lib、route-local utility のテストは対象ファイルに隣接させる。
- 段階移行中の共通テストは `src/test/` に残してよい。
- E2E test は `e2e/` に置き、`.spec.ts` を使う。

`vite.config.ts` は現在、次の unit test を検出する。

```typescript
include: [
  'src/lib/**/*.test.ts',
  'src/test/**/*.test.ts',
  'src/features/**/*.test.ts',
  'src/routes/**/*.test.ts',
];
```

### 6. subpath imports（`#lib`・`#features`）

- **使う:** `src/lib` は `#lib/*`、`src/features` は `#features/*`（`package.json#imports` で定義）。
- **使わない:** `$lib`・`$features`・`@/`。SvelteKit 3 は組み込みの `$lib` を削除し、`alias` オプションも非推奨にしたため、どれも解決されず型チェックと build で失敗する。`vite.config.ts` の `sveltekit()` にも alias を足さない。
- **拡張子は明示する:** TS モジュールは `.js`、コンポーネントは `.svelte`、runes モジュール（`.svelte.ts`）は `.svelte.js`。`vi.mock` の specifier も同じ形にする。

```typescript
// OK
import { formatDate } from '#lib/utils/format.js';
import WorkBookForm from '#features/workbooks/components/shared/WorkBookForm.svelte';
import type { PageServerLoad } from './$types';

// NG: SvelteKit 3 では解決されない
import { formatDate } from '$lib/utils/format';
```

`$lib` は、静的・動的 import、`.ts`・`.svelte`、`vi.mock` のどれで書いても型チェックか Vite（dev・build・Vitest）で失敗し、SvelteKit が `module_removed_lib` で `#lib` への書き換えを案内する。oxlint と ESLint の `no-restricted-imports` でも禁止しているので、commit 前の lint でも止まる。
`$features`・`@/` は import なら型チェックで失敗するが、`vi.mock('$features/...')` は解決されないまま無視され、mock が効かずに本物のモジュールが使われる。specifier をまとめて変えたときは、`rg -n '\$lib|\$features|@/' src e2e prisma` で残りが無いことを確かめる。

`$types` は SvelteKit が生成する route 型専用で、domain type は `src/**/types/` に置く。

## 将来案・未実装

以下は候補であり、現在の必須構成ではない。

- 管理画面の複数 route で共有される UI や service が増えた場合に、`features/admin/` を作る。
- account と auth から独立した公開プロフィール機能が必要になった場合に、 `features/user-profile/` を作る。
- `src/lib/` の既存コードを、利用箇所の監査後に各 feature へ段階的に移す。
- feature 間依存を ESLint 等で機械的に検査する。

ディレクトリを先に作ると境界が形骸化するため、2つ目の実利用が生じた時点で共通化を判断する。

## 参考資料

- [SvelteKit project structure](https://svelte.dev/docs/kit/project-structure)
- [SvelteKit routing](https://svelte.dev/docs/kit/advanced-routing)
- [SvelteKit server-only modules](https://svelte.dev/docs/kit/server-only-modules)
- [Issue #601: ディレクトリ構造＆コロケーション](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/601)
