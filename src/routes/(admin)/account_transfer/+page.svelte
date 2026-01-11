<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { run } from 'svelte/legacy';

  import { superForm } from 'sveltekit-superforms';
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    Label,
    Input,
    Button,
  } from 'flowbite-svelte';
  import BadgeCheck from '@lucide/svelte/icons/badge-check';
  import Ban from '@lucide/svelte/icons/ban';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import MessageHelperWrapper from '$lib/components/MessageHelperWrapper.svelte';

  import type { FloatingMessages } from '$lib/types/floating_message';

  interface Props {
    formAction?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
  }

  let { formAction = 'account_transfer', data }: Props = $props();

  const { form, errors, message, submitting, enhance } = superForm(data.form);

  let accountTransferMessages: FloatingMessages = $state([]);

  run(() => {
    accountTransferMessages = data.accountTransferMessages as FloatingMessages;
  });

  let clearMessagesTimeout: ReturnType<typeof setTimeout> | undefined = $state();

  // 10秒後にメッセージを空にする
  run(() => {
    if (accountTransferMessages.length > 0) {
      clearTimeout(clearMessagesTimeout);

      clearMessagesTimeout = setTimeout(() => {
        accountTransferMessages = [];
      }, 10000);
    }
  });

  // HACK: アカウントの移行後に、別のページから戻ってくると処理内容が残ったままとなることへの対応。
  onMount(() => {
    accountTransferMessages = [];
  });

  onDestroy(() => {
    clearTimeout(clearMessagesTimeout);
  });
</script>

<HeadingOne title="アカウント移行" />

<ContainerWrapper>
  <form method="POST" class="flex flex-col gap-4" action={formAction} use:enhance>
    <div class="dark:text-gray-300">
      新しく作成された空のアカウントに、旧アカウントの回答データをコピーできます。
    </div>

    <MessageHelperWrapper message={$message} />

    <div class="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Table shadow hoverable={true} class="text-md">
        <TableBody class="divide-y divide-gray-200 dark:divide-gray-700">
          <TableBodyRow>
            <TableBodyCell>
              <Label>
                <p>旧アカウント名</p>
              </Label>
            </TableBodyCell>
            <TableBodyCell>
              <Input
                id="source_user_name"
                name="sourceUserName"
                bind:value={$form.sourceUserName}
                required
                aria-label="旧アカウント名"
              />

              <!-- エラーメッセージがあれば表示 -->
              <MessageHelperWrapper message={$errors.sourceUserName} />
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
                name="destinationUserName"
                bind:value={$form.destinationUserName}
                required
                aria-label="新アカウント名"
              />

              <!-- エラーメッセージがあれば表示 -->
              <MessageHelperWrapper message={$errors.destinationUserName} />
            </TableBodyCell>
          </TableBodyRow>
        </TableBody>
      </Table>
    </div>

    <div class="flex justify-center">
      <Button type="submit" class="w-full sm:w-5/6 m-4" disabled={$submitting}>
        {$submitting ? 'コピー中...' : 'コピー'}
      </Button>
    </div>
  </form>

  <!-- ステータス表示 -->
  <div class="p-4 space-y-4 dark:text-gray-300">
    {#each accountTransferMessages as accountTransferMessage}
      <div class="flex items-center space-x-2">
        {#if accountTransferMessage.status}
          <!-- 成功時のアイコン -->
          <BadgeCheck class="w-5 h-5 text-green-500" aria-hidden="true" />
        {:else}
          <!-- 失敗時のアイコン -->
          <Ban class="w-5 h-5 text-red-500" aria-hidden="true" />
        {/if}
        <span>{accountTransferMessage.message}</span>
      </div>
    {/each}
  </div>
</ContainerWrapper>
