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
.page {
  background: #f5f7fb;
  min-height: 100vh;
}

/* ================= HEADER ================= */

.header {
  background: linear-gradient(135deg, #1fae4b, #28c76f);
  padding: 24px 20px 28px;
  color: white;
  border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 20px;
  font-weight: 600;
}

.menu-wrapper {
  position: relative;
}

.menu-btn {
  background: none;
  border: none;
  font-size: 22px;
  color: white;
  cursor: pointer;
}

.dropdown {
  position: absolute;
  right: 0;
  top: 36px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(0,0,0,.15);
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
}

.dropdown button:hover {
  background: #f3f3f3;
}

/* PROFILE */

.profile-row {
  display: flex;
  justify-content: space-between;
  margin-top: 22px;
  align-items: center;
}

.name {
  font-size: 17px;
  font-weight: 600;
}

.email {
  font-size: 13px;
  opacity: .9;
}

.avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: white;
  color: #1fae4b;
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

/* responsive grid */
@media (max-width: 600px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 601px) and (max-width: 999px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 1000px) {
  .grid { grid-template-columns: repeat(4, 1fr); }
}

.card {
  background: white;
  border-radius: 18px;
  padding: 22px;
  border: none;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  transition: all .2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 22px rgba(0,0,0,0.12);
}

.icon {
  font-size: 26px;
}

.card-title {
  margin-top: 10px;
  font-weight: 600;
}

.sub {
  font-size: 12px;
  color: #777;
  margin-top: 4px;
}
</style>