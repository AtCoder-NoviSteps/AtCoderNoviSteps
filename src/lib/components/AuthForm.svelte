<script lang="ts">
  import { Card, Button, Label, Input } from 'flowbite-svelte';

  // 必要なコンポーネントだけを読み込んで、コンパイルを時間を短縮
  // モジュールは読み込めているのに以下のエラーが発生するため、やむなく@ts-ignoreを使用
  // Cannot find module 'flowbite-svelte-icons/xxx.svelte' or its corresponding type declarations.ts(2307)
  // @ts-ignore
  import UserOutlineSolid from 'flowbite-svelte-icons/UserCircleSolid.svelte';
  // @ts-ignore
  import EyeOutline from 'flowbite-svelte-icons/EyeOutline.svelte';
  // @ts-ignore
  import EyeSlashOutline from 'flowbite-svelte-icons/EyeSlashOutline.svelte';

  import MessageHelperWrapper from '$lib/components/MessageHelperWrapper.svelte';

  // FIXME: 構造体に相当するものを利用した方が拡張・修正がしやすくなるかもしれせまん
  export let formProperties;
  export let title: string;
  export let submitButtonLabel: string;
  export let confirmationMessage: string;
  export let alternativePageName: string;
  export let alternativePageLink: string;

  const { form, message, errors, submitting, enhance } = formProperties;

  const UNFOCUSABLE = -1;
  let showPassword = false;
</script>

<!-- TODO: ゲストユーザ(お試し用)としてログインできるようにする -->
<!-- FIXME: コンポーネントが巨大になってきたと思われるので、分割しましょう -->
<!-- TODO: containerのデフォルト値を設定できないか? -->
<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/card#Card_with_form_inputs -->
<!-- https://github.com/themesberg/flowbite-svelte-icons/tree/main/src/lib -->
<div class="container mx-auto py-8 w-5/6 flex flex-col items-center">
  <Card class="w-full max-w-md">
    <form method="post" use:enhance class="flex flex-col space-y-6">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">{title}</h3>

      <MessageHelperWrapper message={$message} />

      <!-- User name -->
      <div class="space-y-2">
        <Label for="username-in-auth-form">
          <p>ユーザ名</p>
          <p>（変更不可。3〜24文字で、半角英数字と_のみ）</p>
        </Label>

        <Input
          id="username-in-auth-form"
          name="username"
          placeholder="chokudai"
          aria-invalid={$errors.username ? 'true' : undefined}
          bind:value={$form.username}
          disabled={$submitting}
          required
        >
          <UserOutlineSolid slot="left" class="w-5 h-5" tabindex={UNFOCUSABLE} />
        </Input>

        <!-- エラーメッセージがあれば表示 -->
        <MessageHelperWrapper message={$errors.username} />
      </div>

      <!-- Password -->
      <div class="space-y-2">
        <!-- HACK: 注意書きはTooltipで表示させる? -->
        <Label for="password-in-auth-form">
          <p>パスワード</p>
          <p>（8文字以上で、半角英文字(小・大)と数字を各1文字以上）</p>
        </Label>

        <Input
          id="password-in-auth-form"
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="•••••••"
          aria-invalid={$errors.password ? 'true' : undefined}
          bind:value={$form.password}
          disabled={$submitting}
          required
        >
          <!-- Show / hide password -->
          <button
            type="button"
            tabindex={UNFOCUSABLE}
            slot="left"
            on:click={() => (showPassword = !showPassword)}
            class="pointer-events-auto"
          >
            {#if showPassword}
              <EyeOutline class="w-5 h-5" tabindex={UNFOCUSABLE} />
            {:else}
              <EyeSlashOutline class="w-5 h-5" tabindex={UNFOCUSABLE} />
            {/if}
          </button>
        </Input>

        <!-- エラーメッセージがあれば表示 -->
        <MessageHelperWrapper message={$errors.password} />
      </div>

      <!-- TODO: ログイン画面で、パスワードの記録・忘れた場合のリセット機能を追加 -->
      <!-- <div class="flex items-start">
      <Checkbox>Remember me</Checkbox>
      <a href="/" class="ml-auto text-sm text-primary-700 hover:underline dark:text-primary-500">
        Lost password?
      </a>
    </div> -->

      <Button type="submit" class="w-full" disabled={$submitting}>
        {submitButtonLabel}
      </Button>

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
