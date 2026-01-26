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
   - テストケースをリスト化（→ テストケース設計参照）
   - 各テストの期待値を明確化

2. **テスト実装フェーズ**
   - Vitest でテストコードを記述
   - Provider クラスをスケルトン実装（下記参照）
   - `src/lib/utils/contest_table_provider.ts` の `prepareContestProviderPresets()` と `contestTableProviderGroups` に登録

3. **Provider 実装フェーズ**
   - テストが RED → GREEN になるまで段階的に実装
   - 実行: `pnpm test:unit src/test/lib/utils/contest_table_provider.test.ts`

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
    };
  }

  getContestRoundLabel(): string {
    return '';
  }
}
```

### Provider 登録（テスト実行環境構築）

**ファイル**: `src/lib/utils/contest_table_provider.ts`

```typescript
function prepareContestProviderPresets() {
  return {
    // ... 既存のコード
    myNewProvider: () =>
      new ContestTableProviderGroup().addProvider(new MyNewProvider(ContestType.MY_NEW)),
  };
}

export const contestTableProviderGroups: Record<ProviderKey, ContestTableProviderGroup> = {
  // ... 既存のコード
  myNewProvider: prepareContestProviderPresets().myNewProvider(),
};
```

**重要**: これらを登録しないとテストが実行できません。

詳細な実装例は [Provider実装ファイル](../src/lib/utils/contest_table_provider.ts) を参照してください。

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

その他の実装（`getMetadata()`、`getDisplayConfig()` など）は [Provider実装ファイル](../src/lib/utils/contest_table_provider.ts) を参照してください。

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

その他の実装は [Provider実装ファイル](../src/lib/utils/contest_table_provider.ts) を参照してください。

**注意**: TDPC、FPS_24 も同じパターン。`contest_id` とメタデータだけ異なります。

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

その他の実装は [Provider実装ファイル](../src/lib/utils/contest_table_provider.ts) を参照してください。

---

## 各コンテスト種別の特有仕様

### 範囲フィルタ型

| コンテスト  | 範囲     | フォーマット | セクション | ラベル | 特有の注意    |
| ----------- | -------- | ------------ | ---------- | ------ | ------------- |
| ABC 001-041 | 001～041 | 001, 041     | A～D       | あり   | 旧形式        |
| ABC 042-125 | 042～125 | 042, 125     | A～D       | あり   | 共有問題(ARC) |
| ABC 126-211 | 126～211 | 126, 211     | A～F       | あり   | 6問制         |
| ABC 212-318 | 212～318 | 212, 318     | A～Ex/H    | あり   | 8問制         |
| ABC 319-    | 319～    | 319          | A～G       | あり   | 標準形式      |
| ARC 001-057 | 001～057 | 001, 057     | A～D       | あり   | 旧形式        |
| ARC 058-103 | 058～103 | 058, 103     | C～F       | あり   | 共有問題(ABC) |
| ARC 104-    | 104～    | 104          | 4～6問     | あり   | -             |
| AGC 001-    | 001～    | 001          | 4～7問     | あり   | -             |

### 単一ソース型

| コンテスト   | contest_id    | セクション | フォーマット |
| ------------ | ------------- | ---------- | ------------ |
| EDPC         | `'dp'`        | 26問       | A～Z         |
| TDPC         | `'tdpc'`      | 26問       | A～Z         |
| FPS_24       | `'fps-24'`    | 24問       | A～X         |
| ACL_PRACTICE | `'practice2'` | 12問       | A～L         |

### 複合ソース型

| コンテスト         | contest_id             | 問題数 | セクション   | 分割 | 複数コンテスト |
| ------------------ | ---------------------- | ------ | ------------ | ---- | -------------- |
| ABS                | `'abs'`                | 11問   | A～K         | なし | あり（11個）   |
| ABC-Like           | 計15コンテスト         | 2～8問 | A～H         | なし | あり（15個）   |
| TESSOKU_BOOK       | `'tessoku-book'`       | 166問  | A(01-77)/B/C | あり | あり           |
| MATH_AND_ALGORITHM | `'math-and-algorithm'` | 104問  | 001～104     | なし | あり           |

**複合型の参照解決**: `getMergedTasksMap()` が複数コンテスト由来の task_id を自動統合。テストデータは [prisma/contest_task_pairs.ts](../../prisma/contest_task_pairs.ts) を参照。

---

## テスト実装ガイド

### 必須テスト項目（全 Provider 共通）

1. 基本的なフィルタリング検証（contest_id / 型）
2. メタデータ取得（title、abbreviationName）
3. ディスプレイ設定確認（isShownHeader、isShownRoundLabel 等）
4. ラウンドラベルフォーマット（`getContestRoundLabel()`）
5. テーブル生成構造（問題数確認）
6. ヘッダー・ラウンドID取得
7. 空入力ハンドリング

### パターン固有テスト

- **範囲フィルタ型**: 範囲境界値テスト、共有問題の有無確認
- **複合ソース型**: 複数 contest_id 混在テスト、セクション分割ロジック

### Vitest テスト例

```typescript
import { describe, test, expect, vi } from 'vitest';

describe('MyNewProvider', () => {
  beforeEach(() => {
    vi.mock('src/lib/utils/contest', () => ({
      classifyContest: vi.fn((contestId) => {
        if (contestId === 'my-contest') return ContestType.MY_NEW;
        // ... その他
      }),
    }));
  });

  test('filters tasks correctly', () => {
    const provider = new MyNewProvider(ContestType.MY_NEW);
    const filtered = provider.filter(mockTasks);
    expect(filtered?.every((t) => t.contest_id === 'my-contest')).toBe(true);
  });

  test('returns correct metadata', () => {
    const provider = new MyNewProvider(ContestType.MY_NEW);
    expect(provider.getMetadata().title).toBe('Expected Title');
  });

  test('returns correct display config', () => {
    const provider = new MyNewProvider(ContestType.MY_NEW);
    const config = provider.getDisplayConfig();
    expect(config.isShownHeader).toBe(true);
  });
});
```

### モックデータ準備

**ステップ1: データソース確認**

- `prisma/tasks.ts`: contest_id、task_id フォーマット確認
- `prisma/contest_task_pairs.ts`: 共有問題の確認
- `prisma/schema.prisma`: task_table_index フォーマット確認

**ステップ2: ContestType 確認**

- `src/lib/types/contest.ts` で定義済みか確認
- `classifyContest()` ユーティリティで分類ロジック実装済みか確認

**ステップ3: テストデータ構築**

```typescript
export const taskResultsForNewProvider: TaskResults = [
  createTaskResultWithTaskTableIndex('contest_id', 'task_id_1', 'A', AC),
  createTaskResultWithTaskTableIndex('contest_id', 'task_id_2', 'B', AC),
  // ... 問題数分
];
```

---

## よくあるミス Top 5

### 1. **モック定義の漏れ**（最頻出）

**問題**: テストで新しい `contest_id` を使うと、`classifyContest()` モックに対応定義がなく失敗

**解決策**:

```typescript
vi.mock('src/lib/utils/contest', () => ({
  classifyContest: vi.fn((contestId) => {
    if (contestId === 'practice2') return ContestType.ACL_PRACTICE;
    if (contestId === 'new-contest') return ContestType.NEW;
    // ... その他を追加
  }),
}));
```

---

### 2. **getDisplayConfig() での属性漏れ**

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
  };
}
```

---

### 3. **複数コンテスト由来の問題を見落とし**

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

### 4. **ソート順序の不安定**

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

### 5. **パラメータ化テストでの共通化誤り**

**問題**: `describe.each()` で複数 Provider テストを共通化したが、1つの Provider だけ `displayConfig` が異なるため全体が失敗

**解決策**: 異なる Provider は個別 `describe` ブロック

```typescript
describe.each([...])('shared tests', () => { /* ... */ });

describe('CustomProvider with unique config', () => {
  test('custom test', () => { /* ... */ });
});
```

---

## 実装完了後

### ドキュメント更新チェックリスト

- [ ] 各コンテスト種別テーブル に新規 Provider の行を追加
- [ ] 複合型参照情報がある場合は複合型コンテストの実装パターン に追加
- [ ] テストデータ参考ファイル に新規ファイルがあれば追加
- [ ] GitHub Issues に当該 Provider のリンクを追加
- [ ] 最終更新日を現在日付に変更

---

## 参考資料

### GitHub Issues

- [#2919](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2919) - ABS
- [#2830](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2830) - ABC126ToABC211Provider
- [#2836](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2836) - ABC042～125 & ARC058～103
- [#2835](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2835) - ARC104OnwardsProvider
- [#2837](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2837) - AGC001OnwardsProvider
- [#2838](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2838) - ABC001～041 & ARC001～057
- [#2840](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2840) - ABCLikeProvider
- [#2776](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2776) - TessokuBookProvider
- [#2785](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2785) - MathAndAlgorithmProvider
- [#2797](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2797) - FPS24Provider
- [#2920](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2920) - ACLPracticeProvider

### 実装ファイル

- [Provider 実装](../src/lib/utils/contest_table_provider.ts)
- [単体テスト](../src/test/lib/utils/contest_table_provider.test.ts)
- [モックデータ](../src/test/lib/utils/test_cases/contest_table_provider.ts)

---

**最終更新**: 2026-01-26
