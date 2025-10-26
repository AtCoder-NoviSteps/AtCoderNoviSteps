<script lang="ts">
  import { tick } from 'svelte';
  import { goto } from '$app/navigation';

  import { Card, Button, Label, Input, Hr } from 'svelte-5-ui-lib';

  // 必要なコンポーネントだけを読み込んで、コンパイルを時間を短縮
  import CircleUserRound from '@lucide/svelte/icons/circle-user-round';
  import Eye from '@lucide/svelte/icons/eye';
  import EyeOff from '@lucide/svelte/icons/eye-off';

  import MessageHelperWrapper from '$lib/components/MessageHelperWrapper.svelte';

  import {
    GUEST_USER_NAME,
    GUEST_USER_PASSWORD,
    // GUEST_USER_PASSWORD_FOR_LOCAL,
    LOGIN_LABEL,
  } from '$lib/constants/forms';
  import { HOME_PAGE, LOGIN_PAGE, FORGOT_PASSWORD_PAGE } from '$lib/constants/navbar-links';

  interface Props {
    // FIXME: 構造体に相当するものを利用した方が拡張・修正がしやすくなるかもしれせまん
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formProperties: any;
    title: string;
    submitButtonLabel: string;
    confirmationMessage: string;
    alternativePageName: string;
    alternativePageLink: string;
  }

  let {
    formProperties,
    title,
    submitButtonLabel,
    confirmationMessage,
    alternativePageName,
    alternativePageLink,
  }: Props = $props();

  const { form, message, errors, submitting, enhance } = formProperties;

  let isSubmitting = $state(false);

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

      // FIXME: ログイン前のページに戻れるようにする
      await goto(HOME_PAGE);
    } catch (error) {
      console.error('Failed to login as a guest: ', error);
    } finally {
      isSubmitting = false;
    }
  }

  const UNFOCUSABLE = -1;
  let showPassword = $state(false);

  function isLoginForm(title: string): boolean {
    return title === LOGIN_LABEL;
  }
</script>

<!-- FIXME: コンポーネントが巨大になってきたと思われるので、分割しましょう -->
<!-- TODO: containerのデフォルト値を設定できないか? -->
<!-- See: -->
<!-- https://github.com/lucide-icons/lucide -->
<div class="container mx-auto py-8 w-5/6 flex flex-col items-center">
  <Card class="w-full max-w-md">
    <form id="auth-form" method="post" use:enhance class="flex flex-col space-y-6">
      <h3 class="text-xl font-medium text-gray-900 dark:text-white">{title}</h3>
      <MessageHelperWrapper message={$message} />

      <!-- Login as guest -->
      <Button
        type="button"
        class="w-full"
        onclick={handleLoginAsGuest}
        onkeydown={handleLoginAsGuest}
        disabled={isSubmitting || $submitting}
      >
        <div class="text-md">お試し用のアカウントでログイン</div>
      </Button>

      <div>
        <Hr hrClass="my-2 h-0.5 bg-gray-400 dark:bg-gray-200" />
      </div>

      <!-- User name -->
      <div class="space-y-2">
        <Label for="username-in-auth-form">
          <p>ユーザ名</p>
          <p>（変更不可。3〜24文字で、半角英数字と_のみ）</p>
        </Label>

        <!-- Note: class=“ps-10” is required to ensure that the string does not overlap with the icon. -->
        <Input
          id="username-in-auth-form"
          type="text"
          name="username"
          placeholder="chokudai"
          aria-invalid={$errors.username ? 'true' : undefined}
          bind:value={$form.username}
          disabled={$submitting || isSubmitting}
          required
          class="ps-10"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
        >
          {#snippet left()}
            <CircleUserRound class="w-5 h-5" tabindex={UNFOCUSABLE} />
          {/snippet}
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
          class="ps-10"
          autocomplete={isLoginForm(title) ? 'current-password' : 'new-password'}
          autocapitalize="none"
          spellcheck="false"
        >
          <!-- Show / hide password -->
          {#snippet left()}
            <button
              type="button"
              tabindex={UNFOCUSABLE}
              onclick={() => (showPassword = !showPassword)}
              class="pointer-events-auto"
            >
              {#if showPassword}
                <Eye class="w-5 h-5" tabindex={UNFOCUSABLE} />
              {:else}
                <EyeOff class="w-5 h-5" tabindex={UNFOCUSABLE} />
              {/if}
            </button>
          {/snippet}
        </Input>

        <!-- エラーメッセージがあれば表示 -->
        <MessageHelperWrapper message={$errors.password} />
      </div>

      <!-- TODO: ログイン画面で、パスワードの記録・忘れた場合のリセット機能を追加 -->
      <!-- HACK: 認証ライブラリの移行・メールアドレスの登録・送信機能などが必要なため、暫定的に「アカウント移行機能」で対応 -->
      {#if isLoginForm(title)}
        <div class="flex items-start">
          <!-- <Checkbox>Remember me</Checkbox> -->

          <a
            href={FORGOT_PASSWORD_PAGE}
            class="ml-auto text-sm text-primary-700 hover:underline dark:text-primary-500"
          >
            パスワードを忘れましたか?
          </a>
        </div>
      {/if}

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
