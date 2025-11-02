# Button Group のレスポンシブ化

## 問題

640px未満の画面でボタングループの文字が縦に潰れてしまう

## 解決方法

Tailwind CSSのレスポンシブクラスを使用してボタンの折り返しと配置を実装

## コード変更

### 修正前

```svelte
<ButtonGroup class="m-4 contents-center">
```

### 修正後

```svelte
<div class="flex justify-center m-4">
  <ButtonGroup class="flex flex-wrap justify-start gap-1 shadow-none">
    {#each Object.entries(contestTableProviderGroups) as [type, config]}
      <Button
        onclick={() => updateActiveContestType(type as ContestTableProviderGroups)}
        class={`rounded-lg ${activeContestType === (type as ContestTableProviderGroups)
          ? 'active-button-class text-primary-700 dark:!text-primary-500'
          : ''}`}
        aria-label={config.getMetadata().ariaLabel}
      >
        {config.getMetadata().buttonLabel}
      </Button>
    {/each}
  </ButtonGroup>
</div>
```

## 使用クラス一覧

| クラス           | 役割                                        |
| ---------------- | ------------------------------------------- |
| `flex`           | Flexboxコンテナを有効化                     |
| `flex-wrap`      | 画面幅に応じてボタンを折り返す              |
| `justify-center` | ボタングループ全体を水平中央揃え（外側div） |
| `justify-start`  | ボタン自体を左寄せ（ButtonGroup内）         |
| `gap-1`          | ボタン間のスペーシング（0.25rem）           |
| `rounded-lg`     | ボタンの角に丸みを付与                      |
| `shadow-none`    | デフォルトシャドウを削除                    |

## 注記

`ButtonGroup`コンポーネントのデフォルトスタイルにシャドウが含まれているため、`shadow-none`クラスを追加してそれらを打ち消す必要があります。

## 参考資料

- [Tailwind CSS - Flex Wrap](https://tailwindcss.com/docs/flex-wrap)
- [Tailwind CSS - Justify Content](https://tailwindcss.com/docs/justify-content)
- [Tailwind CSS - Gap](https://tailwindcss.com/docs/gap)
- [Tailwind CSS - Border Radius](https://tailwindcss.com/docs/border-radius)
- [Tailwind CSS - Box Shadow](https://tailwindcss.com/docs/box-shadow)

## 使用ライブラリ

- Tailwind CSS
- Flowbite
- svelte-5-ui-lib
