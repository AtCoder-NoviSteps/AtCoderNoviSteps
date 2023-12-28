<script lang="ts">
  import { Tabs, TabItem, Label, Input, Button } from 'flowbite-svelte';
  export let data;
  let username = data.username;
  let atcoder_username = data.atcoder_username;
  let atcoder_validationcode = data.atcoder_validationcode;
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
        <Input size="md" disabled readonly label="AtCoder ID" bind:value={atcoder_username} />
      </Label>
      <Button type="submit">Import</Button>
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
    <form action="generate">
      <Label class="space-y-2">
        <span>Username</span>
        <Input size="md" disabled readonly label="Username" bind:value={username} />
      </Label>
      <Label class="space-y-2">
        <span>AtCoder Id</span>
        <Input size="md" label="AtCoder ID" bind:value={atcoder_username} />
      </Label>
      <Button type="submit">Generate</Button>
    </form>

    <form action="confirm">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        <b>How to validate:</b>
        AtCoderの所属欄に、validationCodeを入力し、Valicateボタンをクリックしてください。
      </p>
      <Label class="space-y-2">
        <span>Valication Code</span>
        <Input
          size="md"
          disabled
          readonly
          label="ValidationCode"
          bind:value={atcoder_validationcode}
        />
      </Label>

      <Button disabled readonly type="submit">Validate</Button>
    </form>
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
    <p class="text-sm text-gray-500 dark:text-gray-400">
      <b>Disabled:</b>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
      et dolore magna aliqua.
    </p>
  </TabItem>
</Tabs>
