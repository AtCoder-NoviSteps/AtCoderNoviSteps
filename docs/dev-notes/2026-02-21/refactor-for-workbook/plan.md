# workbooks 機能の features/ 集約 実装計画

## コンテキスト

GitHub issue #3193「[Refactor] 問題集機能に関するファイルをfeatures dir に集約しましょう」に基づく実装。

**目的**: 問題集並び替え機能を円滑に実装するため、workbooks 関連ファイルを `src/features/workbooks/` に集約する。

**方針**:

- `docs/guides/architecture.md` の3層ディレクトリモデルに従う
- コンポーネントはページベース (list/, detail/, shared/) で整理
- テストはファイル隣接配置に移行
- ファイルの内部構造は変更せず、パスの修正のみ実施

## 移動するファイル (合計 29 ファイル)

### 1. types/ (1ファイル)

```
src/lib/types/workbook.ts → src/features/workbooks/types/workbook.ts
```

### 2. services/ (2ファイル)

```
src/lib/services/workbooks.ts → src/features/workbooks/services/workbooks.ts
src/lib/services/workbook_tasks.ts → src/features/workbooks/services/workbook_tasks.ts
```

### 3. utils/ (3ファイル)

```
src/lib/utils/workbook.ts → src/features/workbooks/utils/workbook.ts
src/lib/utils/workbooks.ts → src/features/workbooks/utils/workbooks.ts
src/lib/utils/workbook_tasks.ts → src/features/workbooks/utils/workbook_tasks.ts
```

### 4. stores/ (3ファイル)

```
src/lib/stores/active_workbook_tab.ts → src/features/workbooks/stores/active_workbook_tab.ts
src/lib/stores/replenishment_workbook.svelte.ts → src/features/workbooks/stores/replenishment_workbook.svelte.ts
src/lib/stores/task_grades_by_workbook_type.ts → src/features/workbooks/stores/task_grades_by_workbook_type.ts
```

### 5. zod/ (新規作成)

**src/lib/zod/schema.ts から抽出**:

- `workBookTaskSchema` (44-49行)
- `workBookSchema` (51-94行)
- 依存する import: `WorkBookType`, `isValidUrl`, `isValidUrlSlug`

**新規ファイル**: `src/features/workbooks/zod/schema.ts`

**src/lib/zod/schema.ts から削除**:

- 上記の2スキーマと WorkBookType の import

### 6. components/ (9ファイル)

#### list/ - 一覧ページ用 (4ファイル)

```
src/lib/components/WorkBooks/WorkBookList.svelte → src/features/workbooks/components/list/WorkBookList.svelte
src/lib/components/WorkBooks/WorkBookBaseTable.svelte → src/features/workbooks/components/list/WorkBookBaseTable.svelte
src/lib/components/WorkBooks/TitleTableHeadCell.svelte → src/features/workbooks/components/list/TitleTableHeadCell.svelte
src/lib/components/WorkBooks/TitleTableBodyCell.svelte → src/features/workbooks/components/list/TitleTableBodyCell.svelte
```

#### detail/ - 詳細ページ用 (2ファイル)

```
src/lib/components/WorkBookTasks/WorkBookTasksTable.svelte → src/features/workbooks/components/detail/WorkBookTasksTable.svelte
src/lib/components/WorkBook/CommentAndHint.svelte → src/features/workbooks/components/detail/CommentAndHint.svelte
```

**理由**: CommentAndHint は詳細ページ (`src/routes/workbooks/[slug]/+page.svelte`) のみで使用

#### shared/ - 複数ページで使用 (3ファイル)

```
src/lib/components/WorkBook/WorkBookForm.svelte → src/features/workbooks/components/shared/WorkBookForm.svelte
src/lib/components/WorkBook/WorkBookInputFields.svelte → src/features/workbooks/components/shared/WorkBookInputFields.svelte
src/lib/components/WorkBooks/PublicationStatusLabel.svelte → src/features/workbooks/components/shared/PublicationStatusLabel.svelte
```

**理由**:

- WorkBookForm は作成・編集の両方で使用 → shared/
- PublicationStatusLabel は一覧・詳細の両方で使用 → shared/

### 7. テストファイル (7ファイル) - ファイル隣接配置

```
src/test/lib/stores/active_workbook_tab.test.ts → src/features/workbooks/stores/active_workbook_tab.test.ts
src/test/lib/stores/replenishment_workbook.test.ts → src/features/workbooks/stores/replenishment_workbook.test.ts
src/test/lib/stores/task_grades_by_workbook_type.test.ts → src/features/workbooks/stores/task_grades_by_workbook_type.test.ts
src/test/lib/utils/workbook.test.ts → src/features/workbooks/utils/workbook.test.ts
src/test/lib/utils/workbook_tasks.test.ts → src/features/workbooks/utils/workbook_tasks.test.ts
src/test/lib/utils/workbooks.test.ts → src/features/workbooks/utils/workbooks.test.ts
src/test/lib/zod/workbook_schema.test.ts → src/features/workbooks/zod/schema.test.ts
```

### 8. fixtures/ (1ファイル)

```
prisma/workbooks.ts → src/features/workbooks/fixtures/workbooks.ts
```

**prisma/seed.ts の更新**:

```typescript
// Before
import { workbooks } from './workbooks';

// After
import { workbooks } from '../src/features/workbooks/fixtures/workbooks';
```

## import パス更新が必要なファイル

### routes/ (9ファイル)

1. `src/routes/workbooks/+page.svelte`
2. `src/routes/workbooks/+page.server.ts`
3. `src/routes/workbooks/[slug]/+page.svelte`
4. `src/routes/workbooks/[slug]/+page.server.ts`
5. `src/routes/workbooks/create/+page.svelte`
6. `src/routes/workbooks/create/+page.server.ts`
7. `src/routes/workbooks/edit/[slug]/+page.svelte`
8. `src/routes/workbooks/edit/[slug]/+page.server.ts`
9. `src/routes/sitemap.xml/+server.ts`

### lib/components/ (5ファイル) - workbook 型を使用

1. `src/lib/components/SubmissionStatus/AcceptedCounter.svelte`
2. `src/lib/components/ThermometerProgressBar.svelte`
3. `src/lib/components/Trophies/CompletedTasks.svelte`
4. `src/lib/components/TaskSearchBox.svelte`
5. `src/lib/components/TabItemWrapper.svelte`

**変更例**:

```typescript
// Before
import { WorkBookType } from '$lib/types/workbook';
import { activeWorkbookTabStore } from '$lib/stores/active_workbook_tab';

// After
import { WorkBookType } from '$features/workbooks/types/workbook';
import { activeWorkbookTabStore } from '$features/workbooks/stores/active_workbook_tab';
```

### lib/services/ (1ファイル)

- `src/lib/services/task_results.ts`

### lib/utils/ (1ファイル)

- `src/lib/utils/task.ts`

### test/ (2ファイル)

- `src/test/lib/utils/task.test.ts`
- `src/test/lib/utils/test_cases/task_results.ts`

### prisma/ (1ファイル)

- `prisma/seed.ts`

### zod/ (1ファイル)

- `src/lib/zod/schema.ts` (workbook スキーマを削除)

**合計**: 21 ファイルで import パス更新が必要

## import パターン

### 更新前

```typescript
import type { WorkBook } from '$lib/types/workbook';
import { getWorkbookWithAuthor } from '$lib/utils/workbook';
import * as workBooksCrud from '$lib/services/workbooks';
import WorkBookForm from '$lib/components/WorkBook/WorkBookForm.svelte';
import { activeWorkbookTabStore } from '$lib/stores/active_workbook_tab';
import { workBookSchema } from '$lib/zod/schema';
```

### 更新後

```typescript
import type { WorkBook } from '$features/workbooks/types/workbook';
import { getWorkbookWithAuthor } from '$features/workbooks/utils/workbook';
import * as workBooksCrud from '$features/workbooks/services/workbooks';
import WorkBookForm from '$features/workbooks/components/shared/WorkBookForm.svelte';
import { activeWorkbookTabStore } from '$features/workbooks/stores/active_workbook_tab';
import { workBookSchema } from '$features/workbooks/zod/schema';
```

## 実装手順

### Phase 1: ディレクトリ構造作成

```bash
mkdir -p src/features/workbooks/{components/{list,detail,shared},fixtures,services,stores,types,utils,zod}
```

### Phase 2: ファイル移動 (依存関係の順序)

**順序が重要**: 依存される側から移動

1. **types/** (最も依存される)

   ```bash
   git mv src/lib/types/workbook.ts src/features/workbooks/types/workbook.ts
   ```

2. **utils/**

   ```bash
   git mv src/lib/utils/workbook.ts src/features/workbooks/utils/workbook.ts
   git mv src/lib/utils/workbooks.ts src/features/workbooks/utils/workbooks.ts
   git mv src/lib/utils/workbook_tasks.ts src/features/workbooks/utils/workbook_tasks.ts
   ```

3. **zod/** - 新規作成 (src/lib/zod/schema.ts から抽出)

4. **services/**

   ```bash
   git mv src/lib/services/workbooks.ts src/features/workbooks/services/workbooks.ts
   git mv src/lib/services/workbook_tasks.ts src/features/workbooks/services/workbook_tasks.ts
   ```

5. **stores/**

   ```bash
   git mv src/lib/stores/active_workbook_tab.ts src/features/workbooks/stores/active_workbook_tab.ts
   git mv src/lib/stores/replenishment_workbook.svelte.ts src/features/workbooks/stores/replenishment_workbook.svelte.ts
   git mv src/lib/stores/task_grades_by_workbook_type.ts src/features/workbooks/stores/task_grades_by_workbook_type.ts
   ```

6. **components/**

   ```bash
   # list/
   git mv src/lib/components/WorkBooks/WorkBookList.svelte src/features/workbooks/components/list/WorkBookList.svelte
   git mv src/lib/components/WorkBooks/WorkBookBaseTable.svelte src/features/workbooks/components/list/WorkBookBaseTable.svelte
   git mv src/lib/components/WorkBooks/TitleTableHeadCell.svelte src/features/workbooks/components/list/TitleTableHeadCell.svelte
   git mv src/lib/components/WorkBooks/TitleTableBodyCell.svelte src/features/workbooks/components/list/TitleTableBodyCell.svelte

   # detail/
   git mv src/lib/components/WorkBookTasks/WorkBookTasksTable.svelte src/features/workbooks/components/detail/WorkBookTasksTable.svelte
   git mv src/lib/components/WorkBook/CommentAndHint.svelte src/features/workbooks/components/detail/CommentAndHint.svelte

   # shared/
   git mv src/lib/components/WorkBook/WorkBookForm.svelte src/features/workbooks/components/shared/WorkBookForm.svelte
   git mv src/lib/components/WorkBook/WorkBookInputFields.svelte src/features/workbooks/components/shared/WorkBookInputFields.svelte
   git mv src/lib/components/WorkBooks/PublicationStatusLabel.svelte src/features/workbooks/components/shared/PublicationStatusLabel.svelte
   ```

7. **fixtures/**

   ```bash
   git mv prisma/workbooks.ts src/features/workbooks/fixtures/workbooks.ts
   ```

8. **テスト** (対応するファイルの隣に配置)
   ```bash
   git mv src/test/lib/stores/active_workbook_tab.test.ts src/features/workbooks/stores/active_workbook_tab.test.ts
   git mv src/test/lib/stores/replenishment_workbook.test.ts src/features/workbooks/stores/replenishment_workbook.test.ts
   git mv src/test/lib/stores/task_grades_by_workbook_type.test.ts src/features/workbooks/stores/task_grades_by_workbook_type.test.ts
   git mv src/test/lib/utils/workbook.test.ts src/features/workbooks/utils/workbook.test.ts
   git mv src/test/lib/utils/workbook_tasks.test.ts src/features/workbooks/utils/workbook_tasks.test.ts
   git mv src/test/lib/utils/workbooks.test.ts src/features/workbooks/utils/workbooks.test.ts
   git mv src/test/lib/zod/workbook_schema.test.ts src/features/workbooks/zod/schema.test.ts
   ```

### Phase 3: import パス更新

すべてのファイル (21ファイル + features/workbooks/ 内部) で `$lib` → `$features/workbooks` に変更

### Phase 4: 空ディレクトリの削除

```bash
rmdir src/lib/components/WorkBook
rmdir src/lib/components/WorkBooks
rmdir src/lib/components/WorkBookTasks
```

### Phase 5: 検証

1. **TypeScript 型チェック**

   ```bash
   pnpm check
   ```

2. **ビルド確認**

   ```bash
   pnpm build
   ```

3. **単体テスト実行**

   ```bash
   pnpm test:unit
   ```

4. **E2E テスト実行**

   ```bash
   pnpm test:integration
   ```

5. **Lint/Format**

   ```bash
   pnpm lint
   pnpm format
   ```

6. **開発サーバー起動確認**

   ```bash
   pnpm dev
   ```

   - http://localhost:5174/workbooks にアクセス
   - 一覧・詳細・作成・編集ページの動作確認

## 注意事項

### 1. zod/schema.ts の分離

`src/lib/zod/schema.ts` には workbook 以外のスキーマ (authSchema, accountSchema) も含まれるため、workbook 関連のみを抽出し、他は残す。

### 2. 共通コンポーネントからの依存

`lib/components/` の以下のコンポーネントが workbook 型を使用するため、import パス更新が必要:

- AcceptedCounter.svelte
- ThermometerProgressBar.svelte
- Trophies/CompletedTasks.svelte
- TaskSearchBox.svelte
- TabItemWrapper.svelte

### 3. WorkBookType enum の扱い

WorkBookType は Prisma の enum を re-export している (`@prisma/client` → `WorkBookType`)。複数箇所で使用されるが、workbooks ドメインに属するため features/workbooks/types/ に配置。

### 4. features 間の依存禁止

features/workbooks/ から他の features への参照は禁止。lib/ への参照のみ許可。

## 完了後のディレクトリ構造

```
src/features/workbooks/
├── components/
│   ├── list/
│   │   ├── WorkBookList.svelte
│   │   ├── WorkBookBaseTable.svelte
│   │   ├── TitleTableHeadCell.svelte
│   │   └── TitleTableBodyCell.svelte
│   ├── detail/
│   │   ├── WorkBookTasksTable.svelte
│   │   └── CommentAndHint.svelte
│   └── shared/
│       ├── WorkBookForm.svelte
│       ├── WorkBookInputFields.svelte
│       └── PublicationStatusLabel.svelte
├── fixtures/
│   └── workbooks.ts
├── services/
│   ├── workbooks.ts
│   └── workbook_tasks.ts
├── stores/
│   ├── active_workbook_tab.ts
│   ├── active_workbook_tab.test.ts
│   ├── replenishment_workbook.svelte.ts
│   ├── replenishment_workbook.test.ts
│   ├── task_grades_by_workbook_type.ts
│   └── task_grades_by_workbook_type.test.ts
├── types/
│   └── workbook.ts
├── utils/
│   ├── workbook.ts
│   ├── workbook.test.ts
│   ├── workbooks.ts
│   ├── workbooks.test.ts
│   ├── workbook_tasks.ts
│   └── workbook_tasks.test.ts
└── zod/
    ├── schema.ts
    └── schema.test.ts
```

## 重要ファイル

実装時に特に注意が必要なファイル:

1. **src/lib/types/workbook.ts** - 最も多くの依存関係を持つ型定義
2. **src/lib/zod/schema.ts** - workbook スキーマの抽出が必要 (他のスキーマは残す)
3. **src/routes/workbooks/+page.svelte** - 多くのコンポーネント・型を import
4. **prisma/seed.ts** - fixtures の import パス変更
5. **src/lib/components/TabItemWrapper.svelte** - 共通コンポーネントからの workbook 型使用
