<script lang="ts">
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import { BadgeCheckOutline, BanOutline } from 'flowbite-svelte-icons';
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    Label,
    Input,
    Button,
  } from 'flowbite-svelte';
  //let importContests = data.importContests;
  let source_username = '';
  let destination_username = '';
  export let data;
  let accountTransferMessages = data.results;
  // 10秒後にメッセージを空にする
  if (accountTransferMessages.length > 0) {
    setTimeout(() => {
      accountTransferMessages = []; // メッセージを消す
    }, 10000); // 10000ミリ秒（10秒）後に実行
  }
</script>

<HeadingOne title="回答コピー" />
<form method="POST" class="space-y-4" action="copy">
  <Table shadow hoverable={true} class="text-md">
    <TableBody tableBodyClass="divide-y">
      <TableBodyRow>
        <TableBodyCell>
          <Label>
            <p>Source User ID:</p>
          </Label>
        </TableBodyCell>
        <TableBodyCell>
          <Input id="source_user_name" name="source_username" bind:value={source_username}></Input>
        </TableBodyCell>
      </TableBodyRow>
      <TableBodyRow>
        <TableBodyCell>
          <Label>
            <p>Destination User ID:</p>
          </Label>
        </TableBodyCell>
        <TableBodyCell>
          <Input
            id="destination_user_name"
            name="destination_username"
            bind:value={destination_username}
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
