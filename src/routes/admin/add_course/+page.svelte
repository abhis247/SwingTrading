<script lang="ts">
  import { supabase } from "$lib/supabase";
  import { auth } from "$lib/firebase";
  import { onMount } from "svelte";
  import AppBar from "$lib/AppBar1.svelte";
    import { snackbar } from "$lib/snackbar";
    import { goto } from "$app/navigation";

  let user: any = null;
  let loading = false;

  // course fields
  let title = "";
  let category = "";
  let duration = "";
  let level = "";
  let description = "";

  let price = 0;

  let bannerFile: File | null = null;
  let bannerPreview = "";

  let categories = [
    "Foundation",
    "Intermediate",
    "Advanced",
    "Webinars",
  ];

  // subjects
  let subjects: any[] = [];

  onMount(() => {
    auth.onAuthStateChanged((u) => (user = u));
  });

  // banner pick
  function pickBanner(e: any) {
    const file = e.target.files[0];
    bannerFile = file;
    bannerPreview = URL.createObjectURL(file);
  }

  async function uploadBanner(file: File) {
    const fileName = Date.now() + ".jpg";
    const filePath = `course_banner/${fileName}`;

    const { error } = await supabase.storage
      .from("course-banner")
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("course-banner")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  function addSubject() {
    subjects = [
      ...subjects,
      {
        title: "",
        description: "",
        mentor: "",
        isPreview: false,
        videos: [],
      },
    ];
  }

  function deleteSubject(index: number) {
    subjects.splice(index, 1);
    subjects = [...subjects];
  }

  function addVideo(i: number) {
    subjects[i].videos.push({
      title: "",
      url: "",
      duration: "",
      description: "",
    });
    subjects = [...subjects];
  }

  function deleteVideo(subjectIndex: number, videoIndex: number) {
    subjects[subjectIndex].videos.splice(videoIndex, 1);
    subjects = [...subjects];
  }

  async function submit() {
    if (!user) return alert("Login required");
    if (!bannerFile) return alert("Banner required");

    loading = true;

    try {
      const banner = await uploadBanner(bannerFile);

      const { data: course } = await supabase
        .from("courses")
        .insert({
          title,
          category,
          description,
          duration,
          level,
          banner: banner,
          mentor_id: user.uid,
          price: price,
        })
        .select()
        .single();

      for (const s of subjects) {
        const { data: subject } = await supabase
          .from("subjects")
          .insert({
            course_id: course.id,
            title: s.title,
            description: s.description,
            mentor: s.mentor,
            is_preview: s.isPreview,
          })
          .select()
          .single();

        for (const v of s.videos) {
          await supabase.from("videos").insert({
            subject_id: subject.id,
            title: v.title,
            video_url: v.url,
            duration: v.duration,
          });
        }
      }

      snackbar.show("Course created successfully 🚀");
      setTimeout(() => {
  goto("/admin/dashboard");
}, 1200);
    } catch (e) {
      console.error(e);
      alert("Error creating course");
    }

    loading = false;
  }
</script>
<AppBar title="Add course" showBack={true} />
<div class="form">

  <!-- BANNER TOP -->
  <div class="card banner-card">
    <h3>Course Banner</h3>

    <label class="banner-upload">
      <input type="file" on:change={pickBanner} hidden />

      {#if bannerPreview}
        <img alt="banner" src={bannerPreview} />
      {:else}
        <div class="banner-placeholder">📷 Upload Banner</div>
      {/if}
    </label>
  </div>

  <!-- COURSE DETAILS -->
  <div class="card">
    <h3>Course Details</h3>

    <input placeholder="Course title" bind:value={title} />

    <select bind:value={category}>
      <option value="">Select category</option>
      {#each categories as c}
        <option value={c}>{c}</option>
      {/each}
    </select>

    <div class="column">
      <input placeholder="Duration" bind:value={duration} />
      <input placeholder="Level" bind:value={level} />
      <input placeholder="Price ($)"  bind:value={price}  type="number" 
/>
    </div>

    <textarea placeholder="Description" bind:value={description}></textarea>
  </div>

  <!-- SUBJECTS -->
  <div class="card">
    <div class="section-header">
      <h3>Subjects</h3>
      <button class="add-btn" on:click={addSubject}>+ Add Subject</button>
    </div>

    {#each subjects as s, i}
      <div class="subject">

        <div class="subject-head">
          <h4>Subject {i + 1}</h4>
          <button class="delete-btn" on:click={() => deleteSubject(i)}>Delete</button>
        </div>

        <input placeholder="Subject title" bind:value={s.title} />
        <input placeholder="Description" bind:value={s.description} />
        <input placeholder="Mentor" bind:value={s.mentor} />

        <label class="preview">
          <input type="checkbox" bind:checked={s.isPreview} />
          Free Preview
        </label>

        <div class="videos-section">
          <div class="section-header">
            <h5>Videos</h5>
            <button class="add-btn" on:click={() => addVideo(i)}>+ Add Video</button>
          </div>

          {#each s.videos as v, vi}
            <div class="video">
              <div class="video-head">
                <span>Video {vi + 1}</span>
                <button class="delete-btn" on:click={() => deleteVideo(i, vi)}>Delete</button>
              </div>

              <input placeholder="Video title" bind:value={v.title} />
              <input placeholder="Video URL" bind:value={v.url} />
              <input placeholder="Duration" bind:value={v.duration} />
              <textarea placeholder="Description" bind:value={v.description} ></textarea>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <!-- SUBMIT -->
  <button class="submit" on:click={submit} disabled={loading}>
    {loading ? "Saving..." : "🚀 Save Course"}
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
  background: var(--clr-page-bg);
}

/* FORM */
.form{
  max-width:900px;
  margin:auto;
  display:flex;
  flex-direction:column;
  gap:20px;
}

/* CARD */
.card{
  background: var(--clr-card-bg);
  padding:18px;
  border-radius:14px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 6px 18px var(--clr-accent-shadow);
  display:flex;
  flex-direction:column;
  gap:12px;
}

/* INPUT */
input,textarea,select{
  padding:12px;
  border-radius:10px;
  border:1px solid var(--clr-card-border);
  font-size:14px;
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
}

textarea{
  min-height:80px;
}

/* COLUMN */
.column{
  display:flex;
  flex-direction:column;
  gap:12px;
}

/* BANNER */
.banner-card img{
  width:100%;
  height:220px;
  object-fit:cover;
  border-radius:12px;
}

.banner-placeholder{
  height:200px;
  background: var(--clr-tab-idle-bg);
  border-radius:12px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:16px;
  color: var(--clr-subtext);
}

/* SUBJECT */
.subject{
  background: var(--clr-card-bg);
  padding:14px;
  border-radius:12px;
  border:1px solid var(--clr-card-border);
  display:flex;
  flex-direction:column;
  gap:10px;
}

.subject-head{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

/* VIDEO */
.video{
  background: var(--clr-tab-idle-bg);
  padding:12px;
  border-radius:10px;
  box-shadow:0 4px 10px var(--clr-accent-shadow);
  display:flex;
  flex-direction:column;
  gap:8px;
}

.video-head{
  display:flex;
  justify-content:space-between;
}

/* HEADERS */
.section-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

/* BUTTONS */
.add-btn{
  background: var(--clr-accent);
  color:#fff;
  border:none;
  padding:8px 14px;
  border-radius:8px;
  font-size:13px;
  cursor:pointer;
}

.delete-btn{
  background:#e53935; /* no root */
  color:#fff;
  border:none;
  padding:6px 12px;
  border-radius:6px;
  font-size:12px;
  cursor:pointer;
}

.preview{
  display:flex;
  gap:8px;
  align-items:center;
  font-size:13px;
  color: var(--clr-subtext);
}

/* SUBMIT */
.submit{
  background: var(--grad);
  color:#fff;
  padding:16px;
  border:none;
  border-radius:12px;
  font-size:16px;
  font-weight:700;
  cursor:pointer;
  box-shadow:0 6px 18px var(--clr-accent-shadow2);
}
/* ===== TEXT VISIBILITY FIX ===== */

/* placeholder */
input::placeholder,
textarea::placeholder {
  color: var(--clr-subtext);
  opacity: 1;
}

/* select text */
select {
  color: var(--clr-heading);
}

/* headings */
h3, h4, h5 {
  color: var(--clr-heading);
}

/* checkbox label */
.preview {
  color: var(--clr-heading);
}

/* focus state */
input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--clr-accent);
}

/* cursor color */
input, textarea {
  caret-color: var(--clr-accent);
}
</style>