<script lang="ts">
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';

  import {
    Button,
    DarkMode,
    Dropdown,
    DropdownItem,
    DropdownDivider,
    Modal,
    Navbar,
    NavBrand,
    NavHamburger,
    NavLi,
    NavUl,
  } from 'flowbite-svelte';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';

  import { PRODUCT_NAME } from '$lib/constants/product-info';
  import { navbarDashboardLinks, navbarLinks } from '$lib/constants/navbar-links';
  import { externalLinks } from '$lib/constants/external-links';

  let activeUrl = $state($page.url.pathname);

  // For Modal
  let isOpenModalForLogout = $state(false);

  const closeLogoutModal = () => {
    isOpenModalForLogout = false;
  };

  let user = $derived($page.data.user);
</script>

<!-- Note: fluid and breakpoint props have not been working in v1.31.0 (as of January, 2026) -->
<!-- See: docs/dev-notes/2026-01-02/migrate-from-svelte-5-ui-lib-to-flowbite-svelte/plan.md -->
<Navbar fluid={true} breakpoint="lg">
  <NavBrand href="/">
    <img src="../../../favicon.png" class="mr-3 h-6 sm:h-9" alt="{PRODUCT_NAME} Logo" />
    <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
      {PRODUCT_NAME}
    </span>
  </NavBrand>

  <NavHamburger />

  <NavUl {activeUrl} ulClass="text-sm items-center lg:text-md lg:font-medium p-0">
    {#if $page.data.isAdmin}
      {@render navLiForDropdown('nav-dashboard', '管理画面')}

      <Dropdown triggeredBy="#nav-dashboard" simple class="w-48 z-20">
        {#each navbarDashboardLinks as navbarDashboardLink}
          <DropdownItem href={navbarDashboardLink.path}>
            {navbarDashboardLink.title}
          </DropdownItem>
        {/each}
      </Dropdown>
    {/if}

    <!-- Internal Links -->
    {#each navbarLinks as navbarLink}
      <NavLi
        href={navbarLink.path}
        class="flex items-center"
        activeClass="dark:text-gray-400 lg:dark:hover:text-white"
      >
        {navbarLink.title}
      </NavLi>
    {/each}

    {#if !user}
      <NavLi
        href="/login"
        class="flex items-center"
        activeClass="dark:text-gray-400 lg:dark:hover:text-white"
      >
        ログイン
      </NavLi>
      <NavLi
        href="/signup"
        class="flex items-center"
        activeClass="dark:text-gray-400 lg:dark:hover:text-white"
      >
        アカウント作成
      </NavLi>
    {:else}
      {@render navLiForDropdown('nav-user-page', user.name)}

      <Dropdown triggeredBy="#nav-user-page" simple class="w-48 z-20">
        <!-- Profile -->
        <DropdownItem href="/users/edit">基本設定</DropdownItem>

        <DropdownDivider />

        <!-- Logout -->
        <DropdownItem
          onclick={() => (isOpenModalForLogout = true)}
          class="font-medium py-2 px-4 text-sm text-left text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          ログアウト
        </DropdownItem>
      </Dropdown>
    {/if}

    <!-- External Links -->
    {@render navLiForDropdown('nav-external-links', '外部リンク')}

    <Dropdown triggeredBy="#nav-external-links" simple class="w-48 z-20">
      {#each externalLinks as externalLink}
        <DropdownItem href={externalLink.path} target="_blank">
          {externalLink.title}
        </DropdownItem>
      {/each}
    </Dropdown>

    <DarkMode />
  </NavUl>
</Navbar>

<!-- NavLi for Dropdown -->
{#snippet navLiForDropdown(id: string, description: string)}
  <NavLi
    {id}
    class="flex items-center cursor-pointer"
    activeClass="dark:text-gray-400 lg:dark:hover:text-white"
  >
    {description}
    <ChevronDown class="w-3 h-3 ms-1 inline text-primary-800 dark:text-white" />
  </NavLi>
{/snippet}

<!-- Logout Modal -->
<Modal bind:open={isOpenModalForLogout} size="xs" outsideclose={true}>
  <p class="font-medium text-lg text-center">ログアウトしますか?</p>

  <form method="post" action="../../logout?/logout" use:enhance onsubmit={closeLogoutModal}>
    <input type="hidden" name="logout" value="Log out" />

    <div class="flex flex-wrap justify-center items-center gap-4">
      <Button
        type="button"
        class="xs:flex-1"
        color="alternative"
        onclick={() => (isOpenModalForLogout = false)}
      >
        キャンセル
      </Button>
      <Button type="submit" class="xs:flex-1">ログアウト</Button>
    </div>
  </form>
</Modal>
