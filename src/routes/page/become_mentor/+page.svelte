<script lang="ts">
  import { onMount } from "svelte";
  import { auth } from "$lib/firebase";
  import { supabase } from "$lib/supabase";
  import { goto } from "$app/navigation";

  let name = "";
  let email = "";

  let expertise = "";
  let experience = "";
  let bio = "";

  let loading = true;
  let alreadyApplied = false;
  let isMentor = false;

  ////////////////////////////////////////////////////////////
  // INIT DATA
  ////////////////////////////////////////////////////////////

  onMount(() => {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        goto("/auth/login" ,{ replaceState:true });
        return;
      }

      // fetch profile
      const { data: profile } = await supabase
        .from("users")
        .select()
        .eq("uid", user.uid)
        .single();

      name = profile?.name;
      email = profile?.email;

      // mentor role
      if (profile?.role === "mentor") {
        isMentor = true;
      }

      // existing application
      const { data: existing } = await supabase
        .from("mentor_applications")
        .select()
        .eq("user_uid", user.uid)
        .maybeSingle();

      if (existing) alreadyApplied = true;

      loading = false;
    });
  });

  ////////////////////////////////////////////////////////////
  // SUBMIT APPLICATION
  ////////////////////////////////////////////////////////////

  async function submitApplication() {
    const user = auth.currentUser;
    if (!user) return;

    if (!expertise) {
      alert("Enter expertise");
      return;
    }

    await supabase.from("mentor_applications").insert({
      user_uid: user.uid,
      expertise,
      experience,
      bio,
      status: "pending"
    });

    alert("Application Submitted");
    goto("/");
  }
</script>

<div class="page">

  {#if loading}
    <div class="center">Loading...</div>

  {:else if isMentor}
    <div class="center">You are already a mentor</div>

  {:else if alreadyApplied}
    <div class="center">Application under review</div>

  {:else}

    <!-- APPBAR -->
    <div class="appbar">
      <button class="back" on:click={() => history.back()}>←</button>
      <h2>Become a Mentor</h2>
    </div>

    <div class="content">

      <!-- USER INFO -->
      <div class="user-card">
        <span>👤</span>
        <div>
          <h4>{name}</h4>
          <p>{email}</p>
        </div>
      </div>

      <!-- FORM -->

      <input
        placeholder="Expertise"
        bind:value={expertise}
        class="input"
      />

      <input
        placeholder="Experience"
        bind:value={experience}
        class="input"
      />

      <textarea
        placeholder="Short Bio"
        bind:value={bio}
        class="textarea"
      ></textarea>

      <button class="apply-btn" on:click={submitApplication}>
        Apply as Mentor
      </button>

    </div>

  {/if}
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
:global(body) {
  background: var(--clr-page-bg);
  font-family: system-ui;
}

/* PAGE */
.page {
  min-height: 100vh;
  background: var(--clr-page-bg);
}

/* CENTER STATES */
.center {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--clr-subtext);
}

/* APPBAR */
.appbar {
  background: var(--grad);
  color: var(--appbar-text);
  padding: 16px;
  position: relative;
  text-align: center;
}

.back {
  position: absolute;
  left: 12px;
  top: 12px;
  background: none;
  border: none;
  font-size: 22px;
  color: var(--appbar-text);
  cursor: pointer;
}

/* CONTENT */
.content {
  padding: 16px;
  max-width: 520px;
  margin: auto;
}

/* USER CARD */
.user-card {
  display: flex;
  gap: 12px;
  background: var(--clr-card-bg);
  padding: 14px;
  border-radius: 14px;
  margin-bottom: 20px;
  border: 1px solid var(--clr-card-border);
  box-shadow: 0 4px 10px var(--clr-accent-shadow);
}

.user-card span {
  font-size: 22px;
}

.user-card h4 {
  color: var(--clr-heading);
}

.user-card p {
  color: var(--clr-subtext);
}

/* INPUTS */
.input,
.textarea {
  width: 88%;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid var(--clr-card-border);
  margin-bottom: 14px;
  font-size: 14px;
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
}

.textarea {
  height: 120px;
  resize: none;
}

/* BUTTON */
.apply-btn {
  width: 100%;
  height: 50px;
  background: var(--grad);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 6px 18px var(--clr-accent-shadow2);
}
</style>