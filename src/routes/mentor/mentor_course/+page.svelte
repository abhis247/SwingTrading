<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { auth } from "$lib/firebase";
  import { supabase } from "$lib/supabase";
  import AppBar from "$lib/AppBar1.svelte";

  let courses: any[] = [];
  let loading = true;
  let deleteId: string | null = null;
  let search = "";
  let openMenuId: string | null = null;

  /* ================= FILTER ================= */

  $: filteredCourses =
    search.trim() === ""
      ? courses
      : courses.filter((course) => {
          const title = course.title?.toLowerCase() ?? "";
          const description = course.description?.toLowerCase() ?? "";
          const level = course.level?.toLowerCase() ?? "";

          return (
            title.includes(search.toLowerCase()) ||
            description.includes(search.toLowerCase()) ||
            level.includes(search.toLowerCase())
          );
        });

  /* ================= LOAD ================= */

  onMount(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (mentor) => {
      if (!mentor) {
        goto("/auth/login");
        return;
      }
      await fetchCourses(mentor.uid);
    });

    const handleClick = () => (openMenuId = null);
    document.addEventListener("click", handleClick);

    return () => {
      unsubscribeAuth();
      document.removeEventListener("click", handleClick);
    };
  });

  async function fetchCourses(mentorId: string) {
    try {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("mentor_id", mentorId)
        .order("created_at", { ascending: false });

      courses = data ?? [];
      loading = false;
    } catch (e) {
      console.error("Course load error:", e);
      loading = false;
    }
  }

  /* ================= MENU ================= */

  function toggleMenu(id: string) {
    openMenuId = openMenuId === id ? null : id;
  }

  /* ================= DELETE ================= */

  async function deleteCourse(id: string) {
    await supabase.from("courses").delete().eq("id", id);
    deleteId = null;
    courses = courses.filter((c) => c.id !== id);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }
</script>

<AppBar title="My Courses" showBack={true} />

<div class="page">

  <!-- SEARCH -->
  <div class="search-box">
    <input
      type="text"
      placeholder="Search courses..."
      bind:value={search}
    />
  </div>

  {#if loading}
    <div class="center">Loading courses...</div>

  {:else if filteredCourses.length === 0}
    <div class="center">No courses found</div>

  {:else}
    <div class="list">
      {#each filteredCourses as course}
        <div class="card">

          <!-- IMAGE -->
          <div class="image">
            {#if course.banner}
              <img src={course.banner} alt="banner" />
            {:else}
              📚
            {/if}
          </div>

          <!-- CONTENT -->
          <div class="content">
            <div class="title">{course.title ?? "Course"}</div>

            <div class="description">
              {course.description ?? ""}
            </div>

            <div class="badges">
              <span>{course.duration || "Duration N/A"}</span>
              <span>{course.level || "Beginner"}</span>
              <span>₹ {course.price ?? "Free"}</span>
              <span>{course.students_count ?? 0} Students</span>
            </div>

            <div class="created">
              Created: {course.created_at ? formatDate(course.created_at) : ""}
            </div>
          </div>
<!-- MENU -->
<div class="menu-wrapper">
  <button
    type="button"
    class="menu-btn"
    on:click|stopPropagation={() => toggleMenu(course.id)}
  >
    ⋮
  </button>

  {#if openMenuId === course.id}
    <div class="popup-menu">
      <button
        type="button"
        on:click={() => {
          goto(`/admin/edit_course/${course.id}`);
          openMenuId = null;
        }}
      >
        ✏ Edit
      </button>

      <button
        type="button"
        class="delete-item"
        on:click={() => {
          deleteId = course.id;
          openMenuId = null;
        }}
      >
        🗑 Delete
      </button>
    </div>
  {/if}
</div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- DELETE DIALOG -->
{#if deleteId}
  <div class="overlay">
    <button
    title="button"
      class="overlay-bg"
      type="button"
      on:click={() => deleteId = null}
    ></button>

    <div class="dialog">
      <h3>Delete Course?</h3>
      <p>This action cannot be undone.</p>

      <div class="dialog-actions">
        <button type="button" on:click={() => deleteId = null}>
          Cancel
        </button>

        <button
          type="button"
          class="danger"
          on:click={() => deleteCourse(deleteId!)}
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
* {
  box-sizing: border-box;
}

:global(body){
  margin:0;
  background: var(--clr-page-bg);
  font-family: system-ui;
  color: var(--clr-heading);
}

* {
  box-sizing: border-box;
}

.page {
  padding: 20px;
  background: var(--clr-page-bg);
  min-height: 100vh;
}

/* ================= SEARCH ================= */

.search-box {
  margin-bottom: 22px;
  display: flex;
  justify-content: center;
}

.search-box input {
  width: 100%;
  max-width: 420px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--clr-card-border);
  font-size: 14px;
  background: var(--clr-view-btn-bg);
  color: var(--clr-heading);
  transition: 0.2s ease;
}

.search-box input::placeholder {
  color: var(--clr-subtext);
}

.search-box input:focus {
  outline: none;
  border-color: var(--clr-accent);
  box-shadow: 0 0 0 3px var(--clr-accent-shadow);
}

/* ================= LIST ================= */

.list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ================= CARD ================= */

.card {
  background: var(--clr-card-bg);
  border: 1px solid var(--clr-card-border);
  border-radius: 18px;
  padding: 16px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  box-shadow: 0 6px 18px var(--clr-accent-shadow);
  position: relative;
  transition: 0.25s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 34px var(--clr-accent-shadow2);
}

/* ================= IMAGE ================= */

.image {
  width: 110px;
  height: 85px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--clr-icon-bg);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: var(--clr-accent);
}

.image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ================= CONTENT ================= */

.content {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: 17px;
  font-weight: 700;
  color: var(--clr-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.description {
  font-size: 13px;
  color: var(--clr-subtext);
  margin-top: 6px;
  line-height: 1.5;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.badges span {
  background: var(--clr-tab-idle-bg);
  color: var(--clr-accent);
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 20px;
  max-width: 100%;
  word-break: break-word;
}

.created {
  font-size: 11px;
  color: var(--clr-subtext);
  margin-top: 8px;
}

/* ================= MENU ================= */

.menu-wrapper {
  position: absolute;
  top: 10px;
  right: 10px;
}

.menu-btn {
  border: none;
  background: var(--clr-view-btn-bg);
  color: var(--clr-accent);
  font-size: 16px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  transition: 0.2s ease;
}

.menu-btn:hover {
  background: var(--clr-accent);
  color: #000;
}

.popup-menu {
  position: absolute;
  right: 0;
  top: 36px;
  background: var(--clr-card-bg);
  border: 1px solid var(--clr-card-border);
  border-radius: 10px;
  box-shadow: 0 10px 24px var(--clr-accent-shadow);
  min-width: 150px;
  padding: 6px 0;
  z-index: 100;
}

.popup-menu button {
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--clr-heading);
}

.popup-menu button:hover {
  background: var(--clr-view-btn-hover);
}

.delete-item {
  color: #ff6b6b;
}

/* ================= DIALOG ================= */

.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-bg {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.6);
  border: none;
}

.dialog {
  background: var(--clr-card-bg);
  border: 1px solid var(--clr-card-border);
  padding: 22px;
  border-radius: 14px;
  width: 320px;
  z-index: 1000;
  text-align: center;
  color: var(--clr-heading);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.dialog button {
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: var(--clr-view-btn-bg);
  color: var(--clr-heading);
}

.dialog button:hover {
  background: var(--clr-view-btn-hover);
}

.danger {
  background: #ff4d4f;
  color: white;
}

/* ================= MOBILE ================= */

@media (max-width: 768px) {

  .page {
    padding: 14px;
  }

  .card {
    flex-direction: row;
    gap: 12px;
  }

  .image {
    width: 95px;
    height: 75px;
  }

  .title {
    font-size: 15px;
  }

}
</style>