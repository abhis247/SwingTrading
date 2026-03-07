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
        goto("/auth/login");
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
.page {
  min-height: 100vh;
  background: #f5f7fb;
  font-family: system-ui;
}

/* CENTER STATES */
.center {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

/* APPBAR */
.appbar {
  background: #1fae4b;
  color: white;
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
  color: white;
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
  background: white;
  padding: 14px;
  border-radius: 14px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,.06);
}

.user-card span {
  font-size: 22px;
}

/* INPUTS */
.input,
.textarea {
  width: 100%;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #ddd;
  margin-bottom: 14px;
  font-size: 14px;
}

.textarea {
  height: 120px;
  resize: none;
}

/* BUTTON */
.apply-btn {
  width: 100%;
  height: 50px;
  background: #1fae4b;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
}
</style>