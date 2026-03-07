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
.page {
  padding:8px;
  min-height: 100vh;
  background: #f6f8fb;
}



.error {
  background: #ffe5e5;
  color: #c62828;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 12px;
  text-align: center;
}

.form-container {
  max-width: 700px;
  margin: auto;
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.banner-box {
  position: relative;
  height: 220px;
  border-radius: 16px;
  overflow: hidden;
  background: #e9eef5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  color: #777;
  font-size: 14px;
}

.upload-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: #1b8e5a;
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
}

.upload-btn input {
  display: none;
}

input,
textarea,
select {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #ddd;
  font-size: 14px;
  width: 100%;
}

textarea {
  min-height: 90px;
  resize: vertical;
}

.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.update-btn {
  background: #1b8e5a;
  color: white;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

.update-btn:disabled {
  background: #999;
  cursor: not-allowed;
}

.loader {
  text-align: center;
  padding: 100px 0;
}
</style>