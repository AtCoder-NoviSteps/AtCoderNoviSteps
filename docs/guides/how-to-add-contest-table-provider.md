# ContestTableProvider 実装・テストガイド

## 概要

競技プログラミングコンテストサイト の各コンテスト種別に対応した `ContestTableProvider` を新規に実装・テストするときのガイドです。

**対象者**: JavaScript の基本知識がある開発者

**スコープ**: Provider クラス実装 + 単体テスト設計

---

## Test Driven Development (TDD) 設計ガイド

新しい Provider を実装する際は、**テストファースト** のアプローチを推奨します。

### 実装フロー

1. **テスト設計フェーズ**
   - モックデータを定義
   - テストケースをリスト化
   - 各テストの期待値を明確化

2. **テスト実装フェーズ**
   - テストコードを先に記述
   - Provider クラスはスケルトンで作成（メソッドは未実装でOK）
   - **スケルトン Provider を `prepareContestProviderPresets()` と `contestTableProviderGroups` に登録・エクスポート**（テスト実行可能な環境構築）

3. **Provider 実装フェーズ**
   - 登録済みの Provider クラスに実装を追加
   - テストが RED → GREEN になるまで段階的に実装
   - `setFilterCondition()`、`getMetadata()`、`getDisplayConfig()`、`getContestRoundLabel()` を完成

### 利点

- **要件の明確化**: テスト設計時点で仕様が固まる
- **品質保証**: 実装中にテストで即座に検証
- **保守性**: テストが仕様書として機能

### 実装フェーズ詳細

#### ステップ1: Provider クラス作成（スケルトン）

テスト実装フェーズで使用するスケルトン Provider クラスを作成：

**要件**:

- `ContestTableProviderBase` を継承
- `protected contestType` を指定
- 抽象メソッドは暫定実装（テストが実行可能な状態まで）

**例**:

```typescript
export class MyNewProvider extends ContestTableProviderBase {
  protected contestType = ContestType.MY_NEW;

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return () => true; // 暫定実装
  }

  getMetadata(): ContestTableMetaData {
    return { title: '', abbreviationName: '' }; // 暫定実装
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      /* 暫定実装 */
    };
  }

  getContestRoundLabel(): string {
    return ''; // 暫定実装
  }
}
```

#### ステップ2: Provider 登録・エクスポート（テスト実行環境構築）

**ファイル**: `src/lib/utils/contest_table_provider.ts`

`prepareContestProviderPresets()` 関数内に新規 Provider を追加：

```typescript
function prepareContestProviderPresets() {
  return {
    // ... 既存の Provider
    myNewProvider: () =>
      new ContestTableProviderGroup().addProvider(new MyNewProvider(ContestType.MY_NEW)),
  };
}
```

次に、`contestTableProviderGroups` オブジェクトに新規 Provider グループをエクスポート：

```typescript
export const contestTableProviderGroups: Record<ProviderKey, ContestTableProviderGroup> = {
  // ... 既存の Provider グループ
  myNewProvider: prepareContestProviderPresets().myNewProvider(),
};
```

**重要**: この登録がないとテストが実行されず、RED 状態が継続します。

#### ステップ3: Provider 実装フェーズ（本体実装）

登録済みの Provider クラスに実装を追加：

**要件**:

- `setFilterCondition()`: 条件関数を返すメソッド
- `getMetadata()`: `title`、`abbreviationName` を返す
- `getDisplayConfig()`: 表示設定を返す
- `getContestRoundLabel()`: ラウンドラベルを返す

**例**:

```typescript
export class MyNewProvider extends ContestTableProviderBase {
  protected contestType = ContestType.MY_NEW;

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => taskResult.contest_id === 'my-contest';
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'My New Contest',
      abbreviationName: 'myNew',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: false,
      roundLabelWidth: '',
      tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-2',
      isShownTaskIndex: false,
    };
  }

  getContestRoundLabel(contestId: string): string {
    return '';
  }
}
```

テストを実行しながら段階的に実装を完成させてください：

```bash
pnpm test:unit src/test/lib/utils/contest_table_provider.test.ts
```

---

## 実装パターン

### パターン1: 範囲フィルタ型（ABC / ARC / AGC）

**特徴**:

- 範囲内の contest_id をフィルタリング
- contest_id から数字を抽出して範囲判定
- すべての ARC/AGC はこのパターン
- 表示: コンテストのラウンド名、ヘッダー
- 非表示: 問題名の前にある問題 id

**実装例**（ABC 001-041）：

```typescript
class ABC001ToABC041Provider extends ContestTableProviderBase {
  protected contestType = ContestType.ABC;

  filter(tasks: TaskResults): TaskResults | null {
    return tasks.filter((task) => {
      const round = this.extractRound(task.contest_id, 'abc');
      return round >= 1 && round <= 41;
    });
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginner Contest 001 〜 041（レーティング導入前）',
      abbreviationName: 'fromAbc001ToAbc041',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      roundLabelWidth: 'xl:w-16',
      tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1',
      isShownTaskIndex: false,
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('ABC ', '');
  }
}
```

**注意**:

- 他の ABC 範囲も同じパターン（ARC、AGC も同様）

---

### パターン2: 単一ソース型（EDPC / TDPC / FPS_24 / ACL_PRACTICE）

**特徴**:

- 単一の contest_id のみをフィルタリング
- セクションは固定フォーマット（A～Z など）
- 表示: 問題名の前にある問題 id
- 非表示: コンテストのラウンド名、ヘッダー

**実装例**（EDPC）：

```typescript
class EDPCProvider extends ContestTableProviderBase {
  protected contestType = ContestType.EDPC;

  filter(tasks: TaskResults): TaskResults | null {
    return tasks.filter((task) => task.contest_id === 'dp');
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Educational DP Contest',
      abbreviationName: 'edpc',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '',
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(contestId: string): string {
    return '';
  }
}
```

**注意**:

- TDPC、FPS_24 も同じパターン（contest_id と メタデータだけ異なる）

---

### パターン3: 複合ソース型（ABS / TESSOKU_BOOK / MATH_AND_ALGORITHM）

**特徴**:

- 複数の異なる contest/task_id を1つのテーブルに表示
- task_table_index が共通フォーマット（A～K、001～104 など）
- セクション分割可能（Tessoku Book のみ）

**実装例**（ABS）：

```typescript
class ABSProvider extends ContestTableProviderBase {
  protected contestType = ContestType.ABS;

  filter(tasks: TaskResults): TaskResults | null {
    return tasks.filter((task) => task.contest_id === 'abs');
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Beginners Selection',
      abbreviationName: 'abs',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '',
      tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-2',
      isShownTaskIndex: false,
    };
  }

  getContestRoundLabel(contestId: string): string {
    return '';
  }

  getHeaderIdsForTask(tasks: TaskResults): string[] {
    return (
      this.filter(tasks)
        ?.map((task) => task.task_table_index)
        .sort() ?? []
    );
  }
}
```

**Tessoku Book（セクション分割あり）**:

```typescript
// 基底クラス: TessokuBookProvider
export class TessokuBookProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return classifyContest(taskResult.contest_id) === this.contestType;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: '競技プログラミングの鉄則',
      abbreviationName: 'tessoku-book',
    };
  }
}

// 例題: A01～A77
export class TessokuBookForExamplesProvider extends TessokuBookProvider {
  constructor(contestType: ContestType) {
    super(contestType, 'examples');
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return (
        classifyContest(taskResult.contest_id) === this.contestType &&
        taskResult.task_table_index.startsWith('A')
      );
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: '競技プログラミングの鉄則（A. 例題）',
      abbreviationName: 'tessoku-book-for-examples',
    };
  }
}

// 応用: B01～B69
export class TessokuBookForPracticalsProvider extends TessokuBookProvider {
  constructor(contestType: ContestType) {
    super(contestType, 'practicals');
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return (
        classifyContest(taskResult.contest_id) === this.contestType &&
        taskResult.task_table_index.startsWith('B')
      );
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: '競技プログラミングの鉄則（B. 応用問題）',
      abbreviationName: 'tessoku-book-for-practicals',
    };
  }
}

// 力試し: C01～C20
export class TessokuBookForChallengesProvider extends TessokuBookProvider {
  constructor(contestType: ContestType) {
    super(contestType, 'challenges');
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return (
        classifyContest(taskResult.contest_id) === this.contestType &&
        taskResult.task_table_index.startsWith('C')
      );
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: '競技プログラミングの鉄則（C. 力試し問題）',
      abbreviationName: 'tessoku-book-for-challenges',
    };
  }
}
```

---

## 各コンテスト種別の特有仕様

### 範囲フィルタ型

| コンテスト  | 範囲     | フォーマット | 問題数        | ラベル表示 | 特有の注意                |
| ----------- | -------- | ------------ | ------------- | ---------- | ------------------------- |
| ABC 001-041 | 001～041 | 001, 041     | 4問（A-D）    | あり       | 古いID形式混在            |
| ABC 042-125 | 042～125 | 042, 125     | 4問（A-D）    | あり       | 共有問題あり（ARC）       |
| ABC 126-211 | 126～211 | 126, 211     | 6問（A-F）    | あり       | 標準形式                  |
| ABC 212-318 | 212～318 | 212, 318     | 8問（A-Ex/H） | あり       | 標準形式                  |
| ABC 319-    | 319～    | 319          | 7問（A-G）    | あり       | 標準形式                  |
| ARC 001-057 | 001～057 | 001, 057     | 4問（A-D）    | あり       | 古いID形式                |
| ARC 058-103 | 058～103 | 058, 103     | 4問（C-F）    | あり       | 共有問題あり (ABC)        |
| ARC 104-    | 104～    | 104          | 4～6問        | あり       | -                         |
| AGC 001-    | 001～    | 001          | 4～7問        | あり       | 7問パターン（AGC028のみ） |

### 単一ソース型

| コンテスト   | contest_id    | セクション範囲 | フォーマット | ヘッダー表示 | 問題インデックス表示 |
| ------------ | ------------- | -------------- | ------------ | ------------ | -------------------- |
| EDPC         | `'dp'`        | A～Z（26問）   | A, B, ..., Z | なし         | あり                 |
| TDPC         | `'tdpc'`      | A～Z（26問）   | A, B, ..., Z | なし         | あり                 |
| FPS_24       | `'fps-24'`    | A～X（24問）   | A, B, ..., X | なし         | あり                 |
| ACL_PRACTICE | `'practice2'` | A～L（12問）   | A, B, ..., L | なし         | あり                 |

### 複合ソース型

| コンテスト         | contest_id             | 問題数 | セクション範囲               | フォーマット       | セクション分割 | 複数コンテスト | ヘッダー表示 | インデックス表示 | 特有の注意           |
| ------------------ | ---------------------- | ------ | ---------------------------- | ------------------ | -------------- | -------------- | ------------ | ---------------- | -------------------- |
| ABS                | `'abs'`                | 11問   | A～K                         | A, B, ..., K       | なし           | あり（11個）   | なし         | なし             | task_idが複雑        |
| TESSOKU_BOOK       | `'tessoku-book'`       | 166問  | A(01-77), B(01-69), C(01-20) | A01, A77, B63, C20 | あり           | あり           | なし         | あり             | セクション判定が複雑 |
| MATH_AND_ALGORITHM | `'math-and-algorithm'` | 104問  | 001～104                     | 001, 028, 104      | なし           | あり           | なし         | あり             | 範囲内に欠損あり     |

---

## テスト設計ガイド

### テストケース設計

#### 全 Provider 共通の必須テスト項目

1. **基本的なフィルタリング**: contest_id / 型の検証
2. **メタデータ取得**: title、abbreviationName
3. **ディスプレイ設定確認**: isShownHeader、isShownRoundLabel 等
4. **ラウンドラベルフォーマット**: getContestRoundLabel()
5. **テーブル生成**: generateTable() の構造（問題数確認）
6. **ラウンドID取得**: getContestRoundIds()
7. **ヘッダーID取得**: getHeaderIdsForTask()
8. **当該Provider の特徴的な検証**: 共有問題確認、複数由来確認等
9. **空入力ハンドリング**: 空配列での動作

#### パターン固有テスト

- **範囲フィルタ型**: 範囲境界値（最小値、最大値、範囲外）の検証、共有問題がないか確認
- **複合ソース型**: 複数 contest_id の混在検証、セクション分割ロジック（該当する場合）

### モックデータの準備と確認事項

#### ステップ1: データソース確認

テスト設計開始前に、以下のファイルで当該コンテストの仕様を把握してください：

**ファイル**: `prisma/tasks.ts`

- 当該 contest_id のエントリを確認
- 問題ID フォーマット（数字 `001` / 英字サフィックス `A`）を把握
- 複数コンテスト由来の問題がないか確認

**ファイル**: `prisma/contest_task_pairs.ts`

- 共有問題の有無を確認（同一の問題が複数コンテストで使用されているか）
- 複合ソース型の場合、各問題の元のコンテストを特定

**ファイル**: `prisma/schema.prisma`

- `task_table_index` フィールドのフォーマットを確認

#### ステップ2: ContestType 確認

- **ファイル**: `src/lib/types/contest.ts`
  - 対応する `ContestType` が定義されているか確認
  - 定義されていない場合は、先に ContestType を追加

- **Provider 実装**の確認
  - `protected contestType` が正しく指定されているか
  - `classifyContest()` ユーティリティ関数に分類ロジックが実装されているか確認

#### ステップ3: テストデータ構築

**ファイル**: `src/test/lib/utils/test_cases/contest_table_provider.ts`

以下のヘルパー関数を使用してテストデータを作成してください：

```typescript
// 既存のヘルパー関数（汎用）
export function createTaskResultWithTaskTableIndex(
  contestId: string,
  taskId: string,
  taskTableIndex: string,
  submissionStatus: SubmissionStatus,
): TaskResult {
  return {
    contest_id: contestId,
    task_id: taskId,
    task_table_index: taskTableIndex,
    submission_status: submissionStatus,
    // ... その他のプロパティ
  };
}

// 新規 Provider 用テストデータ定数
export const taskResultsForNewProvider: TaskResults = [
  createTaskResultWithTaskTableIndex('contest_id', 'task_id_1', 'A', AC),
  createTaskResultWithTaskTableIndex('contest_id', 'task_id_2', 'B', AC),
  // ... 問題数分のエントリ
];
```

**重要なポイント**：

- `createTaskResultWithTaskTableIndex` を使用して、contest_id、task_id、task_table_index を明確に指定
- テストデータは「全 Provider 共通の必須テスト項目」すべてをカバーする構成にする
- 複数コンテスト由来の問題がある場合は、そのパターンも明示的に含める
- `AC` 以外のステータスが必要な場合は、テストケースごとに明示的に指定

### テスト実装の最小構成

#### Vitest の基本概念

- `describe()`: テストスイートをグループ化
- `test()` または `it()`: 個別のテストケース
- `expect()`: アサーション（期待値の検証）
- `vi.mock()`: モック関数の定義
- `beforeEach()`: 各テスト前に実行する初期化処理

#### Vitest を使用したテスト例

```typescript
import { describe, test, expect, vi } from 'vitest';

describe('NewProvider', () => {
  // モック定義
  beforeEach(() => {
    vi.mock('src/lib/utils/contest', () => ({
      classifyContest: vi.fn((contestId) => {
        if (contestId === 'new-contest') return ContestType.NEW;
        // ... その他の処理
      }),
    }));
  });

  test('expects to filter tasks correctly', () => {
    const provider = new NewProvider(ContestType.NEW);
    const filtered = provider.filter(mockTasks);
    expect(filtered?.every((t) => /* condition */)).toBe(true);
  });

  test('expects to return correct metadata', () => {
    const provider = new NewProvider(ContestType.NEW);
    expect(provider.getMetadata().title).toBe('Expected Title');
  });

  test('expects to return correct display config', () => {
    const provider = new NewProvider(ContestType.NEW);
    const config = provider.getDisplayConfig();
    expect(config.isShownHeader).toBe(true);
  });
});
```

---

## 教訓: よくあるミス

### 1. **モック定義の漏れ**（最頻出）

**問題**: テストで新しい contest_id を使うと、`classifyContest()` モックに対応定義がなく失敗

**対策チェックリスト**:

- [ ] 新規 contest_id をテストで使用する場合、`classifyContest` モックに追加したか
- [ ] テストデータと モック定義が対応しているか
- [ ] 初回実行で失敗したら、**モック定義を最優先で確認**

**例**:

```typescript
vi.mock('src/lib/utils/contest', () => ({
  classifyContest: vi.fn((contestId) => {
    if (contestId === 'practice2') return ContestType.ACL_PRACTICE;
    if (contestId === 'new-contest') return ContestType.NEW;
    // ...
  }),
}));
```

### 2. **ソート順序の不安定**

**問題**: 数字ソート（001, 028, 036, 102）と文字ソート（A, B, M, X）の混在で誤り

**対策**:

- 数字フォーマット（001など）は **文字列として数値ソート**
- 英字フォーマット（A, Bなど）は **localeCompare() を使用**

```typescript
// ❌ 間違い
const sorted = indices.sort();

// ✅ 正解（数字フォーマット）
const sorted = indices.sort((a, b) => {
  const aNum = parseInt(a, 10);
  const bNum = parseInt(b, 10);
  return aNum - bNum;
});

// ✅ 正解（英字フォーマット）
const sorted = indices.sort((a, b) => a.localeCompare(b));
```

### 3. **複数コンテスト由来の問題を見落とし**

**問題**: ABC042-125 の共有問題（ARC との同日開催）で task_id が arc58_a なのに contest_id は abc042 のケースを処理し忘れ

**対策**:

- 範囲フィルタ型で複数コンテスト由来の問題がないか確認
- テストケースに **混合パターン** を明示的に含める

```typescript
test('expects to filter only ABC-type contests', () => {
  const mixed = [
    { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' }, // ABC側
    { contest_id: 'abc042', task_id: 'arc058_a', task_table_index: 'C' }, // 共有問題
    { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' }, // ARC側
  ];
  // ARC側は除外、ABC042側の2つだけが返る
});
```

### 4. **セクション判定ロジックの複雑化**

**問題**: Tessoku Book の A01～A77, B01～B69, C01～C20 で正規表現を間違える

**対策**:

- 正規表現は **段階的にテスト**
- 範囲の上限が2桁（A77, B69）と可変の場合、明示的に記述

```typescript
// Tessoku Book 例題（A01～A30）
const isExample = /^A(0[1-9]|[12][0-9]|30)$/.test(index);

// 応用（A31～A77）
const isPractical = /^A(3[1-9]|[4-6][0-9]|7[0-7])$/.test(index);
```

### 5. **パラメータ化テスト（describe.each）での誤り**

**問題**: 複数 Provider で displayConfig が共通だが、1つだけ異なる値を設定するとテスト全体が失敗

**対策**:

- `describe.each()` で共通テストは共有、固有テストは別ブロック
- 表示設定が異なる Provider は `describe.each()` から **除外**

```typescript
describe.each([
  { Provider: EDPCProvider, ... },
  { Provider: TDPCProvider, ... },
  // ただし displayConfig が異なる場合は個別 describe ブロック
])('...', ({ Provider, ... }) => {
  test('shared test', () => { ... });
});

describe('CustomProvider with unique displayConfig', () => {
  test('custom test', () => { ... });
});
```

---

## 参考資料

### GitHub Issues

- [#2919](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2919) - ABS
- [#2830](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2830) - ABC126ToABC211Provider
- [#2836](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2836) - ABC042～125 & ARC058～103
- [#2835](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2835) - ARC104OnwardsProvider
- [#2837](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2837) - AGC001OnwardsProvider
- [#2838](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2838) - ABC001～041 & ARC001～057
- [#2776](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2776) - TessokuBookProvider
- [#2785](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2785) - MathAndAlgorithmProvider
- [#2797](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2797) - FPS24Provider
- [#2962](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2962) - ACLPracticeProvider

### 実装ファイル

- [Provider 実装](../src/lib/utils/contest_table_provider.ts)
- [単体テスト](../src/test/lib/utils/contest_table_provider.test.ts)
- [モックデータ](../src/test/lib/utils/test_cases/contest_table_provider.ts)

---

**最終更新**: 2026-01-23
