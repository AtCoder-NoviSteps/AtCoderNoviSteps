<script lang="ts">
  import { onDestroy } from 'svelte';

  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    Label,
    Input,
    Button,
  } from 'flowbite-svelte';
  import { BadgeCheckOutline, BanOutline } from 'flowbite-svelte-icons';

  import HeadingOne from '$lib/components/HeadingOne.svelte';

  import type { FloatingMessages } from '$lib/types/floating_message';

  export let formAction: string = 'account_transfer';
  export let data: { accountTransferMessages: FloatingMessages };

  let accountTransferMessages = data.accountTransferMessages;
  let clearMessagesTimeout: ReturnType<typeof setTimeout>;
  let sourceUserName = '';
  let destinationUserName = '';

  // 10秒後にメッセージを空にする
  $: if (accountTransferMessages.length > 0) {
    clearTimeout(clearMessagesTimeout);

    clearMessagesTimeout = setTimeout(() => {
      accountTransferMessages = [];
    }, 10000);
  }

  onDestroy(() => {
    clearTimeout(clearMessagesTimeout);
  });
</script>

<HeadingOne title="アカウント移行" />
<form method="POST" class="space-y-4" action={formAction}>
  新しく作成された空のアカウントに、旧アカウントの回答データをコピーできます。
  <Table shadow hoverable={true} class="text-md">
    <TableBody tableBodyClass="divide-y">
      <TableBodyRow>
        <TableBodyCell>
          <Label>
            <p>旧アカウント名</p>
          </Label>
        </TableBodyCell>
        <TableBodyCell>
          <Input id="source_user_name" name="source_username" bind:value={sourceUserName}></Input>
        </TableBodyCell>
      </TableBodyRow>
      <TableBodyRow>
        <TableBodyCell>
          <Label>
            <p>新アカウント名</p>
          </Label>
        </TableBodyCell>
        <TableBodyCell>
          <Input
            id="destination_user_name"
            name="destination_username"
            bind:value={destinationUserName}
          ></Input>
        </TableBodyCell>
      </TableBodyRow>
    </TableBody>
  </Table>
  <div class="flex justify-center">
    <Button type="submit" class="w-full sm:w-5/6 m-4">コピー</Button>
  </div>
</form>

<!-- ステータス表示 -->
<div class="p-4 space-y-4">
  {#each accountTransferMessages as accountTransferMessage}
    <div class="flex items-center space-x-2">
      {#if accountTransferMessage.status}
        <!-- 成功時のアイコン: BadgeCheckOutline -->
        <BadgeCheckOutline class="w-5 h-5 text-green-500"></BadgeCheckOutline>
      {:else}
        <!-- 失敗時のアイコン: BanOutline -->
        <BanOutline class="w-5 h-5 text-red-500"></BanOutline>
      {/if}
      <span>{accountTransferMessage.message}</span>
    </div>
  {/each}
</div>
