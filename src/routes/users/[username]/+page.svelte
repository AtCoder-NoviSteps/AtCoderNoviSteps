<script lang="ts">
  export let data;
  let username = data.username;
  let isLoggedIn = data.isLoggedIn;
  import UserForm from '$lib/components/UserForm.svelte';
</script>

<UserForm {username} {isLoggedIn} />
