<script lang="ts">
  import { signUpUser, signInWithGoogle } from "$lib/firebase";
  import { goto } from "$app/navigation";

  let name = "";
  let email = "";
  let password = "";
  let loading = false;
  let googleLoading = false;

  let nameError = "";
  let emailError = "";
  let passwordError = "";

  /* 🔥 Snackbar */
  let toastMessage = "";
  let showToast = false;

  function showSnackbar(message: string) {
    toastMessage = message;
    showToast = true;

    setTimeout(() => {
      showToast = false;
    }, 3000);
  }

  function validateEmail(email: string): boolean {
    return /^[\w\.-]+@([\w-]+\.)+[\w-]{2,}$/.test(email);
  }

  /* ================= AUTO VALIDATION ================= */

  $: {
    if (name.length > 0 && name.trim().length < 2) {
      nameError = "Enter full name";
    } else {
      nameError = "";
    }
  }

  $: {
    if (email.length > 0) {
      emailError = validateEmail(email)
        ? ""
        : "Enter valid email address";
    } else {
      emailError = "";
    }
  }

  $: {
    if (password.length > 0 && password.length < 6) {
      passwordError = "Password must be at least 6 characters";
    } else {
      passwordError = "";
    }
  }

  function validateForm(): boolean {
    if (!name.trim()) nameError = "Name is required";
    if (!email.trim()) emailError = "Email is required";
    if (!password) passwordError = "Password is required";

    return !nameError && !emailError && !passwordError;
  }

  /* ================= EMAIL SIGNUP ================= */

  async function handleSignup(): Promise<void> {
    if (!validateForm()) return;

    loading = true;

    try {
      await signUpUser(name, email, password);

      showSnackbar("Account created successfully 🎉");

      setTimeout(() => {
        goto("../page/home");
      }, 800);
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") {
        showSnackbar("Email already registered");
      } else if (e.code === "auth/weak-password") {
        showSnackbar("Password should be at least 6 characters");
      } else if (e.code === "auth/invalid-email") {
        showSnackbar("Invalid email address");
      } else {
        showSnackbar("Signup failed");
      }
    }

    loading = false;
  }

  /* ================= GOOGLE SIGNUP ================= */

  async function googleSignup(): Promise<void> {
    googleLoading = true;

    try {
      const user = await signInWithGoogle();

      if (user) {
        showSnackbar("Google signup successful 🎉");

        setTimeout(() => {
          goto("../page/home");
        }, 800);
      }
    } catch (e) {
      showSnackbar("Google signup failed");
    }

    googleLoading = false;
  }
</script>

<div class="container">
  <div class="card">

    <div class="field">
      <input
        type="text"
        placeholder="Full Name"
        bind:value={name}
        class="input {nameError ? 'input-error' : ''}"
      />
      {#if nameError}
        <p class="error">{nameError}</p>
      {/if}
    </div>

    <div class="field">
      <input
        type="email"
        placeholder="Email"
        bind:value={email}
        class="input {emailError ? 'input-error' : ''}"
      />
      {#if emailError}
        <p class="error">{emailError}</p>
      {/if}
    </div>

    <div class="field">
      <input
        type="password"
        placeholder="Password"
        bind:value={password}
        class="input {passwordError ? 'input-error' : ''}"
      />
      {#if passwordError}
        <p class="error">{passwordError}</p>
      {/if}
    </div>

    <button class="register-btn" on:click={handleSignup} disabled={loading}>
      {loading ? "Please wait..." : "Register"}
    </button>

    <p class="or">or continue with</p>

    <button class="google-btn" on:click={googleSignup} disabled={googleLoading}>
      {googleLoading ? "Signing..." : "Sign up with Google"}
    </button>

    <p class="login">
      Already have an account?
      <a href="/auth/login" class="login-link">Login</a>
    </p>

  </div>
</div>

{#if showToast}
  <div class="toast">{toastMessage}</div>
{/if}

<style>
  :global(*) { box-sizing: border-box; }
:global(html, body) { 
  margin: 0; 
  padding: 0; 
}

/* FULL SCREEN CONTAINER */
.container {
  min-height: 100vh;
  display: flex;
  align-items: stretch;   /* important */
  justify-content: center;
  background: #f8fafc;
  padding: 0;
}

/* FULL HEIGHT CARD */
.card {
  width: 100%;
  max-width: 480px;
  min-height: 100vh;      /* full screen */
  background: white;
  padding: 32px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;  /* center form vertically */
}

/* FIELDS */
.field { 
  margin-bottom: 20px; 
  text-align: left; 
}

.input {
  width: 100%;
  height: 56px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  font-size: 16px;
  outline: none;
}

.input:focus {
  border-color: #1b8e5a;
  box-shadow: 0 0 0 2px rgba(27,142,90,0.15);
}

.input-error { border-color: #dc2626; }

.error {
  color: #dc2626;
  font-size: 13px;
  margin-top: 6px;
}

.register-btn,
.google-btn {
  width: 100%;
  height: 56px;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  font-size: 16px;
  color: white;
  cursor: pointer;
}

.register-btn { background: #16a34a; }
.google-btn { background: #9d3ca3; margin-top: 12px; }

.or { margin: 24px 0; text-align: center; color: #6b7280; }

.login { margin-top: 24px; text-align: center; color: #6b7280; }

.login-link {
  color: #1b8e5a;
  font-weight: 600;
  text-decoration: underline;
}

.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  color: white;
  padding: 14px 20px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 999;
}

  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, 20px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
</style>