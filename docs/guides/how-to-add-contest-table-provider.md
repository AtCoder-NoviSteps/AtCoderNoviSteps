# ContestTableProvider 実装・テストガイド

## 概要

競技プログラミングコンテストサイト の各コンテスト種別に対応した `ContestTableProvider` を新規に実装・テストするときのガイドです。

**対象者**: JavaScript の基本知識がある開発者

**スコープ**: Provider クラス実装 + 単体テスト設計

---

## 0. 実装前確認フェーズ

新しい Provider を実装する前に、必ず以下の事項を確認してください。

### 事前確認チェックリスト

- [ ] **ContestType の選択**
  - 新規追加が必要か？ → `src/lib/types/contest.ts` を確認
  - 既存の `ContestType` で対応できないか？ → 「各コンテスト種別の特有仕様」を参照
  - 判断基準: 複数の異なる contest_id を統一表示するなら「複合型」の可能性

- [ ] **コンテスト分類の確認**
  - `classifyContest()` が新しい `contest_id` に対して正しい `ContestType` を返すか確認
  - 既存の分類ロジック（`src/lib/utils/contest.ts`）に追加が必要か判断

- [ ] **データ存在確認**
  - `prisma/tasks.ts` に該当 `contest_id` のタスクが存在するか確認
  - 複合型の場合は `prisma/contest_task_pairs.ts` で共有問題を確認

- [ ] **実装パターン判定**
  - **パターン1（範囲フィルタ型）**: ABC 001～041、ARC 058～103 など → 数値範囲でフィルタ
  - **パターン2（単一ソース型）**: EDPC、TDPC、ACL_PRACTICE など → 単一 contest_id のみ
  - **パターン3（複合ソース型）**: ABS、ABC-Like など → 複数 contest_id を統一表示
  - **パターン4（コンストラクタパラメータ型）**: ICPC 国内予選など → 1クラスをコンストラクタ引数（年度等）で N 回インスタンス化
  - 対応セクション: [実装パターン](#実装パターン)

- [ ] **JOI の contest_id サフィックス変更の確認**
  - JOI 本選は 2026 年より `joi{YYYY}ho` → `joi{YYYY}sf` にサフィックスが変更された
  - `JOISemiFinalRoundProvider` の regex は `(ho|sf)` にマッチするよう対応済み
  - `getJoiContestLabel()` は `sf` → `'セミファイナルステージ'` を返す
  - テーブルの行ラベル (`getContestRoundLabel()`) は `sf` でも年のみ返す

- [ ] **ガイドの実装例の確認**
  - 判定したパターンの実装例を確認してテンプレート理解

### 記入例

```markdown
**新規 Provider 名**: ACLBeginnerProvider

事前確認結果:

- ContestType: ABC_LIKE（既存流用）
- contest_id: abl（prisma/tasks.ts に 6 つのタスク存在確認）
- パターン: パターン2（単一ソース型）
- テンプレート: EDPC と同一構造

→ 実装フェーズ開始
```

---

## Test Driven Development (TDD) 設計ガイド

新しい Provider を実装する際は、**テストファースト** のアプローチを推奨します。

### 実装フロー

1. **テスト設計フェーズ**
   - モックデータを定義
   - テストケースをリスト化（→ テストケース設計参照）
   - 各テストの期待値を明確化

2. **テスト実装フェーズ**
   - Vitest でテストコードを記述
   - Provider クラスをスケルトン実装（下記参照）
   - `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts` の `prepareContestProviderPresets()` と `contestTableProviderGroups` に登録

3. **Provider 実装フェーズ**
   - テストが RED → GREEN になるまで段階的に実装
   - 実行: `pnpm test:unit src/features/tasks/utils/contest-table/`

### スケルトン Provider の最小例

```typescript
export class MyNewProvider extends ContestTableProviderBase {
  protected contestType = ContestType.MY_NEW;

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return () => true; // テストをパスさせるための最小限の実装
  }

  getMetadata(): ContestTableMetaData {
    return { title: '', abbreviationName: '' };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      /* 未定義 */
      // columnWrapThreshold?: number  // optional: デフォルト8、AOJ系は6
    };
  }

  getContestRoundLabel(): string {
    return '';
  }
}
```

### Provider 登録（テスト実行環境構築）

**ファイル**: `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts`

```typescript
function prepareContestProviderPresets() {
  return {
    // ... 既存のコード
    myNewProvider: () =>
      new ContestTableProviderGroup().addProvider(new MyNewProvider(ContestType.MY_NEW)),
  };
}

const presets = prepareContestProviderPresets();

export const contestTableProviderGroups: Record<ProviderKey, ContestTableProviderGroup> = {
  // ... 既存のコード
  myNewProvider: presets.myNewProvider(),
};
```

**重要**: これらを登録しないとテストが実行できません。

詳細な実装例は [Provider実装ディレクトリ](../src/features/tasks/utils/contest-table/) を参照してください。

---

## 実装パターン

### パターン1: 範囲フィルタ型（ABC / ARC / AGC）

**特徴**:

- `contest_id` の範囲内でフィルタリング
- 表示: コンテストのラウンド名、ヘッダー
- 非表示: 問題 id

**実装例** - `setFilterCondition()` のコア部分：

```typescript
protected setFilterCondition(): (taskResult: TaskResult) => boolean {
  return (taskResult: TaskResult) => {
    if (classifyContest(taskResult.contest_id) !== this.contestType) {
      return false;
    }
    const contestRound = parseContestRound(taskResult.contest_id, 'abc');
    return contestRound >= 1 && contestRound <= 41;
  };
}
```

その他の実装（`getMetadata()`、`getDisplayConfig()` など）は [Provider実装ディレクトリ](../src/features/tasks/utils/contest-table/) を参照してください。

**注意**: ARC、AGC も同じパターン。範囲フィルタ型を参照してください。

---

### パターン2: 単一ソース型（EDPC / TDPC / FPS_24 / ACL_PRACTICE）

**特徴**:

- 単一の `contest_id` のみフィルタリング
- セクション: 固定フォーマット（A～Z など）
- 表示: 問題 id
- 非表示: ラウンド名、ヘッダー

**実装例** - `setFilterCondition()` のコア部分：

```typescript
protected setFilterCondition(): (taskResult: TaskResult) => boolean {
  return (taskResult: TaskResult) => {
    if (classifyContest(taskResult.contest_id) !== this.contestType) {
      return false;
    }
    return taskResult.contest_id === 'dp'; // ← contest_id だけ変更
  };
}
```

その他の実装は [Provider実装ディレクトリ](../src/features/tasks/utils/contest-table/) を参照してください。

**注意**: TDPC、FPS_24 も同じパターン。`contest_id` とメタデータだけ異なります。

---

### パターン4: コンストラクタパラメータ型（ICPC 国内予選）

**特徴**:

- 年度などのパラメータを受け取る1つのクラスを N 回インスタンス化
- `super(contestType, String(year))` でセクションを年度文字列にし、プロバイダキーを `AOJ_ICPC::2025` のように一意化
- 年度範囲定数（`OLDEST_YEAR` / `LATEST_YEAR`）をモジュールトップで `export` し、tests でも参照できるようにする
- グループ登録時は最新年から古い年へ降順ループし、テーブルを新しい順に並べる
- **固定セクションバリアント**: N 回インスタンス化ではなく、同一グループ内で同一 ContestType のプロバイダーを 2 種類共存させる場合も同じ仕組みが使える。一方に固定文字列を渡し（例: `super(contestType, '0100')` → key `AWC::0100`）、もう一方はセクションなし（key `AWC`）とすることで衝突を回避する

**実装例**:

```typescript
export const ICPC_PRELIM_OLDEST_YEAR = 1998;
export const ICPC_PRELIM_LATEST_YEAR = 2026;

export class AojIcpcPrelimProvider extends ContestTableProviderBase {
  private readonly year: number;
  private readonly contestId: string;

  constructor(contestType: ContestType, year: number) {
    super(contestType, String(year)); // provider key: AOJ_ICPC::2025
    this.year = year;
    this.contestId = `ICPCPrelim${year}`;
  }
  // ...
}

// グループ登録（最新年が上に来るよう降順）
for (let year = ICPC_PRELIM_LATEST_YEAR; year >= ICPC_PRELIM_OLDEST_YEAR; year--) {
  group.addProvider(new AojIcpcPrelimProvider(ContestType.AOJ_ICPC, year));
}
```

**注意**:

- `task_table_index` が数値文字列キー（例: `'1664'`）の場合、ベースクラスの `getHeaderIdsForTask` は辞書順ソートになるため、**必ず数値昇順ソートでオーバーライド**すること。`generateTable`（ベースクラスが `getTaskTableHeaderName()` 経由で同じキーを使う）との一致が崩れるとセルが表示されない。`generateTable` 自体のオーバーライドは不要。
- アルゴリズムが成立しない例外年度には上書き Map を用意する:

```typescript
// contest_id -> (task_table_index -> letter). Used only for years with judge gaps.
export const ICPC_PRELIM_LABEL_OVERRIDES: Record<string, Record<string, string>> = {};
```

上書き Map のテストは `beforeEach`/`afterEach` でエントリを直接追加・削除する（`vi.mock` 不要）:

```typescript
beforeEach(() => {
  ICPC_PRELIM_LABEL_OVERRIDES['ICPCPrelimTest'] = { '1150': 'A', '1152': 'C' };
});
afterEach(() => {
  delete ICPC_PRELIM_LABEL_OVERRIDES['ICPCPrelimTest'];
});
```

- **表示ラベルは `getTaskLabels` で返し、`generateTable` ではタイトルを変更しない**。
  `generateTable` で `{ ...taskResult, title: \`${letter}. ${title}\` }`のような整形をすると、
optimistic update で整形済みオブジェクトがソース配列に書き戻され、次の`$derived`再計算で
累積する（Issue [#3636](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3636)）。
位置ラベルは`getTaskLabels(filtered)`が`{ [contestId]: { index: letter } }`を返し、`TaskTableBodyCell`の`$derived displayTitle`で`formatAojIcpcTitle` を呼ぶ設計にすること。

- provider 見出しのフォント・太字・余白をデフォルトから変えたい場合は `getMetadata()` で `titleStyle` を返す。`ContestTableTitleStyle`（`headingTag` / `fontSize` / `fontWeight` / `bottomGap`）のうち必要なフィールドだけ指定すればよい。

---

### パターン3: 複合ソース型（ABS / TESSOKU_BOOK / MATH_AND_ALGORITHM）

**特徴**:

- 複数の異なる contest/task_id を1つのテーブルに表示
- セクション分割可能（Tessoku Book のみ）
- 表示: 問題 id、セクション分割
- 非表示: ラウンド名、ヘッダー

**実装例** - `setFilterCondition()` のコア部分：

```typescript
protected setFilterCondition(): (taskResult: TaskResult) => boolean {
  return (taskResult: TaskResult) => {
    return classifyContest(taskResult.contest_id) === this.contestType;
  };
}
```

**Tessoku Book（セクション分割あり）**:

セクション分割が必要な場合は、例えば `task_table_index` の先頭文字でフィルタリングします：

```typescript
class TessokuBookSectionProvider extends TessokuBookProvider {
  constructor(
    contestType: ContestType,
    private sectionPrefix: 'A' | 'B' | 'C',
  ) {
    super(
      contestType,
      sectionPrefix === 'A' ? 'examples' : sectionPrefix === 'B' ? 'practicals' : 'challenges',
    );
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return (
        classifyContest(taskResult.contest_id) === this.contestType &&
        taskResult.task_table_index.startsWith(this.sectionPrefix)
      );
    };
  }
}
```

その他の実装は [Provider実装ディレクトリ](../src/features/tasks/utils/contest-table/) を参照してください。

---

## 各コンテスト種別の特有仕様

### 範囲フィルタ型

| コンテスト    | 範囲       | フォーマット | セクション | ラベル | 特有の注意    |
| ------------- | ---------- | ------------ | ---------- | ------ | ------------- |
| ABC 001-041   | 001～041   | 001, 041     | A～D       | あり   | 旧形式        |
| ABC 042-125   | 042～125   | 042, 125     | A～D       | あり   | 共有問題(ARC) |
| ABC 126-211   | 126～211   | 126, 211     | A～F       | あり   | 6問制         |
| ABC 212-318   | 212～318   | 212, 318     | A～Ex/H    | あり   | 8問制         |
| ABC 319-      | 319～      | 319          | A～G       | あり   | 標準形式      |
| ARC 001-057   | 001～057   | 001, 057     | A～D       | あり   | 旧形式        |
| ARC 058-103   | 058～103   | 058, 103     | C～F       | あり   | 共有問題(ABC) |
| ARC 104-      | 104～      | 104          | 4～6問     | あり   | -             |
| AGC 001-      | 001～      | 001          | 4～7問     | あり   | -             |
| AWC 0001-0099 | 0001～0099 | 0001         | A～E       | あり   | -             |

### 単一ソース型

| コンテスト     | contest_id    | セクション | フォーマット |
| -------------- | ------------- | ---------- | ------------ |
| EDPC           | `'dp'`        | 26問       | A～Z         |
| TDPC           | `'tdpc'`      | 26問       | A～Z         |
| NDPC           | `'ndpc'`      | 20問       | A～T         |
| FPS_24         | `'fps-24'`    | 24問       | A～X         |
| ACL_PRACTICE   | `'practice2'` | 12問       | A～L         |
| ACL_BEGINNER\* | `'abl'`       | 6問        | A～F         |
| ACL_CONTEST1\* | `'acl1'`      | 6問        | A～F         |
| AWC0100†       | `'awc0100'`   | 15問       | A～O         |

\*注: ACL_PRACTICE、ACL_BEGINNER、ACL_CONTEST1 は `Acl` グループの下で 3 つのコンテストが統一管理されています。
\*\*注: EDPC・TDPC・NDPC・FPS 24 は `dps` グループ下で 4 つのコンテストが統一管理されています。
†注: ContestType.AWC を再利用し、section `'0100'` で同グループ内の AWC0001To0099Provider と共存（provider key = `AWC::0100`）。`getProvider(ContestType.AWC, '0100')` で取得。

### 複合ソース型

| コンテスト         | contest_id             | 問題数 | セクション   | 分割 | 複数コンテスト                            |
| ------------------ | ---------------------- | ------ | ------------ | ---- | ----------------------------------------- |
| ABS                | `'abs'`                | 11問   | A～K         | なし | あり（11個）                              |
| ABC-Like           | 計14コンテスト         | 2～8問 | A～H         | なし | あり（14個）、ABL は ACL と同じ区分で表示 |
| TESSOKU_BOOK       | `'tessoku-book'`       | 166問  | A(01-77)/B/C | あり | あり                                      |
| MATH_AND_ALGORITHM | `'math-and-algorithm'` | 104問  | 001～104     | なし | あり                                      |

**複合型の参照解決**: `getMergedTasksMap()` が複数コンテスト由来の task_id を自動統合。テストデータは [prisma/contest_task_pairs.ts](../../prisma/contest_task_pairs.ts) を参照。

---

## テスト実装ガイド

### 必須テスト項目（全 Provider 共通）

1. 基本的なフィルタリング検証（contest_id / 型）
2. メタデータ取得（title、abbreviationName）
3. ディスプレイ設定確認（isShownHeader、isShownRoundLabel、columnWrapThreshold 等）
4. ラウンドラベルフォーマット（`getContestRoundLabel()`）
5. テーブル生成構造（問題数確認）
6. ヘッダー・ラウンドID取得
7. 空入力ハンドリング

### パターン固有テスト

- **範囲フィルタ型**: 範囲境界値テスト、共有問題の有無確認。既存プロバイダーを上限付きに分割した場合は、隣接するもう一方のフィクスチャを結合して上限境界の除外を確認する:

  ```typescript
  const combined = [...taskResultsForAWC0001To0099Provider, ...taskResultsForAWC0100Provider];
  const filtered = provider.filter(combined);
  expect(filtered.some((task) => task.contest_id === 'awc0100')).toBe(false);
  ```

- **複合ソース型**: 複数 contest_id 混在テスト、セクション分割ロジック

### Vitest テスト例

```typescript
import { describe, test, expect } from 'vitest';

import { ContestType } from '$lib/types/contest';
import type { TaskResults } from '$lib/types/task';

import { MyNewProvider } from './my_new_provider';
import { taskResultsForMyNew } from '$features/tasks/fixtures/contest-table/contest_table_provider';

describe('MyNewProvider', () => {
  test('filters tasks correctly', () => {
    const provider = new MyNewProvider(ContestType.MY_NEW);
    const filtered = provider.filter(taskResultsForMyNew);
    expect(filtered.every((task) => task.contest_id === 'my-contest')).toBe(true);
  });

  test('returns correct metadata', () => {
    const provider = new MyNewProvider(ContestType.MY_NEW);
    expect(provider.getMetadata().title).toBe('Expected Title');
  });

  test('returns correct display config', () => {
    const provider = new MyNewProvider(ContestType.MY_NEW);
    const config = provider.getDisplayConfig();
    expect(config.isShownHeader).toBe(true);
    // columnWrapThreshold を明示する場合はアサーションを追加
    // expect(config.columnWrapThreshold).toBe(6);
  });
});
```

### prepareContestProviderPresets() のテスト

Provider クラスのテスト完了後、`prepareContestProviderPresets()` から返されるグループ（`ContestTableProviderGroup`）の動作を検証します。

**テスト項目**:

1. **グループ名の確認**

   ```typescript
   const group = prepareContestProviderPresets().MyNewProvider();
   expect(group.getGroupName()).toBe('Expected Group Name');
   ```

2. **グループメタデータの確認**（`buttonLabel`、`ariaLabel`）

   ```typescript
   expect(group.getMetadata()).toEqual({
     buttonLabel: 'Button Label',
     ariaLabel: 'ARIA Label',
   });
   ```

3. **プロバイダー数の確認**
   - **単一プロバイダーグループ**: `getSize()` が 1 を返す
   - **複数プロバイダーグループ**: `getSize()` が複数を返す（例：ACL は 3）

4. **プロバイダーインスタンス型の確認**
   - **単一プロバイダー**:
     ```typescript
     expect(group.getProvider(ContestType.MY_NEW)).toBeInstanceOf(MyNewProvider);
     ```
   - **複数プロバイダー**（セクション指定あり）:
     ```typescript
     expect(group.getProvider(ContestType.TESSOKU_BOOK, 'examples')).toBeInstanceOf(
       TessokuBookForExamplesProvider,
     );
     expect(group.getProvider(ContestType.TESSOKU_BOOK, 'practicals')).toBeInstanceOf(
       TessokuBookForPracticalsProvider,
     );
     ```

5. **プリセット登録の確認**

   新しい Provider を追加したら、`prepareContestProviderPresets()` の戻り値に含まれているか必ずテストを追加する：

   ```typescript
   test('expects to verify all presets are functions', () => {
     const presets = prepareContestProviderPresets();
     // 既存のアサーションに加えて新規分を追加
     expect(typeof presets.MyNewProvider).toBe('function');
   });
   ```

   このテストを更新し忘れると、Provider を実装しても画面に表示されない場合に検出できない。

**セクション識別子の指定**:

複数プロバイダーを含むグループでは、`getProvider()` の第2引数にセクション識別子を渡します。セクション定数は `src/features/tasks/types/contest-table/contest_table_provider.ts` で定義されています：

- `TESSOKU_SECTIONS`: `examples`、`practicals`、`challenges`
- `JOI_SECOND_QUAL_ROUND_SECTIONS`: `'2020Onwards'`、`from2006To2019`
- `JOI_FINAL_ROUND_SECTIONS`: `semiFinal`

詳細な実装例は [単体テストディレクトリ](../src/features/tasks/utils/contest-table/) の各 `*.test.ts` ファイルを参照してください。

---

### モックデータ準備

**ステップ1: データソース確認**

- `prisma/tasks.ts`: contest_id、task_id フォーマット確認
- `prisma/contest_task_pairs.ts`: 共有問題の確認
- `prisma/schema.prisma`: task_table_index フォーマット確認

**ステップ2: ContestType 確認**

- `src/lib/types/contest.ts` で定義済みか確認
- `classifyContest()`（`src/lib/utils/contest.ts`）が新しい contest_id に対応済みか確認
- テストではモックを使わず実際の `classifyContest()` を直接呼び出すため、実装の追加が必須

**ステップ3: テストデータ構築**

```typescript
export const taskResultsForNewProvider: TaskResults = [
  createTaskResultWithTaskTableIndex('contest_id', 'task_id_1', 'A', AC),
  createTaskResultWithTaskTableIndex('contest_id', 'task_id_2', 'B', AC),
  // ... 問題数分
];
```

---

## よくあるミス

### 1. **getDisplayConfig() での属性漏れ**

**問題**: 一部の属性だけ定義し、他の属性（`isShownHeader` など）を未定義にすると、ベースクラスのデフォルト値が適用される

**解決策**: `ContestTableDisplayConfig` の **全属性を明示的に定義**

```typescript
getDisplayConfig() {
  return {
    isShownHeader: true,               // 必ず指定
    isShownRoundLabel: true,           // 必ず指定
    roundLabelWidth: 'xl:w-16',
    tableBodyCellsWidth: 'w-8 h-8 px-1 py-1',
    isShownTaskIndex: false,           // 必ず指定
    // columnWrapThreshold?: number    // optional: 省略時は8（デフォルト）、AOJ系は6
  };
}
```

---

### 2. **複数コンテスト由来の問題を見落とし**

**問題**: ABC042-125 の共有問題（ARC との同日開催）で `task_id` が `arc58_a` なのに `contest_id` は `abc042` のケースを処理し忘れ

**解決策**: テストケースに **混合パターンを明示的に含める**

```typescript
test('filters correctly with shared problems', () => {
  const mixed = [
    { contest_id: 'abc042', task_id: 'abc042_a' }, // ABC側
    { contest_id: 'abc042', task_id: 'arc058_a' }, // 共有問題
    { contest_id: 'arc058', task_id: 'arc058_a' }, // ARC側
  ];
  // ABC042側の2つだけが返る
});
```

---

### 3. **ソート順序の不安定**

**問題**: 数字ソート（001, 028, 036, 102）と文字ソート（A, B, M, X）の混在で誤り

**解決策**:

```typescript
// ❌ 間違い
const sorted = indices.sort();

// ✅ 正解（数字フォーマット）
const sorted = indices.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

// ✅ 正解（英字フォーマット）
const sorted = indices.sort((a, b) => a.localeCompare(b));
```

---

### 4. **パラメータ化テストでの共通化誤り**

**問題**: `describe.each()` で複数 Provider テストを共通化したが、1つの Provider だけ `displayConfig` が異なるため全体が失敗

**解決策**: 異なる Provider は個別 `describe` ブロック

```typescript
describe.each([...])('shared tests', () => { /* ... */ });

describe('CustomProvider with unique config', () => {
  test('custom test', () => { /* ... */ });
});
```

---

### 5. **contestTypePriorities の JSDoc カテゴリ名を変更してしまう**

**問題**: 新しい ContestType を挿入して数値範囲が変わったとき、既存の4カテゴリ名
（`Educational` / `Contests for genius` / `Special contests` / `External platforms`）を
意図せず改名・分割・合体してしまい、歴史的経緯や分類上の意味が失われる。

**解決策**: **カテゴリ名は絶対に変更しない**。変えてよいのは括弧内の数値範囲だけ。

```typescript
// Before: [ContestType.TDPC, 5] ... [ContestType.PAST, 6]
// After inserting NDPC at 6:
//   [ContestType.NDPC, 6], [ContestType.PAST, 7], ...

// ✅ 数値範囲だけ更新
// Educational contests (0–11, 17)
// Contests for genius (12–16)
// Special contests (18–20)
// External platforms (21–23)

// ❌ カテゴリを改名・分割・合体しない
// Educational / DP contests (0–6)   ← NG
```

---

### 6. `addProvider` の順序を意識しない

**問題**: 同一グループ内の複数プロバイダーは `addProvider` の呼び出し順が画面上の表示順（先 = 上）になる。

**解決策**: 上に表示したいプロバイダーを先に `addProvider` する。

```typescript
// AWC0100 を AWC0001-0099 の上に表示する場合
group
  .addProvider(new AWC0100Provider(ContestType.AWC)) // 上
  .addProvider(new AWC0001To0099Provider(ContestType.AWC)); // 下
```

---

## 実装完了後

### ドキュメント更新チェックリスト

- [ ] **実装例・テスト結果の報告** — dev-notes に実装教訓を記載
- [ ] **各コンテスト種別テーブル** — 新規 Provider の行を追加（範囲フィルタ型 / 単一ソース型 / 複合ソース型）
- [ ] **実装パターン説明** — 複合型参照情報がある場合は該当セクション に追加
- [ ] **このガイド（how-to-add-contest-table-provider.md）** — 「事前確認チェックリスト」に新規学習項目を追加
- [ ] **参考資料** — GitHub Issues に当該 Provider (#xxxx) のリンクを追加
- [ ] **最終更新日** — 現在日付に変更

---

## 参考資料

### GitHub Issues

- [#2919](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2919) - ABS
- [#2830](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2830) - ABC126ToABC211Provider
- [#2836](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2836) - ABC042～125 & ARC058～103
- [#2835](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2835) - ARC104OnwardsProvider
- [#2837](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2837) - AGC001OnwardsProvider
- [#2838](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2838) - ABC001～041 & ARC001～057
- [#2840](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2840)、[#3108](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3108) - ABCLikeProvider
- [#3153](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3153) - AWC0001To0099Provider（旧: AWC0001OnwardsProvider）、AWC0100Provider
- [#2776](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2776) - TessokuBookProvider
- [#2785](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2785) - MathAndAlgorithmProvider
- [#2797](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2797) - FPS24Provider
- [#2920](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2920)、[#3120](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3120) - ACLPracticeProvider、ACLBeginnerProvider、ACLProvider
- [#3152](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3152) - JOISemiFinalRoundProvider（本選 → セミファイナルステージ への対応）
- NDPC実装 - NDPCProvider（パターン2: 単一ソース型、prisma/tasks.ts に 20 問存在）

### 実装ファイル

- [Provider 実装ディレクトリ](../src/features/tasks/utils/contest-table/)
- [単体テスト](../src/features/tasks/utils/contest-table/) (各 `*.test.ts` ファイル)
- [テストフィクスチャ](../src/features/tasks/fixtures/contest-table/contest_table_provider.ts)

---

**最終更新**: 2026-06-24
