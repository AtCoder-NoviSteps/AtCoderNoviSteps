<script lang="ts">
  import type { PageData } from './$types';
  import { superForm } from 'sveltekit-superforms/client';

  import AuthForm from '$lib/components/AuthForm.svelte';
  import { CREATE_ACCOUNT_LABEL, LOGIN_LABEL } from '$lib/constants/forms';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<AuthForm
  formProperties={superForm(data?.form)}
  title={CREATE_ACCOUNT_LABEL}
  submitButtonLabel={CREATE_ACCOUNT_LABEL}
  confirmationMessage="アカウントを登録していますか?"
  alternativePageName={LOGIN_LABEL}
  alternativePageLink="/login"
/>
