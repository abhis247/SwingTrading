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
* {
  box-sizing: border-box;
}

.page {
  padding: 20px;
  background: #f5f7fb;
  min-height: 100vh;
}

/* ================= SEARCH ================= */

.search-box {
  margin-bottom: 22px;
  display: flex;
  justify-content: center;
}

.search-box input {
  width: 100%;               /* 🔥 FIXED */
  max-width: 420px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #ddd;
  font-size: 14px;
  transition: 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #1fae4b;
  box-shadow: 0 0 0 3px rgba(31,174,75,.1);
}

/* ================= LIST ================= */

.list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ================= CARD ================= */

.card {
  background: white;
  border-radius: 18px;
  padding: 16px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  box-shadow: 0 6px 18px rgba(0,0,0,.08);
  position: relative;
  transition: 0.2s ease;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 26px rgba(0,0,0,.12);
}

/* ================= IMAGE (LEFT ALWAYS) ================= */

.image {
  width: 110px;
  height: 85px;
  border-radius: 12px;
  overflow: hidden;
  background: #e0f2e9;
  flex-shrink: 0;            /* 🔥 IMPORTANT */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ================= CONTENT ================= */

.content {
  flex: 1;
  min-width: 0;              /* 🔥 PREVENT OVERFLOW */
}

.title {
  font-size: 17px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.description {
  font-size: 13px;
  color: #666;
  margin-top: 6px;
  line-height: 1.5;

  display: -webkit-box;
  line-clamp: 2;
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
  background: rgba(31,174,75,.12);
  color: #1fae4b;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 20px;
  max-width: 100%;
  word-break: break-word;
}

.created {
  font-size: 11px;
  color: #999;
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
  background: rgba(255,255,255,.9);
  color: #1fae4b;
  font-size: 16px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  transition: 0.2s ease;
}

.menu-btn:hover {
  background: #1fae4b;
  color: white;
}

.popup-menu {
  position: absolute;
  right: 0;
  top: 36px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(0,0,0,.15);
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
}

.popup-menu button:hover {
  background: #f5f5f5;
}

.delete-item {
  color: #e53935;
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
  background: rgba(0,0,0,.4);
  border: none;
}

.dialog {
  background: white;
  padding: 22px;
  border-radius: 14px;
  width: 320px;
  z-index: 1000;
  text-align: center;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.danger {
  background: red;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
}

/* ================= MOBILE (IMAGE STILL LEFT) ================= */

@media (max-width: 768px) {

  .page {
    padding: 14px;
  }

  .card {
    flex-direction: row;   /* 🔥 KEEP HORIZONTAL */
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