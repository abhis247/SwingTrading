<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { auth } from "$lib/firebase";
  import { supabase } from "$lib/supabase";
  import AppBar from "$lib/AppBar1.svelte";
   import { snackbar } from "$lib/snackbar";

  let loading = false;
  let user: any = null;

  let error = "";
  let success = "";

  // Basic fields
  let title = "";
  let category = "";
  let duration = "";
  let level = "";
  let description = "";
  let bannerFile: File | null = null;
  let bannerPreview = "";

  let subjects: any[] = [];

  /* ================= AUTO CLEAR ERROR ================= */

$: if (error && (title || category || duration || level || description || bannerFile)) {
  error = "";
}
  const categories = [
    "Software Training",
    "Design Development",
    "Project Management",
    "Specialization Training"
  ];

  onMount(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) goto("/auth/login");
      user = u;
    });
    return unsub;
  });

  /* ================= BANNER ================= */

  function handleBannerChange(e: Event) {
    const input = e.target as HTMLInputElement;
    bannerFile = input.files?.[0] ?? null;

    if (bannerFile) {
      bannerPreview = URL.createObjectURL(bannerFile);
    }
  }

  async function uploadBanner(file: File) {
    const fileName = `course_${Date.now()}.jpg`;
    const path = `course_banner/${fileName}`;

    await supabase.storage
      .from("course-banner")
      .upload(path, file, { upsert: true });

    return supabase.storage
      .from("course-banner")
      .getPublicUrl(path).data.publicUrl;
  }

  /* ================= SUBJECT ================= */

  function addSubject() {
    subjects = [
      ...subjects,
      { title: "", description: "", isPreview: false, videos: [] }
    ];
  }

  function removeSubject(index: number) {
    subjects.splice(index, 1);
    subjects = [...subjects];
  }

  function addVideo(subjectIndex: number) {
    subjects[subjectIndex].videos.push({
      title: "",
      url: "",
      duration: ""
    });
    subjects = [...subjects];
  }

  function removeVideo(subjectIndex: number, videoIndex: number) {
    subjects[subjectIndex].videos.splice(videoIndex, 1);
    subjects = [...subjects];
  }

  /* ================= SUBMIT ================= */

  async function submit() {
    error = "";
    success = "";

    if (!title || !category || !bannerFile) {
      error = "Please fill all required fields.";
      return;
    }

    loading = true;

    try {
      const bannerUrl = await uploadBanner(bannerFile);

      const { data: course } = await supabase
        .from("courses")
        .insert({
          title,
          category,
          duration,
          level,
          description,
          banner: bannerUrl,
          mentor_id: user.uid
        })
        .select()
        .single();

      const courseId = course.id;

      for (const subject of subjects) {
        const { data: subjectRow } = await supabase
          .from("subjects")
          .insert({
            course_id: courseId,
            title: subject.title,
            description: subject.description,
            is_preview: subject.isPreview
          })
          .select()
          .single();

        for (const video of subject.videos) {
          await supabase.from("videos").insert({
            subject_id: subjectRow.id,
            title: video.title,
            video_url: video.url,
            duration: video.duration
          });
        }
      }

     snackbar.show("Course created successfully 🎉");
      setTimeout(() => goto("/mentor/mentor_course"), 1200);

    } catch (e) {
      console.error(e);
      snackbar.show("Failed to create course");
    }

    loading = false;
  }
</script>

<AppBar title="Create Course" showBack={true} />

<div class="page">

  {#if error}
    <div class="alert error">{error}</div>
  {/if}

  {#if success}
    <div class="alert success">{success}</div>
  {/if}

  <!-- BASIC INFO -->
  <div class="card">
    <h2>Basic Information</h2>
    
    <div class="banner-upload">
      <label>Upload Banner *</label>
      <input type="file" accept="image/*" on:change={handleBannerChange} />

      {#if bannerPreview}
        <img src={bannerPreview} class="banner-preview" alt="preview" />
      {/if}
    </div>

    <input placeholder="Course Title *" bind:value={title} />

    <select bind:value={category}>
      <option value="">Select Category *</option>
      {#each categories as c}
        <option value={c}>{c}</option>
      {/each}
    </select>

    <input placeholder="Duration (10 hours)" bind:value={duration} />
    <input placeholder="Level (Beginner/Advanced)" bind:value={level} />

    <textarea placeholder="Description" bind:value={description}></textarea>

  </div>

  <!-- SUBJECTS -->
  <div class="card">
    <div class="section-header">
      <h2>Subjects</h2>
      <button class="add-btn" on:click={addSubject}>+ Add Subject</button>
    </div>

    {#each subjects as subject, i}
      <div class="subject">

        <div class="subject-header">
          <h3>Subject {i + 1}</h3>
          <button class="remove-btn" on:click={() => removeSubject(i)}>✖</button>
        </div>

        <input placeholder="Subject Title" bind:value={subject.title} />
        <textarea placeholder="Description" bind:value={subject.description}></textarea>

     <div class="preview-toggle">
  <label class="preview-label">
    <input
      type="checkbox"
      bind:checked={subject.isPreview}
    />
    <span>Free Preview</span>
  </label>
</div>
        <div class="videos">
          <button class="add-video" on:click={() => addVideo(i)}>
            + Add Video
          </button>

          {#each subject.videos as video, v}
            <div class="video">
              <input placeholder="Video Title" bind:value={video.title} />
              <input placeholder="Video URL" bind:value={video.url} />
              <input placeholder="Duration" bind:value={video.duration} />
              <button
                class="remove-video"
                on:click={() => removeVideo(i, v)}
              >
                Remove
              </button>
            </div>
          {/each}
        </div>

      </div>
    {/each}
  </div>

  <button class="submit-btn" on:click={submit} disabled={loading}>
    {loading ? "Saving Course..." : "Save Course"}
  </button>

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
:global(body){
  margin:0;
  background: var(--clr-page-bg);
  font-family: system-ui;
  color: var(--clr-heading);
}

.page {
  max-width: 900px;
  margin: auto;
  padding: 30px 20px;
}

/* ================= CARD ================= */
.card {
  background: var(--clr-card-bg);
  padding: 24px;
  border-radius: 18px;
  margin-bottom: 24px;
  border: 1px solid var(--clr-card-border);
  box-shadow: 0 6px 20px var(--clr-accent-shadow);
}

/* ================= HEADER ================= */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ================= INPUT ================= */
input, select, textarea {
  width: 100%;
  padding: 12px;
  margin-top: 12px;
  border-radius: 10px;
  border: 1px solid var(--clr-card-border);
  font-size: 14px;
  background: var(--clr-view-btn-bg);
  color: var(--clr-heading);
}

input::placeholder,
textarea::placeholder {
  color: var(--clr-subtext);
}

textarea {
  min-height: 90px;
}

/* ================= BANNER ================= */
.banner-preview {
  margin-top: 12px;
  width: 100%;
  border-radius: 12px;
}

/* ================= SUBJECT ================= */
.subject {
  margin-top: 20px;
  padding: 18px;
  background: var(--clr-view-btn-bg);
  border-radius: 14px;
  border: 1px solid var(--clr-card-border);
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ================= VIDEO ================= */
.video {
  margin-top: 12px;
  padding: 12px;
  background: var(--clr-card-bg);
  border-radius: 10px;
  border: 1px solid var(--clr-card-border);
}

/* ================= BUTTON ================= */
.add-btn,
.add-video {
  background: var(--grad);
  color: var(--clr-heading);
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: .2s;
}

.add-btn:hover,
.add-video:hover {
  opacity: .9;
}

/* REMOVE */
.remove-btn,
.remove-video {
  background: none;
  border: none;
  color: #ff4d4d;
  cursor: pointer;
}

/* ================= SUBMIT ================= */
.submit-btn {
  width: 100%;
  padding: 16px;
  background: var(--grad);
  color: var(--clr-heading);
  border: none;
  border-radius: 12px;
  font-weight: bold;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 6px 16px var(--clr-accent-shadow);
}

.submit-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

/* ================= ALERT ================= */
.alert {
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.alert.error {
  background: rgba(255,77,77,.15);
  color: #ff4d4d;
}

.alert.success {
  background: rgba(0,255,157,.15);
  color: #00ff9d;
}

/* ================= PREVIEW ================= */
.preview-toggle {
  margin-top: 14px;
}

.preview-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.preview-label input {
  width: 16px;
  height: 16px;
  accent-color: var(--clr-accent);
}

.preview-label span {
  color: var(--clr-heading);
}
</style>