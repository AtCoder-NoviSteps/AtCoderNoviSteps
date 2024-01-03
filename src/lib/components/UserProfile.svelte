<script>
  import { Table, TableBody, TableBodyCell, TableBodyRow, Avatar, Button } from 'flowbite-svelte';

  export let username = '';
  export let atcoder_username = '';
  export let isLoggedIn = false;
</script>

{#if username.length === 0}
  This user is not found.
{:else}
  <div class=" flex flex-wrap justify-center space-x-4 rtl:space-x-reverse">
    <Avatar src="https://flowbite-svelte.com/images/examples/image-2@2x.jpg" rounded size="xl" />
  </div>

  <Table noborder={true}>
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
