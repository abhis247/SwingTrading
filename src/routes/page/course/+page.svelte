<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { auth } from "$lib/firebase";
  import { goto } from "$app/navigation";
  import AppBar from "$lib/AppBar1.svelte";
    import { Currency } from "lucide-svelte";

  let activeTab = "project";
  let courses: any[] = [];
  let loading = true;
  let user: any = null;
  let enrolledCourseIds = new Set<string>();

  const tabs = [
    { key: "project", label: "Project" },
    { key: "design", label: "Design" },
    { key: "software", label: "Software" },
    { key: "specialization", label: "Specialization" }
  ];

  const categoryMap: Record<string, string> = {
    project: "Project & Cost Management Certifications",
    design: "Design Development Training",
    software: "Software Training",
    specialization: "Specialization Training"
  };

  onMount(() => {
    auth.onAuthStateChanged(async (u) => {
      user = u;
      await fetchCourses();
    });
  });

  async function fetchCourses() {
    loading = true;

    const realCategory = categoryMap[activeTab];

    const [coursesRes, enrollmentsRes] = await Promise.all([
      supabase
        .from("courses")
        .select()
        .eq("category", realCategory)
        .order("created_at", { ascending: false }),

      user
        ? supabase
            .from("enrollments")
            .select("course_id")
            .eq("user_id", user.uid)
        : Promise.resolve({ data: [] })
    ]);

    courses = coursesRes.data || [];

    enrolledCourseIds = new Set(
      enrollmentsRes.data?.map(e => e.course_id) || []
    );

    loading = false;
  }

  function startLearning(courseId: string) {
    goto(`/page/enroll_course_detail/${courseId}`);
  }

  let startX = 0;

  function handleTouchStart(e: TouchEvent) {
    startX = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent) {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;

    if (Math.abs(diff) < 60) return;

    const index = tabs.findIndex(t => t.key === activeTab);

    if (diff < 0 && index < tabs.length - 1) {
      activeTab = tabs[index + 1].key;
      fetchCourses();
    }

    if (diff > 0 && index > 0) {
      activeTab = tabs[index - 1].key;
      fetchCourses();
    }
  }



async function enrollWithRazorpay(course: any) {
  if (!user) {
    goto("/auth/login");
    return;
  }

  // Free course
  if (!course.price || course.price === 0) {
    await supabase.from("enrollments").insert({
      user_id: user.uid,
      course_id: course.id
    });

    goto(`/page/enroll_course_detail/${course.id}`);
    return;
  }

  // Create order
  const amountInCents = Math.round(course.price * 100);
  const res = await fetch("/api/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountInCents,currency:"USD" })
  });

  const order = await res.json();

  const options = {
    key: import.meta.env.PUBLIC_RAZORPAY_KEY,
  amount: order.amount,
  currency: "USD",
  name: "Construction Wizards",
  description: course.title,
  // image: "/logo.png", // optional logo
  order_id: order.id,


    handler: async function (response: any) {
      await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...response,
          courseId: course.id,
          userId: user.uid
        })
      });

      goto(`/page/enroll_course_detail/${course.id}`);
    },

    theme: {
      color: "#11ba66"
    }
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}
</script>
<div class="page">

<AppBar title="Courses" showBack={true}/>

  <!-- TAB BAR (Flutter style) -->
  <div class="tabs">
    {#each tabs as tab}
      <button
        type="button"
        class="tab {activeTab === tab.key ? 'active' : ''}"
        on:click={() => {
          activeTab = tab.key;
          fetchCourses();
        }}>
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- BODY -->
 <section
  class="content"
 
  aria-label="Course content"
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
>

    {#if loading}
    <div class="skeleton-wrapper">
  <div class="skeleton-card"></div>
  <div class="skeleton-card"></div>
  <div class="skeleton-card"></div>
</div>

<style>
.skeleton-wrapper {
  padding: 24px;
}

.skeleton-card {
  height: 120px;
  background: linear-gradient(
    90deg,
    #f3f4f6 25%,
    #e5e7eb 37%,
    #f3f4f6 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 16px;
  margin-bottom: 16px;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>
    {:else if courses.length === 0}
      <div class="center">No courses found</div>

    {:else}

     {#each courses as course}
     <div class="card">

  <!-- Laptop Image -->
  <img
    class="course-img"
    src={course.banner || "/placeholder.jpg"}
    alt={course.title}
  />

  <div class="card-top">
    <div class="icon">🎓</div>

    <div class="text">
      <h3>{course.title}</h3>
      <p>{course.category}</p>
    </div>
  </div>

  <!-- Laptop Description -->
  <p class="course-desc">
    {course.description || ""}
  </p>

  <div class="card-actions">

    <!-- Laptop Price -->
   <div class="price">
  {course.price && course.price > 0
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(course.price)
    : "Free"}
</div>

    <button
      type="button"
      class="view"
      on:click={() => goto(`/page/course_detail/${course.id}`)}>
      View Details
    </button>

    <button
      type="button"
      class="enroll"
      on:click={() =>
        enrolledCourseIds.has(course.id)
          ? startLearning(course.id)
          : enrollWithRazorpay(course)
      }>
      {enrolledCourseIds.has(course.id)
        ? "Start Learning"
        : "Enroll Now"}
    </button>

  </div>

</div>
<!-- 
  <div class="card">

    <div class="card-top">
      <div class="icon">🎓</div>

      <div class="text">
        <h3>{course.title}</h3>
        <p>{course.category}</p>
      </div>
    </div>

    <div class="card-actions">
      <button
        type="button"
        class="view"
        on:click={() => goto(`/page/course_detail/${course.id}`)}>
        View Details
      </button>

      <button
        type="button"
        class="enroll"
        on:click={() =>
  enrolledCourseIds.has(course.id)
    ? startLearning(course.id)
    : enrollWithRazorpay(course)
        }>
        {enrolledCourseIds.has(course.id)
          ? "Start Learning"
          : "Enroll Now"}
      </button>
    </div>

  </div> -->

{/each}
    {/if}

  </section>

</div>
<style>
/* =====================================================
   🎨 THEME — change colors here, nowhere else
   ===================================================== */
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
/* =====================================================
   PAGE
   ===================================================== */
.page {
  min-height: 100vh;
  background: var(--clr-page-bg);
  color: var(--clr-heading);
}

/* =====================================================
   TABS — mobile
   ===================================================== */
.tabs {
  display: flex;
  overflow-x: auto;
  padding: 12px 10px 6px;
  background: var(--clr-tab-bar-bg);
  gap: 6px;
}

.tab {
  border: none;
  background: transparent;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  color: #666;
  position: relative;
  white-space: nowrap;
}

.tab.active {
  color: var(--clr-accent);
  font-weight: 600;
}

.tab.active::after {
  content: "";
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--clr-accent);
  border-radius: 4px;
}

/* =====================================================
   CONTENT AREA
   ===================================================== */
.content {
  padding: 16px;
  max-width: 920px;
  margin: auto;
}

.center {
  text-align: center;
  padding: 40px;
}

/* =====================================================
   CARD — mobile
   ===================================================== */
.card {
  background: var(--clr-card-bg);
  border:1px solid var(--clr-card-border);
   padding: 16px;
  border-radius: 16px;
  margin-bottom: 14px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.card-top {
  display: flex;
  gap: 12px;
}

.icon {
  background: var(--clr-icon-bg);
  padding: 10px;
  border-radius: 10px;
  font-size: 20px;
}

.text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--clr-heading);
}

.text p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--clr-subtext);
}

.card-actions {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.view {
  background: none;
  border: none;
  color: var(--clr-view-btn-fg);
  cursor: pointer;
  font-weight: 500;
}

.enroll {
  background: var(--clr-accent);
  color: rgb(9, 9, 9);
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}

/* hidden on mobile */
.course-img  { display: none; }
.course-desc { display: none; }
.price       { display: none; }

/* =====================================================
   SKELETON
   ===================================================== */
.skeleton-wrapper {
  padding: 24px;
}

.skeleton-card {
  height: 120px;
  background: linear-gradient(
    90deg,
    var(--clr-shimmer-1) 25%,
    var(--clr-shimmer-2) 37%,
    var(--clr-shimmer-1) 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 16px;
  margin-bottom: 16px;
}

@keyframes shimmer {
  0%   { background-position:  100% 0; }
  100% { background-position: -100% 0; }
}

/* =====================================================
   MOBILE
   ===================================================== */
@media (max-width: 600px) {
  .content { padding: 14px; }
}

/* =====================================================
   DESKTOP  ≥ 1024px
   ===================================================== */
@media (min-width: 1024px) {

  .tabs {
    justify-content: center;
    gap: 10px;
    padding: 14px 12px;
    overflow-x: auto;
  }

  .tab {
    padding: 10px 18px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 999px;
    background: var(--clr-tab-idle-bg);
    color: var(--clr-tab-idle-fg);
    white-space: nowrap;
    transition: 0.25s;
    flex: 0 0 auto;
  }

  .tab.active {
    background: var(--grad);
    color: white;
    box-shadow: 0 6px 16px var(--clr-accent-shadow);
  }

  .tab:hover { transform: translateY(-2px); }
  .tab.active::after { display: none; }

  .content {
    width: 100%;
    max-width: 1400px;
    margin: auto;
    padding: 60px 70px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
  }

  .card {
    padding: 0;
    overflow: hidden;
    border-radius: 22px;
    display: flex;
    flex-direction: column;
    background: var(--clr-card-bg);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
    transition: all 0.35s ease;
    margin-bottom: 0;
  }

  .card:hover {
    transform: translateY(-10px);
    box-shadow: 0 30px 70px rgba(0, 0, 0, 0.18);
  }

  .course-img {
    display: block;
    width: 100%;
    height: 230px;
    object-fit: cover;
  }

  .card-top {
    padding: 22px;
    gap: 14px;
  }

  .icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    border-radius: 14px;
    background: var(--grad);
    color: white;
    flex-shrink: 0;
    padding: 0;
  }

  .text h3 {
    font-size: 21px;
    font-weight: 700;
    line-height: 1.4;
  }

  .text p {
    font-size: 14px;
    margin-top: 4px;
  }

  .course-desc {
    display: -webkit-box;
    font-size: 15px;
    color: var(--clr-subtext);
    padding: 0 22px;
    line-height: 1.6;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 46px;
  }

  .card-actions {
    padding: 22px;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: auto;
    justify-content: flex-start;
  }

  .price {
    display: block;
    font-size: 24px;
    font-weight: 800;
    background: var(--grad);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-right: auto;
  }

  .view {
    background: var(--clr-view-btn-bg);
    border: none;
    padding: 10px 16px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    color: var(--clr-view-btn-fg);
    transition: 0.25s;
  }

  .view:hover { background: var(--clr-view-btn-hover); }

  .enroll {
    background: var(--grad);
    color: white;
    border: none;
    padding: 12px 22px;
    border-radius: 14px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    box-shadow: 0 10px 25px var(--clr-accent-shadow);
    transition: 0.25s;
  }

  .enroll:hover {
    transform: scale(1.06);
    box-shadow: 0 16px 40px var(--clr-accent-shadow2);
  }

  .skeleton-wrapper {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
    padding: 0;
  }

  .skeleton-card {
    height: 300px;
    border-radius: 22px;
    margin-bottom: 0;
  }

  .center {
    grid-column: 1 / -1;
    text-align: center;
    padding: 80px;
    font-size: 18px;
  }
}
</style>