<script lang="ts">
  import { Heading, Button } from 'flowbite-svelte';
  import HeadingOne from '$lib/components/HeadingOne.svelte';

  interface Props {
    errorStatus: number | undefined;
    errorMessage: string | undefined;
    returnUrl: string;
    returnButtonLabel: string;
  }

  let { errorStatus, errorMessage, returnUrl, returnButtonLabel }: Props = $props();
</script>

<div
  class="container mx-auto md:w-4/5 lg:w-2/3 py-4 md:py-8 px-3 md:px-0 flex flex-col items-center"
>
  <HeadingOne title="エラーが発生しました" />

  <Heading
    tag="h2"
    class="text-3xl mb-3 text-gray-900 dark:text-gray-300"
    aria-label="error status"
  >
    {errorStatus ?? ''}
  </Heading>

  <p class="dark:text-gray-300" aria-label="error messages">{errorMessage ?? ''}</p>

  <div class="flex justify-center mt-6">
    <Button href={returnUrl} color="primary" class="px-6">
      {returnButtonLabel}
    </Button>
  </div>
</div>
