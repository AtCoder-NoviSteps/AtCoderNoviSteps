# workbooks 機能の features/ 集約

## コンテキスト

GitHub issue #3193「[Refactor] 問題集機能に関するファイルをfeatures dir に集約しましょう」に基づく実装。

**目的**: 問題集並び替え機能を円滑に実装するため、workbooks 関連ファイルを `src/features/workbooks/` に集約。

**方針**:

- `docs/guides/architecture.md` の3層ディレクトリモデルに従う
- コンポーネントはページベース (list/, detail/, shared/) で整理
- テストはファイル隣接配置に移行
- ファイルの内部構造は変更せず、パスの修正のみ実施

## 実装結果

✅ **完了**: 29ファイルを移動し、21+ファイルの import パスを更新

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

### アーキテクチャ

1. **ページベース構造が有効**: components/ を list/detail/shared で分けることで、用途が明確になり、コードの見通しが良くなった
2. **テスト隣接配置**: `src/test/` から移動し、対象ファイルの隣に配置することで、変更時にテストが目に入りやすくなった
3. **依存関係順序が重要**: types → utils → zod → services → stores → components の順で移動することで、途中での型エラーを最小化できた

### 技術的ポイント

4. **zod スキーマの分離**: `src/lib/zod/schema.ts` から workbook 関連スキーマのみを抽出。他のスキーマ（auth, account）は残す
5. **fixtures の移動**: `prisma/workbooks.ts` を `src/features/workbooks/fixtures/` に移動し、`prisma/seed.ts` のパスを更新
6. **空ディレクトリ**: git は空ディレクトリを追跡しないため、削除してもコミットには含まれない

### 実装効率化

7. **Task tool で一括更新**: import パスの更新は Task tool（general-purpose agent）を使うことで効率化できた
8. **段階的コミット**: Phase ごとにコミットすることで、変更内容が明確になり、問題発生時のロールバックが容易になった
9. **検証の重要性**: 型チェック・ビルド・テスト・Lint を実行することで、リファクタリングの成功を確認できた

### 次回への示唆

10. **features 間の依存禁止**: `features/workbooks/` から他の features への参照は NG。共通化が必要なら `lib/` に移す
11. **既存エラーの把握**: 事前に既知のエラー（AuthForm関連、state_referenced_locally警告）を把握しておくことで、リファクタリング起因のエラーと区別できた
