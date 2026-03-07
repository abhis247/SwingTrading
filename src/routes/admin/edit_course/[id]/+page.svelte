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
.container{
  padding:16px;
}

.loading{
  padding:20px;
}

.card{
  background:white;
  padding:18px;
  border-radius:12px;
  margin-bottom:20px;
  box-shadow:0 6px 18px rgba(0,0,0,.08);
  display:flex;
  flex-direction:column;
  gap:10px;
}

input, textarea{
  padding:10px;
  border-radius:8px;
  border:1px solid #ddd;
}

textarea{ min-height:80px; }

.primary{
  background:#1b8e5a;
  color:white;
  border:none;
  padding:10px;
  border-radius:8px;
  cursor:pointer;
}

.video{
  background:#f7f9fc;
  padding:16px;
  border-radius:8px;
  margin-top:10px;
  display:flex;
  flex-direction:column;
  gap:8px;
}

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
  border:1px solid #ddd;
}


.snackbar{
  position:fixed;
  bottom:24px;
  left:50%;
  transform:translateX(-50%);
  background:#1b8e5a;
  color:white;
  padding:12px 18px;
  border-radius:8px;
  font-size:14px;
  box-shadow:0 8px 22px rgba(0,0,0,.25);
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