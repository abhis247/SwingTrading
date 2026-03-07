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
* {
  box-sizing: border-box;
}

.page {
  padding: 18px;
  min-height: 100vh;
  background: #f5f7fb;
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
  border: 1px solid #ddd;
  font-size: 14px;
  transition: .2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #1fae4b;
  box-shadow: 0 0 0 3px rgba(31,174,75,.1);
}

/* ================= CENTER TEXT ================= */

.center {
  text-align: center;
  padding: 40px;
  color: #777;
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
  background: white;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 6px 18px rgba(0,0,0,.08);
  transition: .2s ease;
  min-width: 0;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 22px rgba(0,0,0,.12);
}

/* ================= AVATAR ================= */

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #e0f2e9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #1fae4b;
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
  min-width: 0; /* prevents overflow */
}

.name {
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course {
  font-size: 12px;
  margin-top: 6px;
  font-weight: 600;
  color: #1fae4b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ================= ARROW ================= */

.arrow {
  font-size: 18px;
  color: #aaa;
  flex-shrink: 0;
}

/* ================= MOBILE OPTIMIZATION ================= */

@media (max-width: 480px) {

  .page {
    padding: 14px;
  }

  .card {
    padding: 12px;
    gap: 12px;
  }

  .avatar {
    width: 44px;
    height: 44px;
  }

  .name {
    font-size: 14px;
  }

  .email {
    font-size: 12px;
  }

  .course {
    font-size: 11px;
  }

}

/* ================= TABLET ================= */

@media (min-width: 768px) {

  .page {
    padding: 32px;
  }

  .card {
    padding: 18px;
  }

  .name {
    font-size: 17px;
  }

}

/* ================= DESKTOP GRID MODE ================= */

@media (min-width: 1100px) {

  .list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 22px;
  }

}
</style>