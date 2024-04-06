<script lang="ts">
  import { Card, Button, Label, Input, Helper } from 'flowbite-svelte';

  // 必要なコンポーネントだけを読み込んで、コンパイルを時間を短縮
  // モジュールは読み込めているのに以下のエラーが発生するため、やむなく@ts-ignoreを使用
  // Cannot find module 'flowbite-svelte-icons/xxx.svelte' or its corresponding type declarations.ts(2307)
  // @ts-ignore
  import UserOutlineSolid from 'flowbite-svelte-icons/UserCircleSolid.svelte';
  // @ts-ignore
  import EyeOutline from 'flowbite-svelte-icons/EyeOutline.svelte';
  // @ts-ignore
  import EyeSlashOutline from 'flowbite-svelte-icons/EyeSlashOutline.svelte';

  // FIXME: 構造体に相当するものを利用した方が拡張・修正がしやすくなるかもしれせまん
  export let formProperties;
  export let title: string;
  export let submitButtonLabel: string;
  export let confirmationMessage: string;
  export let alternativePageName: string;
  export let alternativePageLink: string;

  const { form, message, errors, submitting, enhance } = formProperties;

  let showPassword = false;
</script>

<!-- TODO: ゲストユーザ(お試し用)としてログインできるようにする -->
<!-- FIXME: コンポーネントが巨大になってきたと思われるので、分割しましょう -->
<!-- TODO: containerのデフォルト値を設定できないか? -->
<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/card#Card_with_form_inputs -->
<!-- https://github.com/themesberg/flowbite-svelte-icons/tree/main/src/lib -->
<div class="container mx-auto w-5/6 flex flex-col items-center">
  <Card class="w-full max-w-md">
    <form method="post" use:enhance class="flex flex-col space-y-6">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">{title}</h3>

      {#if $message}
        <Helper class="mt-2" color="red">
          <span class="font-medium">{$message}</span>
        </Helper>
      {/if}

      <!-- User name -->
      <Label class="space-y-2">
        <span>
          <p>ユーザ名</p>
          <p>（変更不可。5〜24文字で、半角英数字のみ）</p>
        </span>

        <Input
          name="username"
          placeholder="chokudai"
          aria-invalid={$errors.username ? 'true' : undefined}
          bind:value={$form.username}
          disabled={$submitting}
          required
        >
          <UserOutlineSolid slot="left" class="w-5 h-5" />
        </Input>

        <!-- エラーメッセージがあれば表示 -->
        {#if $errors.username}
          <Helper class="mt-2" color="red">
            <span class="font-medium">{$errors.username}</span>
          </Helper>
        {/if}
      </Label>

      <!-- Password -->
      <Label class="space-y-2">
        <!-- HACK: 注意書きはTooltipで表示させる? -->
        <span>
          <p>パスワード</p>
          <p>（8文字以上で、半角英文字(小・大)と数字を各1文字以上）</p>
        </span>

        <Input
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

        <!-- エラーメッセージがあれば表示 -->
        {#if $errors.password}
          <Helper class="mt-2" color="red">
            <span class="font-medium">{$errors.password}</span>
          </Helper>
        {/if}
      </Label>

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
