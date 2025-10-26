<script lang="ts">
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';

  import {
    Button,
    Darkmode,
    Dropdown,
    DropdownUl,
    DropdownLi,
    DropdownDivider,
    Modal,
    Navbar,
    NavBrand,
    NavLi,
    NavUl,
    uiHelpers,
  } from 'svelte-5-ui-lib';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';

  import { PRODUCT_NAME } from '$lib/constants/product-info';
  import { navbarDashboardLinks, navbarLinks } from '$lib/constants/navbar-links';
  import { externalLinks } from '$lib/constants/external-links';

  let activeUrl = $state($page.url.pathname);

  // For Navbar
  //
  // See:
  // https://svelte-5-ui-lib.codewithshin.com/components/navbar
  let nav = uiHelpers();
  let navStatus = $state(false);
  let toggleNav = nav.toggle;
  let closeNav = nav.close;

  // For Dropdown
  // 1. Admin dashboard
  let dropdownForDashboard = uiHelpers();
  let dropdownForDashboardStatus = $state(false);
  let closeDropdownForDashboard = dropdownForDashboard.close;

  // 2. User page
  let dropdownForUserPage = uiHelpers();
  let dropdownForUserPageStatus = $state(false);
  let closeDropdownForUserPage = dropdownForUserPage.close;

  // 3. External links
  let dropdownForExternalLinks = uiHelpers();
  let dropdownForExternalLinksStatus = $state(false);
  let closeDropdownForExternalLinks = dropdownForExternalLinks.close;

  // For Modal
  // Logout
  //
  // See:
  // https://svelte-5-ui-lib.codewithshin.com/components/modal
  const modalForLogout = uiHelpers();
  let modalForLogoutStatus = $state(false);
  const openModal = modalForLogout.open;
  const closeModal = modalForLogout.close;

  $effect(() => {
    activeUrl = $page.url.pathname;

    navStatus = nav.isOpen;

    dropdownForDashboardStatus = dropdownForDashboard.isOpen;
    dropdownForUserPageStatus = dropdownForUserPage.isOpen;
    dropdownForExternalLinksStatus = dropdownForExternalLinks.isOpen;

    modalForLogoutStatus = modalForLogout.isOpen;
  });

  let user = $derived($page.data.user);

  function handleDropdownForUserPage(): void {
    dropdownForUserPage.toggle();
  }

  // Close dropdowns when user state changes
  const dropdownManager = {
    dropdowns: [
      { name: 'dashboard', close: closeDropdownForDashboard },
      { name: 'userPage', close: closeDropdownForUserPage },
      { name: 'externalLinks', close: closeDropdownForExternalLinks },
    ],
    closeAll() {
      this.dropdowns.forEach((dropdown) => dropdown.close());
    },
  };

  $effect(() => {
    if (user) {
      dropdownManager.closeAll();
    }
  });
</script>

{#snippet navLiForDropdown(id: string, description: string, onclick: () => void)}
  <NavLi
    {id}
    class="flex items-center cursor-pointer"
    aClass="dark:text-gray-400 lg:dark:hover:text-white"
    {onclick}
  >
    {description}
    <ChevronDown class="w-3 h-3 ms-1 inline text-primary-800 dark:text-white" />
  </NavLi>
{/snippet}

<Navbar {toggleNav} {closeNav} {navStatus} breakPoint="lg" divClass="max-w-none">
  {#snippet brand()}
    <NavBrand href="/">
      <img src="../../../favicon.png" class="mr-3 h-6 sm:h-9" alt="{PRODUCT_NAME} Logo" />
      <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
        {PRODUCT_NAME}
      </span>
    </NavBrand>
  {/snippet}

  <NavUl {activeUrl} class="bg-white dark:bg-gray-900 relative">
    <!-- Dashboard (Admin only) -->
    {#if $page.data.isAdmin}
      {@render navLiForDropdown('nav-dashboard', '管理画面', dropdownForDashboard.toggle)}

      <Dropdown
        dropdownStatus={dropdownForDashboardStatus}
        closeDropdown={closeDropdownForDashboard}
        class="absolute w-44 z-20 left-32 mt-0 lg:-left-10 lg:mt-10"
      >
        <DropdownUl>
          {#each navbarDashboardLinks as navbarDashboardLink}
            <DropdownLi href={navbarDashboardLink.path} rel="noreferrer">
              {navbarDashboardLink.title}
            </DropdownLi>
          {/each}
        </DropdownUl>
      </Dropdown>
    {/if}

    <!-- Internal Links -->
    {#each navbarLinks as navbarLink}
      <NavLi
        href={navbarLink.path}
        class="flex items-center"
        aClass="dark:text-gray-400 lg:dark:hover:text-white"
      >
        {navbarLink.title}
      </NavLi>
    {/each}

    {#if !user}
      <NavLi
        href="/login"
        class="flex items-center"
        aClass="dark:text-gray-400 lg:dark:hover:text-white"
      >
        ログイン
      </NavLi>
      <NavLi
        href="/signup"
        class="flex items-center"
        aClass="dark:text-gray-400 lg:dark:hover:text-white"
      >
        アカウント作成
      </NavLi>
    {:else}
      {@render navLiForDropdown('nav-user-page', user.name, () => handleDropdownForUserPage())}

      <Dropdown
        dropdownStatus={dropdownForUserPageStatus}
        closeDropdown={closeDropdownForUserPage}
        class="absolute w-48 z-20 left-32 mt-52 lg:left-auto lg:right-20 lg:mt-10"
      >
        <!-- TODO: アカウントページを表示 -->
        <DropdownUl>
          <!-- Profile -->
          <DropdownLi href="/users/edit">基本設定</DropdownLi>

          <DropdownDivider />

          <!-- Logout -->
          <button
            name="logout_helper"
            onclick={openModal}
            class="font-medium py-2 px-4 text-sm text-left w-full rounded text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            ログアウト
          </button>
        </DropdownUl>
      </Dropdown>
    {/if}

    <!-- External Links -->
    {@render navLiForDropdown('nav-external-links', '外部リンク', dropdownForExternalLinks.toggle)}

    <Dropdown
      dropdownStatus={dropdownForExternalLinksStatus}
      closeDropdown={closeDropdownForExternalLinks}
      class="absolute w-48 z-20 left-32 mt-60 lg:left-auto lg:right-0 lg:mt-10"
    >
      <DropdownUl>
        {#each externalLinks as externalLink}
          <DropdownLi href={externalLink.path} target="_blank" rel="noreferrer">
            {externalLink.title}
          </DropdownLi>
        {/each}
      </DropdownUl>
    </Dropdown>

    <Darkmode />
  </NavUl>
</Navbar>

<Modal size="xs" modalStatus={modalForLogoutStatus} {closeModal} outsideClose>
  <p class="font-medium text-lg text-center">ログアウトしますか?</p>

  <form method="post" action="../../logout?/logout" use:enhance onsubmit={closeModal}>
    <Button name="logout" value="Log out" type="submit" class="w-full">ログアウト</Button>
  </form>
</Modal>
