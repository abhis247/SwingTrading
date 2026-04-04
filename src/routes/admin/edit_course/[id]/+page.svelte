<script lang="ts">
  import { supabase } from "$lib/supabase";
  import AppBar from "$lib/AppBar1.svelte";
  import { page } from "$app/stores";
  import { onMount } from "svelte";

  /* ---------------- TYPES ---------------- */

  type Video = {
    id: string;
    title: string;
    video_url: string;
    duration: string;
  };

  type Subject = {
    id: string;
    title: string;
    description: string;
    videos: Video[];
  };

  type Course = {
    id: string;
    title: string;
    category: string;
    duration: string;
    level: string;
    description: string;
    banner?: string;
    subjects: Subject[];
  };

  /* ---------------- STATE ---------------- */

  let courseId: string | undefined;
  let course: Course | null = null;
  let subjects: Subject[] = [];

  let loading = true;
  let saving = false;

  let title = "";
  let category = "";
  let duration = "";
  let level = "";
  let description = "";

  // banner
  let imageFile: File | null = null;
  let bannerPreview = "";
  let uploadingBanner = false;

  let showSnackbar = false;
  let snackbarMessage = "";

  $: courseId = $page.params.id;

  function openSnackbar(message: string) {
  snackbarMessage = message;
  showSnackbar = true;

  setTimeout(() => {
    showSnackbar = false;
  }, 2500);
}
  /* ---------------- LOAD COURSE ---------------- */

  async function loadCourse() {
    if (!courseId) return;

    loading = true;

    const { data, error } = await supabase
      .from("courses")
      .select(`
        *,
        subjects (
          *,
          videos (*)
        )
      `)
      .eq("id", courseId)
      .single();

    if (error) {
      console.error(error);
      loading = false;
      return;
    }

    if (data) {
      course = data;
      subjects = data.subjects || [];

      title = course!.title || "";
      category = course!.category || "";
      duration = course!.duration || "";
      level = course!.level || "";
      description = course!.description || "";
    }

    loading = false;
  }

  onMount(loadCourse);

  /* ---------------- BANNER UPLOAD ---------------- */

  async function uploadBanner() {
    if (!imageFile || !courseId) return;

    uploadingBanner = true;

    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `course_banner/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("course-banner")
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("course-banner")
        .getPublicUrl(filePath);

      await supabase
        .from("courses")
        .update({ banner: data.publicUrl })
        .eq("id", courseId);

      if (course) course.banner = data.publicUrl;

      openSnackbar("Banner updated successfully ✅");
    } catch {
      openSnackbar("Upload failed ");
    }

    uploadingBanner = false;
  }

  /* ---------------- UPDATE COURSE ---------------- */

  async function updateCourse() {
    if (!courseId) return;

    saving = true;

    await supabase
      .from("courses")
      .update({
        title,
        category,
        duration,
        level,
        description
      })
      .eq("id", courseId);

    saving = false;
  openSnackbar("Course updated successfully ✅");
  }

  /* ---------------- UPDATE SUBJECT ---------------- */

  async function updateSubject(subject: Subject) {
    await supabase
      .from("subjects")
      .update({
        title: subject.title,
        description: subject.description
      })
      .eq("id", subject.id);

    openSnackbar("Subject updated successfully ✅");
  }

  /* ---------------- UPDATE VIDEO ---------------- */

  async function updateVideo(video: Video) {
    await supabase
      .from("videos")
      .update({
        title: video.title,
        video_url: video.video_url,
        duration: video.duration
      })
      .eq("id", video.id);

    openSnackbar("Video updated successfully ✅");
  }
</script>

<AppBar title="Edit Course" showBack={true} />

{#if loading}
  <p class="loading">Loading course...</p>
{:else}

<div class="container">

  <!-- COURSE INFO -->
  <div class="card">
    <h2>Course Info</h2>

    <!-- BANNER -->
    <div class="banner-section">

      {#if bannerPreview || course?.banner}
        <img
          src={bannerPreview || course?.banner}
          class="banner-img"
          alt="banner"
        />
      {/if}

      <input
  type="file"
  accept="image/*"
  on:change={(e) => {
    const input = e.target as HTMLInputElement;
    imageFile = input.files?.[0] ?? null;

    if (imageFile) {
      bannerPreview = URL.createObjectURL(imageFile);
    }
  }}
/>

      <button class="primary" on:click={uploadBanner}>
        {uploadingBanner ? "Uploading..." : "Upload Banner"}
      </button>

    </div>

    <input bind:value={title} placeholder="Course Title" />
    <input bind:value={category} placeholder="Category" />
    <input bind:value={duration} placeholder="Duration" />
    <input bind:value={level} placeholder="Level" />
    <textarea bind:value={description} placeholder="Description"></textarea>

    <button class="primary" on:click={updateCourse} disabled={saving}>
      {saving ? "Saving..." : "Update Course"}
    </button>
  </div>

  <!-- SUBJECTS -->
  {#each subjects as subject}
    <div class="card">

      <details class="card">
      
        <summary>{subject.title}</summary>
         
        <input bind:value={subject.title} placeholder="Subject title" />
        <input bind:value={subject.description} placeholder="Description" />

        <button class="primary" on:click={() => updateSubject(subject)}>
          Update Subject
        </button>

        <hr />

        {#each subject.videos as video}
          <div class="video">
            <input bind:value={video.title} placeholder="Video title" />
            <input bind:value={video.video_url} placeholder="Video URL" />
            <input bind:value={video.duration} placeholder="Duration" />

            <button class="primary" on:click={() => updateVideo(video)}>
              Update Video
            </button>
          </div>
        {/each}

      </details>

    </div>
  {/each}

</div>

{/if}
{#if showSnackbar}
  <div class="snackbar">
    {snackbarMessage}
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
.container{
  padding:16px;
}

/* LOADING */
.loading{
  padding:20px;
  color: var(--clr-subtext);
}

/* CARD */
.card{
  background: var(--clr-card-bg);
  padding:18px;
  border-radius:12px;
  margin-bottom:20px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 6px 18px var(--clr-accent-shadow);
  display:flex;
  flex-direction:column;
  gap:10px;
}

/* INPUT */
input, textarea{
  padding:10px;
  border-radius:8px;
  border:1px solid var(--clr-card-border);
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
}

/* PLACEHOLDER */
input::placeholder,
textarea::placeholder{
  color: var(--clr-subtext);
  opacity:1;
}

textarea{ 
  min-height:80px; 
}

/* FOCUS */
input:focus,
textarea:focus{
  outline:none;
  border-color: var(--clr-accent);
  box-shadow: 0 0 0 2px var(--clr-accent-shadow);
}

/* CURSOR */
input, textarea{
  caret-color: var(--clr-accent);
}

/* BUTTON */
.primary{
  background: var(--grad);
  color:white;
  border:none;
  padding:10px;
  border-radius:8px;
  cursor:pointer;
  box-shadow:0 6px 18px var(--clr-accent-shadow2);
}
h2 {
  color: var(--clr-heading);
  font-weight: 700;
  margin-bottom: 8px;
} 
/* VIDEO */
.video{
  background: var(--clr-tab-idle-bg);
  padding:16px;
  border-radius:8px;
  margin-top:10px;
  display:flex;
  flex-direction:column;
  gap:8px;
}

/* DETAILS SUMMARY */
details summary{
  color: var(--clr-heading);
  cursor:pointer;
}

/* BANNER */
.banner-section{
  display:flex;
  flex-direction:column;
  gap:10px;
  margin-bottom:12px;
}

.banner-img{
  width:100%;
  max-width:420px;
  height:220px;
  object-fit:cover;
  border-radius:12px;
  border:1px solid var(--clr-card-border);
}

/* SNACKBAR */
.snackbar{
  position:fixed;
  bottom:24px;
  left:50%;
  transform:translateX(-50%);
  background: var(--clr-accent);
  color:white;
  padding:12px 18px;
  border-radius:8px;
  font-size:14px;
  box-shadow:0 8px 22px var(--clr-accent-shadow2);
  animation:slideUp .25s ease;
  z-index:9999;
}

@keyframes slideUp{
  from{
    transform:translate(-50%,20px);
    opacity:0;
  }
  to{
    transform:translate(-50%,0);
    opacity:1;
  }
}

</style>