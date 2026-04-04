<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { auth } from "$lib/firebase";
  import { supabase } from "$lib/supabase";
  import AppBar from "$lib/AppBar1.svelte";

  let students: any[] = [];
  let loading = true;
  let search = "";

  /* ================= FILTER ================= */

  $: filteredStudents =
    search.trim() === ""
      ? students
      : students.filter((item) => {
          const name = item.user.name?.toLowerCase() ?? "";
          const email = item.user.email?.toLowerCase() ?? "";
          const course = item.course?.toLowerCase() ?? "";

          return (
            name.includes(search.toLowerCase()) ||
            email.includes(search.toLowerCase()) ||
            course.includes(search.toLowerCase())
          );
        });

  /* ================= LOAD ================= */

  onMount(() => {
    const unsubscribe = auth.onAuthStateChanged(async (mentor) => {
      if (!mentor) {
        goto("/auth/login");
        return;
      }

      await fetchStudents(mentor.uid);
    });

    return unsubscribe;
  });

  async function fetchStudents(mentorId: string) {
    try {
      // 1️⃣ Get mentor courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .eq("mentor_id", mentorId);

      if (!courses || courses.length === 0) {
        students = [];
        loading = false;
        return;
      }

      const courseIds = courses.map((c) => c.id);

      // 2️⃣ Get enrollments
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("user_id, course_id")
        .in("course_id", courseIds);

      if (!enrollments || enrollments.length === 0) {
        students = [];
        loading = false;
        return;
      }

      const studentIds = [...new Set(enrollments.map((e) => e.user_id))];

      // 3️⃣ Fetch users
      const { data: users } = await supabase
        .from("users")
        .select("uid, name, email, profile_image")
        .in("uid", studentIds);

      // 4️⃣ Map user + course
      let finalList: any[] = [];

      for (let enrollment of enrollments) {
        const user = users?.find((u) => u.uid === enrollment.user_id);
        const course = courses.find((c) => c.id === enrollment.course_id);

        if (user && course) {
          finalList.push({
            user,
            course: course.title
          });
        }
      }

      students = finalList;
      loading = false;

    } catch (e) {
      console.error("Student fetch error:", e);
      loading = false;
    }
  }
</script>

<AppBar title="Students" showBack={true} />

<div class="page">

  <!-- SEARCH -->
  <div class="search-box">
    <input
      type="text"
      placeholder="Search student..."
      bind:value={search}
    />
  </div>

  {#if loading}
    <div class="center">Loading students...</div>

  {:else if filteredStudents.length === 0}
    <div class="center">No enrolled students</div>

  {:else}
    <div class="list">
      {#each filteredStudents as item}
        <div class="card">

          <!-- Avatar -->
          <div class="avatar">
            {#if item.user.profile_image}
              <img src={item.user.profile_image} alt="profile" />
            {:else}
              {item.user.name?.[0]?.toUpperCase() ?? "S"}
            {/if}
          </div>

          <!-- Info -->
          <div class="info">
            <div class="name">{item.user.name ?? "Student"}</div>
            <div class="email">{item.user.email}</div>
            <div class="course">Course: {item.course}</div>
          </div>

          <div class="arrow">›</div>

        </div>
      {/each}
    </div>
  {/if}

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
* {
  box-sizing: border-box;
}

.page {
  padding: 18px;
  min-height: 100vh;
  background: var(--clr-page-bg);
}

/* ================= SEARCH ================= */

.search-box {
  margin-bottom: 20px;
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
  background: var(--clr-card-bg);
  color: var(--clr-heading);
  transition: .2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: var(--clr-accent);
  box-shadow: 0 0 0 3px var(--clr-accent-shadow);
}

/* ================= CENTER TEXT ================= */

.center {
  text-align: center;
  padding: 40px;
  color: var(--clr-subtext);
  font-size: 14px;
}

/* ================= LIST ================= */

.list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ================= CARD ================= */

.card {
  background: var(--clr-card-bg);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--clr-card-border);
  box-shadow: 0 6px 18px var(--clr-accent-shadow);
  transition: .25s ease;
  min-width: 0;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px var(--clr-accent-shadow2);
  background: var(--clr-view-btn-hover);
}

/* ================= AVATAR ================= */

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--clr-icon-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: var(--clr-accent);
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ================= INFO ================= */

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 600;
  font-size: 15px;
  color: var(--clr-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email {
  font-size: 13px;
  color: var(--clr-subtext);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course {
  font-size: 12px;
  margin-top: 6px;
  font-weight: 600;
  color: var(--clr-accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ================= ARROW ================= */

.arrow {
  font-size: 18px;
  color: var(--clr-subtext);
  flex-shrink: 0;
}

/* ================= MOBILE ================= */

@media (max-width: 480px) {
  .page { padding: 14px; }

  .card { padding: 12px; gap: 12px; }

  .avatar { width: 44px; height: 44px; }

  .name { font-size: 14px; }
  .email { font-size: 12px; }
  .course { font-size: 11px; }
}

/* ================= TABLET ================= */

@media (min-width: 768px) {
  .page { padding: 32px; }

  .card { padding: 18px; }

  .name { font-size: 17px; }
}

/* ================= DESKTOP GRID ================= */

@media (min-width: 1100px) {
  .list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 22px;
  }
}
</style>