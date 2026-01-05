<script lang="ts">
  import { Table, TableBody, TableBodyCell, TableBodyRow, Avatar, Button } from 'flowbite-svelte';

  interface Props {
    username?: string;
    atcoder_username?: string;
    isLoggedIn?: boolean;
  }

  let { username = '', atcoder_username = '', isLoggedIn = false }: Props = $props();
</script>

{#if username.length === 0}
  This user is not found.
{:else}
  <!-- FIXME: ページに掲載する内容・レイアウトを修正 -->
  <!-- See: -->
  <!-- https://svelte-5-ui-lib.codewithshin.com/components/avatar -->
  <div class=" flex flex-wrap justify-center space-x-4 rtl:space-x-reverse">
    <Avatar dot={{}} cornerStyle="rounded" size="xl" />
  </div>

  <Table border={false}>
    <TableBody>
      <TableBodyRow>
        <TableBodyCell>username:</TableBodyCell>
        <TableBodyCell>{username}</TableBodyCell>
      </TableBodyRow>
      <TableBodyRow>
        <TableBodyCell>AtCoder username</TableBodyCell>
        <TableBodyCell>{atcoder_username}</TableBodyCell>
      </TableBodyRow>
    </TableBody>
  </Table>

  {#if isLoggedIn}
    <Button href="./edit">Edit</Button>
  {/if}
{/if}
