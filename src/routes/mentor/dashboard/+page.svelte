<script lang="ts">
  import { auth } from "$lib/firebase";
  import { goto } from "$app/navigation";
  import { signOut } from "firebase/auth";
  import { onMount, onDestroy } from "svelte";

  let user: any = null;
  let showMenu = false;

  let unsubscribe: any;

  /* ================= USER LOAD ================= */

  onMount(() => {
    unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) {
        goto("/auth/login");
        return;
      }
      user = u;
    });

    document.addEventListener("click", handleOutsideClick);
  });

  onDestroy(() => {
    unsubscribe && unsubscribe();
    document.removeEventListener("click", handleOutsideClick);
  });

  function handleOutsideClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest(".menu-wrapper")) {
      showMenu = false;
    }
  }

  /* ================= LOGOUT ================= */

  async function handleLogout() {
    showMenu = false;

    if (!confirm("Are you sure you want to logout?")) return;

    await signOut(auth);
    goto("/auth/login");
  }
</script>

<div class="page">

  <!-- ================= HEADER ================= -->
  <div class="header">

    <div class="topbar">
      <div class="title">Mentor Dashboard</div>

      <div class="menu-wrapper">
        <button class="menu-btn" on:click={() => showMenu = !showMenu}>
          ⋮
        </button>

        {#if showMenu}
          <div class="dropdown">
            <button on:click={handleLogout}>Logout</button>
          </div>
        {/if}
      </div>
    </div>

    <div class="profile-row">
      <div>
        <div class="name">{user?.displayName ?? "Mentor"}</div>
        <div class="email">{user?.email}</div>
      </div>

      <div class="avatar">
        {#if user?.photoURL}
          <img src={user.photoURL} alt="profile" />
        {:else}
          {user?.displayName?.[0]?.toUpperCase() ?? "M"}
        {/if}
      </div>
    </div>

  </div>

  <!-- ================= GRID ================= -->
  <div class="grid">

    <button class="card" on:click={() => goto("/mentor/student_page")}>
      <div class="icon">👥</div>
      <div class="card-title">Students</div>
      <div class="sub">View learners</div>
    </button>

    <button class="card" on:click={() => goto("/mentor/mentor_inbox_page")}>
      <div class="icon">💬</div>
      <div class="card-title">Inbox</div>
      <div class="sub">Student messages</div>
    </button>

    <button class="card" on:click={() => goto("/mentor/mentor_course")}>
      <div class="icon">📚</div>
      <div class="card-title">Teaching</div>
      <div class="sub">Your courses</div>
    </button>

    <button class="card" on:click={() => goto("/mentor/mentor_upload_course")}>
      <div class="icon">🎥</div>
      <div class="card-title">Add Video</div>
      <div class="sub">Upload lessons</div>
    </button>

    <button class="card" on:click={() => goto("/mentor/mentor_analytic_page")}>
      <div class="icon">📊</div>
      <div class="card-title">Analytics</div>
      <div class="sub">Performance</div>
    </button>

    <button class="card" on:click={() => goto("/mentor/mentor_webinar_page")}>
      <div class="icon">🎦</div>
      <div class="card-title">Webinar</div>
      <div class="sub">Manage webinar</div>
    </button>

  </div>
</div>

<style>
:global(:root){

  /* ================= APPBAR ================= */
  --appbar-bg: linear-gradient(135deg,#c38e1d,#6f5a12);
  --appbar-text:#f5d060;

  /* ================= PRIMARY ================= */
  --clr-primary-from:#7a5400;
  --clr-primary-to:#d4a017;

  /* ================= ACCENT ================= */
  --clr-accent:#d4a017;
  --clr-accent-dark:#b88a10;

  /* ================= SHADOW ================= */
  --clr-accent-shadow:rgba(212,160,23,0.3);
  --clr-accent-shadow2:rgba(212,160,23,0.45);

  /* ================= BACKGROUND ================= */
  --clr-page-bg:linear-gradient(180deg,#0a0800,#120d00);

  /* 🔥 MAIN FIX (VERY IMPORTANT) */
  --clr-card-bg:#2b1f06;   /* brighter → visible */
  --clr-card-border:rgba(212,160,23,0.3);

  --clr-tab-bar-bg:#120d00;

  /* ================= TAB ================= */
  --clr-tab-idle-bg:#35280a;
  --clr-tab-idle-fg:#c9a84d;

  /* ================= ICON ================= */
  --clr-icon-bg:#35280a;

  /* ================= TEXT ================= */
  --clr-heading:#fff2c2;   /* brighter for readability */
  --clr-subtext:#c9a84d;

  /* ================= BUTTON ================= */
  --clr-view-btn-bg:#35280a;
  --clr-view-btn-hover:#4a390f;
  --clr-view-btn-fg:#f5e6c0;

  /* ================= SKELETON ================= */
  --clr-shimmer-1:#35280a;
  --clr-shimmer-2:#4a390f;

  /* ================= GRADIENT ================= */
  --grad:linear-gradient(135deg,var(--clr-primary-from),var(--clr-primary-to));
}
.page {
  background: var(--clr-page-bg);
  min-height: 100vh;
}

/* ================= HEADER ================= */
.header {
  background: var(--grad);
  padding: 24px 20px 28px;
  color: var(--clr-heading);
  border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px;
}

/* TOPBAR */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: var(--clr-heading);
}

/* MENU */
.menu-btn {
  background: var(--clr-icon-bg);
  border: none;
  font-size: 22px;
  color: var(--clr-heading);
  cursor: pointer;
  border-radius: 8px;
  padding: 6px 10px;
}

.dropdown {
  position: absolute;
  right: 0;
  top: 36px;
  background: var(--clr-card-bg);
  border: 1px solid var(--clr-card-border);
  border-radius: 10px;
  box-shadow: 0 8px 20px var(--clr-accent-shadow);
  padding: 6px 0;
  min-width: 120px;
  z-index: 100;
}

.dropdown button {
  border: none;
  background: none;
  padding: 10px 16px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  color: var(--clr-heading);
}

.dropdown button:hover {
  background: var(--clr-view-btn-hover);
}

/* ================= PROFILE ================= */
.profile-row {
  display: flex;
  justify-content: space-between;
  margin-top: 22px;
  align-items: center;
}

.name {
  font-size: 17px;
  font-weight: 600;
  color: var(--clr-heading);
}

.email {
  font-size: 13px;
  color: var(--clr-subtext);
}

/* AVATAR */
.avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--clr-card-bg);
  color: var(--clr-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ================= GRID ================= */
.grid {
  padding: 22px;
  display: grid;
  gap: 16px;
}

@media (max-width: 600px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 601px) and (max-width: 999px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 1000px) {
  .grid { grid-template-columns: repeat(4, 1fr); }
}

/* ================= CARD ================= */
.card {
  background: var(--clr-card-bg);
  border-radius: 18px;
  padding: 22px;
  border: 1px solid var(--clr-card-border);
  text-align: center;
  cursor: pointer;
  box-shadow: 0 6px 18px var(--clr-accent-shadow);
  transition: all .25s ease;
  color: var(--clr-heading);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px var(--clr-accent-shadow2);
  background: var(--clr-view-btn-hover);
}

/* ICON */
.icon {
  font-size: 26px;
  background: var(--clr-icon-bg);
  width: 48px;
  height: 48px;
  margin: auto;
  border-radius: 50%;
  display:flex;
  align-items:center;
  justify-content:center;
}

/* TEXT */
.card-title {
  margin-top: 10px;
  font-weight: 600;
  color: var(--clr-heading);
}

.sub {
  font-size: 12px;
  color: var(--clr-subtext);
  margin-top: 4px;
}
</style>