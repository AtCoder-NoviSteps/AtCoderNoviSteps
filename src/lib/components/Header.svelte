<script lang="ts">
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';

  import {
    Dropdown,
    DropdownItem,
    Navbar,
    NavBrand,
    NavLi,
    NavUl,
    NavHamburger,
  } from 'flowbite-svelte';
  // @ts-ignore
  import ChevronDownOutline from 'flowbite-svelte-icons/ChevronDownOutline.svelte';

  import { PRODUCT_NAME } from '$lib/constants/product-info';
  import { navbarDashboardLinks, navbarLinks } from '$lib/constants/navbar-links';
  import { externalLinks } from '$lib/constants/external-links';
</script>

<!-- TODO: Add logo. -->
<Navbar let:hidden let:toggle>
  <NavBrand href="/">
    <img src="favicon.png" class="mr-3 h-6 sm:h-9" alt="{PRODUCT_NAME} Logo" />
    <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
      {PRODUCT_NAME}
    </span>
  </NavBrand>
  <NavHamburger on:click={toggle} />

  <NavUl {hidden}>
    <!-- Dashboard (Admin only) -->
    {#if $page.data.isAdmin}
      <NavLi id="nav-dashboard" class="cursor-pointer">
        管理画面
        <ChevronDownOutline class="w-3 h-3 ml-2 text-primary-800 dark:text-white inline" />
      </NavLi>
      <Dropdown triggeredBy="#nav-dashboard" class="w-44 z-20">
        {#each navbarDashboardLinks as navbarDashboardLink}
          <DropdownItem href={navbarDashboardLink.path} rel="noreferrer">
            {navbarDashboardLink.title}
          </DropdownItem>
        {/each}
      </Dropdown>
    {/if}

    <!-- Internal Links -->
    {#each navbarLinks as navbarLink}
      <NavLi href={navbarLink.path}>{navbarLink.title}</NavLi>
    {/each}

    {#if !$page.data.user}
      <NavLi href="/login">ログイン</NavLi>
      <NavLi href="/signup">アカウント作成</NavLi>
    {:else}
      <!-- TODO: アカウントページを表示 -->
      <!-- HACK: 相対パスを使っているため、3階層以上のパスがあるときに動作しない可能性が高い -->
      <form
        method="post"
        action="../logout?/logout"
        use:enhance
        class="py-2 pe-4 ps-3 md:p-0 rounded text-gray-700 hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-primary-700"
      >
        <button name="logout" value="Log out" type="submit"> ログアウト </button>
      </form>
    {/if}

    <!-- External Links -->
    <NavLi id="nav-external-links" class="cursor-pointer">
      外部リンク
      <ChevronDownOutline class="w-3 h-3 ml-2 text-primary-800 dark:text-white inline" />
    </NavLi>
    <Dropdown triggeredBy="#nav-external-links" class="w-48 z-20">
      {#each externalLinks as externalLink}
        <DropdownItem href={externalLink.path} target="_blank" rel="noreferrer">
          {externalLink.title}
        </DropdownItem>
      {/each}
    </Dropdown>
  </NavUl>
</Navbar>
