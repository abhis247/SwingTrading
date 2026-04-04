<script lang="ts">
  import { supabase } from "$lib/supabase";
  import { onMount } from "svelte";
  import AppBar from "$lib/AppBar1.svelte";
  import { onDestroy } from "svelte";

  let users: any[] = [];
  let filteredUsers: any[] = [];

  let loading = true;
  let search = "";

  let showConfirm = false;
  let showUpdate = false;
  let selectedUser: any = null;

  let updateName = "";
  let updateEmail = "";

  onMount(loadUsers);

  async function loadUsers() {
    loading = true;

    const { data, error } = await supabase
      .from("users")
      .select("id,name,email,role,profile_image")
      .order("created_at", { ascending: false });

    if (!error && data) {
      users = data.map((u) => ({ ...u, showMenu: false }));
      filteredUsers = [...users];
    }

    loading = false;
  }

  function searchUser(value: string) {
    search = value;

    filteredUsers = users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return (
        name.includes(value.toLowerCase()) ||
        email.includes(value.toLowerCase())
      );
    });
  }

  function toggleMenu(index: number) {
    users = users.map((u, i) => ({
      ...u,
      showMenu: i === index ? !u.showMenu : false
    }));

    filteredUsers = [...users];
  }

  function openUpdate(user: any) {
    selectedUser = user;
    updateName = user.name;
    updateEmail = user.email;
    showUpdate = true;
  }

  async function updateUser() {
    await supabase.from("users").update({
      name: updateName,
      email: updateEmail,
    }).eq("id", selectedUser.id);

    showUpdate = false;
    await loadUsers();
  }



  function closeConfirm() {
  showConfirm = false;
  selectedUser = null;
}

  function confirmDelete(user: any) {
    selectedUser = user;
    showConfirm = true;
  }

  async function deleteUser() {
    await supabase.from("users").delete().eq("id", selectedUser.id);
    showConfirm = false;
    await loadUsers();
  }


onMount(() => {
  document.addEventListener("click", handleOutsideClick);
});

onDestroy(() => {
  document.removeEventListener("click", handleOutsideClick);
});
  function closeMenu(index: number) {
  users = users.map((u, i) => ({
    ...u,
    showMenu: i === index ? false : u.showMenu
  }));

  filteredUsers = [...users];
}

function handleOutsideClick(event: MouseEvent) {
  const target = event.target as HTMLElement;

  // if click NOT inside any menu
  if (!target.closest(".menu")) {
    users = users.map(u => ({ ...u, showMenu: false }));
    filteredUsers = [...users];
  }
}
</script>

<AppBar title="Users" showBack={true} />

<div class="container">

  <!-- SEARCH -->
  <input
    class="search"
    placeholder="Search user..."
    bind:value={search}
    on:input={() => searchUser(search)}
  />

  <!-- USERS LIST -->
  {#if loading}
    <div class="center">Loading users...</div>

  {:else if filteredUsers.length === 0}
    <div class="center">No users found</div>

  {:else}
    {#each filteredUsers as user, index}
      <div class="card">

        <!-- PROFILE -->
        <div class="left">
          {#if user.profile_image}
            <img src={user.profile_image} alt="profile" />
          {:else}
            <div class="avatar">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
          {/if}
        </div>

        <!-- INFO -->
        <div class="info">
          <div class="name">{user.name}</div>
          <div class="email">{user.email}</div>
          <div class="role">{user.role}</div>
        </div>

        <!-- MENU -->
        <button
               type="button"
               class="menu-btn"
              on:click|stopPropagation={() => toggleMenu(index)}
                     >
                     ⋮
        </button>

          {#if user.showMenu}
            <div class="menu-dropdown">
            <button
  type="button"
  class="menu-item"
  on:click={() => {
    openUpdate(user);
    closeMenu(index);
  }}
>
  ✏️ Edit
</button>

<button
  type="button"
  class="menu-item delete"
  on:click={() => {
    confirmDelete(user);
    closeMenu(index);
  }}
>
  🗑 Delete
</button>
            </div>
          {/if}
        </div>

    
    {/each}
  {/if}

</div>
<!-- UPDATE DIALOG -->
{#if showUpdate}
  <div class="overlay" role="dialog" aria-modal="true">
    <div class="dialog">

      <!-- HEADER -->
      <div class="dialog-header">
        <h3>Edit User</h3>
        <button
          type="button"
          class="close-btn"
          on:click={() => showUpdate = false}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <!-- BODY -->
      <div class="dialog-body">

        <div class="field">
          <label for="updateName">Full Name</label>
          <input
            id="updateName"
            bind:value={updateName}
            placeholder="Enter name"
          />
        </div>

        <div class="field">
          <label for="updateEmail">Email Address</label>
          <input
            id="updateEmail"
            type="email"
            bind:value={updateEmail}
            placeholder="Enter email"
          />
        </div>

      </div>

      <!-- FOOTER -->
      <div class="dialog-actions">
        <button
          type="button"
          class="cancel"
          on:click={() => showUpdate = false}
        >
          Cancel
        </button>

        <button
          type="button"
          class="primary"
          on:click={updateUser}
        >
          💾 Save Changes
        </button>
      </div>

    </div>
  </div>
{/if}
{#if showConfirm}
  <div class="overlay">

    <!-- Background click layer (interactive) -->
    <button
      type="button"
      class="overlay-bg"
      aria-label="Close"
      on:click={closeConfirm}
    ></button>

    <!-- Modal -->
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      tabindex="-1"
    >
      <h3 id="delete-title">Delete User</h3>

      <p>
        Are you sure you want to delete
        <strong>{selectedUser?.name}</strong>?
      </p>

      <div class="dialog-actions">
        <button
          type="button"
          class="cancel"
          on:click={closeConfirm}
        >
          Cancel
        </button>

        <button
          type="button"
          class="delete"
          on:click={deleteUser}
        >
          Delete
        </button>
      </div>
    </div>

  </div>
{/if}
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
:global(body){
  background: var(--clr-page-bg);
}

/* ================= CONTAINER ================= */
.container{
  max-width:1000px;
  margin:20px auto;
  padding:0 16px;
}

/* ================= SEARCH ================= */
.search{
  width:100%;
  padding:12px;
  border-radius:10px;
  border:1px solid var(--clr-card-border);
  margin-bottom:20px;
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
}

.search::placeholder{
  color: var(--clr-subtext);
}

/* ================= CARD ================= */
.card{
  display:flex;
  align-items:center;
  gap:16px;
  background: var(--clr-card-bg);
  padding:16px;
  padding-right:50px;
  border-radius:14px;
  margin-bottom:14px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 4px 14px var(--clr-accent-shadow);
  position:relative;
}

/* ================= PROFILE ================= */
.left img{
  width:50px;
  height:50px;
  border-radius:50%;
  object-fit:cover;
}

.avatar{
  width:50px;
  height:50px;
  border-radius:50%;
  background: var(--clr-accent);
  color:white;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:bold;
}

/* ================= TEXT ================= */
.info{ flex:1; }

.name{
  color: var(--clr-heading);
  font-weight:700;
}

.email{
  font-size:13px;
  color: var(--clr-subtext);
}

.role{
  font-size:12px;
  color: var(--clr-accent);
  font-weight:600;
}

/* ================= MENU ================= */
.menu-btn{
  background: var(--clr-accent);
  color:white;
  border:none;
  font-size:18px;
  padding:4px 10px;
  border-radius:8px;
  cursor:pointer;
}

.menu-dropdown{
  position:absolute;
  right:0;
  top:36px;
  background: var(--clr-card-bg);
  border-radius:10px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 6px 18px var(--clr-accent-shadow);
  min-width:130px;
  overflow:hidden;
  z-index:10;
}
.dialog h3{
  color: var(--clr-heading);
  font-size: 20px;
  font-weight: 800;
}
.menu-item{
  width:100%;
  padding:10px 14px;
  text-align:left;
  background:none;
  border:none;
  cursor:pointer;
  font-size:14px;
  color: var(--clr-heading);
}

.menu-item:hover{
  background: var(--clr-tab-idle-bg);
}

.menu-item.delete:hover{
  background: rgba(255,107,107,0.12);
}

/* ================= OVERLAY ================= */
.overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.5);
  display:flex;
  justify-content:center;
  align-items:center;
  z-index:999;
}

/* ================= DIALOG ================= */
.dialog{
  width:100%;
  max-width:420px;
  background: var(--clr-card-bg);
  border-radius:16px;
  padding:20px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 10px 30px var(--clr-accent-shadow);
  display:flex;
  flex-direction:column;
  gap:16px;
}

/* HEADER */
.dialog-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.dialog-header h3{
  margin:0;
  font-size:20px;
  color: var(--clr-heading);
}

.close-btn{
  background:none;
  border:none;
  font-size:18px;
  cursor:pointer;
  color: var(--clr-subtext);
}

/* BODY */
.dialog-body{
  display:flex;
  flex-direction:column;
  gap:14px;
}

.field{
  display:flex;
  flex-direction:column;
  gap:6px;
}

.field label{
  font-size:13px;
  font-weight:600;
  color: var(--clr-heading);
}

.field input{
  padding:12px;
  border-radius:10px;
  border:1px solid var(--clr-card-border);
  font-size:14px;
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
}

.field input::placeholder{
  color: var(--clr-subtext);
}

.field input:focus{
  outline:none;
  border-color: var(--clr-accent);
  box-shadow:0 0 0 2px var(--clr-accent-shadow);
}

/* ================= BUTTONS ================= */
.dialog-actions{
  display:flex;
  justify-content:flex-end;
  gap:10px;
}

.cancel{
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
  border:none;
  padding:10px 14px;
  border-radius:8px;
  cursor:pointer;
}

.primary{
  background: var(--grad);
  color:white;
  border:none;
  padding:10px 16px;
  border-radius:8px;
  font-weight:600;
  cursor:pointer;
}

/* DELETE BUTTON */
.delete{
  background: linear-gradient(135deg,#e53935,#ff5252);
  color:#fff;
  border:none;
  padding:10px 16px;
  border-radius:10px;
  font-weight:600;
  cursor:pointer;
}

.delete:hover{
  box-shadow:0 6px 14px rgba(229,57,53,.35);
}

/* ================= TEXT FIX ================= */
.dialog p{
  color: var(--clr-subtext);
}

.dialog strong{
  color: var(--clr-heading);
}

/* ================= CENTER ================= */
.center{
  text-align:center;
  padding:40px;
  color: var(--clr-subtext);
}

/* ================= MOBILE ================= */
@media (max-width:600px){
  .email{
    white-space:normal;
    word-break:break-word;
  }
}

</style>