<script lang="ts">
  import { Label, Input, Button } from 'flowbite-svelte';
  //import type { ActionForm } from './$types';

  export let username: string;
  export let atcoder_username: string;
  export let atcoder_validationcode: string;

  // status = notiong : username = "hogehoge" and atcoder_username = "" and atcoder_validationcode = "" and atcoder_validated = false
  // status = generated : username = "hogehoge" and atcoder_username = "fugafuga" and atcoder_validationcode = "xxxxxx" and validated = false
  // status = validated =  username = "hogehoge" and atcoder_username = "fugafuga" and atcoder_validationcode = "" and validated = true
  // for noting -> generated, push "generate" button (only "generate" button is aveilable)
  // for generated -> validated, push "validate" button ( "validate" and "edit" button is available )

  // for generated/validated -> notiong, push "edit" button ( "edit" is available)
  export let status: string;
</script>

{#if status == 'nothing'}
  <form method="POST" action="?/generate">
    <!-- hiddenでusernameを持つのは共通-->
    <Input size="md" type="hidden" name="username" bind:value={username} />
    <Label class="space-y-2">
      <span>Username:{username}</span>
    </Label>
    <Label class="space-y-2">
      <!-- AtCoderIdを修正できるのは、notingのステータスの時のみ-->
      <span>AtCoder Username</span>
      <Input
        size="md"
        label="atcoder_username"
        name="atcoder_username"
        bind:value={atcoder_username}
      />
    </Label>
    <Button type="submit">Generate</Button>
  </form>
{/if}

{#if status == 'generated'}
  <form method="POST" action="?/validate">
    <p class="text-sm text-gray-500 dark:text-gray-400">
      <b>Status: Generated</b>
      AtCoderの所属欄に、validationCodeを入力し、Validateボタンをクリックしてください。
    </p>

    <!-- hiddenでusernameを持つのは共通-->
    <Input size="md" type="hidden" name="username" bind:value={username} />
    <Label class="space-y-2">
      <span>Username:{username}</span>
    </Label>

    <!-- atcoder_usernameとvalidation_code は編集不可-->
    <Input size="md" type="hidden" name="atcoder_username" bind:value={atcoder_username} />
    <Label class="space-y-2">
      <span>AtCoder Username:{atcoder_username}</span>
    </Label>

    <Input
      size="md"
      type="hidden"
      name="usernatcoder_validationcodeame"
      bind:value={atcoder_validationcode}
    />
    <Label class="space-y-2">
      <span>Validation Code:{atcoder_validationcode}</span>
    </Label>

    <Button type="submit">Validate</Button>
  </form>

  <form method="POST" action="?/reset">
    <Input size="md" type="hidden" name="username" bind:value={username} />
    <Input size="md" type="hidden" name="atcoder_username" bind:value={atcoder_username} />
    <Button type="submit">Edit</Button>
  </form>
{/if}

{#if status == 'validated'}
  <form method="POST" action="?/reset">
    <p class="text-sm text-gray-500 dark:text-gray-400">
      <b>Status: Validated</b>
      This AtCoder Username is Validated.
    </p>

    <!-- hiddenでusernameを持つのは共通-->
    <Input size="md" type="hidden" name="username" bind:value={username} />
    <Label class="space-y-2">
      <span>Username:{username}</span>
    </Label>

    <!-- atcoder_usernameを表示（変更不可）-->
    <Input size="md" type="hidden" name="atcoder_username" bind:value={atcoder_username} />
    <Label class="space-y-2">
      <span>AtCoder Username:{atcoder_username}</span>
    </Label>

    <Button type="submit">Edit</Button>
  </form>
{/if}
