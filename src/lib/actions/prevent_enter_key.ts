// Usage:
//
// 1. 任意のSvelteコンポーネントにインポート
// <script>
//   import { preventEnterKey } from '$lib/actions/prevent_enter_key';
// </script>

// 2. formに use:preventEnterKey を追加
// <form use:preventEnterKey method="post">
//   <!-- フォームの内容 -->
// </form>
export function preventEnterKey(node: HTMLElement) {
  node.addEventListener('keydown', handleKeyDown);

  return {
    destroy() {
      node.removeEventListener('keydown', handleKeyDown);
    },
  };
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
  }
}
