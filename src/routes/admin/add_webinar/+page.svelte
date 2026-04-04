<script lang="ts">
  import { supabase } from "$lib/supabase";
  import { auth } from "$lib/firebase";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import AppBar from "$lib/AppBar1.svelte";

  let title = "";
  let mentorName = "";
  let meetingLink = "";
  let duration = "";
  let description = "";

  let selectedDate: string | null = null;
  let selectedTime: string | null = null;

  let bannerFile: File | null = null;
  let bannerPreview: string | null = null;

  let loading = false;
  let user: any = null;

  let showDialog = false;
  let dialogMessage = "";
  let dialogType: "success" | "error" = "success";

  //////////////////////////////////////////////////////
  // AUTH
  //////////////////////////////////////////////////////
  onMount(() => {
    auth.onAuthStateChanged((u) => {
      if (!u) goto("/auth/login");
      else user = u;
    });
  });

  //////////////////////////////////////////////////////
  // PICK BANNER
  //////////////////////////////////////////////////////
  function pickBanner(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    bannerFile = file;
    bannerPreview = URL.createObjectURL(file);
  }

  //////////////////////////////////////////////////////
  // UPLOAD BANNER
  //////////////////////////////////////////////////////
  async function uploadBanner() {
    if (!bannerFile) return null;

    const fileName = Date.now() + ".jpg";
    const path = `webinars/${fileName}`;

    await supabase.storage
      .from("webinar_banner")
      .upload(path, bannerFile);

    const { data } = supabase.storage
      .from("webinar_banner")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  //////////////////////////////////////////////////////
  // VALIDATION HELPER
  //////////////////////////////////////////////////////
  function showError(msg: string) {
    dialogType = "error";
    dialogMessage = msg;
    showDialog = true;
  }

  //////////////////////////////////////////////////////
  // SUBMIT
  //////////////////////////////////////////////////////
  async function submit() {
    if (!title.trim()) return showError("Title is required");
    if (!mentorName.trim()) return showError("Mentor name is required");

    if (!meetingLink.trim()) return showError("Meeting link is required");

    try {
      new URL(meetingLink);
    } catch {
      return showError("Please enter a valid meeting link");
    }

    if (!selectedDate) return showError("Please select a date");
    if (!selectedTime) return showError("Please select a time");

    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);

    if (selectedDateTime <= new Date()) {
      return showError("Schedule must be in the future");
    }

    if (!duration || Number(duration) <= 0) {
      return showError("Duration must be greater than 0");
    }
    if (!/^[0-9]+$/.test(duration)) {
  return showError("Duration must contain only numbers");
   }

  if (Number(duration) <= 0) {
  return showError("Duration must be greater than 0");
  }



   if (!description.trim()) return showError("Description is required");

    loading = true;

    try {
      const bannerUrl = await uploadBanner();

      await supabase.from("webinars").insert({
        title,
        mentor_id: user?.uid,
        mentor_name: mentorName,
        meeting_link: meetingLink,
        duration: Number(duration),
        schedule_at: selectedDateTime.toISOString(),
        description,
        status: "Upcoming",
        banner: bannerUrl
      });

      dialogType = "success";
      dialogMessage = "Webinar created successfully 🎉";
      showDialog = true;
      history.back();

    } catch (e) {
      dialogType = "error";
      dialogMessage = "Failed to create webinar";
      showDialog = true;
    }

    loading = false;
  }
</script>

<AppBar title="Add Webinar" showBack={true} />

<div class="container">

  <!-- Banner -->
  <label for="banner" class="banner">
    {#if bannerPreview}
      <img src={bannerPreview} alt="banner" />
    {:else}
      <div class="banner-placeholder">
        <span>Click to add banner</span>
      </div>
    {/if}
  </label>

  <input
    id="banner"
    type="file"
    accept="image/*"
    on:change={pickBanner}
    hidden
  />

  <input type="text" placeholder="Webinar Title *" bind:value={title} required />
  <input type="text" placeholder="Mentor Name *" bind:value={mentorName} required />
  <input type="url" placeholder="Meeting Link *" bind:value={meetingLink} required />

  <!-- Date & Time -->
  <div class="date-time-grid">

    <div class="field">
      <label>Select Date *</label>
      <input
        type="date"
        bind:value={selectedDate}
        min={new Date().toISOString().split("T")[0]}
        required
      />
    </div>

    <div class="field">
      <label>Select Time *</label>
      <input
        type="time"
        bind:value={selectedTime}
        required
      />
    </div>

  </div>

  <input
  type="text"
  placeholder="Duration (minutes) *"
  bind:value={duration}
  inputmode="numeric"
  pattern="[0-9]*"
  on:input={(e) => {
    const target = e.target as HTMLInputElement;
    target.value = target.value.replace(/[^0-9]/g, "");
    duration = target.value;
  }}
  required
/>

  <textarea
    placeholder="Description"
    bind:value={description}
  ></textarea>

  <button on:click={submit} disabled={loading}>
    {loading ? "Saving..." : "Add Webinar"}
  </button>
</div>

<!-- Dialog -->
{#if showDialog}
  <div class="dialog-overlay">
    <div class="dialog-box {dialogType}">
      <p>{dialogMessage}</p>

      <button
        on:click={() => {
          showDialog = false;
          if (dialogType === "success") goto("/mentor/webinars");
        }}
      >
        OK
      </button>
    </div>
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
:global(body){
  background: var(--clr-page-bg);
}

/* CONTAINER */
.container {
  max-width: 620px;
  margin: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* BANNER */
.banner {
  height: 170px;
  border-radius: 14px;
  background: var(--clr-tab-idle-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  border: 2px dashed var(--clr-card-border);
}

.banner-placeholder span{
  color: var(--clr-subtext);
}

.banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* GRID */
.date-time-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

/* FIELD */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--clr-subtext);
}

/* INPUT */
input, textarea {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--clr-card-border);
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
}

/* PLACEHOLDER */
input::placeholder,
textarea::placeholder {
  color: var(--clr-subtext);
  opacity: 1;
}

/* FOCUS */
input:focus, textarea:focus {
  outline: none;
  border-color: var(--clr-accent);
  box-shadow: 0 0 0 2px var(--clr-accent-shadow);
}

/* CURSOR */
input, textarea {
  caret-color: var(--clr-accent);
}

/* BUTTON */
button {
  background: var(--grad);
  color: white;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 18px var(--clr-accent-shadow2);
}

button:disabled {
  opacity: .6;
  cursor: not-allowed;
}

/* DIALOG */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.dialog-box {
  background: var(--clr-card-bg);
  padding: 22px;
  border-radius: 14px;
  width: 320px;
  text-align: center;
  border: 1px solid var(--clr-card-border);
  box-shadow: 0 10px 30px var(--clr-accent-shadow);
}

.dialog-box p {
  color: var(--clr-heading);
}

/* SUCCESS / ERROR */
.dialog-box.success {
  border-top: 4px solid #22c55e; /* keep */
}

.dialog-box.error {
  border-top: 4px solid #ef4444; /* keep */
}

.dialog-box button {
  margin-top: 14px;
  padding: 10px 20px;
  border-radius: 10px;
  background: var(--clr-accent);
}
</style>