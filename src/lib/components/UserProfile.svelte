<script>
  import { Table, TableBody, TableBodyCell, TableBodyRow, Img, Button } from 'flowbite-svelte';

  export let username = '';
  export let atcoder_id = '';
  export let isLoggedIn = false;
</script>

{#if username.length == 0}
  This user is not found.
{:else}
  <Img
    src="https://flowbite-svelte.com/images/examples/image-2@2x.jpg"
    alt="sample 1"
    size="max-w-xs"
    alignment="mx-auto"
    imgClass="h-96"
    class="rounded-full"
  />

  <Table noborder={true}>
    <TableBody>
      <TableBodyRow>
        <TableBodyCell>username:</TableBodyCell>
        <TableBodyCell>{username}</TableBodyCell>
      </TableBodyRow>
      <TableBodyRow>
        <TableBodyCell>AtCoderId</TableBodyCell>
        <TableBodyCell>{atcoder_id}</TableBodyCell>
      </TableBodyRow>
    </TableBody>
  </Table>

  {#if isLoggedIn}
    <Button type="submit">Edit</Button>
  {/if}
{/if}
