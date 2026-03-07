<script lang="ts">
  export let title: string = "Title";
  export let showBack: boolean = true;
  export let showMenu: boolean = false;

  function goBack() {
    history.back();
  }

  function openMenu() {
    console.log("menu click");
  }
</script>

<div class="appbar">

  <!-- LEFT BACK -->
  {#if showBack}
    <button class="back-btn" on:click={goBack} aria-label="Back">
      ←
    </button>
  {/if}

  <!-- TITLE CENTER -->
  <div class="title">{title}</div>

  <!-- RIGHT MENU -->
  {#if showMenu}
    <button class="menu-btn" on:click={openMenu} aria-label="Menu">
      ⋮
    </button>
  {/if}

</div>

<style>
.appbar {
  height: 88px;
  background: var(--appbar-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: white;

  border-bottom-left-radius: 22px;
  border-bottom-right-radius: 22px;

  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}
/* title center */
.title {
  font-size: 21px;
  font-weight: 600;
}

/* back button left */
.back-btn {
  position: absolute;
  left: 18px;
  background: none;
  border: none;
  font-size: 28px;
  color: white;
  cursor: pointer;
}

/* menu button right */
.menu-btn {
  position: absolute;
  right: 18px;
  background: none;
  border: none;
  font-size: 22px;
  color: white;
  cursor: pointer;
}
</style>