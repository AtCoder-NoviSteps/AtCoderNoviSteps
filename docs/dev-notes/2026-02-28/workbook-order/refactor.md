# リファクタリング計画

- 最小限の機能が実装されている状態だが、特にタスク終盤の精度が著しく低い
- 機能の追加・修正をしやすくするためにリファクタリングが必要
- これらと同様のタスクは、AI エージェントがサポートしている機能を活用して、自律的に修正させるようにする

## テスト

### 単体テストの修正・補強

- [ ] モックデータの値を意味のあるものに書き換え。prisma/seed.ts で参照しているデータを使用する
- [ ] 文字列 as HogeType は 既存の型を使う
- [ ] taskGrade, solutionCategory が混在しているテストを追加
- [ ] solutionCategory のテストを追加

### e2e テスト

- [ ] 初期計画で予定指定した内容を追加

## 全体

- [ ] コメントは英語で書く
- [ ] テストやコンポーネントで直書きされている型定義や定数を src/routes/(admin)/workbooks/order/\_types/kanban_board に移動させる
  - [ ] src/features/workbooks/types/workbook.ts の型を そのまま残すものと、src/features/workbooks/types/workbook_placements.ts に移動させるものに分ける
  - [ ] 上記に伴い参照先を修正
  - [ ] より汎用性の高いものは、src/features/workbooks/types/workbook.ts や workbook_placements.ts に移動させる
  - [ ] ベースとなる型 + 差分 に分ける
  - [ ] 配列要素を表す型は、複数形の型を定義して使うようにする
  - [ ] never や any は使わない
- [ ] filter や map では省略した変数ではなく、明示的に記述
  - [ ] 元の変数の単数形を使用

## Seed

- [ ] prisma/seed.ts の巨大なメソッドを分割

## Service 層

- src/features/workbooks/services/workbook_placements.ts
  - [ ] 型定義は、src/features/workbooks/types/workbook_placements.ts に移動
  - [ ] 文字列でハードコーディングされている型は、定義済みのものを基本的に使うように書き換え
  - [ ] initializeCurriculumPlacements() を責務に応じてメソッドを分割する
  - [ ] 戻り値の型を明記
  - [ ] JSDoc を使って、引数と戻り値のドキュメントを記述
- src/features/workbooks/services/workbook_placements.test.ts のテストケースの補強
  - [ ] taskGrade は、文字列ではなく、src/lib/types/task.ts の `TaskGrade` を使う

## サーバ側の処理

- src/routes/(admin)/workbooks/order/+page.server.ts
  - [ ] await prisma.model.doSomething のような処理は、Service 層に移動させる、もしくは、既存のメソッドを使用する
  - [ ] actions の処理がベタ書きになっているのでメソッドを分割し、適切なディレクトリ・ファイルに分ける

## コンポーネント

- src/routes/(admin)/workbooks/order/+page.svelte
  - [ ] UI の改善
    - [ ] ContainerWrapper を使用する
    - [ ] ページのタイトルを「問題集（並び替え）」にする
    - [ ] 青系統 → 緑系統（default）に変更
    - [ ] 「ボードに問題集を追加」を配置を左寄せにして、タイトルの下に移動させる

- src/routes/(admin)/workbooks/order/\_components/KanbanBoard.svelte
  - 警告の解消
    - [ ] Module '"$features/workbooks/types/workbook"' has no exported member 'WorkBookPlacement' や 'SolutionCategory'. の原因特定・解消
  - API アクセス
    - [ ] 処理の妥当性を批判的にレビューし、TypeScript や Svelte Kit で標準的な方法を利用する
      - [ ] onDragEnd
  - [ ] UI の改善
    - [ ] タブ: 日中モードのときに背景色の塗りつぶしを入れないようにする
    - [ ] 文字サイズをもう一回り大きくする
      - [ ] タブ: 解法別、カリキュラム
      - [ ] ボタン: 表示グレード、カテゴリ
    - [ ] ボタン
      - [ ] 青系統 → 緑系統（default）に変更
      - [ ] ホバーしたときは背景色を変える
    - [ ] パネル間同士の移動で、カードとカードの間にも移動できるようにする
  - コンポーネントのスリム化
    - [ ] SOLUTION_LABELS: 該当ファイルに移動
    - [ ] GRADE_LABELS: src/lib/types/task.ts の getTaskGrade() を使用
    - [ ] 直書きされている汎用的な処理は src/routes/(admin)/workbooks/order/\_utils/ として切り出す
    - [ ] 一つのメソッドで複数の処理がされている場合は、単一の責務となるように分割
      - [ ] onDragEnd
  - 可読性の向上
    - [ ] if 文 地獄になっているので、interface や 類似する機能を活用して場合分けを減らす
    - [ ] DragDropProvider の内部で重複しているになっているので、コンポーネントの分割や `snippet` などを活用して認知負荷を下げる
      - [ ] 解法別とグレード別がほぼ同じ処理なのに、2回ベタ書きされている
        - [ ] 目的が共通しているかを判定
        - [ ] DRY であればリファクタリング

- [ ] src/routes/(admin)/workbooks/order/\_components/KanbanColumn.svelte
  - [ ] UI の改善
    - [ ] 文字サイズを一回り拡大
      - [ ] ラベル
      - [ ] カードの数
    - [ ] ダークモードで、パネルの背景が識別できるようにする
    - [ ] カードの数が多いときは、縦方向のスクロールバーを表示

- [ ] src/routes/(admin)/workbooks/order/\_components/KanbanCard.svelte
  - [ ] UI の改善
    - /workbooks と同じように、該当ページへのリンクを貼る（既存のコンポーネントを使用）
    - [ ] 「未公開」のラベルを赤色にする
    - [ ] ホバーしたときにカードの枠線の色を緑系統に

- [ ] src/routes/(admin)/workbooks/order/\_components/ColumnSelector.svelte
  - [ ] opt のような省略はせず、option のように書く
  - [ ] opt.value を毎回参照するの非効率なので、@const を使う可能性を検討
    - [ ] 有効か判断
    - [ : 有効な場合のみ書き換え
  - [ ] button の class シンプルに記述する
  - [ ] 配色は緑系統を使用
  - [ ] `minSelect` では伝わらないので、`minRequired` のようにしてはどうか?
    - [ ] リネームの妥当性を検討
    - [ ] 別の命名候補も考える
  - [ ] 下限を設定根拠を英語で明記
    - [ ] ドロップ・アンド・ドラッグに必要な最小限のパネル数

## 管理画面

- [ ] 「問題集」の下に、「問題集（並び替え）」のリンクを追加

## ドキュメントの更新

- [ ] architecture.md のディレクトリ構成と指針を追記

## 修正内容の抽象化

- TODO: 上記の修正をしながら加筆・修正

## 教訓

- TODO: 上記の修正をしながら加筆・修正

## Claude Code の機能を活用した自律的な修正に向けた基盤作り

- TODO: 上記の修正をしながら加筆・修正
