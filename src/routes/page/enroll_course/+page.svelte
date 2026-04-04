<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { auth } from "$lib/firebase";
  import { goto } from "$app/navigation";
  import AppBar from "$lib/AppBar1.svelte";

  let courses: any[] = [];
  let loading = true;
  let user: any = null;

  //////////////////////////////////////////////////////
  // INIT
  //////////////////////////////////////////////////////
  onMount(() => {
    auth.onAuthStateChanged(async (u) => {
      user = u;

      if (!user) {
        loading = false;
        return;
      }

      await fetchMyCourses();
    });
  });

  //////////////////////////////////////////////////////
  // FETCH ENROLLED COURSES
  //////////////////////////////////////////////////////
  async function fetchMyCourses() {
    loading = true;

    try {
      // 🔥 get enrolled course ids
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.uid);

      if (!enrollments || enrollments.length === 0) {
        loading = false;
        return;
      }

      const courseIds = enrollments.map((e) => e.course_id);

      // 🔥 fetch course details
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .in("id", courseIds)
        .order("created_at", { ascending: false });

      courses = courseData || [];
      loading = false;
    } catch (e) {
      console.log("My course error:", e);
      loading = false;
    }
  }

  //////////////////////////////////////////////////////
  // NAVIGATION
  //////////////////////////////////////////////////////
  function openCourse(course: any) {
    goto(`/page/enroll_course_detail/${course.id}`);
  }
</script>

<div class="page">
 
  
  <AppBar title="My Courses" showBack={true}/>

  {#if loading}
    <div class="center">Loading courses...</div>

  {:else if courses.length === 0}
    <div class="center empty">
      <h3>No courses enrolled yet</h3>
      <p>Start learning by enrolling in a course</p>
    </div>

  {:else}

    <div class="list">
      {#each courses as course}
        <button
          type="button"
          class="card"
          on:click={() => openCourse(course)}
        >
          <!-- TOP -->
          <div class="top">
            <!-- banner -->
            <img
              src={course.banner}
              alt="course"
              on:error={(e:any)=> e.target.src="/placeholder.jpg"}
            />

            <!-- INFO -->
            <div class="info">
              <h3>{course.title}</h3>
              <p>{course.category}</p>
            </div>

            <div class="play">▶</div>
          </div>

          <!-- BOTTOM -->
          <div class="bottom">
            <span class="continue">Continue Learning</span>

            <span class="badge">Enrolled</span>
          </div>
        </button>
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
/* ================= PAGE ================= */
.page {
  min-height: 100vh;
  background: var(--clr-page-bg);
  color: var(--clr-heading);
}

/* ================= EMPTY ================= */
.center {
  text-align: center;
  padding: 60px 20px;
  color: var(--clr-subtext);
}

.empty h3 {
  margin-bottom: 6px;
  color: var(--clr-heading);
}

/* ================= LIST ================= */
.list {
  padding: 16px;
  max-width: 900px;
  margin: auto;
}

/* ================= CARD ================= */
.card {
  width: 100%;
  text-align: left;
  background: var(--clr-card-bg);   /* ✅ dark */
  border: 1px solid var(--clr-card-border);
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 16px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.5);
  cursor: pointer;
  transition: 0.25s;
}

.card:hover {
  transform: translateY(-3px);
}

/* ================= TOP ================= */
.top {
  display: flex;
  gap: 12px;
}

.top img {
  height: 75px;
  width: 100px;
  object-fit: cover;
  border-radius: 12px;
}

/* ================= INFO ================= */
.info {
  flex: 1;
}

.info h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--clr-heading);   /* white */
}

.info p {
  margin-top: 4px;
  font-size: 12px;
  color: var(--clr-subtext);   /* gray */
}

/* ▶ PLAY ICON */
.play {
  font-size: 24px;
  color: var(--clr-accent);   /* gold */
}

/* ================= BOTTOM ================= */
.bottom {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.continue {
  color: var(--clr-accent);   /* gold highlight */
  font-weight: 600;
  font-size: 14px;
}

.badge {
  background: #1a1404;
  color: var(--clr-accent);
  font-size: 11px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 6px;
}
</style>