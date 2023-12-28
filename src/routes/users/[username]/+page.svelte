<script lang="ts">
  export let data;
  let username = data.username;
  let isLoggedIn = data.isLoggedIn;
  import UserProfile from '$lib/components/UserProfile.svelte';
</script>

<UserProfile {username} {isLoggedIn} />
