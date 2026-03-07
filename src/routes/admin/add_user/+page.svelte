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
.page {
  display:flex;
  justify-content:center;
  padding:20px;
}

.form {
  width:100%;
  max-width:520px;
  display:flex;
  flex-direction:column;
  gap:12px;
}

input, select {
  padding:12px;
  border-radius:12px;
  border:1px solid #ddd;
  font-size:14px;
}

button {
  padding:14px;
  background:#1b8e5a;
  color:white;
  border:none;
  border-radius:12px;
  font-weight:600;
  cursor:pointer;
}

button:disabled {
  background:#9ca3af;
  cursor:not-allowed;
}

.error {
  background:#fee2e2;
  color:#b91c1c;
  padding:10px;
  border-radius:10px;
  font-size:13px;
}

.success {
  background:#dcfce7;
  color:#15803d;
  padding:10px;
  border-radius:10px;
  font-size:13px;
}

/* responsive */
@media (max-width:768px){
  .page { padding:16px }
}
</style>