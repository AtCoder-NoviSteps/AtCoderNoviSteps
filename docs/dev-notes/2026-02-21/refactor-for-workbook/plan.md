# workbooks 機能の features/ 集約

## コンテキスト

GitHub issue #3193「[Refactor] 問題集機能に関するファイルをfeatures dir に集約しましょう」に基づく実装。

**目的**: 問題集並び替え機能を円滑に実装するため、workbooks 関連ファイルを `src/features/workbooks/` に集約。

**方針**:

- `docs/guides/architecture.md` の3層ディレクトリモデルに従う
- コンポーネントはページベース (list/, detail/, shared/) で整理
- テストはファイル隣接配置に移行
- ファイルの内部構造は変更せず、パスの修正のみ実施
- `getWorkbookWithAuthor` をサービス層へ移動

---

## 実装結果

✅ **完了**: 29ファイルを移動し、21+ファイルの import パスを更新
✅ **完了**: `getWorkbookWithAuthor` を `utils/workbook.ts` から `services/workbooks.ts` に移動
✅ **完了**: `TabItemWrapper` の責務分離（共通UI抽出 + ドメイン別薄いラッパー）

### コミット

- `db8c0ff1` - refactor: Move files to features/workbooks (#3193)
- `1e263a92` - refactor: Move and reconfigure workbooks to features (#3193)
- `e9135703` - docs: Remove completed workbooks from feature split plan (#3193)

### 完成したディレクトリ構造

```text
src/features/workbooks/
├── components/
│   ├── list/          # 一覧ページ (4ファイル)
│   ├── detail/        # 詳細ページ (2ファイル)
│   └── shared/        # 共通 (3ファイル)
├── fixtures/          # テストデータ (1ファイル)
├── services/          # ビジネスロジック (2ファイル)
├── stores/            # ストア (3ファイル + 3テスト)
├── types/             # 型定義 (1ファイル)
├── utils/             # ユーティリティ (3ファイル + 3テスト)
└── zod/               # バリデーション (1ファイル + 1テスト)
```

## 教訓

### アーキテクチャ原則

1. **ページベース構造が有効**: components/ を list/detail/shared で分けることで、用途が明確になり、コードの見通しが良くなった
2. **テスト隣接配置**: 対象ファイルの隣に配置することで、変更時にテストが目に入りやすくなった
3. **utils と services の責務分離**: DB アクセスを含む関数は `utils/` に置かない。誤って client から import されると SvelteKit のビルドエラーになる
4. **features 間の依存禁止**: `features/workbooks/` から他の features への参照は NG。共通化が必要なら `lib/` に移す

### コンポーネント設計

5. **排他的 props は責務混在のサイン**: 片方が必ず null になる props が存在する場合、コンポーネントが複数のドメインを担当している証拠
6. **テンプレート重複は共通化の根拠**: 「コンポーネントが小さいから重複してもよい」は誤り。重複行数ではなく、変更が波及するファイル数で判断する
7. **純粋UIと状態管理の分離**: UI構造（Tooltip・Icon・TabItem）は `onclick` prop を受け取る純粋UIとして切り出し、store への依存はドメイン別ラッパーに閉じ込める
8. **ディレクトリ名は機能で付ける**: `Tabs/` のようにコンセプト名を使うことで `TabItemWrapper/TabItemWrapper.svelte` のような冗長な重複を避けられる

### 実装プロセス

9. **依存関係順序が重要**: types → utils → zod → services → stores → components の順で移動することで、途中での型エラーを最小化できた
10. **テスト有無の事前確認**: 移動対象関数のテストが存在するか確認してから着手すると、作業範囲が明確になる
11. **段階的コミット**: Phase ごとにコミットすることで、問題発生時のロールバックが容易になった
12. **既存エラーの把握**: 事前に既知のエラー（AuthForm 関連、state_referenced_locally 警告）を把握しておくことで、リファクタリング起因のエラーと区別できた
13. **検証の重要性**: 型チェック・ビルド・テスト・Lint を実行することで、リファクタリングの成功を確認できた

### ツール活用

14. **Task tool で一括更新**: import パスの更新は Task tool（general-purpose agent）を使うことで効率化できた
