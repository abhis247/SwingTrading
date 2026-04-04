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

/* CARD */
.card {
  max-width:600px;
  margin:24px auto;
  background: var(--clr-card-bg);
  padding:24px;
  border-radius:14px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 6px 18px var(--clr-accent-shadow);
  display:flex;
  flex-direction:column;
  gap:16px;
}

/* FIELD */
.field {
  display:flex;
  flex-direction:column;
  gap:6px;
}

/* INPUT */
input, textarea, select {
  padding:12px;
  border-radius:8px;
  border:1px solid var(--clr-card-border);
  font-size:14px;
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
}

textarea {
  min-height:100px;
}

/* LABEL */
label {
  color: var(--clr-subtext);
}

/* SUBMIT */
.submit {
  background: var(--grad);
  color:white;
  padding:14px;
  border:none;
  border-radius:10px;
  font-size:15px;
  font-weight:600;
  cursor:pointer;
  box-shadow:0 6px 18px var(--clr-accent-shadow2);
}

.submit:disabled {
  opacity:.6;
  cursor:not-allowed;
}

/* ===== DIALOG ===== */

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
  background: var(--clr-card-bg);
  padding:24px;
  border-radius:14px;
  width:320px;
  text-align:center;
  border:1px solid var(--clr-card-border);
  box-shadow:0 8px 24px var(--clr-accent-shadow);
}

.dialog h3 {
  color: var(--clr-heading);
}

.dialog p {
  color: var(--clr-subtext);
}

.ok-btn {
  margin-top:14px;
  padding:10px 18px;
  border:none;
  border-radius:8px;
  background: var(--clr-accent);
  color:white;
  cursor:pointer;
}

.redirect-text {
  margin-top:12px;
  font-size:13px;
  color: var(--clr-subtext);
}

/* ===== LOADER ===== */

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
  border-top:4px solid var(--clr-accent);
  border-radius:50%;
  animation:spin 1s linear infinite;
}

/* ===== VISIBILITY FIX ===== */
input::placeholder,
textarea::placeholder {
  color: var(--clr-subtext);
  opacity: 1;
}

select {
  color: var(--clr-heading);
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--clr-accent);
}

input, textarea {
  caret-color: var(--clr-accent);
}
</style>