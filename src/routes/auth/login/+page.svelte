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

/* ================= CONTAINER ================= */

.container{
min-height:100vh;

display:flex;
justify-content:center;
align-items:stretch;


background:linear-gradient(135deg,#20559b,#11ba66);

padding:0;
}

/* ================= CARD ================= */

.card{
width:100%;
min-height:100vh;

background:white;

padding:36px 20px;

display:flex;
flex-direction:column;
}

/* ================= LOGO ================= */

.logo{
display:flex;
justify-content:center;
}

.logo img{
max-height:115px;
width:auto;
object-fit:contain;
}

/* ================= TITLE ================= */

.title{
text-align:center;
font-size:26px;
font-weight:700;
color:#111827;
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

border:1px solid #e5e7eb;

font-size:16px;

background:#f9fafb;

outline:none;

transition:.2s;
}

.input:focus{
background:white;
border-color:#11ba66;
box-shadow:0 0 0 3px rgba(17,186,102,.15);
}

.input-error{
border-color:#dc2626;
}

/* ================= ERROR ================= */

.error{
color:#dc2626;
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

color:white;

cursor:pointer;

transition:.25s;
}

/* LOGIN BUTTON */

.login-btn{
background:#16a34a;
}

.login-btn:hover{
background:#15803d;
transform:translateY(-2px);
}

/* GOOGLE BUTTON */

.google-btn{
background:#9d3ca3;
margin-top:10px;
}

.google-btn:hover{
background:#7e2c85;
transform:translateY(-2px);
}

/* ================= TEXT ================= */

.or{
text-align:center;
color:#6b7280;
}

.signup{
margin-top:24px;
text-align:center;
color:#6b7280;
}

.signup a{
color:#11ba66;
font-weight:600;
text-decoration:underline;
}

/* ================= TOAST ================= */

.toast{
position:fixed;

bottom:20px;
left:50%;
transform:translateX(-50%);

background:#111827;
color:white;

padding:14px 20px;

border-radius:10px;

font-size:14px;

box-shadow:0 10px 30px rgba(0,0,0,.25);

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

border:1px solid #e5e7eb;

box-shadow:
0 10px 25px rgba(0,0,0,.05),
0 20px 60px rgba(0,0,0,.08);

transition:.25s;
}

.card:hover{
transform:translateY(-6px);

box-shadow:
0 25px 80px rgba(0,0,0,.15),
0 30px 90px rgba(0,0,0,.18);
}

.logo img{
max-height:120px;
}

}
</style>