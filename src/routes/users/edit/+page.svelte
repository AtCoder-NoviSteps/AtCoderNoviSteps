<script lang="ts">
  import { Tabs, TabItem, Label, Input, Button, Alert } from 'flowbite-svelte';

  import AtCoderUserValidationForm from '$lib/components/AtCoderUserValidationForm.svelte';
  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import SubmissionButton from '$lib/components/SubmissionButton.svelte';
  //import type { ActionForm } from './$types';
  export let data;
  //export let form;

  let username = data.username;
  let atcoder_username = data.atcoder_username;
  let atcoder_validationcode = data.atcoder_validationcode;
  let atcoder_is_validated = data.is_validated;
  let message = data.message;
  let message_type = data.message_type;

  export let status = 'nothing';
  if (data.is_validated === true) {
    status = 'validated';
  }
  if (data.atcoder_username.length > 0 && data.atcoder_validationcode.length > 0) {
    status = 'generated';
  }
</script>

{#if message_type === 'default'}
  <Alert>
    <span class="font-medium">Message:</span>
    {message}
  </Alert>
{:else if message_type === 'green'}
  <Alert color="green">
    <span class="font-medium">Success alert!</span>
    Change a few things up and try submitting again.
  </Alert>
{/if}

<div class="container mx-auto w-5/6 lg:w-3/4">
  <Tabs style="underline" contentClass="bg-white">
    <!-- 基本情報 -->
    <TabItem open>
      <span slot="title" class="text-lg">基本情報</span>
      <ContainerWrapper>
        <form action="update" class="w-full max-w-md mt-6 space-y-6">
          <Label class="space-y-2">
            <span>ユーザ名</span>
            <Input size="md" disabled readonly label="Username" bind:value={username} />
          </Label>
          <Label class="space-y-2">
            <span>AtCoder ID</span>
            <Input size="md" disabled readonly label="AtCoder ID" value={atcoder_username} />
          </Label>

          <SubmissionButton labelName="保存" />
        </form>
      </ContainerWrapper>
    </TabItem>

    <!-- ステータス -->
    <TabItem disabled>
      <span slot="title" class="text-lg text-gray-400 dark:text-gray-500">ステータス編集</span>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        <b>Settings:</b>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </p>
    </TabItem>

    <!-- AtCoder IDを利用した認証 -->
    <TabItem>
      <span slot="title" class="text-lg">AtCoder IDを設定</span>
      <AtCoderUserValidationForm {username} {atcoder_username} {atcoder_validationcode} {status} />
    </TabItem>

    <!-- 問題の回答状況をインポート (AtCoder ProblemsのAPIを使用) -->
    {#if atcoder_is_validated === true}
      <TabItem>
        <span slot="title" class="text-lg text-gray-400 dark:text-gray-500">インポート</span>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          <b>TODO:Taskのインポートボタンを作成する</b>
        </p>
      </TabItem>
    {:else}
      <TabItem disabled>
        <span slot="title" class="text-lg text-gray-400 dark:text-gray-500">インポート</span>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          <b>Disabled:</b>
        </p>
      </TabItem>
    {/if}

    <!-- アカウント削除 -->
    <TabItem>
      <span slot="title" class="text-lg">アカウント削除</span>
      <ContainerWrapper>
        <form action="/users/delete" class="w-full max-w-md mt-6 space-y-6">
          <Label class="space-y-2">
            <span>ユーザ名</span>
            <Input size="md" disabled readonly label="Username" bind:value={username} />
          </Label>
          <Button disabled readonly type="submit" class="w-full">アカウントを削除</Button>
        </form>
      </ContainerWrapper>
    </TabItem>
  </Tabs>
</div>
