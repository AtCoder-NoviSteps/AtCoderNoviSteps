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
    NavLi,
    NavUl,
    NavHamburger,
  } from 'flowbite-svelte';
  // @ts-ignore
  import ChevronDownOutline from 'flowbite-svelte-icons/ChevronDownOutline.svelte';

  import { PRODUCT_NAME } from '$lib/constants/product-info';
  import { navbarDashboardLinks, navbarLinks } from '$lib/constants/navbar-links';
  import { externalLinks } from '$lib/constants/external-links';

  $: user = $page.data.user;

  let showLogoutModal = false;

  const openLogoutModal = () => {
    showLogoutModal = true;
  };

  const closeLogoutModal = () => {
    showLogoutModal = false;
  };
</script>

<Navbar let:hidden let:toggle>
  <NavBrand href="/">
    <img src="../../../favicon.png" class="mr-3 h-6 sm:h-9" alt="{PRODUCT_NAME} Logo" />
    <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
      {PRODUCT_NAME}
    </span>
  </NavBrand>
  <NavHamburger on:click={toggle} />

  <NavUl {hidden} class="bg-white dark:bg-gray-900">
    <!-- Dashboard (Admin only) -->
    {#if $page.data.isAdmin}
      <NavLi id="nav-dashboard" class="flex items-center cursor-pointer">
        管理画面
        <ChevronDownOutline class="w-3 h-3 ml-2 text-primary-800 dark:text-white align-middle" />
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
      <NavLi href={navbarLink.path} class="flex items-center">{navbarLink.title}</NavLi>
    {/each}

    {#if !user}
      <NavLi href="/login" class="flex items-center">ログイン</NavLi>
      <NavLi href="/signup" class="flex items-center">アカウント作成</NavLi>
    {:else}
      <NavLi id="nav-user-page" class="flex items-center cursor-pointer">
        {user.name}
        <ChevronDownOutline class="w-3 h-3 ml-2 text-primary-800 dark:text-white align-middle" />
      </NavLi>
      <Dropdown triggeredBy="#nav-user-page" class="w-48 z-20">
        <!-- TODO: アカウントページを表示 -->
        <DropdownItem href="/users/edit">基本設定</DropdownItem>
        <DropdownDivider />
        <button
          name="logout_helper"
          on:click={openLogoutModal}
          class="font-medium py-2 px-4 text-sm text-left w-full rounded text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          ログアウト
        </button>
      </Dropdown>
    {/if}

    <!-- External Links -->
    <NavLi id="nav-external-links" class="flex items-center cursor-pointer">
      外部リンク
      <ChevronDownOutline class="w-3 h-3 ml-2 text-primary-800 dark:text-white align-middle" />
    </NavLi>
    <Dropdown triggeredBy="#nav-external-links" class="w-48 z-20">
      {#each externalLinks as externalLink}
        <DropdownItem href={externalLink.path} target="_blank" rel="noreferrer">
          {externalLink.title}
        </DropdownItem>
      {/each}
    </Dropdown>

    <!-- Note: デフォルトのpaddingを使うと、他のナビゲーションの文字の縦位置がずれてしまうため -->
    <DarkMode class="flex items-center" btnClass="p-2.5 md:p-0" />
  </NavUl>
</Navbar>

<Modal size="xs" bind:open={showLogoutModal} outsideclose>
  <p class="font-medium text-lg text-center">ログアウトしますか?</p>

  <form method="post" action="../../logout?/logout" use:enhance on:submit={closeLogoutModal}>
    <Button name="logout" value="Log out" type="submit" class="w-full">ログアウト</Button>
  </form>
</Modal>
