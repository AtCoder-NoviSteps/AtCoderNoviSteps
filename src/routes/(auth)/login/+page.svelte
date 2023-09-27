<script lang="ts">
  import type { PageData } from './$types';
  import { superForm } from 'sveltekit-superforms/client';

  export let data: PageData;

  import AuthForm from '$lib/components/AuthForm.svelte';
  import { CREATE_ACCOUNT_LABEL, LOGIN_LABEL } from '$lib/constants/forms';
</script>

<AuthForm
  formProperties={superForm(data?.form)}
  title={LOGIN_LABEL}
  submitButtonLabel={LOGIN_LABEL}
  confirmationMessage="アカウントを持っていませんか?"
  alternativePageName={CREATE_ACCOUNT_LABEL}
  alternativePageLink="/signup"
/>
