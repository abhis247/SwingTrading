<script lang="ts">
  import { auth } from "$lib/firebase";
  import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
  import AppBar from "$lib/AppBar1.svelte";
  import { goto } from "$app/navigation";
    import { createUserIfNotExists } from "$lib/createUser";

  let name = "";
  let email = "";
  let password = "";
  let phone = "";
  let role = "student";

  let loading = false;
  let errorMsg = "";
  let successMsg = "";

  /////////////////////////////////////////////////////////
  // CREATE USER
  /////////////////////////////////////////////////////////
  async function addUser() {
    errorMsg = "";
    successMsg = "";

    if (!name || !email || !password) {
      errorMsg = "Please fill required fields";
      return;
    }

    loading = true;

    try {
      const credential= await createUserWithEmailAndPassword(auth, email.trim(), password.trim());

      successMsg = "User created successfully";

      // reset form
    //   name = "";
    //   email = "";
    //   password = "";
    //   phone = "";
    //   role = "student";
 if (credential.user) {
    await updateProfile(credential.user, {
      displayName: name
    });
      // 3️⃣ create supabase user
    await createUserIfNotExists(name);
    
  }

      setTimeout(() => goto("/admin/dashboard"), 1000);
    } catch (e: any) {
      errorMsg = e.message;
    }

    loading = false;
  }
</script>

<AppBar title="Add User" showBack={true} />

<div class="page">
  <form class="form" on:submit|preventDefault={addUser}>
    
    <input bind:value={name} placeholder="Full Name *" />
    <input bind:value={email} placeholder="Email *" />
    <input bind:value={password} type="password" placeholder="Password *" />
    <input bind:value={phone} placeholder="Phone" />

    <select bind:value={role}>
      <option value="student">student</option>
      <option value="mentor">mentor</option>
      <option value="admin">admin</option>
    </select>

    {#if errorMsg}
      <div class="error">{errorMsg}</div>
    {/if}

    {#if successMsg}
      <div class="success">{successMsg}</div>
    {/if}

    <button disabled={loading}>
      {#if loading}
        Creating...
      {:else}
        Create User
      {/if}
    </button>

  </form>
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
:global(body){
  background: var(--clr-page-bg);
}

/* PAGE */
.page {
  display:flex;
  justify-content:center;
  padding:20px;
}

/* FORM */
.form {
  width:100%;
  max-width:520px;
  display:flex;
  flex-direction:column;
  gap:12px;
  background: var(--clr-card-bg);
  padding:20px;
  border-radius:14px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 6px 18px var(--clr-accent-shadow);
}

/* INPUT */
input, select {
  padding:12px;
  border-radius:12px;
  border:1px solid var(--clr-card-border);
  font-size:14px;
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
}

/* PLACEHOLDER */
input::placeholder {
  color: var(--clr-subtext);
  opacity:1;
}

/* SELECT TEXT */
select {
  color: var(--clr-heading);
}

/* BUTTON */
button {
  padding:14px;
  background: var(--grad);
  color:white;
  border:none;
  border-radius:12px;
  font-weight:600;
  cursor:pointer;
  box-shadow:0 6px 18px var(--clr-accent-shadow2);
}

button:disabled {
  opacity:.6;
  cursor:not-allowed;
}

/* ERROR */
.error {
  background: rgba(255,0,0,0.15);
  color: #ff6b6b;
  padding:10px;
  border-radius:10px;
  font-size:13px;
}

/* SUCCESS */
.success {
  background: rgba(0,255,100,0.15);
  color: #4ade80;
  padding:10px;
  border-radius:10px;
  font-size:13px;
}

/* FOCUS */
input:focus,
select:focus {
  outline:none;
  border-color: var(--clr-accent);
}

/* CURSOR */
input {
  caret-color: var(--clr-accent);
}

/* RESPONSIVE */
@media (max-width:768px){
  .page { padding:16px }
}
</style>