# Supabase に CSV からデータをインポートする方法

## 基本的な手順

### 1. CSV ファイルの準備

Supabase Dashboard からのインポートでは、以下のカラムを **必ず含める** 必要があります：

- `id` - UUID（自動生成ではなく、CSV に含める必要がある）
- `createdAt` - タイムスタンプ
- `updatedAt` - タイムスタンプ
- その他のビジネスロジック用カラム

**CSV ファイルの例（`contest_task_pairs.csv`）:**

```csv
id,contestId,taskId,taskTableIndex,createdAt,updatedAt
550e8400-e29b-41d4-a716-446655440000,tessoku-book,typical90_s,C18,2025-11-03T10:00:00.000Z,2025-11-03T10:00:00.000Z
6ba7b810-9dad-11d1-80b4-00c04fd430c8,tessoku-book,math_and_algorithm_ac,C09,2025-11-03T10:00:00.000Z,2025-11-03T10:00:00.000Z
7cb12b42-0b4a-11d2-91c5-00d04fd430c9,tessoku-book,abc007_3,B63,2025-11-03T10:00:00.000Z,2025-11-03T10:00:00.000Z
```

### 2. Python で UUID と タイムスタンプを生成

既存の CSV に `id`、`createdAt`、`updatedAt` を追加するスクリプト：

```python
import uuid
import csv
from datetime import datetime

# 現在時刻を ISO 8601 形式で取得
now = datetime.utcnow().isoformat() + 'Z'

# CSV を読み込み
with open('tessoku-book.csv', 'r') as f:
    reader = csv.reader(f)
    header = next(reader)
    rows = list(reader)

# ID とタイムスタンプを追加して新しい CSV を作成
with open('tessoku-book-with-id.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['id', 'createdAt', 'updatedAt'] + header)

    for row in rows:
        writer.writerow([str(uuid.uuid4()), now, now] + row)

print(f"✅ {len(rows)} 件のデータを処理しました")
```

### 3. Supabase Dashboard からインポート

1. [Supabase ダッシュボード](https://supabase.com/dashboard)にログイン
2. 対象のプロジェクト → 「SQL Editor」または「Table Editor」を選択
3. 対象テーブル（例：`contesttaskpair`）を選択
4. 右上の「Import data」または「↓ Import」ボタンをクリック
5. 生成した CSV ファイル（`tessoku-book-with-id.csv`）を選択
6. カラムのマッピングを確認
7. 「Import」をクリック

## トラブルシューティング

### エラー: "null value in column "id" violates not-null constraint"

**原因:** CSV に `id` カラムが含まれていない場合、Supabase が自動生成してくれません。

**解決方法:** 上記の Python スクリプトを使用して、UUID を生成した CSV を作成してください。

### エラー: カラム名が一致しない

**原因:** CSV のカラム名とテーブルの属性名が異なる

**対応:**

- CSV のカラム名とテーブルの属性名が完全に一致していることを確認
- インポート画面でカラムマッピングを手動で行う
- 大文字小文字は区別されるので注意

### CSV のカラム順序が異なる場合

**結果:** 問題ありません。Supabase はカラム名で識別するため、順序は関係ありません。

## 得られた教訓

### 1. 自動生成カラムについて

Prisma スキーマで `@default(uuid())` や `@default(now())` が定義されていても、Supabase Dashboard の CSV インポート機能はこのデフォルト値を適用しません。

```prisma
model ContestTaskPair {
  id             String   @id @default(uuid())    // ← デフォルト値が定義されていても
  createdAt      DateTime @default(now())          // ← CSV インポートには反映されない
  updatedAt      DateTime @updatedAt
}
```

**対策:** CSV ファイルに明示的にこれらのカラムを含める必要があります。

### 2. カラム名の一致は必須

- **必須:** CSV のカラム名 = テーブルの属性名
- **不要:** カラムの順序
- **補完:** インポート画面でマッピングできるが、あらかじめ一致させておくのが確実

### 3. UUID v4 の選択

デフォルトの `uuid()` (v4) はランダムなため、DB インデックスの効率が低下します。大規模なデータセットの場合は、`cuid()` の使用や UUID v6 の検討を推奨します。

## 参考資料

- [Supabase 公式 - Import data](https://supabase.com/docs/guides/database/import-data)
- [Prisma - @default 関数](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#default)
- [RFC 9562 - UUID Versions](https://tools.ietf.org/html/rfc9562)
- [UUID Library for Python - uuid4](https://docs.python.org/3/library/uuid.html#uuid.uuid4)
