<script lang="ts">
  import AuthForm from '$lib/components/AuthForm.svelte';
  import { CREATE_ACCOUNT_LABEL, LOGIN_LABEL } from '$lib/constants/forms';
</script>

<AuthForm
  title={CREATE_ACCOUNT_LABEL}
  submitButtonLabel={CREATE_ACCOUNT_LABEL}
  confirmationMessage="アカウントを登録していますか?"
  alternativePageName={LOGIN_LABEL}
  alternativePageLink="/login"
/>
