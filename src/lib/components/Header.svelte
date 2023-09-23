<script lang="ts">
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
  import { navbarLinks } from '$lib/constants/navbar-links';
  import { externalLinks } from '$lib/constants/external-links';
</script>

<!-- TODO: Add logo. -->
<!-- TODO: Change default color if needs. -->
<Navbar let:hidden let:toggle>
  <NavBrand href="/">
    <img src="favicon.png" class="mr-3 h-6 sm:h-9" alt="{PRODUCT_NAME} Logo" />
    <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
      {PRODUCT_NAME}
    </span>
  </NavBrand>
  <NavHamburger on:click={toggle} />
  <NavUl {hidden}>
    <!-- Internal Links-->
    {#each navbarLinks as navbarLink}
      <NavLi href={navbarLink.path}>{navbarLink.title}</NavLi>
    {/each}

    <!-- TODO: Add login / logout -->
    <!-- if currentUser exists -->
    <!-- アカウントページを表示 -->
    <NavLi href="/profile">Profile</NavLi>
    <!-- else -->
    <!-- 登録・ログインページを表示 -->

    <!-- External Links-->
    <NavLi id="nav-external-links" class="cursor-pointer">
      Links
      <ChevronDownOutline class="w-3 h-3 ml-2 text-primary-800 dark:text-white inline" />
    </NavLi>
    <Dropdown triggeredBy="#nav-external-links" class="w-44 z-20">
      {#each externalLinks as externalLink}
        <DropdownItem href={externalLink.path} target="_blank" rel="noreferrer">
          {externalLink.title}
        </DropdownItem>
      {/each}
    </Dropdown>
  </NavUl>
</Navbar>
