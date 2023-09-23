<script lang="ts">
  import AuthForm from '$lib/components/AuthForm.svelte';
  import { CREATE_ACCOUNT_LABEL, LOGIN_LABEL } from '$lib/constants/forms';
</script>

<AuthForm
  title={LOGIN_LABEL}
  submitButtonLabel={LOGIN_LABEL}
  confirmationMessage="アカウントを持っていませんか?"
  alternativePageName={CREATE_ACCOUNT_LABEL}
  alternativePageLink="/signup"
/>
