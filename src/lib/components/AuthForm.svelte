<script lang="ts">
  import { tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { Card, Button, Label, Input, Hr } from 'flowbite-svelte';

  // 必要なコンポーネントだけを読み込んで、コンパイルを時間を短縮
  import UserOutlineSolid from 'flowbite-svelte-icons/UserCircleSolid.svelte';
  import EyeOutline from 'flowbite-svelte-icons/EyeOutline.svelte';
  import EyeSlashOutline from 'flowbite-svelte-icons/EyeSlashOutline.svelte';

  import MessageHelperWrapper from '$lib/components/MessageHelperWrapper.svelte';

  import {
    GUEST_USER_NAME,
    GUEST_USER_PASSWORD,
    // GUEST_USER_PASSWORD_FOR_LOCAL,
  } from '$lib/constants/forms';
  import { HOME_PAGE, LOGIN_PAGE } from '$lib/constants/navbar-links';

  // FIXME: 構造体に相当するものを利用した方が拡張・修正がしやすくなるかもしれせまん
  export let formProperties;
  export let title: string;
  export let submitButtonLabel: string;
  export let confirmationMessage: string;
  export let alternativePageName: string;
  export let alternativePageLink: string;

  const { form, message, errors, submitting, enhance } = formProperties;

  $: isSubmitting = false;

  async function handleLoginAsGuest(event: Event) {
    if (!event || (event instanceof KeyboardEvent && event.key !== 'Enter')) {
      event.preventDefault();
      return;
    }

    event.preventDefault();

    // HACK: ローカル環境のパスワードは一時的に書き換えて対応している
    //
    // See:
    // src/lib/constants/forms.ts
    $form.username = GUEST_USER_NAME;
    // $form.password = GUEST_USER_PASSWORD_FOR_LOCAL;
    $form.password = GUEST_USER_PASSWORD;

    try {
      // $formの更新後にフォームを送信
      await tick();
      isSubmitting = true;
      const formElement = event.target instanceof Element ? event.target.closest('form') : null;

      if (!formElement || !(formElement instanceof HTMLFormElement)) {
        throw new Error('Not found form element or HTMLFormElement');
      }

      const response = await fetch(LOGIN_PAGE, {
        method: 'POST',
        body: new FormData(formElement),
      });

      if (!response.ok) {
        console.error('Failed to login as a guest: ', response);
        return;
      }

      await goto(HOME_PAGE);
    } catch (error) {
      console.error('Failed to login as a guest: ', error);
    } finally {
      isSubmitting = false;
    }
  }

  const UNFOCUSABLE = -1;
  let showPassword = false;
</script>

<!-- FIXME: コンポーネントが巨大になってきたと思われるので、分割しましょう -->
<!-- TODO: containerのデフォルト値を設定できないか? -->
<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/card#Card_with_form_inputs -->
<!-- https://github.com/themesberg/flowbite-svelte-icons/tree/main/src/lib -->
<div class="container mx-auto py-8 w-5/6 flex flex-col items-center">
  <Card class="w-full max-w-md">
    <form id="auth-form" method="post" use:enhance class="flex flex-col space-y-6">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">{title}</h3>
      <MessageHelperWrapper message={$message} />

      <!-- Login as guest -->
      <Button
        type="button"
        class="w-full"
        on:click={handleLoginAsGuest}
        on:keydown={handleLoginAsGuest}
        disabled={isSubmitting || $submitting}
      >
        <div class="text-md">お試し用のアカウントでログイン</div>
      </Button>

      <div>
        <Hr classHr="my-2 h-0.5 bg-gray-400 dark:bg-gray-200" />
      </div>

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
          disabled={$submitting || isSubmitting}
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
          disabled={$submitting || isSubmitting}
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

      <Button type="submit" class="w-full" disabled={$submitting || isSubmitting}>
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
