<script>
  import {
    Dropdown,
    DropdownItem,
    DropdownDivider,
    Navbar,
    NavBrand,
    NavLi,
    NavUl,
    NavHamburger,
  } from 'flowbite-svelte';
  import { Icon } from 'flowbite-svelte-icons';
</script>

<!-- TODO: Use consts. -->
<!-- TODO: Change default color if needs. -->
<Navbar let:hidden let:toggle>
  <NavBrand href="/">
    <img src="favicon.png" class="mr-3 h-6 sm:h-9" alt="AtCoder HogeHoges Logo" />
    <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"
      >AtCoder HogeHoges</span
    >
  </NavBrand>
  <NavHamburger on:click={toggle} />
  <NavUl {hidden}>
    <NavLi href="/">Home</NavLi>
    <NavLi href="/about">About</NavLi>
    <NavLi href="/problems">Problems</NavLi>
    <NavLi id="nav-external-links" class="cursor-pointer">
      Links
      <Icon
        name="chevron-down-outline"
        class="w-3 h-3 ml-2 text-primary-800 dark:text-white inline"
      />
    </NavLi>
    <Dropdown triggeredBy="#nav-external-links" class="w-44 z-20">
      <DropdownItem href="https://atcoder.jp" target="_blank" rel="noreferrer">
        AtCoder
      </DropdownItem>
      <DropdownItem href="https://github.com/" target="_blank" rel="noreferrer">
        GitHub
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem href="https://kenkoooo.com/atcoder/#/" target="_blank" rel="noreferrer">
        AtCoder Problems
      </DropdownItem>
      <!-- TODO: Add login / lougout -->
    </Dropdown>
  </NavUl>
</Navbar>
