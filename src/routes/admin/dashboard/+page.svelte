<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { goto } from "$app/navigation";
  import { auth } from "$lib/firebase";
  import { signOut } from "firebase/auth";

  let users = 0;
  let mentors = 0;
  let courses = 0;
  let webinars = 0;

  let loading = true;
  let showMenu = false;
  let showLogoutDialog = false;

  /* ================= LOAD COUNTS ================= */

  async function loadCounts() {
    loading = true;
    try {
      const { data: u } = await supabase.from("users").select("id");
      const { data: m } = await supabase.from("mentors").select("id");
      const { data: c } = await supabase.from("courses").select("id");
      const { data: w } = await supabase.from("webinars").select("id");

      users = u?.length ?? 0;
      mentors = m?.length ?? 0;
      courses = c?.length ?? 0;
      webinars = w?.length ?? 0;
    } catch (e) {
      console.error("Dashboard load error:", e);
    }
    loading = false;
  }

  onMount(loadCounts);

  /* ================= LOGOUT ================= */

  async function handleLogout() {
    try {
      await signOut(auth);
      goto("/auth/login");
    } catch (e) {
      console.error("Logout error", e);
      alert("Logout failed");
    }
  }
</script>

<div class="page">

  <!-- ================= APPBAR ================= -->
  <div class="appbar">
    <div class="title">Admin Dashboard</div>

    <div class="menu-wrapper">
      <button class="menu-btn" on:click={() => showMenu = !showMenu}>⋮</button>

      {#if showMenu}
        <div class="dropdown">
          <button on:click={() => showLogoutDialog = true}>Logout</button>
        </div>
      {/if}
    </div>
  </div>

  <!-- ================= BODY ================= -->
  <div class="body">

    <!-- HEADER -->
    <div class="header">
      <div>
        <h3>Welcome Admin</h3>
        <p>Manage users, mentors & courses</p>
      </div>
      <div class="avatar">🛡</div>
    </div>

    <!-- QUICK ACTIONS -->
    <div class="quick-actions">

      <button class="action" on:click={() => goto("/admin/add_user")}>
        <div class="circle">👤</div>
        <span>Add User</span>
      </button>

      <button class="action" on:click={() => goto("/admin/add_webinar")}>
        <div class="circle">🎥</div>
        <span>Webinar</span>
      </button>

      <button class="action" on:click={() => goto("/admin/add_course")}>
        <div class="circle">📚</div>
        <span>Course</span>
      </button>

      <button class="action" on:click={() => goto("/admin/add_mentor")}>
        <div class="circle">🎓</div>
        <span>Mentor</span>
      </button>

    </div>

    <!-- ================= STATS GRID ================= -->
    {#if loading}
      <div class="loader">Loading...</div>
    {:else}
      <div class="grid">

        <button class="stat green" on:click={() => goto("/admin/user")}>
          <div class="icon">👥</div>
          <div class="value">{users}</div>
          <div class="label">Users</div>
        </button>

        <button class="stat purple" on:click={() => goto("/admin/mentor")}>
          <div class="icon">🎓</div>
          <div class="value">{mentors}</div>
          <div class="label">Mentors</div>
        </button>

        <button class="stat orange" on:click={() => goto("/admin/course")}>
          <div class="icon">📚</div>
          <div class="value">{courses}</div>
          <div class="label">Courses</div>
        </button>

        <button class="stat blue" on:click={() => goto("/admin/webinar")}>
          <div class="icon">🎥</div>
          <div class="value">{webinars}</div>
          <div class="label">Webinars</div>
        </button>

      </div>
    {/if}

    <!-- WEBINAR CARD -->
    <div class="webinar-card">
      <div>
        <h4>Flutter Live Webinar</h4>
        <p>Today • 5:00 PM</p>
      </div>
      <button class="manage-btn">Manage</button>
    </div>

  </div>
</div>

<!-- ================= LOGOUT DIALOG ================= -->

{#if showLogoutDialog}
  <div class="dialog-overlay">

    <div class="dialog">
      <h3>Logout</h3>
      <p>Are you sure you want to logout?</p>

      <div class="dialog-actions">
        <button class="cancel" on:click={() => showLogoutDialog = false}>
          Cancel
        </button>

        <button class="logout" on:click={handleLogout}>
          Logout
        </button>
      </div>
    </div>

  </div>
{/if}

<style>
  .page {
    background: #f4f6fb;
    min-height: 100vh;
  }

  /* APPBAR */
  

  .title {
    font-size: 21px;
    font-weight: 600;
  }

  .menu-wrapper {
    position: absolute;
    right: 18px;
  }


  .dropdown {
    position: absolute;
    right: 0;
    top: 40px;
    background: rgb(209, 206, 206);
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    padding: 8px;
  }

  .dropdown button {
    border: none;
    background: none;
    padding: 8px 16px;
    cursor: pointer;
  }

  .body {
    padding: 8px;
    max-width: 1200px;
    margin: auto;
  }

  .header {
    background: linear-gradient(90deg, #5B86E5, #36D1DC);
    padding: 0px 8px 0px 8px;
    border-radius: 18px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .avatar {
    background: white;
    color: #2563eb;
    padding: 14px;
    border-radius: 50%;
  }

  .quick-actions {
    display: flex;
    gap: 20px;
    margin: 24px 0;
    flex-wrap: wrap;
  }

  .action {
    flex: 1;
    border: none;
    background: transparent;
    text-align: center;
    cursor: pointer;
  }

  .circle {
    width: 52px;
    height: 52px;
    background: #e0f2fe;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: auto;
  }

  /* GRID RESPONSIVE */
  .grid {
    display: grid;
    gap: 16px;
  }

  @media (max-width: 600px) {
    .grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (min-width: 601px) and (max-width: 1000px) {
    .grid { grid-template-columns: repeat(3, 1fr); }
  }

  @media (min-width: 1001px) {
    .grid { grid-template-columns: repeat(4, 1fr); }
  }

  .stat {
    border: none;
    padding: 22px;
    border-radius: 18px;
    color: white;
    text-align: center;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 6px 14px rgba(0,0,0,0.08);
  }

  .icon { font-size: 22px; }
  .value { font-size: 26px; margin-top: 6px; }
  .label { font-size: 14px; opacity: .9; }

  .green { background: #22c55e; }
  .purple { background: #9333ea; }
  .orange { background: #f97316; }
  .blue { background: #2563eb; }

  .webinar-card {
    margin-top: 24px;
    background: white;
    border-radius: 16px;
    padding: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .manage-btn {
    background: #2563eb;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
  }

  .loader {
    text-align: center;
    padding: 40px;
  }

  /* LOGOUT DIALOG */
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
  }

  .dialog {
    background: white;
    padding: 22px;
    border-radius: 14px;
    width: 320px;
    max-width: 90%;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .cancel {
    background: #eee;
    border: none;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
  }

  .logout {
    background: #ef4444;
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
  }
</style>