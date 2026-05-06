<script lang="ts">
  import type { PageData } from './$types';
  import { page } from '$app/state';
  import { superForm } from 'sveltekit-superforms/client';

  import AuthForm from '$lib/components/AuthForm.svelte';

  import { buildSignupPath } from '$features/auth/utils/signup';

  import { CREATE_ACCOUNT_LABEL, LOGIN_LABEL } from '$lib/constants/forms';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const signupLink = $derived(buildSignupPath(page.url.searchParams.get('redirectTo')));
</script>

<AuthForm
  formProperties={superForm(data?.form)}
  title={LOGIN_LABEL}
  submitButtonLabel={LOGIN_LABEL}
  confirmationMessage="アカウントを持っていませんか?"
  alternativePageName={CREATE_ACCOUNT_LABEL}
  alternativePageLink={signupLink}
/>
