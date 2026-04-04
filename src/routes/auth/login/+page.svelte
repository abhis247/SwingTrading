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
<div class="logo">
  <img src="/logo.png" alt="Construction Wizards" />
</div>
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
:global(*){box-sizing:border-box}

:global(html,body){
  margin:0;
  padding:0;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
}


/* ================= VARIABLES ================= */

:global(:root){

  --clr-primary-from:#7a5400;
  --clr-primary-to:#d4a017;

  --clr-accent:#d4a017;
  --clr-accent-dark:#b88a10;

  --clr-accent-shadow:rgba(212,160,23,0.3);

  --clr-page-bg:linear-gradient(180deg,#0a0800,#120d00);

  --clr-card-bg:#2b1f06;
  --clr-card-border:rgba(212,160,23,0.3);

  --clr-heading:#fff2c2;
  --clr-subtext:#c9a84d;

  --grad:linear-gradient(135deg,var(--clr-primary-from),var(--clr-primary-to));
}


/* ================= CONTAINER ================= */

.container{
  min-height:100vh;

  display:flex;
  justify-content:center;
  align-items:stretch;

  background: var(--clr-page-bg);
}


/* ================= CARD ================= */

.card{
  width:100%;
  min-height:100vh;

  background: var(--clr-card-bg);

  padding:36px 20px;

  display:flex;
  flex-direction:column;

  box-shadow:
    0 0 20px rgba(212,160,23,0.08),
    0 20px 60px rgba(0,0,0,.8);
}


/* ================= LOGO ================= */

.logo{
  display:flex;
  justify-content:center;
  margin-bottom:10px;
}

.logo img{
  max-height:158px;

  filter:
    drop-shadow(0 0 15px rgba(212,160,23,0.6))
    drop-shadow(0 0 30px rgba(212,160,23,0.4));
}


/* ================= TITLE ================= */

.title{
  text-align:center;
  font-size:26px;
  font-weight:700;

  color: var(--clr-accent);

  text-shadow:0 0 10px rgba(212,160,23,0.5);
}


/* ================= FIELD ================= */

.field{
  margin-bottom:20px;
}


/* ================= INPUT ================= */

.input{
  width:100%;
  height:56px;

  padding:0 16px;

  border-radius:12px;

  border:1px solid var(--clr-card-border);

  font-size:16px;

  background:#0d0d0d;
  color:var(--clr-heading);

  outline:none;

  transition:.2s;
}

.input::placeholder{
  color:var(--clr-subtext);
}

.input:focus{
  border-color:var(--clr-accent);
  box-shadow:0 0 0 3px rgba(212,160,23,.2);
}

.input-error{
  border-color:#dc2626;
}


/* ================= ERROR ================= */

.error{
  color:#f87171;
  font-size:13px;
  margin-top:6px;
}


/* ================= BUTTONS ================= */

.login-btn,
.google-btn{
  width:100%;
  height:56px;

  border:none;
  border-radius:12px;

  font-size:16px;
  font-weight:bold;

  cursor:pointer;

  transition:.25s;
}

/* LOGIN BUTTON */

.login-btn{
  background:var(--grad);
  color:black;
}

.login-btn:hover{
  transform:translateY(-2px);
  box-shadow:0 10px 25px rgba(212,160,23,0.3);
}


/* GOOGLE BUTTON */

.google-btn{
  background:#222;
  color:var(--clr-heading);
  margin-top:10px;
  border:1px solid var(--clr-card-border);
}

.google-btn:hover{
  transform:translateY(-2px);
  background:#2a2a2a;
}


/* ================= TEXT ================= */

.or{
  text-align:center;
  color:var(--clr-subtext);
}

.signup{
  margin-top:24px;
  text-align:center;
  color:var(--clr-subtext);
}

.signup a{
  color:var(--clr-accent);
  font-weight:600;
  text-decoration:underline;
}


/* ================= TOAST ================= */

.toast{
  position:fixed;

  bottom:20px;
  left:50%;
  transform:translateX(-50%);

  background:#111;
  color:var(--clr-heading);

  padding:14px 20px;

  border-radius:10px;

  font-size:14px;

  box-shadow:0 10px 30px rgba(0,0,0,.5);

  z-index:999;
}


/* ================= DESKTOP ================= */

@media(min-width:768px){

  .container{
    align-items:center;
    padding:20px;
  }

  .card{
    max-width:500px;
    min-height:auto;

    border-radius:20px;

    border:1px solid var(--clr-card-border);

    transition:.25s;
  }

  .card:hover{
    transform:translateY(-6px);
  }

  .logo img{
    max-height:158px;
  }
}

</style>