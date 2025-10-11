# Contest-Problem Mapping Extension Plan

## 概要

既存のTask テーブルのunique制約を維持しながら、複数コンテストで同一問題を扱うための拡張方針を検討。AtCoder Problems の実装を参考に、段階的な移行戦略を策定。

## 現状の課題

### 課題1: Task識別の制限

- **問題**: `task_id` が同じでも `contest_id` が異なるケースが多数存在
- **制約**: Task テーブルの `task_id` unique制約は必ず維持する必要がある
- **影響**: AtCoder Problems API の Problems API で登録済みの (task_id, contest_id) の問題のみ処理可能

### 課題2: 影響範囲の調査

- 数万行のTypeScript・Svelteコード
- `map<string, TaskResult>` 形式の処理が広範囲に存在
- e2eテストがほぼ実装されていないので、手動での確認が必要

## 解決方針

### 基本アプローチ

AtCoder Problems API を活用:

- 問題情報: 同一の `task_id` が存在する場合は、どれか一つのコンテストに割り当て
  - `https://kenkoooo.com/atcoder/resources/problems.json`
- コンテストと問題idの対応関係を網羅
  - `https://kenkoooo.com/atcoder/resources/contest-problem.json`

### 技術的解決策

#### 1. 複合キーによる識別

**方針**: `map<pair<string, string>, TaskResult>` への移行

```typescript
// 型定義
type TaskKey = `${string}:${string}`; // "contest_id:task_id"

// ヘルパー関数
function createTaskKey(contestId: string, taskId: string): TaskKey {
  return `${contestId}:${taskId}`;
}

// マップの型
type TaskResultMap = Map<TaskKey, TaskResult>;
```

**利点**:

- 文字列連結は一般的で高速
- TypeScriptのTuple型も利用可能だが、文字列の方が実用的
- O(1)での参照が可能

#### 2. データマイグレーション戦略

```typescript
// 既存データの移行
function migrateExistingData(oldMap: Map<string, TaskResult>): Map<TaskKey, TaskResult> {
  const newMap = new Map<TaskKey, TaskResult>();

  for (const [taskId, result] of oldMap) {
    const primaryContestId = result.contest_id || 'primary';
    const key = createTaskKey(primaryContestId, taskId);
    newMap.set(key, result);
  }

  return newMap;
}

// 互換性レイヤー
export class TaskMapAdapter {
  constructor(
    private enhanced: EnhancedTaskMap,
    private legacy: LegacyTaskMap,
  ) {}

  get(taskId: string, contestId?: string): TaskResult | undefined {
    if (contestId) {
      return this.enhanced.get(createTaskKey(contestId, taskId));
    }
    return this.legacy.get(taskId);
  }
}
```

#### 3. インポート処理の分離

**方針**: 問題データインポートとマッピングデータインポートを別ページで処理

```typescript
interface ImportOptions {
  includeContestMapping?: boolean; // contest-problem.json を使用
  onlyProblems?: boolean; // problems.json のみ使用
}

// 問題データインポート（既存制約を守る）
async function importTaskData(options: ImportOptions = {}) {
  if (options.onlyProblems !== false) {
    await importFromProblemsJson();
  }

  if (options.includeContestMapping) {
    await importContestProblemMapping();
  }
}
```

**分離理由**:

- 責務の分離（異なるAPIエンドポイント）
- エラーハンドリングの違い
- 将来のコンテストサイト固有設定への対応

## 実装計画

### Phase 1: 基盤整備

- [ ] 新しい型定義の作成
- [ ] ユーティリティ関数の実装
- [ ] 互換性レイヤーの作成

### Phase 2: 影響範囲調査

```bash
# 調査用コマンド
grep -r "taskId" src/ --include="*.ts" --include="*.svelte"
grep -r "Map<string," src/ --include="*.ts"
grep -r "TaskResult" src/ --include="*.ts"
```

### Phase 3: 段階的移行

1. 新しい型定義を導入
2. 互換性レイヤーで既存コードをラップ
3. モジュール単位で新しいAPIに移行
4. テストで検証

### Phase 4: インポート機能拡張

- [ ] マッピングデータ用の管理画面作成
- [ ] フィルタリング機能の実装
- [ ] バリデーション機能の追加

## データ投入方法

### 推奨アプローチ: 管理者向けWebインターフェース

**実装コスト**: 14-21時間（目安）

```typescript
// 基本機能
interface MappingImportPage {
  importContestProblemMapping(filters: ImportFilter): Promise<void>;
  previewMappingChanges(): Promise<MappingPreview>;
  validateMappingData(): Promise<ValidationResult>;
}

interface ImportFilter {
  contestIds?: string[];
  taskIds?: string[];
  dateRange?: { from: Date; to: Date };
}
```

**利点**:

- 長期的な保守性
- エラーハンドリングの容易さ
- 他コンテストサイト対応への拡張性

### ディレクトリ構成案

```
src/routes/admin/import/
├── problems/           # 問題データインポート
│   ├── +page.svelte
│   └── types.ts
├── mapping/            # コンテスト-問題マッピング
│   ├── +page.svelte
│   ├── bulk/
│   └── selective/
└── shared/            # 共通コンポーネント
    ├── ImportStatus.svelte
    └── ValidationResults.svelte
```

## 今後の課題

### 短期

- [ ] 影響範囲の詳細調査
- [ ] プロトタイプの作成
- [ ] 基本的なe2eテストの追加

### 中期

- [ ] 他コンテストサイトAPI対応
- [ ] APIレート制限への対応
- [ ] UI/UXの改善

### 長期

- [ ] 完全自動化システム
- [ ] 包括的なテストスイート
- [ ] パフォーマンス最適化

## リスク要因と対策

| リスク               | 影響度 | 対策                 |
| -------------------- | ------ | -------------------- |
| 既存機能の破綻       | 高     | 互換性レイヤーの実装 |
| データ不整合         | 中     | バリデーション強化   |
| パフォーマンス劣化   | 中     | 段階的な最適化       |
| メンテナンスコスト増 | 中     | ドキュメント整備     |

## 決定事項

1. **Task テーブルのunique制約は維持**
2. **複合キー (`contest_id:task_id`) による識別**
3. **段階的移行による安全な実装**
4. **インポート機能の責務分離**
5. **Web UI による管理画面実装**

## 参考リンク

- [API client in AtCoder Problems](https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/api/APIClient.ts#L239)
- [Problems API](https://kenkoooo.com/atcoder/resources/problems.json)
- [Contest-Problem API](https://kenkoooo.com/atcoder/resources/contest-problem.json)

---

**作成日**: 2025-09-17
**最終更新**: 2025-09-17
**ステータス**: 計画段階
