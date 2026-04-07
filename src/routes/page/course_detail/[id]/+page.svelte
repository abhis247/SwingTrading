<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { auth } from "$lib/firebase";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  import AppBar from "$lib/AppBar1.svelte";
   import Load from "$lib/load.svelte";


  let courseId: string | undefined;
  let course: any = null;
  let subjects: any[] = [];
  let loading = true;

  let user: any = null;
  let isEnrolled = false;
  let enrollLoading = false;

  let initialized = false;

  $: courseId = $page.params.id;

  onMount(() => {
    auth.onAuthStateChanged((u) => {
      user = u;
      if (courseId && !initialized) {
        initPage();
      }
    });
  });

  $: if (courseId && user && !initialized) {
    initPage();
  }

  async function initPage() {
    initialized = true;
    loading = true;

    await Promise.all([
      fetchCourseDetails(),
      checkEnrollment()
    ]);

    loading = false;
  }

  async function fetchCourseDetails() {
    if (!courseId) return;

    const [courseRes, subjectRes] = await Promise.all([
      supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single(),

      supabase
        .from("subjects")
        .select("*, videos(*)")
        .eq("course_id", courseId)
        .order("created_at")
    ]);

    course = courseRes.data;
    subjects = subjectRes.data || [];
  }

  async function checkEnrollment() {
    if (!user || !courseId) return;

    const { data } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.uid)
      .eq("course_id", courseId)
      .limit(1);

    isEnrolled = !!data?.length;
  }

 async function enrollNow() {

  if (!user) {
    goto("/auth/login");
    return;
  }

  if (isEnrolled) {
    goto(`/page/enroll_course`);
    return;
  }

  // FREE COURSE
  if (!course.price || course.price === 0) {
    await supabase.from("enrollments").insert({
      user_id: user.uid,
      course_id: courseId
    });

    goto(`/page/enroll_course_detail/${courseId}`);
    return;
  }

  enrollLoading = true;

  // Create Razorpay order
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
          courseId: courseId,
          userId: user.uid
        })
      });

      isEnrolled = true;
      goto(`/page/enroll_course_detail/${courseId}`);
    },

    theme: {
      color: "#11ba66"
    }
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.open();

  enrollLoading = false;
}
</script>
<div class="page">
  <AppBar title="Course detail" showBack={true}/>

  {#if loading}
    <Load count={1} />
  {:else if !course}
    <div class="center">Course not found</div>

  {:else}

    <!-- BANNER -->
    <div class="banner">
      <img src={course.banner} alt="course banner" />
    </div>

    <div class="content">

      <!-- TITLE -->
      <h1>{course.title}</h1>
      <p class="category">{course.category}</p>

      <!-- PRICE -->
      {#if isEnrolled}
        <div class="price enrolled">Enrolled</div>

      {:else if course.price > 0}
  <div class="price">
    {new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(course.price)}
    <span>one time</span>
  </div>

      {:else}
        <div class="price free">Free Course</div>
      {/if}

      <!-- INFO CHIPS -->
      <div class="chips">
        <div class="chip">⏱ {course.duration}</div>
        <div class="chip">📊 {course.level}</div>
      </div>

      <!-- ABOUT -->
      <h3>About this course</h3>
      <p>{course.description}</p>

      <!-- CONTENT -->
      <h3>Course Content</h3>

      {#each subjects as subject}
        <div class="subject">
          <div class="subject-title">
            {subject.title}
            <span>{subject.videos?.length || 0} videos</span>
          </div>

          {#each subject.videos as video}
            <div class="video">
              <div>
                ▶ {video.title}
                {#if video.is_preview}
                  <span class="preview">Preview</span>
                {/if}
              </div>

              <div>
                {#if video.is_preview || isEnrolled}
                  <span class="play">Play</span>
                {:else}
                  <span class="lock">Locked</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/each}

      <div class="mobile-spacer" style="height:120px"></div>
    </div>

    <!-- BOTTOM BUTTON -->
   <div class="bottom"> 
    <button class="enroll-btn" 
    on:click={enrollNow} 
    disabled={enrollLoading} >
     {#if enrollLoading} Processing... 
     {:else} {isEnrolled ? "Start Learning" : "Enroll Now"} 
     {/if} 
    </button>
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
:global(body) {
  background: var(--clr-page-bg);
  font-family: system-ui, sans-serif;
}

/* PAGE */
.page {
  min-height: 100vh;
  background: var(--clr-page-bg);
}

/* BANNER */
.banner img {
  width: 100%;
  height: 220px;
  object-fit: cover;
}

/* CONTENT */
.content {
  padding: 16px;
  max-width: 900px;
  margin: auto;
}

/* CATEGORY */
.category {
  color: var(--clr-subtext);
}

/* PRICE */
.price {
  font-size: 24px;
  font-weight: bold;
  color: var(--clr-accent);
}

.price span {
  font-size: 12px;
  color: var(--clr-subtext);
}

.price.free {
  color: var(--clr-heading);
}

/* CHIPS */
.chips {
  display: flex;
  gap: 10px;
  margin: 14px 0;
}

h1 {
  color: var(--clr-heading);
}

h3 {
  color: var(--clr-heading);
}
p {
  color: var(--clr-subtext);
}

.subject-title {
  color: var(--clr-heading);
}
.video {
  color: var(--clr-subtext);
}
.subject-title span {
  color: var(--clr-subtext);
  font-size: 12px;
}

.chip {
  background: var(--clr-tab-idle-bg);
  color: var(--clr-subtext);
  padding: 6px 12px;
  border-radius: 20px;
}

/* SUBJECT */
.subject {
  background: var(--clr-card-bg);
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 12px;
  border: 1px solid var(--clr-card-border);
}

.subject-title {
  font-weight: 600;
  margin-bottom: 8px;
}

/* VIDEO */
.video {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-top: 1px solid var(--clr-card-border);
}

/* LABELS */
.preview {
  background: var(--clr-accent);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
  margin-left: 6px;
}

.lock {
  color: red; /* no root available */
}

.play {
  color: var(--clr-accent);
}

/* BOTTOM BAR */
.bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--clr-card-bg);
  padding: 12px;
  border-top: 1px solid var(--clr-card-border);
}

/* BUTTON */
.enroll-btn {
  width: 100%;
  padding: 14px;
  background: var(--grad);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 6px 18px var(--clr-accent-shadow2);
}

/* CENTER */
.center {
  text-align: center;
  padding: 40px;
}

/* DESKTOP */
@media (min-width:1024px){

.page{
  background: var(--clr-page-bg);
}

.banner{
  max-width:940px;
  margin:40px auto 0;
}

.banner img{
  width:100%;
  height:280px;
  object-fit:cover;
  border-radius:16px 16px 0 0;
}

.content{
  max-width:900px;
  margin:auto;
  background: var(--clr-card-bg);
  border:1px solid var(--clr-card-border);
  border-top:none;
  border-radius:0 0 16px 16px;
  padding:28px;
  box-shadow:0 12px 30px var(--clr-accent-shadow);
}

h1{
  font-size:30px;
  font-weight:800;
  margin-bottom:6px;
  color: var(--clr-heading);
}

.category{
  color: var(--clr-subtext);
}

.price{
  font-size:26px;
  font-weight:800;
  color: var(--clr-accent);
  margin-top:12px;
}

.price span{
  color: var(--clr-subtext);
}

.chips{
  display:flex;
  gap:12px;
  margin:18px 0;
}

.chip{
  background: var(--clr-tab-idle-bg);
  color: var(--clr-subtext);
}

.content p{
  color: var(--clr-subtext);
}

.content h3{
  color: var(--clr-heading);
}

.subject{
  background: var(--clr-card-bg);
  border:1px solid var(--clr-card-border);
  margin-top:14px;
  transition:.25s;
}

.subject:hover{
  border-color: var(--clr-accent);
  box-shadow:0 6px 16px var(--clr-accent-shadow);
}

.video{
  border-top:1px solid var(--clr-card-border);
}

.play{
  color: var(--clr-accent);
}

.preview{
  background: var(--clr-accent);
}

.bottom{
  position: relative;
  background: transparent;
  max-width:900px;
  margin:20px auto 40px;
}

.enroll-btn{
  background: var(--grad);
  box-shadow:0 6px 18px var(--clr-accent-shadow2);
}

.mobile-spacer{
  display:none;
}

}
</style>