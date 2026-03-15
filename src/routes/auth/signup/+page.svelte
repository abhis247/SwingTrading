<script lang="ts">
  import { signUpUser, signInWithGoogle } from "$lib/firebase";
  import { goto } from "$app/navigation";

  
  let name = "";
  let email = "";
  let password = "";
  let phone = "";
 let phoneError = "";
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

  function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
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
$: {
  if (phone.length === 0) {
    phoneError = "";
  } 
  else if (phone.length < 10) {
    phoneError = "";
  } 
  else {
    phoneError = validatePhone(phone)
      ? ""
      : "Enter valid mobile number";
  }
}
  function validateForm(): boolean {
    if (!name.trim()) nameError = "Name is required";
    if (!email.trim()) emailError = "Email is required";
    if (!password) passwordError = "Password is required";
    if (!phone.trim()) phoneError = "Phone number is required";

    return !nameError && !emailError && !passwordError;
  }

  /* ================= EMAIL SIGNUP ================= */

  async function handleSignup(): Promise<void> {
    if (!validateForm()) return;

    loading = true;

    try {
      await signUpUser(name, email, password,phone);

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
    <div class="logo">
    <img src="/logo.png" alt="Construction Wizards" />
    </div>
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
    
    <div class="field">
    <input
  type="tel"
  placeholder="Phone Number"
  bind:value={phone}
  inputmode="numeric"
  pattern="[0-9]{10}"
  maxlength="10"
  class="input {phoneError ? 'input-error' : ''}"
/>
  {#if phoneError}
    <p class="error">{phoneError}</p>
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
margin-bottom:16px;
}

.logo img{
max-height:115px;
width:auto;
object-fit:contain;
}

/* ================= FIELD ================= */

.field{
margin-bottom:20px;
text-align:left;
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

.register-btn,
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

/* REGISTER BUTTON */

.register-btn{
background:#16a34a;
}

.register-btn:hover{
background:#15803d;
transform:translateY(-2px);
}

/* GOOGLE BUTTON */

.google-btn{
background:#9d3ca3;
margin-top:8px;
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

.login{
margin-top:24px;
text-align:center;
color:#6b7280;
}

.login-link{
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
max-height:110px;
}



}
</style>