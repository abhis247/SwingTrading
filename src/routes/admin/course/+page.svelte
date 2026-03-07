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
.search-wrapper{
  margin:16px 0;
}

.search{
  width:88%;
  padding:12px;
  border-radius:10px;
  border:1px solid #ddd;
}

.course-card{
  background:white;
  padding:18px;
  border-radius:14px;
  margin-bottom:20px;
  box-shadow:0 6px 18px rgba(0,0,0,.08);
  display:flex;
  flex-direction:column;
  min-height:170px;
}

.course-header{
  display:flex;
  gap:16px;
  align-items:center;
}

.course-header img{
  width:70px;
  height:70px;
  border-radius:10px;
  object-fit:cover;
}

.placeholder{
  width:70px;
  height:70px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#eee;
  border-radius:10px;
  font-size:30px;
}

.info{
  flex:1;
}

.actions{
  position:relative;
}

.menu-btn{
  background:#1b8e5a;
  color:white;
  border:none;
  padding:6px 10px;
  border-radius:6px;
  cursor:pointer;
}

.menu-dropdown{
  position:absolute;
  right:0;
  top:36px;
  background:white;
  border-radius:10px;
  box-shadow:0 6px 18px rgba(0,0,0,.15);
  min-width:140px;
  z-index:50;
  overflow:hidden;
}

.menu-dropdown button,
.menu-dropdown button{
  width:100%;
  padding:10px 14px;
  border:none;
  background:none;
  text-align:left;
  cursor:pointer;
  display:block;
}

.menu-dropdown button{
  text-decoration:none;
  color:#343333;
}

.menu-dropdown button{
  color:#151615;
}

.menu-dropdown button:hover,
.menu-dropdown button:hover{
  background:#f5f5f5;
}

.subject{
  margin-top:10px;
  padding:10px;
  background:#f7f9fc;
  border-radius:8px;
}

.video{
  padding-left:15px;
  margin-top:6px;
}

.empty{
  color:#777;
  margin-top:10px;
}

.overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.4);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:1000;
}
.dialog{
  background:white;
  padding:12px;
  border-radius:12px;

  width:clamp(260px, 80vw, 340px);  /* always smaller than screen */
  
  display:flex;
  flex-direction:column;
  gap:8px;
}
.dialog-actions{
  display:flex;
  justify-content:flex-end;
  gap:10px;
  margin-top:15px;
}

.dialog .delete{
    
  background:#e53935;
  color:white;
  border:none;
  padding:6px 10px;
  border-radius:6px;
}
</style>