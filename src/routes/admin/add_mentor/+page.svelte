<script lang="ts">
  import { supabase } from "$lib/supabase";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import AppBar from "$lib/AppBar1.svelte";

  let loading = false;
  let users: any[] = [];

  let selectedEmail = "";
  let selectedUid = "";

  let expertise = "";
  let experience = "";
  let bio = "";

  // dialog state
  let showDialog = false;
  let dialogMessage = "";
  let dialogSuccess = false;

  // fetch users
  onMount(async () => {
    const { data, error } = await supabase
      .from("users")
      .select("uid,email,name")
      .eq("role", "user");

    if (!error && data) users = data;
  });

  function handleUserChange(e: any) {
    selectedEmail = e.target.value;
    const user = users.find((u) => u.email === selectedEmail);
    selectedUid = user?.uid || "";
  }

  async function submit() {
    if (!selectedUid) {
      dialogMessage = "Select user first";
      dialogSuccess = false;
      showDialog = true;
      return;
    }

    loading = true;

    try {
      // check mentor exists
      const { data: existing } = await supabase
        .from("mentors")
        .select("id")
        .eq("uid", selectedUid)
        .maybeSingle();

      if (existing) {
        dialogMessage = "Mentor already exists";
        dialogSuccess = false;
        showDialog = true;
        loading = false;
        return;
      }

      // insert mentor
      await supabase.from("mentors").insert({
        uid: selectedUid,
        expertise,
        experience,
        bio,
      });

      // update role
      await supabase
        .from("users")
        .update({ role: "mentor" })
        .eq("uid", selectedUid);

      // success dialog
      dialogMessage = "Mentor created successfully 🎉";
      dialogSuccess = true;
      showDialog = true;

      // auto redirect
      setTimeout(() => {
        goto("/admin/dashboard");
      }, 1500);

      // reset fields
      selectedEmail = "";
      selectedUid = "";
      expertise = "";
      experience = "";
      bio = "";

    } catch (e) {
      console.error(e);
      dialogMessage = "Error creating mentor";
      dialogSuccess = false;
      showDialog = true;
    }

    loading = false;
  }
</script>

<AppBar title="Add Mentor" showBack={true} />

<div class="card">

  <!-- USER DROPDOWN -->
  <div class="field">
    <label for="email">Select User Email</label>
    <select id="email" bind:value={selectedEmail} on:change={handleUserChange}>
      <option value="">Select email</option>
      {#each users as u}
        <option value={u.email}>
          {u.name || "User"} ({u.email})
        </option>
      {/each}
    </select>
  </div>

  <!-- EXPERTISE -->
  <div class="field">
    <label for="expertise">Expertise</label>
    <input id="expertise" bind:value={expertise} placeholder="Expertise" />
  </div>

  <!-- EXPERIENCE -->
  <div class="field">
    <label for="experience">Experience (Years)</label>
    <input id="experience" bind:value={experience} placeholder="Experience" />
  </div>

  <!-- BIO -->
  <div class="field">
    <label for="bio">Bio</label>
    <textarea id="bio" bind:value={bio} placeholder="Bio"></textarea>
  </div>

  <!-- SUBMIT -->
  <button class="submit" on:click={submit} disabled={loading}>
    {loading ? "Creating..." : "Create Mentor"}
  </button>

</div>

<!-- DIALOG -->
{#if showDialog}
  <div class="dialog-overlay">
    <div class="dialog">
      <h3>{dialogSuccess ? "Success" : "Error"}</h3>
      <p>{dialogMessage}</p>

      {#if !dialogSuccess}
        <button class="ok-btn" on:click={() => showDialog = false}>
          OK
        </button>
      {/if}

      {#if dialogSuccess}
        <div class="redirect-text">Redirecting...</div>
      {/if}
    </div>
  </div>
{/if}

<!-- LOADER -->
{#if loading}
  <div class="overlay">
    <div class="loader"></div>
  </div>
{/if}

<style>

.card {
  max-width:600px;
  margin:24px auto;
  background:white;
  padding:24px;
  border-radius:14px;
  box-shadow:0 6px 18px rgba(0,0,0,.08);
  display:flex;
  flex-direction:column;
  gap:16px;
}

.field {
  display:flex;
  flex-direction:column;
  gap:6px;
}

input, textarea, select {
  padding:12px;
  border-radius:8px;
  border:1px solid #ddd;
  font-size:14px;
}

textarea {
  min-height:100px;
}

.submit {
  background:linear-gradient(45deg,#1b8e5a,#43a047);
  color:white;
  padding:14px;
  border:none;
  border-radius:10px;
  font-size:15px;
  font-weight:600;
  cursor:pointer;
}

.submit:disabled {
  opacity:.6;
  cursor:not-allowed;
}

/* DIALOG */

.dialog-overlay {
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.4);
  display:flex;
  justify-content:center;
  align-items:center;
  z-index:999;
}

.dialog {
  background:white;
  padding:24px;
  border-radius:14px;
  width:320px;
  text-align:center;
  box-shadow:0 8px 24px rgba(0,0,0,.2);
}

.ok-btn {
  margin-top:14px;
  padding:10px 18px;
  border:none;
  border-radius:8px;
  background:#1b8e5a;
  color:white;
  cursor:pointer;
}

.redirect-text {
  margin-top:12px;
  font-size:13px;
  color:#777;
}

/* LOADER */

.overlay {
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.3);
  display:flex;
  justify-content:center;
  align-items:center;
}

.loader {
  width:42px;
  height:42px;
  border:4px solid #fff;
  border-top:4px solid #1b8e5a;
  border-radius:50%;
  animation:spin 1s linear infinite;
}

@keyframes spin {
  to { transform:rotate(360deg); }
}

</style>