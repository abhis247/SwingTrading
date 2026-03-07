<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { auth } from "$lib/firebase";
  import { supabase } from "$lib/supabase";
  import AppBar from "$lib/AppBar1.svelte";

  let loading = true;
  let totalStudents = 0;
  let totalCourses = 0;
  let courseEnrollments: any[] = [];

  onMount(() => {
    const unsub = auth.onAuthStateChanged(async (mentor) => {
      if (!mentor) {
        goto("/auth/login");
        return;
      }
      await loadAnalytics(mentor.uid);
    });

    return unsub;
  });

  async function loadAnalytics(mentorId: string) {
    try {
      // Courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .eq("mentor_id", mentorId);

      totalCourses = courses?.length ?? 0;

      if (!courses || courses.length === 0) {
        loading = false;
        return;
      }

      const courseIds = courses.map((c) => c.id);

      // Enrollments
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id, user_id")
        .in("course_id", courseIds);

      const uniqueStudents =
        new Set(enrollments?.map((e) => e.user_id));

      totalStudents = uniqueStudents.size;

      // Map enrollments per course
      const map: any = {};

      for (const c of courses) {
        map[c.id] = { title: c.title, count: 0 };
      }

      for (const e of enrollments ?? []) {
        if (map[e.course_id]) {
          map[e.course_id].count++;
        }
      }

      courseEnrollments = Object.values(map);

      loading = false;

    } catch (err) {
      console.error("Analytics error:", err);
      loading = false;
    }
  }
</script>

<AppBar title="Mentor Analytics" showBack={true} />

<div class="page">

  {#if loading}
    <div class="center">Loading analytics...</div>

  {:else}

    <!-- OVERVIEW -->
    <h2>Overview</h2>

    <div class="stats">

      <div class="stat-card green">
        <div class="value">{totalStudents}</div>
        <div class="label">Students Enrolled</div>
      </div>

      <div class="stat-card orange">
        <div class="value">{totalCourses}</div>
        <div class="label">Courses Created</div>
      </div>

    </div>

    <!-- COURSE PERFORMANCE -->
    <h3 class="section-title">Course Performance</h3>

    {#if courseEnrollments.length === 0}
      <div class="empty">No enrollments yet</div>
    {:else}

      <div class="course-list">
        {#each courseEnrollments as course}

          <div class="course-card">

            <div class="row">
              <div class="course-title">
                {course.title}
              </div>

              <div class="count">
                {course.count} students
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="progress">
              <div
                class="progress-bar"
                style="width: {(totalStudents === 0 ? 0 : (course.count / totalStudents) * 100)}%"
              ></div>
            </div>

          </div>

        {/each}
      </div>

    {/if}

  {/if}

</div>

<style>
.page {
  max-width: 1000px;
  margin: auto;
  padding: 30px 20px;
  background: #f5f7fb;
  min-height: 100vh;
}

.center {
  text-align: center;
  padding: 40px;
  color: #777;
}

h2 {
  font-size: 22px;
  font-weight: 700;
}

.section-title {
  margin-top: 30px;
  font-size: 18px;
  font-weight: 600;
}

/* STATS */

.stats {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 240px;
  padding: 24px;
  border-radius: 20px;
  color: white;
  box-shadow: 0 10px 25px rgba(0,0,0,.08);
}

.green {
  background: linear-gradient(135deg, #1fae4b, #28c76f);
}

.orange {
  background: linear-gradient(135deg, #ff9800, #ffc107);
}

.value {
  font-size: 28px;
  font-weight: bold;
}

.label {
  margin-top: 6px;
  opacity: .9;
}

/* COURSE LIST */

.course-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.course-card {
  background: white;
  padding: 18px;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0,0,0,.06);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.course-title {
  font-weight: 600;
}

.count {
  color: #1fae4b;
  font-weight: 600;
}

.progress {
  height: 8px;
  background: #e5e5e5;
  border-radius: 10px;
  margin-top: 12px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #1fae4b;
  transition: width .4s ease;
}

.empty {
  margin-top: 20px;
  padding: 30px;
  text-align: center;
  color: #999;
}

/* RESPONSIVE */

@media (max-width: 768px) {
  .stats {
    flex-direction: column;
  }
}
</style>