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
.page {
  min-height: 100vh;
  background: #f5f7fb;
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
  background: white;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
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
}

.camera {
  position: absolute;
  bottom: 0;
  right: calc(50% - 60px);
  background: #1fae4b;
  border: none;
  color: white;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
}

/* CONTENT */
.content {
  padding: 28px 16px 16px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 12px;
  box-shadow: 0 6px 14px rgba(0,0,0,0.06);
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon {
  font-size: 22px;
}

.label {
  margin: 0;
  font-size: 16px;
  color: #6b7280;
}

h4 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
h3 {
  margin: 4px 0 0;
}
</style>