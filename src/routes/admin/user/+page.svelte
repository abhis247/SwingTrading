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
.container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 16px;
}

.search {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #ddd;
  margin-bottom: 20px;
}

/* CARD */
.card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 16px;
  padding-right: 50px;
  border-radius: 14px;
  margin-bottom: 14px;
  box-shadow: 0 4px 14px rgba(0,0,0,.08);
  position: relative;
}

.left img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #1b8e5a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.info {
  flex: 1;
}

.name { font-weight: 600; }
.email { font-size: 13px; color: #666; }
.role { font-size: 12px; color: #1b8e5a; }

/* MENU */

.menu-btn {
  background: #1b8e5a;
  color: white;
  border: none;
  font-size: 18px;
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.menu-dropdown {
  position: absolute;
  right: 0;
  top: 36px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(0,0,0,.15);
  min-width: 130px;
  overflow: hidden;
  z-index: 10;
}

.menu-item {
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.delete {
  color: #e53935;
}

/* DIALOG */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.4);
  display: flex;
  justify-content: center;
  align-items: center;
}

.dialog {
  background: white;
  padding: 24px;
  border-radius: 14px;
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dialog-actions .primary {
  background: #1b8e5a;
  color: white;
}

.dialog-actions .delete {
  background: #e53935;
  color: white;
}

.center {
  text-align: center;
  padding: 40px;
}

/* MOBILE */
@media (max-width: 600px) {
  .card {
    flex-direction: row;
    align-items: center;
  }
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.dialog {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: dialogFade .18s ease;
}

@keyframes dialogFade {
  from { transform: translateY(10px); opacity:0; }
  to { transform: translateY(0); opacity:1; }
}

/* header */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

/* body */
.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 600;
  color: #444;
}

.field input {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #ddd;
  font-size: 14px;
}

.field input:focus {
  outline: none;
  border-color: #1b8e5a;
  box-shadow: 0 0 0 2px rgba(27,142,90,.15);
}

/* footer */
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel {
  background: #eee;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
}

.primary {
  background: linear-gradient(45deg,#1b8e5a,#43a047);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

/* mobile */
@media (max-width: 500px) {
  .dialog {
    margin: 0 14px;
  }
}
/* ================= OVERLAY ================= */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  animation: fadeIn .2s ease;
}

/* ================= DIALOG ================= */
.dialog {
  background: white;
  padding: 24px;
  border-radius: 16px;
  width: 92%;
  max-width: 380px;
  box-shadow: 0 12px 30px rgba(0,0,0,.18);
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: scaleIn .18s ease;
}

/* ================= TITLE ================= */
.dialog h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #222;
}

/* ================= MESSAGE ================= */
.dialog p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

/* ================= ACTIONS ================= */
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}

/* ================= BUTTON BASE ================= */
.dialog-actions button {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: .18s ease;
}

/* Cancel button */
.dialog-actions button:first-child {
  background: #f1f3f5;
  color: #333;
}

.dialog-actions button:first-child:hover {
  background: #e5e7ea;
}

/* Delete button */
.dialog-actions .delete {
  background: linear-gradient(45deg,#e53935,#ff5252);
  color: white;
}

.dialog-actions .delete:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(229,57,53,.35);
}

/* ================= ANIMATIONS ================= */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ================= MOBILE ================= */
@media (max-width: 480px) {
  .dialog {
    padding: 20px;
    border-radius: 14px;
  }

  .dialog h3 {
    font-size: 18px;
  }

  .dialog p {
    font-size: 13px;
  }

  .dialog-actions button {
    padding: 10px;
    font-size: 13px;
  }
}



@media (max-width: 600px) {
  .email {
    white-space: normal;
    word-break: break-word;
  }
}
</style>