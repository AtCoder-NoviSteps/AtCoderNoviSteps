<!-- See: -->
<!-- https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/ -->
<script lang="ts">
  import { enhance } from '$app/forms';
</script>

<!-- TODO: UIライブラリを利用して見た目を整える -->
<h1>Log in</h1>

<form method="post" use:enhance>
  <!-- User name -->
  <label for="username">User name</label>
  <input name="username" id="username" required /><br />

  <!-- Password -->
  <label for="password">Password</label>
  <input name="password" id="password" type="password" required /><br />

  <button type="submit">Log in</button>
</form>

<a href="/signup">Create an account</a>
