<script lang="ts">
  import { Input, Button, Label } from 'flowbite-svelte';

  export let username = '';
  export let atcoder_id = 'insert atcoder id';
  export let validationCode = 'show validation code';
  export let isLoggedIn = false;

  function saveData() {
    // データ保存の処理
    console.log('Data saved:', { username, atcoder_id, validationCode });
  }

  function verify() {
    // バリデーションコードの検証
    console.log('Verifying validation code:', validationCode);
  }

  function importSubmissionData() {
    // バリデーションコードの検証
    console.log('Import!');
  }
</script>

{#if isLoggedIn && username.length > 0}
  <!-- 編集可能なフォームを表示 -->
  <form on:submit|preventDefault>
    <!-- フォームの内容 -->
    Username:<Input label="Username" bind:value={username} />
    AtcoderId: <Input label="AtCoder ID" bind:value={atcoder_id} />
    <Button on:click={verify}>Verify</Button>
    ValidationCode:<Input label="Validation Code" bind:value={validationCode} />
    <Button on:click={saveData}>Save</Button>
    <Button on:click={importSubmissionData}>Import</Button>

    TODO:ユーザ情報の編集（atcoderIdの登録なども含め）できるといい気がする
    {username} is same as the session name.
  </form>
{:else if username.length == 0}
  TODO: User:{username} is not found.
{:else}
  <form>
    Username:<Label label="Username" value={username} />
    AtcoderId:<Label label="ID" value={atcoder_id} />
    TODO:ライバルのtaskの進捗情報が見られるといいかも知れない。
    {username} is not same as the session name.
  </form>
{/if}
