# TabItem コンテキストエラー調査メモ

## エラー内容

```
Error: TabItem must be used within a Tabs component
```

flowbite-svelte の `TabItem` が Tabs コンテキストを取得できないときに投げるランタイムエラー。

## 発生状況

| 環境 | 発生 |
|------|------|
| ローカル dev サーバ（HMR 時） | 出る（修正前） |
| ローカル dev サーバ（F5 リロード） | dev サーバ再起動前は出て見えたが、HMR キャッシュのアーティファクト |
| `pnpm check`（svelte-check） | 出ない |
| staging（本番ビルド） | 出ない |

## 原因

### コード上の問題（2026-02-22 混入）

コミット `16315c84`（TabItemWrapper リファクタ）で `problems/+page.svelte` に以下の構造が導入された。

```svelte
<Tabs>
  {@render problemListTab('コンテスト別', ...)}
</Tabs>

{#snippet problemListTab(...)}
  <!-- Tabs の外で宣言 -->
  <ProblemListTabItem ...>...</ProblemListTabItem>
{/snippet}
```

`{#snippet}` が `</Tabs>` の**外**で宣言されている。Svelte 5 においてスニペットはレキシカルスコープでコンテキストをキャプチャするため、`{@render}` が `<Tabs>` 内で呼ばれていても、HMR 時に `TabItem` が Tabs コンテキストを取得できないケースがある。

### なぜ F5 でも出て見えたか

HMR が古いモジュール状態をキャッシュし続けていたため、dev サーバ再起動前は F5 後もエラーが残っているように見えた。コードのバグではなく dev 環境のアーティファクト。

### なぜ staging では出ないか

HMR なしの通常レンダリングでは、スニペットが `<Tabs>` 内で描画される際にコンテキストが正しく伝播するため。ローカル dev の HMR がコンポーネントを単体で再初期化するときにのみ発火する。

## 対処方法（実施済み）

`{#snippet problemListTab}` を廃止し、`ProblemListTabItem` を `<Tabs>` 直下に直接配置する。

```svelte
<Tabs ...>
  <ProblemListTabItem
    title="コンテスト別（アルファ版）"
    activeProblemList="contestTable"
    isOpen={isActiveTab('contestTable')}
  >
    <TaskTable {taskResults} {isLoggedIn} {isAtCoderVerified} {voteResults} />
  </ProblemListTabItem>

  <ProblemListTabItem
    title="グレード別"
    activeProblemList="listByGrade"
    isOpen={isActiveTab('listByGrade')}
  >
    <TaskGradeList {taskResults} {isLoggedIn}></TaskGradeList>
  </ProblemListTabItem>

  <ProblemListTabItem
    title="グレードの目安"
    activeProblemList="gradeGuidelineTable"
    isOpen={isActiveTab('gradeGuidelineTable')}
  >
    <GradeGuidelineTable />
  </ProblemListTabItem>
</Tabs>
```

これにより `ProblemListTabItem`（→ `TabItemWrapper` → `TabItem`）が `<Tabs>` の直接の子孫として初期化され、Tabs コンテキストが正しく伝播する。

`{#snippet problemListTab}` の廃止に伴い、不要になった `import type { Snippet } from 'svelte'` も削除した。

## 検証結果

- F5 リロード：エラーなし ✓
- HMR（ファイル保存）：エラーなし ✓
- `pnpm check`：エラーなし ✓
