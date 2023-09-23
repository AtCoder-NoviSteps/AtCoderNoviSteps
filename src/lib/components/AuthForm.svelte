<script lang="ts">
  import { enhance } from '$app/forms';
  import { Card, Button, Label, Input, Checkbox } from 'flowbite-svelte';

  // 必要なコンポーネントだけを読み込んで、コンパイルを時間を短縮
  // @ts-ignore
  import UserOutlineSolid from 'flowbite-svelte-icons/UserCircleSolid.svelte';
  // @ts-ignore
  import EyeOutline from 'flowbite-svelte-icons/EyeOutline.svelte';
  // @ts-ignore
  import EyeSlashOutline from 'flowbite-svelte-icons/EyeSlashOutline.svelte';

  // FIXME: 構造体に相当するものを利用した方が拡張・修正がしやすくなるかもしれせまん
  export let title: string;
  export let submitButtonLabel: string;
  export let confirmationMessage: string;
  export let alternativePageName: string;
  export let alternativePageLink: string;

  let showPassword = false;
</script>

<!-- TODO: containerのデフォルト値を設定できないか? -->
<!-- TODO: ログインとほぼ同じなので、コンポーネント化 -->
<!-- TODO: バリデーションの結果を表示 -->
<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/card#Card_with_form_inputs -->
<!-- https://github.com/themesberg/flowbite-svelte-icons/tree/main/src/lib -->
<div class="container mx-auto w-5/6 flex flex-col items-center">
  <Card class="w-full max-w-md">
    <form method="post" use:enhance class="flex flex-col space-y-6">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">{title}</h3>

      <!-- User name -->
      <Label class="space-y-2">
        <span>ユーザ名</span>
        <Input name="username" placeholder="chokudai" required>
          <UserOutlineSolid slot="left" class="w-5 h-5" />
        </Input>
      </Label>

      <!-- Password -->
      <Label class="space-y-2">
        <span>パスワード</span>
        <Input
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="•••••••"
          required
        >
          <!-- Show / hide password -->
          <button
            slot="left"
            on:click={() => (showPassword = !showPassword)}
            class="pointer-events-auto"
          >
            {#if showPassword}
              <EyeOutline class="w-5 h-5" />
            {:else}
              <EyeSlashOutline class="w-5 h-5" />
            {/if}
          </button>
        </Input>
      </Label>

      <!-- TODO: ログイン画面で、パスワードの記録・忘れた場合のリセット機能を追加 -->
      <!-- <div class="flex items-start">
      <Checkbox>Remember me</Checkbox>
      <a href="/" class="ml-auto text-sm text-primary-700 hover:underline dark:text-primary-500">
        Lost password?
      </a>
    </div> -->

      <Button type="submit" class="w-full">{submitButtonLabel}</Button>

      <div class="text-sm font-medium text-gray-500 dark:text-gray-300">
        {confirmationMessage}
        <a
          href={alternativePageLink}
          class="text-primary-700 hover:underline dark:text-primary-500"
        >
          {alternativePageName}
        </a>
      </div>
    </form>
  </Card>
</div>
