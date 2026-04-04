<script lang="ts">
  import { supabase } from "$lib/supabase";
  import AppBar from "$lib/AppBar1.svelte";
  import { onMount, onDestroy } from "svelte";
    import { goto } from "$app/navigation";

  let courses: any[] = [];
  let filteredCourses: any[] = [];
  let loading = true;
  let confirmId: string | null = null;
  let search = "";

  /* ---------------- LOAD COURSES ---------------- */

  async function loadCourses() {
    const { data } = await supabase
      .from("courses")
      .select(`
        id,
        title,
        description,
        banner,
        subjects (
          id,
          title,
          videos (
            id,
            title,
            duration
          )
        )
      `);

    courses = (data || []).map(c => ({ ...c, showMenu: false }));
    filteredCourses = courses;
    loading = false;
  }

  /* ---------------- SEARCH ---------------- */

  function searchCourses(value: string) {
    search = value;

    filteredCourses = courses.filter(c => {
      const title = c.title?.toLowerCase() || "";
      const desc = c.description?.toLowerCase() || "";

      return (
        title.includes(value.toLowerCase()) ||
        desc.includes(value.toLowerCase())
      );
    });
  }

  /* ---------------- MENU ---------------- */

  function toggleMenu(id: string) {
    courses = courses.map(c => ({
      ...c,
      showMenu: c.id === id ? !c.showMenu : false
    }));
    filteredCourses = [...courses];
  }

  function closeMenus() {
    courses = courses.map(c => ({ ...c, showMenu: false }));
    filteredCourses = [...courses];
  }

  function handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".actions")) {
      closeMenus();
    }
  }
onMount(() => {
  loadCourses();

  if (typeof document !== "undefined") {
    document.addEventListener("click", handleOutsideClick);
  }

  return () => {
    if (typeof document !== "undefined") {
      document.removeEventListener("click", handleOutsideClick);
    }
  };
});
  /* ---------------- DELETE COURSE ---------------- */

  async function deleteCourse(id: string) {
    await supabase.from("courses").delete().eq("id", id);
    courses = courses.filter(c => c.id !== id);
    filteredCourses = [...courses];
    confirmId = null;
  }
</script>

<AppBar title="Manage Courses" showBack={true} />

<!-- SEARCH -->
<div class="search-wrapper">
  <input
    class="search"
    placeholder="Search courses..."
    bind:value={search}
    on:input={() => searchCourses(search)}
  />
</div>

{#if loading}
  <p>Loading...</p>

{:else if filteredCourses.length === 0}
  <p>No courses found</p>

{:else}

  {#each filteredCourses as course}
    <div class="course-card">

      <div class="course-header">

        {#if course.banner}
          <img src={course.banner} alt="course banner" />
        {:else}
          <div class="placeholder">📘</div>
        {/if}

        <div class="info">
          <h3>{course.title}</h3>
          <p>{course.description}</p>
        </div>

        <!-- POPUP MENU -->
        <div class="actions">
          <button
            class="menu-btn"
            on:click|stopPropagation={() => toggleMenu(course.id)}
          >
            ⋮
          </button>

          {#if course.showMenu}
           <div
  class="menu-dropdown"
  role="menu"
  tabindex="-1"
  on:click|stopPropagation
  on:keydown={(e) => {
    if (e.key === "Escape") closeMenus();
  }}
>

  <button
    type="button"
    role="menuitem"
    on:click={() => {
      closeMenus();
      goto(`/admin/edit_course/${course.id}`);
    }}
  >
    ✏️ Edit
  </button>

  <button
    type="button"
    role="menuitem"
    on:click={() => {
      confirmId = course.id;
      closeMenus();
    }}
  >
    🗑 Delete
  </button>

</div>
          {/if}
        </div>

      </div>

      <!-- SUBJECTS -->
      {#if course.subjects?.length}
        {#each course.subjects as subject}
          <details class="subject">
            <summary>{subject.title}</summary>

            {#if subject.videos?.length}
              {#each subject.videos as video}
                <div class="video">
                  ▶ {video.title} ({video.duration})
                </div>
              {/each}
            {:else}
              <p>No videos</p>
            {/if}
          </details>
        {/each}
      {:else}
        <p class="empty">No subjects added</p>
      {/if}

    </div>
  {/each}

{/if}

<!-- DELETE MODAL -->
{#if confirmId}
  <div
    class="overlay"
    role="button"
    tabindex="0"
    aria-label="Close delete dialog"
    on:click={() => confirmId = null}
    on:keydown={(e) => {
      if (e.key === "Enter" || e.key === " ") confirmId = null;
    }}
  >

    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deleteTitle"
      tabindex="0"
      on:click|stopPropagation
      on:keydown={(e) => {
        if (e.key === "Escape") confirmId = null;
      }}
    >
      <h3 id="deleteTitle">Delete Course?</h3>
      <p>This will permanently delete course, subjects & videos.</p>

      <div class="dialog-actions">
        <button on:click={() => confirmId = null}>
          Cancel
        </button>

        <button
          class="delete"
          on:click={() => confirmId && deleteCourse(confirmId)}
        >
          Delete
        </button>
      </div>
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

/* SEARCH */
.search-wrapper{
  margin:16px 0;
  display:flex;
  justify-content:center;
}

.search{
  width:88%;
  padding:12px;
  border-radius:10px;
  border:1px solid var(--clr-card-border);
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
}

/* placeholder */
.search::placeholder{
  color: var(--clr-subtext);
}

/* COURSE CARD */
.course-card{
  background: var(--clr-card-bg);
  padding:18px;
  border-radius:14px;
  margin-bottom:20px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 6px 18px var(--clr-accent-shadow);
  display:flex;
  flex-direction:column;
  min-height:170px;
}

/* HEADER */
.course-header{
  display:flex;
  gap:16px;
  align-items:center;
}

/* IMAGE */
.course-header img{
  width:70px;
  height:70px;
  border-radius:10px;
  object-fit:cover;
}

/* PLACEHOLDER */
.placeholder{
  width:70px;
  height:70px;
  display:flex;
  align-items:center;
  justify-content:center;
  background: var(--clr-tab-idle-bg);
  border-radius:10px;
  font-size:30px;
}

/* INFO */
.info{
  flex:1;
}

.info h3{
  color: var(--clr-heading);
}

.info p{
  color: var(--clr-subtext);
}

/* ACTIONS */
.actions{
  position:relative;
}

/* MENU BUTTON */
.menu-btn{
  background: var(--clr-accent);
  color:white;
  border:none;
  padding:6px 10px;
  border-radius:6px;
  cursor:pointer;
}

/* DROPDOWN */
.menu-dropdown{
  position:absolute;
  right:0;
  top:36px;
  background: var(--clr-card-bg);
  border-radius:10px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 6px 18px var(--clr-accent-shadow);
  min-width:140px;
  z-index:50;
  overflow:hidden;
}

/* DROPDOWN ITEMS */
.menu-dropdown button{
  width:100%;
  padding:10px 14px;
  border:none;
  background:none;
  text-align:left;
  cursor:pointer;
  color: var(--clr-heading);
}

.menu-dropdown button:hover{
  background: var(--clr-tab-idle-bg);
}

/* SUBJECT */
.subject{
  margin-top:10px;
  padding:10px;
  background: var(--clr-tab-idle-bg);
  border-radius:8px;
  color: var(--clr-heading);
}

/* VIDEO */
.video{
  padding-left:15px;
  margin-top:6px;
  color: var(--clr-subtext);
}

/* EMPTY */
.empty{
  color: var(--clr-subtext);
  margin-top:10px;
}

/* OVERLAY */
.overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.4);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:1000;
}

/* DIALOG */
.dialog{
  background: var(--clr-card-bg);
  padding:12px;
  border-radius:12px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 10px 30px var(--clr-accent-shadow);
  width:clamp(260px, 80vw, 340px);
  display:flex;
  flex-direction:column;
  gap:8px;
}

.dialog h3{
  color: var(--clr-heading);
}

.dialog p{
  color: var(--clr-subtext);
}

/* DIALOG BUTTONS */
.dialog-actions{
  display:flex;
  justify-content:flex-end;
  gap:10px;
  margin-top:15px;
}

.dialog-actions button{
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
  border:none;
  padding:6px 10px;
  border-radius:6px;
}

.dialog .delete{
  background:#e53935; /* keep */
  color:white;
}
</style>