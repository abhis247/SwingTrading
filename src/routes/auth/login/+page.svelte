<script lang="ts">
  import { signInUser, signInWithGoogle } from "$lib/firebase";
  import { goto } from "$app/navigation";

  let email = "";
  let password = "";

  let loading = false;
  let googleLoading = false;

  let emailError = "";
  let passwordError = "";

  let toastMessage = "";
  let showToast = false;

  function showSnackbar(message: string) {
    toastMessage = message;
    showToast = true;
    setTimeout(() => (showToast = false), 3000);
  }

  function validateEmailFormat(email: string): boolean {
    return /^[\w\.-]+@([\w-]+\.)+[\w-]{2,}$/.test(email);
  }

  $: emailError =
    email.length > 0 && !validateEmailFormat(email)
      ? "Enter a valid email address"
      : "";

  $: passwordError =
    password.length > 0 && password.length < 6
      ? "Password must be at least 6 characters"
      : "";

  function validateForm(): boolean {
    if (!email.trim()) emailError = "Email is required";
    if (!password) passwordError = "Password is required";
    return !emailError && !passwordError;
  }

  async function handleLogin() {
    if (!validateForm()) return;

    loading = true;

    try {
      await signInUser(email, password);
      showSnackbar("Login successful 🎉");
      // setTimeout(() => goto("/dashboard"), 800);
    } catch {
      showSnackbar("Incorrect email or password");
    }

    loading = false;
  }

  async function googleLogin() {
    googleLoading = true;

    try {
      const user = await signInWithGoogle();
      if (user) {
        showSnackbar("Google login successful 🎉");
        // setTimeout(() => goto("/dashboard"), 800);
      }
    } catch {
      showSnackbar("Google login failed");
    }

    googleLoading = false;
  }
</script>

<div class="container">
  <div class="card">

    <div class="form">

      <h2 class="title">Welcome Back 👋</h2>

      <!-- EMAIL -->
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

      <!-- PASSWORD -->
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

      <!-- LOGIN BUTTON -->
      <button class="login-btn" on:click={handleLogin} disabled={loading}>
        {loading ? "Please wait..." : "Login"}
      </button>

      <p class="or">or continue with</p>

      <!-- GOOGLE BUTTON -->
      <button class="google-btn" on:click={googleLogin} disabled={googleLoading}>
        {googleLoading ? "Signing..." : "Sign in with Google"}
      </button>

      <p class="signup">
        Not have an account?
        <a href="/auth/signup">Sign up</a>
      </p>

    </div>

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
    align-items: stretch;
    justify-content: center;
    background: #f8fafc;
  }

  /* FULL HEIGHT CARD */
  .card {
    width: 100%;
    max-width: 480px;
    min-height: 100vh;
    background: white;
    padding: 32px 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .form {
    width: 100%;
  }

  .title {
    text-align: center;
    margin-bottom: 28px;
  }

  .field {
    margin-bottom: 20px;
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

  .input-error {
    border-color: #dc2626;
  }

  .error {
    color: #dc2626;
    font-size: 13px;
    margin-top: 6px;
  }

  .login-btn,
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

  .login-btn {
    background: #16a34a;
  }

  .google-btn {
    background: #9d3ca3;
    margin-top: 10px;
  }

  .or {
    margin: 22px 0;
    text-align: center;
    color: #6b7280;
  }

  .signup {
    margin-top: 24px;
    text-align: center;
    color: #6b7280;
  }

  .signup a {
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
</style>