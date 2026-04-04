<script lang="ts">
  import { supabase } from "$lib/supabase";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import AppBar from "$lib/AppBar1.svelte";
  import { snackbar } from "$lib/snackbar";


  let loading = true;
  let updating = false;
  let errorMsg = "";

  let id: string | undefined;

  let title = "";
  let mentor_name = "";
  let duration = "";
  let description = "";
  let meeting_link = "";
  let status = "Upcoming";
  let schedule_at = "";

  let bannerUrl: string | null = null;
  let bannerFile: File | null = null;

  $: id = $page.params.id;

  /* ---------------- SNACKBAR ---------------- */

let showSnackbar = false;
let snackbarMessage = "";
let snackbarType: "success" | "error" | "info" = "success";

let snackbarTimeout: any;

function openSnackbar(
  message: string,
  type: "success" | "error" | "info" = "success"
) {
  snackbarMessage = message;
  snackbarType = type;
  showSnackbar = true;

  clearTimeout(snackbarTimeout);

  snackbarTimeout = setTimeout(() => {
    showSnackbar = false;
  }, 3000);
}

  onMount(async () => {
    if (id) await loadWebinar();
  });

  ///////////////////////////////////////////////////////////
  // LOAD WEBINAR (UTC → LOCAL FIXED)
  ///////////////////////////////////////////////////////////

  async function loadWebinar() {
    const { data, error } = await supabase
      .from("webinars")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      errorMsg = "Failed to load webinar";
      loading = false;
      return;
    }

    if (data) {
      title = data.title || "";
      mentor_name = data.mentor_name || "";
      duration = data.duration || "";
      description = data.description || "";
      meeting_link = data.meeting_link || "";
      status = data.status || "Upcoming";
      bannerUrl = data.banner;

      // 🔥 FIX TIMEZONE PROPERLY
      if (data.schedule_at) {
        const utcDate = new Date(data.schedule_at);

        const localDate = new Date(
          utcDate.getTime() - utcDate.getTimezoneOffset() * 60000
        );

        schedule_at = localDate.toISOString().slice(0, 16);
      }
    }

    loading = false;
  }

  ///////////////////////////////////////////////////////////
  // UPLOAD BANNER
  ///////////////////////////////////////////////////////////

  async function uploadBanner() {
    if (!bannerFile) return bannerUrl;

    const fileName = `${Date.now()}.jpg`;
    const path = `webinar_banner/${fileName}`;

    const { error } = await supabase.storage
      .from("webinar_banner")
      .upload(path, bannerFile, { upsert: true });

    if (error) {
      alert("Banner upload failed");
      return bannerUrl;
    }

    const { data } = supabase.storage
      .from("webinar_banner")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  ///////////////////////////////////////////////////////////
  // UPDATE WEBINAR (LOCAL → UTC SAFE)
  ///////////////////////////////////////////////////////////

  async function updateWebinar() {
    if (!title || !mentor_name || !meeting_link || !duration) {
      snackbar.show("Please fill required fields", "error");
      return;
    }

    updating = true;

    const newBanner = await uploadBanner();

    const { error } = await supabase
      .from("webinars")
      .update({
        title,
        mentor_name,
        duration,
        description,
        meeting_link,
        status,
        // 🔥 Convert LOCAL to UTC before saving
        schedule_at: schedule_at
          ? new Date(schedule_at).toISOString()
          : null,
        banner: newBanner
      })
      .eq("id", id);

    updating = false;

    if (error) {
      snackbar.show("Update failed", "error");
      return;
    }

    snackbar.show("Webinar updated successfully", "success");
    history.back();
    // goto("/admin/webinar");
  }
</script>

{#if loading}
  <div class="loader">Loading...</div>

{:else}
 <AppBar title="Edit webinar" showBack={true} />
  <div class="page">
  
    {#if errorMsg}
      <div class="error">{errorMsg}</div>
    {/if}

    <div class="form-container">

      <!-- Banner -->
      <div class="banner-box">
        {#if bannerFile}
          <img src={URL.createObjectURL(bannerFile)} alt="preview" />
        {:else if bannerUrl}
          <img src={bannerUrl} alt="banner" />
        {:else}
          <div class="placeholder">
            Click to upload banner
          </div>
        {/if}

        <label class="upload-btn">
          Change Banner
          <input
            type="file"
            accept="image/*"
            on:change={(e) => {
              const files = (e.currentTarget as HTMLInputElement).files;
              if (files?.length) bannerFile = files[0];
            }}
          />
        </label>
      </div>

      <!-- Inputs -->
      <div class="grid">
        <input bind:value={title} placeholder="Webinar Title *" />
        <input bind:value={mentor_name} placeholder="Mentor Name *" />
        <input bind:value={meeting_link} placeholder="Meeting Link *" />
        <input bind:value={duration} placeholder="Duration *" />
      </div>

      <textarea bind:value={description} placeholder="Description"></textarea>

      <div class="grid">
        <input type="datetime-local" bind:value={schedule_at} />

        <select bind:value={status}>
          <option>Upcoming</option>
          <option>Live</option>
          <option>Completed</option>
        </select>
      </div>

      <button
        class="update-btn"
        on:click={updateWebinar}
        disabled={updating}
      >
        {updating ? "Updating..." : "Update Webinar"}
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

/* PAGE */
.page {
  padding:8px;
  min-height: 100vh;
  background: var(--clr-page-bg);
}

/* ERROR */
.error {
  background: rgba(255,0,0,0.15);
  color: #ff6b6b;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 12px;
  text-align: center;
}

/* FORM */
.form-container {
  max-width: 700px;
  margin: auto;
  background: var(--clr-card-bg);
  padding: 30px;
  border-radius: 16px;
  border:1px solid var(--clr-card-border);
  box-shadow: 0 10px 30px var(--clr-accent-shadow);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* BANNER */
.banner-box {
  position: relative;
  height: 220px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--clr-tab-idle-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  border:1px solid var(--clr-card-border);
}

.banner-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* PLACEHOLDER */
.placeholder {
  color: var(--clr-subtext);
  font-size: 14px;
}

/* UPLOAD BUTTON */
.upload-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: var(--clr-accent);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  box-shadow:0 4px 10px var(--clr-accent-shadow);
}

.upload-btn input {
  display: none;
}

/* INPUT */
input,
textarea,
select {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--clr-card-border);
  font-size: 14px;
  width: 100%;
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
}

/* PLACEHOLDER */
input::placeholder,
textarea::placeholder{
  color: var(--clr-subtext);
  opacity:1;
}

/* FOCUS */
input:focus,
textarea:focus,
select:focus{
  outline:none;
  border-color: var(--clr-accent);
  box-shadow: 0 0 0 2px var(--clr-accent-shadow);
}

/* CURSOR */
input, textarea{
  caret-color: var(--clr-accent);
}

/* TEXTAREA */
textarea {
  min-height: 90px;
  resize: vertical;
}

/* GRID */
.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

/* BUTTON */
.update-btn {
  background: var(--grad);
  color: white;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow:0 6px 18px var(--clr-accent-shadow2);
}

.update-btn:disabled {
  opacity:.6;
  cursor: not-allowed;
}

/* LOADER */
.loader {
  text-align: center;
  padding: 100px 0;
  color: var(--clr-subtext);
}
</style>