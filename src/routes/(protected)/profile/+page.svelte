<!-- See: -->
<!-- https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/ -->
<script lang="ts">
  import { enhance } from '$app/forms';

  import type { PageData } from './$types';

  export let data: PageData;
</script>

<!-- TODO: UIライブラリを利用して見た目を整える -->
<h1>Profile</h1>

<p>User name: {data.username}</p>

<form method="post" action="logout?/logout" use:enhance>
  <input type="submit" value="Log out" />
</form>
