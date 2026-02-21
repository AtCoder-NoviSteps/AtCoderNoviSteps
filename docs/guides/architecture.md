# アーキテクチャガイド

## 1. 3層ディレクトリモデル

コードの配置先を **routes / features / lib** の3層で判断する。

```text
src/
├── routes/      # ルート定義。薄く保つ
├── features/    # 機能スコープのコード（1つの機能ドメインに閉じるもの）
└── lib/         # 真に共通のコード（2つ以上の機能から使われるもの）
```

### 判定基準

```text
このコードはどの機能ドメインで使われるか？
│
├── 1つの機能ドメインに属する
│   → features/{feature}/ に配置
│
└── 複数の機能ドメインで使う
    → lib/ に配置
```

`routes/` にはルーティングファイル（`+page.svelte`, `+page.server.ts`, `+layout.svelte` 等）のみ置く。

**例:**

- `WorkBookForm.svelte` → workbooks ドメイン → `features/workbooks/`
- `TaskTable.svelte` → tasks ドメイン（problems ページで表示） → `features/tasks/`
- `GradeLabel.svelte` → problems・workbooks・admin で使う → `lib/components/`
- `UserService` → auth・admin・users で使う → `lib/server/services/`

---

## 2. src/features/ の構造

feature ディレクトリの内部は技術スタックベースで整理する。`components/` はページ単位でサブディレクトリに分割し、テストはファイル隣接で配置する。

```text
src/features/
├── workbooks/
│   ├── components/
│   │   ├── list/                    # 一覧ページ
│   │   │   ├── WorkBookList.svelte
│   │   │   ├── WorkBookList.test.ts
│   │   │   └── WorkBookBaseTable.svelte
│   │   ├── detail/                  # 詳細ページ
│   │   │   ├── CommentAndHint.svelte
│   │   │   └── PublicationStatusLabel.svelte
│   │   └── shared/                  # feature 内で複数ページから使うもの
│   │   │   ├── WorkBookForm.svelte
│   │   │   ├── WorkBookForm.test.ts
│   │   │   └── WorkBookInputFields.svelte
│   ├── fixtures/                    # テスト用データ
│   ├── services/
│   │   ├── workbooks.ts
│   │   └── workbooks.test.ts
│   ├── stores/
│   │   └── active_workbook_tab.ts
│   ├── types/
│   │   └── workbook.ts
│   └── utils/
│       ├── workbook.ts
│       └── workbook.test.ts
├── tasks/
│   ├── components/
│   │   ├── contest-table/           # コンテスト別
│   │   ├── grade-list/              # グレード別
│   │   ├── detail/
│   │   │   ├── statistics/          # AtCoder Problems の difficulty、JOI 難易度、AC人数 など
│   │   │   ├── votes/               # AtCoder NoviSteps の難易度、タグを投票
│   │   │   └── comments/            # (要確認) 管理者: 解説、一般ユーザ: コメント
│   │   └── shared/
├── admin/
│   ├── components/
│   │   ├── account_transfer/
│   │   ├── tasks-for-import/
│   │   └── shared/
│   ...
├── auth/
└── user-profile/
```

**components/ のサブディレクトリ規約:**

- `list/` — 一覧ページ用コンポーネント
- `detail/` — 詳細ページ用コンポーネント
- `form/` — 作成・編集フォーム用コンポーネント
- `shared/` — feature 内で複数ページから使うコンポーネント

### Feature 分割案

現在の `src/lib/` からの抽出候補:

| Feature          | 抽出対象                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **workbooks**    | `WorkBook/*`, `WorkBooks/*`, `services/workbooks.ts`, `utils/workbook*.ts`, `stores/active_workbook_tab.ts`                                          |
| **tasks**        | `TaskTables/*`, `TaskGrades/*`, `stores/active_problem_list_tab.svelte.ts`（※ `TaskGradeList`, `TaskList` 等は複数ドメインで使うため `lib/` に残す） |
| **admin**        | `TagForm`, `TagListForEdit`, `TaskForm`, `TaskListForEdit`, `services/tags.ts`, `services/task_tags.ts`                                              |
| **auth**         | `AuthForm`, `utils/auth_forms.ts`, `types/auth_forms.ts`                                                                                             |
| **user-profile** | `UserProfile`, `UserAccountDeletionForm`                                                                                                             |

### Feature 間の依存ルール

- `features/` → `lib/` の参照: OK
- `features/A/` → `features/B/` の参照: NG（共通化が必要なら `lib/` に移す）
- `routes/` → `features/` の参照: OK
- `routes/` → `lib/` の参照: OK

---

## 3. src/lib/ に残すもの

2つ以上の feature から使われるコードのみ配置する。

```text
src/lib/
├── actions/        # SvelteKit アクション
├── clients/        # 外部 API クライアント（AtCoder Problems, AOJ）
├── components/     # 共通 UI コンポーネント（GradeLabel, TaskGradeList, TaskList, FormWrapper 等）
├── constants/      # アプリ定数
├── server/         # サーバー専用コード
│   ├── auth.ts
│   ├── database.ts
│   └── services/   # 複数 feature で使うビジネスロジック
├── stores/         # 共通ストア（error_message 等）
├── types/          # 共通型定義
├── utils/          # 共通ユーティリティ
└── zod/            # バリデーションスキーマ
```

`lib/server/` 内のコードはクライアントからインポートできない（SvelteKit が自動でビルド時エラーにする）。

---

## 4. テストコロケーション

### 方針: ファイル隣接配置

テストは対象ファイルの隣に置く。変更時にテストが目に入り、更新忘れを防ぐ。

```text
features/workbooks/services/
├── workbooks.ts
└── workbooks.test.ts       ← 隣接
```

### 共通テスト資産は src/test/ に残す

- テストファクトリ（`@quramy/prisma-fabbrica`）
- テストヘルパー・フィクスチャ
- E2E テスト（`tests/`）

### Vitest 設定

`vite.config.ts` の `include` パターンを更新する:

```ts
include: [
  'src/test/**/*.test.ts', // 既存テスト（段階移行）
  'src/features/**/*.test.ts', // feature 内テスト
];
```

---

## 5. パスエイリアス

`svelte.config.js` でカスタムエイリアスを設定する:

```js
kit: {
  alias: {
    $lib:      './src/lib',
    $features: './src/features',
  },
}
```

```ts
// インポート例
import WorkBookForm from '$features/workbooks/components/WorkBookForm.svelte';
import { formatDate } from '$lib/utils/format';
import type { PageServerLoad } from './$types'; // フレームワーク型は ./$types から
```

`$types` は SvelteKit が `.svelte-kit/types/` に自動生成するフレームワーク型（`PageServerLoad` 等）。ビジネスドメイン型は `$lib/types/` に置く。

---

## 6. 参考資料

### SvelteKit 公式

- [プロジェクト構造](https://svelte.dev/docs/kit/project-structure)
- [ルーティング](https://svelte.dev/docs/kit/routing)
- [高度なルーティング](https://svelte.dev/docs/kit/advanced-routing)
- [サーバー専用モジュール](https://svelte.dev/docs/kit/server-only-modules)

### 設計の参考

- [Next.js App Router アーキテクチャ設計ガイド](https://zenn.dev/yukionishi/articles/cd79e39ea6c172) — `src/features/` パターン、ESLint によるアーキテクチャ境界の自動強制
- [サンプルリポジトリ](https://github.com/YukiOnishi1129/next-app-router-architecture) — 上記記事の実装例
- [Immich](https://github.com/immich-app/immich/tree/main/web/src) — 大規模 SvelteKit アプリの実例（`lib/components/{domain}/` パターン）

### 関連 Issue

- [#601: ディレクトリ構造＆コロケーション](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/601)
