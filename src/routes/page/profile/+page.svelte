<script lang="ts">
  import { auth } from "$lib/firebase";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import AppBar from "$lib/AppBar1.svelte";
    import AppBar1 from "$lib/AppBar1.svelte";


  let user: any = null;

  onMount(() => {
    auth.onAuthStateChanged((u) => {
      if (!u) goto("/auth/login",{ replaceState:true });
      else user = u;
    });
  });

  function goBack() {
    history.back();
  }

  function uploadPhoto() {
    alert("Upload profile image here");
    // connect Supabase / Firebase storage here
  }
</script>

<div class="page">

  <!-- APPBAR -->
<AppBar title="Become mentor" showBack={true} />

  <!-- PROFILE IMAGE -->
  <div class="profile-wrapper">
    <div class="avatar">
      {#if user?.photoURL}
        <img src={user.photoURL} alt="profile" />
      {:else}
        <span>
          {user?.displayName ? user.displayName[0].toUpperCase() : "U"}
        </span>
      {/if}
    </div>

    <button class="camera" on:click={uploadPhoto}>📷</button>
  </div>

  <!-- INFO CARDS -->
  <div class="content">

    <div class="card">
      <div class="row">
        <span class="icon">👤</span>
        <div>
          <p class="label">User Name</p>
          <h4>{user?.displayName || "User"}</h4>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="row">
        <span class="icon">✉️</span>
        <div>
          <p class="label">Email</p>
          <h4>{user?.email}</h4>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="row">
        <span class="icon">📞</span>
        <div>
          <p class="label">Contact</p>
          <h3>{user?.phoneNumber || "Not added"}</h3>
        </div>
      </div>
    </div>

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
:global(body) {
  background: var(--clr-page-bg);
  font-family: system-ui, sans-serif;
}

/* PAGE */
.page {
  min-height: 100vh;
  background: var(--clr-page-bg);
}

/* PROFILE IMAGE */
.profile-wrapper {
  margin-top: 40px;
  display: flex;
  justify-content: center;
  position: relative;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--clr-card-bg);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--clr-card-border);
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar span {
  font-size: 28px;
  font-weight: bold;
  color: var(--clr-heading);
}

/* CAMERA BUTTON */
.camera {
  position: absolute;
  bottom: 0;
  right: calc(50% - 60px);
  background: var(--clr-accent);
  border: none;
  color: #fff;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 10px var(--clr-accent-shadow);
}

/* CONTENT */
.content {
  padding: 28px 16px 16px;
}

/* CARD */
.card {
  background: var(--clr-card-bg);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 12px;
  border: 1px solid var(--clr-card-border);
  box-shadow: 0 6px 14px var(--clr-accent-shadow);
}

/* ROW */
.row {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ICON */
.icon {
  font-size: 22px;
}

/* LABEL */
.label {
  margin: 0;
  font-size: 16px;
  color: var(--clr-subtext);
}

/* TEXT */
h4 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--clr-heading);
}

h3 {
  margin: 4px 0 0;
  color: var(--clr-heading);
}
</style>