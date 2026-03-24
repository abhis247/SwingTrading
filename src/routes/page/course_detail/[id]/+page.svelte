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
.page {
  min-height: 100vh;
  background: #f5f7fb;
}

.banner img {
  width: 100%;
  height: 220px;
  object-fit: cover;
}

.content {
  padding: 16px;
  max-width: 900px;
  margin: auto;
}

.category {
  color: grey;
}

.price {
  font-size: 24px;
  font-weight: bold;
  color: #1b8e5a;
}

.price span {
  font-size: 12px;
  color: grey;
}

.price.free {
  color: black;
}

.chips {
  display: flex;
  gap: 10px;
  margin: 14px 0;
}

.chip {
  background: #eee;
  padding: 6px 12px;
  border-radius: 20px;
}

.subject {
  background: white;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.subject-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.video {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-top: 1px solid #eee;
}

.preview {
  background: green;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
  margin-left: 6px;
}

.lock {
  color: red;
}

.play {
  color: green;
}

.bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px;
  border-top: 1px solid #eee;
}

.enroll-btn {
  width: 100%;
  padding: 14px;
  background: #1b8e5a;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.center {
  text-align: center;
  padding: 40px;
}

@media (min-width:1024px){

/* PAGE */

.page{
  background:#f5f7fb;
}

/* BANNER */

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

/* MAIN CARD */

.content{
  max-width:900px;
  margin:auto;

  background:white;

  border:1px solid #e5e7eb;
  border-top:none;

  border-radius:0 0 16px 16px;

  padding:28px;

  box-shadow:0 12px 30px rgba(0,0,0,.06);
}

/* TITLE */

h1{
  font-size:30px;
  font-weight:800;
  margin-bottom:6px;
}

/* CATEGORY */

.category{
  font-size:14px;
  color:#6b7280;
}

/* PRICE */

.price{
  font-size:26px;
  font-weight:800;
  color:#11ba66;
  margin-top:12px;
}

.price span{
  font-size:13px;
  color:#888;
  margin-left:6px;
}

/* CHIPS */

.chips{
  display:flex;
  gap:12px;
  margin:18px 0;
}

.chip{
  background:#f3f4f6;
  padding:8px 14px;
  border-radius:20px;
  font-size:13px;
}

/* DESCRIPTION */

.content p{
  font-size:15px;
  line-height:1.7;
  color:#444;
}

/* SECTION TITLE */

.content h3{
  margin-top:24px;
  margin-bottom:10px;
  font-size:18px;
}

/* SUBJECT CARD */

.subject{
  background:#fafafa;

  padding:18px;

  border-radius:12px;

  border:1px solid #eee;

  margin-top:14px;

  transition:.25s;
}

.subject:hover{
  border-color:#ddd;
  box-shadow:0 6px 16px rgba(0,0,0,.08);
}

/* SUBJECT HEADER */

.subject-title{
  font-size:16px;
  font-weight:700;

  display:flex;
  justify-content:space-between;

  margin-bottom:10px;
}

/* VIDEO ROW */

.video{
  display:flex;
  justify-content:space-between;

  padding:10px 0;

  border-top:1px solid #eee;

  font-size:14px;
}

.video:first-of-type{
  border-top:none;
}

/* PLAY */

.play{
  color:#11ba66;
  font-weight:600;
}

/* LOCK */

.lock{
  color:#ef4444;
  font-weight:600;
}

/* PREVIEW */

.preview{
  background:#11ba66;
  color:white;

  font-size:10px;

  padding:3px 7px;

  border-radius:6px;

  margin-left:6px;
}

/* BUTTON */
/* BUTTON */

.bottom{
  position: relative;   /* remove fixed */
background: transparent;
  max-width:900px;
  margin:20px auto 40px;
}

/* BUTTON */

.enroll-btn{
  width:100%;

  padding:16px;

  font-size:16px;
  font-weight:700;

  background:linear-gradient(135deg,#20559b,#11ba66);

  border:none;
  border-radius:12px;

  color:white;

  cursor:pointer;

  transition:.25s;

  box-shadow:0 6px 18px rgba(17,186,102,.35);
}
.mobile-spacer{
  display:none;
}

}

</style>