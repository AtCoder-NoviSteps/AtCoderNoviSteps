// ドキュメントで公開されている型の一覧に載っておらず、ボタンコンポーネントの内部でのみ定義されている
// FIXME: ButtonColorTypeをインポートすると、ts2322エラーが出る
// HACK: 同じ属性を使っているのに、以下のようにハードコーディングするとなぜかエラーが出ない

// See:
// https://flowbite-svelte.com/docs/pages/typescript
// https://github.com/themesberg/flowbite-svelte/blob/main/src/lib/buttons/Button.svelte
// https://github.com/iamrishupatel/trello-clone/blob/16635c8bfcc46ffca1ab89c26752d745b2326b6f/src/lib/components/NewTask/NewTask.component.svelte
export type ButtonColor =
  | 'alternative'
  | 'blue'
  | 'dark'
  | 'green'
  | 'light'
  | 'primary'
  | 'purple'
  | 'red'
  | 'yellow'
  | 'none';
