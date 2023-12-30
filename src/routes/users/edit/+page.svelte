<script lang="ts">
  import { Tabs, TabItem, Label, Input, Button } from 'flowbite-svelte';
  import AtCoderUserValidationForm from '$lib/components/AtCoderUserValidationForm.svelte';
  //import type { ActionForm } from './$types';
  export let data;
  //export let form;

  let username = data.username;
  let atcoder_username = data.atcoder_username;
  let atcoder_validationcode = data.atcoder_validationcode;

  export let status = 'nothing';
  if (data.is_validated == true) {
    status = 'validated';
  }
  if (data.atcoder_username.length > 0 && data.atcoder_validationcode.length > 0) {
    status = 'generated';
  }
</script>

<Tabs>
  <TabItem open title="基本情報編集">
    <p class="text-sm text-gray-500 dark:text-gray-400">
      <b>Profile:</b>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
      et dolore magna aliqua.
    </p>
    <form action="update">
      <Label class="space-y-2">
        <span>Username</span>
        <Input size="md" disabled readonly label="Username" bind:value={username} />
      </Label>
      <Label class="space-y-2">
        <span>AtCoder Id</span>
        <Input size="md" disabled readonly label="AtCoder ID" value={atcoder_username} />
      </Label>
      <Button type="submit">Save</Button>
    </form>
  </TabItem>
  <TabItem disabled>
    <span slot="title" class="text-gray-400 dark:text-gray-500">ステータス編集</span>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      <b>Settings:</b>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
      et dolore magna aliqua.
    </p>
  </TabItem>
  <TabItem title="AtCoder連携">
    <AtCoderUserValidationForm {username} {atcoder_username} {atcoder_validationcode} {status} />
  </TabItem>

  <TabItem disabled>
    <span slot="title" class="text-gray-400 dark:text-gray-500">インポート</span>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      <b>Dashboard:</b>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
      et dolore magna aliqua.
    </p>
  </TabItem>
  <TabItem title="退会">
    <form action="/users/delete">
      <Label class="space-y-2">
        <span>Username</span>
        <Input size="md" disabled readonly label="Username" bind:value={username} />
      </Label>

      <Button disabled readonly type="submit">Delete Account</Button>
    </form>
  </TabItem>
</Tabs>
