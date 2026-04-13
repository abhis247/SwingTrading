<script lang="ts">
  import { auth } from "$lib/firebase";
  import { supabase } from "$lib/supabase";
  import { goto } from "$app/navigation";
  import { onMount, tick } from "svelte";
  import { signOut } from "firebase/auth";
  import { onDestroy } from "svelte";
  import { MessageCircle } from "lucide-svelte";
  import InstallButton from '$lib/InstallButton.svelte';
  let myCoursesLoaded = false;
  let user: any = null;
  let showMenu = false;
  let webinarRef: HTMLDivElement | null = null;
  let webinarInterval: any;
  let webinarIndex = 0;
  /* ================= REAL COURSES ================= */

  let courses: any[] = [];
  let loopCourses: any[] = [];

  let carouselRef: HTMLDivElement;
  let autoInterval: any;

  let myCourses: any[] = [];
  async function fetchCourses() {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, category")
      .order("created_at", { ascending: false })
      .limit(8);

    if (!error && data) {
      courses = data;

      if (courses.length > 0) {
        loopCourses = [
          courses[courses.length - 1],
          ...courses,
          courses[0]
        ];
      }
    }
  }
async function fetchMyCourses(uid: string) {

  try {

    // Step 1: get enrolled course ids
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", uid);

    if (enrollError) {
      console.log("Enrollment error:", enrollError);
      return;
    }

    if (!enrollments || enrollments.length === 0) {
      myCourses = [];
      return;
    }

    const ids = enrollments.map(e => e.course_id);

    // Step 2: get course details
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id,title,category")
      .in("id", ids);

    if (courseError) {
      console.log("Course fetch error:", courseError);
      return;
    }

    myCourses = courseData || [];
    console.log("My courses:", myCourses);

  } catch (err) {
    console.log("fetchMyCourses error:", err);
  }

}
  function scrollToIndex(index: number, smooth = true) {
    const width = carouselRef.clientWidth;
    carouselRef.scrollTo({
      left: width * index,
      behavior: smooth ? "smooth" : "auto"
    });
  }

  function handleScroll() {
    const width = carouselRef.clientWidth;
    const index = Math.round(carouselRef.scrollLeft / width);

    if (index === 0) {
      setTimeout(() => scrollToIndex(courses.length, false), 300);
    }

    if (index === courses.length + 1) {
      setTimeout(() => scrollToIndex(1, false), 300);
    }
  }

  function startAutoSlide() {
    autoInterval = setInterval(() => {
      const width = carouselRef.clientWidth;
      const index = Math.round(carouselRef.scrollLeft / width);
      scrollToIndex(index + 1);
    }, 3500);
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".menu-wrapper")) {
      showMenu = false;
    }
  }

  async function logout() {
    await signOut(auth);
    goto("/auth/login");
  }



  let webinars: any[] = [];

async function fetchWebinars() {
  const { data, error } = await supabase
    .from("webinars")
    .select("id,title,banner,schedule_at,duration")
    .order("schedule_at", { ascending: false })
    .limit(6);

  if (!error && data) {
    webinars = data;
  }
}
function startWebinarSlide() {

  webinarInterval = setInterval(() => {

    if (!webinarRef) return;

    const cards = webinarRef.querySelectorAll(".webinar-slide");

    if (!cards.length) return;

    webinarIndex++;

    if (webinarIndex >= cards.length) {
      webinarIndex = 0;
    }

    const width = (cards[0] as HTMLElement).clientWidth + 14;

    webinarRef.scrollTo({
      left: width * webinarIndex,
      behavior: "smooth"
    });

  }, 3500);

}


function getDurationMinutes(duration: string) {
  if (!duration) return 0;
  const match = duration.toString().match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

function getStatus(scheduleAt: string, durationRaw: string) {

  const duration = getDurationMinutes(durationRaw);

  const start = new Date(scheduleAt).getTime();
  const end = start + duration * 60000;

  const now = Date.now();

  if (now >= start && now <= end) return "LIVE";

  if (now < start) return "UPCOMING";

  return "COMPLETED";
}


$: activeWebinars = webinars.filter(
  (w) => {
    const status = getStatus(w.schedule_at, w.duration);
    return status === "LIVE" || status === "UPCOMING";
  }
);
 onMount(async () => {

  auth.onAuthStateChanged(async (u) => {

      if (!u) return goto("/auth/login",{ replaceState:true });

    

    user = u;

    if (myCourses.length === 0) {
      await fetchMyCourses(u.uid);
    }

  });

  document.addEventListener("click", handleClickOutside);

  /* LOAD DATA */

  await fetchCourses();
  await fetchWebinars();

  /* WAIT DOM */

  await tick();

  /* START COURSE CAROUSEL */

  if (courses.length > 0) {
    scrollToIndex(1, false);
    startAutoSlide();
  }

  /* START WEBINAR AUTO SLIDE */

  if (webinars.length > 0) {
    startWebinarSlide();
  }

});




onDestroy(() => {
  clearInterval(webinarInterval);
  clearInterval(autoInterval);
});
</script>
<svelte:head>
  <title>School Time</title>
  <meta
    name="description"
    content="Learn with courses, webinars, mentors and student tools in School Time."
  />
</svelte:head>
<div class="page">

  <!-- ================= HEADER ================= -->
  <div class="header">

    <div class="top-row">
      <h2>School Time</h2>

    <div class="right-icons">

  <!-- DESKTOP NAVBAR -->
  <div class="desktop-nav">
    <button class="icon-btn" on:click={() => goto("/page/discussion")}>
      Discussion
    </button>

    <button class="icon-btn" on:click={() => goto("/page/profile")}>
      Profile
    </button>

    <button class="icon-btn" on:click={() => goto("/page/support")}>
      Support
    </button>
    <button class="mentor-btn" on:click={() => goto("/page/become_mentor")}>
  Become a mentor
</button>
{#if user}
  <button class="icon-btn logout" on:click={logout}>
    Logout
  </button>
{:else}
  <button class="icon-btn login" on:click={() => goto('/auth/login')}>
    Login
  </button>
{/if}

  </div>

 <button class="icon-btn discussion-btn" on:click={() => goto("/page/discussion")}>
  <MessageCircle size={20} />
</button>
  <!-- MOBILE MENU -->
  <div class="menu-wrapper mobile-menu">
    <button class="icon-btn" on:click={() => showMenu = !showMenu}>
      ⋮
    </button>

    {#if showMenu}
      <div class="dropdown">
        <button on:click={() => goto("/page/profile")}>Profile</button>
        <button on:click={() => goto("/page/support")}>Support</button>
        <button on:click={() => goto("/page/become_mentor")}>Become a mentor</button>

{#if user}
  <button  on:click={logout}>
    Logout
  </button>
{:else}
  <button  on:click={() => goto('/auth/login')}>
    Login
  </button>
{/if}
      </div>
    {/if}
  </div>

</div>


    </div>

    {#if user}
      <div class="welcome">
        <h3>Hi, {user.displayName || "Student"} 👋</h3>
        <p>Ready to continue learning?</p>
      </div>
      {:else}
       <div class="welcome">
        <h3>Hi, Student 👋</h3>
        <p>Ready to continue learning?</p>
      </div>
    {/if}
  </div>
<!-- ✅ INSTALL BUTTON BELOW HEADER -->
<InstallButton />


  <section class="section">
    <h4>Quick Access</h4>

    <div class="quick-grid">
     <button on:click={() => goto("/page/mentor")}>
  <span>🎓</span>
  Mentor
</button>

<button on:click={() => goto("/page/webinar")}>
  <span>📅</span>
  Webinar
</button>

<button on:click={() => goto("/page/message")}>
  <span>💬</span>
  Messages
</button>

<button on:click={() => goto("/page/enroll_course")}>
  <span>📊</span>
  My Course
</button>
    </div>
  </section>
  <!-- ================= EXPLORE COURSES ================= -->
<!-- ================= EXPLORE COURSES (INFINITE - SAME CARD STYLE) ================= -->
<section class="section explore-section">

  <div class="section-title">
    <h4>Explore Courses</h4>
    <button on:click={() => goto("/page/course")}>
      View all
    </button>
  </div>

  {#if courses.length > 0}
    <div
      class="carousel"
      bind:this={carouselRef}
      on:scroll={handleScroll}
    >
      {#each loopCourses as course}
        <div class="slide">

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
                class="view"
                on:click={() =>
                  goto(`/page/course_detail/${course.id}`)
                }>
                View Details
              </button>

              <button
                class="enroll"
                on:click={() =>
                  goto(`/page/course_detail/${course.id}`)
                }>
                Enroll Now
              </button>
            </div>

          </div>

        </div>
      {/each}
    </div>
  {/if}

</section>


<section class="section">

  <div class="section-title">
    <h4>Upcoming Webinars</h4>
    <button on:click={() => goto("/page/webinar")}>
      View all
    </button>
  </div>

  <div class="webinar-carousel" bind:this={webinarRef}>
    {#each webinars as webinar}
      <div class="webinar-slide">

        <div class="webinar-card">

          {#if getStatus(webinar.schedule_at, webinar.duration) === "LIVE"}
              <div class="live-badge">LIVE</div>
           {/if}
                       <img
  src={webinar.banner + '?width=400&quality=70&format=webp'}
  alt={webinar.title}
  loading="lazy"
  width="400"
  height="200"
/>
          <div class="webinar-content">
            <h4>{webinar.title}</h4>

            <p>
              {new Date(webinar.schedule_at).toLocaleString()}
            </p>

            <button on:click={() => goto("/page/webinar")}>
              View Webinar
            </button>
          </div>

        </div>

      </div>

    {/each}

  </div>

</section>

  <!-- ================= YOUR COURSES ================= -->
 <section class="section">

  <div class="section-title">
    <h4>Your Courses</h4>

    <button on:click={() => goto("/page/enroll_course")}>
      See all
    </button>
  </div>

  <div class="horizontal-scroll">

    {#if myCourses.length > 0}

      {#each myCourses as course}

        <div class="course-card">

          <h5>{course.title}</h5>
          <p>{course.category}</p>

          <div class="progress">
            <div
              class="bar"
              style="width:{course.progress || 0}%"
            ></div>
          </div>

          <button
            on:click={() =>
              goto(`/page/course_detail/${course.id}`)
            }
          >
            Continue
          </button>

        </div>

      {/each}

    {:else}

      <p>No enrolled courses yet</p>

    {/if}

  </div>

</section>
  <!-- ================= BROWSE CTA ================= -->
  <div class="cta">
    <button on:click={() => goto("/page/course")}>
      Browse All Courses
    </button>
  </div>

  <!-- ================= QUICK ACCESS ================= -->
  

</div>
<style>
:root{

  /* BACKGROUND */
  --clr-page-bg: linear-gradient(180deg,#0a0800,#140f00);

  /* CARD */
  --clr-card-bg:#241a05;
  --clr-card-border:rgba(212,160,23,0.25);

  /* TEXT */
  --clr-heading:#f8e8b0;
  --clr-subtext:#b89a4a;

  /* PRIMARY / GOLD */
  --clr-accent:#d4a017;
  --clr-accent-dark:#b88a10;

  /* BUTTON */
  --clr-btn-bg:#2f2408;
  --clr-btn-hover:#3f310c;

  /* ICON */
  --clr-icon-bg:#2f2408;

  /* HEADER */
  --clr-header-bg: linear-gradient(135deg,#3a2a0a,#7a6515);

  /* GRADIENT */
  --grad:linear-gradient(135deg,#6b4a00,#d4a017);
}
/* ================= PAGE ================= */

h1,h2,h3,h4,h5,p{
  margin:8px;
}

.page {
  min-height: 100vh;
  background: var(--clr-page-bg);
  color: var(--clr-heading);
  font-family: system-ui;
}

/* ================= HEADER ================= */

.header {
  padding: 20px 16px 24px;
  background: var(--clr-header-bg);
  color: var(--clr-heading);
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right-icons {
  display: flex;
  gap: 10px;
}

.icon-btn {
  background: #f5d060;
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  color: #1a1000;
}


.discussion-btn{
  display:flex;
  align-items:center;
  justify-content:center;
}

.welcome h3 {
  margin: 14px 0 4px;
  font-size: 20px;
}

.welcome p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

/* ================= DROPDOWN ================= */

.menu-wrapper {
  position: relative;
}
/* ================= ENHANCED DROPDOWN ================= */

.dropdown{
  position:absolute;
  right:6px;
  top:46px;

  min-width:158px;

  background:#1a1200;
  border-radius:14px;

  padding:6px;

  box-shadow:0 18px 40px rgba(0,0,0,.5);

  display:flex;
  flex-direction:column;

  z-index:999;

  animation:dropdownFade .18s ease;
}

/* menu items */

.dropdown button{
  display:flex;
  align-items:center;

  padding:8px;

  border:none;
  background:transparent;

  font-size:14px;
  font-weight:500;

  border-radius:10px;

  cursor:pointer;

  color:#f5e6c0;

  transition:all .18s ease;
}

/* hover effect */

.dropdown button:hover{
  background:#2a2000;
  transform:translateX(4px);
}

/* logout highlight */

.dropdown button:last-child{
  color:#ff9900;
  font-weight:600;
}

/* smooth open animation */

@keyframes dropdownFade{
  from{
    opacity:0;
    transform:translateY(-8px) scale(.96);
  }
  to{
    opacity:1;
    transform:translateY(0) scale(1);
  }
}
/* ================= SECTION ================= */

.section {
  padding: 8px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title button {
  background: none;
  border: none;
  color: #d4a017;
  font-weight: 600;
  cursor: pointer;
}

/* ================= CAROUSEL ================= */

.explore-section {
  overflow: hidden;
  
}

.carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.carousel::-webkit-scrollbar {
  display: none;
}

.slide {
  flex: 0 0 100%;
  scroll-snap-align: center;
  padding: 0 16px;
  box-sizing: border-box;
}

/* ================= COURSE CARD ================= */

.card {
  padding: 20px;
  background: var(--clr-card-bg);
  border: 1px solid var(--clr-card-border);
  color: var(--clr-heading);
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.5);
}

.card-top {
  display: flex;
  gap: 16px;
  align-items: center;
}

.card-top .icon {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #8a6a00, #d4a017);
  color: #0a0800;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 22px;
  flex-shrink: 0;
}

.card-top .text h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.card-top .text p {
  margin: 6px 0 0;
  font-size: 13px;
  color: #9a8040;
}

/* ================= ACTION BUTTONS ================= */

.card-actions {
  margin-top: 20px;
  display: flex;
  gap: 14px;
}

.view {
  flex: 1;
  border: none;
  padding: 12px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
   background: var(--clr-btn-bg);
  color: var(--clr-heading);

  transition: 0.2s ease;
}

.view:hover {
  background: var(--clr-btn-hover);
}

.enroll {
  flex: 1;
  background: var(--clr-accent);
  color: #0a0800;
  border: none;
  padding: 12px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.enroll:hover {
  background: var(--clr-accent-dark);}

/* ================= HORIZONTAL SCROLL ================= */

.horizontal-scroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
}

.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

/* ================= QUICK GRID ================= */

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-grid button {
  background: var(--clr-card-bg);
  color: var(--clr-heading);
  border: none;
  padding: 16px;
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(0,0,0,.3);
  font-weight: 600;
  cursor: pointer;
 
}
.course-card {
  min-width: 220px;
   background: var(--clr-card-bg);
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(0,0,0,.3);
  display: flex;
  flex-direction: column;
  color: #f5e6c0;
}

.progress {
  background: #2a2000;
  height: 6px;
  border-radius: 6px;
  margin-bottom: 12px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: var(--clr-accent);}

.course-card button {
  margin-top: auto;
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #5a3e00, #d4a017);
  color: #0a0800;
  font-weight: 600;
  cursor: pointer;
}
/* CTA Section */

.cta {
  padding:16px ;
}

.cta button {
  width: 100%;
  padding: 14px;
  border-radius: 16px;
  border: none;
  font-weight: 700;
  font-size: 15px;
  background: linear-gradient(135deg, #5a3e00, #d4a017);
  color: #0a0800;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 10px 25px rgba(180, 130, 0, 0.3);
}

.cta button:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 35px rgba(180, 130, 0, 0.45);
}
/* ===== DESKTOP HEADER ITEMS ===== */


.desktop-nav{
  display:none;
}

.mobile-menu{
  display:block;
}

.mobile-menu{
  display:block;
}
/* ================= WEBINAR CAROUSEL ================= */
/* ================= WEBINAR CAROUSEL ================= */

.webinar-carousel{
  display:flex;
  overflow-x:auto;
  scroll-snap-type:x mandatory;
  scroll-behavior:smooth;

  padding:10px 16px;
  gap:16px;

  -webkit-overflow-scrolling:touch;
}

.webinar-carousel::-webkit-scrollbar{
  display:none;
}

/* PHONE (1 card) */

.webinar-slide{
  flex:0 0 100%;
  scroll-snap-align:center;
}

/* CARD */

.webinar-card{
  width:100%;
  background:#1a1200;
  border-radius:16px;
  overflow:hidden;
  box-shadow:0 6px 18px rgba(0,0,0,.4);
}

.webinar-card img{
  width:100%;
  height:150px;
  object-fit:cover;
}

.webinar-content{
  padding:14px;
  color:#f5e6c0;
}

.webinar-content h4{
  font-size:15px;
  margin-bottom:6px;
}

.webinar-content p{
  font-size:12px;
  color:#9a8040;
}

.webinar-content button{
  margin-top:10px;
  width:100%;
  padding:10px;
  border:none;
  border-radius:10px;
  background:#d4a017;
  color:#0a0800;
  font-weight:600;
}

/* TABLET (2 cards) */

@media (min-width:640px){
  .webinar-slide{
    flex:0 0 calc(50% - 8px);
  }
}

/* LAPTOP / DESKTOP (3 cards) */

@media (min-width:1024px){
  .webinar-slide{
    flex:0 0 calc(33.333% - 10px);
  }
}

@media (min-width:1024px){
  
:global(body){
  margin:0;
  background: linear-gradient(180deg,#0a0800,#1a1200);
}
/* ================= PAGE ================= */

.page{
  max-width:1200px;
  margin:auto;
}

/* ================= HEADER ================= */

.header{
  width:100vw;
  margin-left:calc(50% - 50vw);
  margin-right:calc(50% - 50vw);
  padding:34px 40px 38px;
}

.top-row,
.welcome{
  max-width:1200px;
  margin:auto;
}
.top-row{
  display:flex;
  align-items:center;
  justify-content:center;
  position:relative;
}
.mentor-btn{
  white-space: nowrap;
  display:flex;
  align-items:center;
  justify-content:center;

  padding:6px 14px;
  font-size:19px;

  border-radius:8px;
  border:none;

  font-weight:600;

  color:#f5d060;

  cursor:pointer;

  transition:all .25s ease;
  background: transparent;
}

.mentor-btn:hover{
  transform:translateY(-2px);
  box-shadow:0 8px 18px rgba(0,0,0,.4);
}

.icon-btn{
  background:transparent;
  color:#f5d060;
  font-weight:600;
}

.icon-btn:hover{
  background:rgba(212,160,23,.15);
}
/* ================= HEADER CONTROLS ================= */


  .discussion-btn{
    display:none;
  }

.mobile-menu{
  display:none;
}
.right-icons{
  display:flex;
  width:100%;
  max-width:700px;
  margin:auto;
}

.right-icons .icon-btn{
  flex:1;
  text-align:center;
}


.icon-btn.logout{
  background:#ff9900;
  color:#0a0800;
}

/* ================= SECTION ================= */

.section{
  padding:30px 32px;
}

/* ================= QUICK ACCESS ================= */
/* ================= QUICK ACCESS ================= */

.quick-grid{
  grid-template-columns:repeat(4,1fr);
  gap:20px;
}

/* card style */

.quick-grid button{
  background:#1a1200;
  border:none;

  padding:22px;

  border-radius:18px;

  font-size:15px;
  font-weight:600;

  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:8px;

  box-shadow:0 8px 20px rgba(0,0,0,.3);

  transition:all .3s ease;

  cursor:pointer;

  color:#f5e6c0;
}

/* icon size */

.quick-grid button span{
  font-size:26px;
}

/* hover effect */

.quick-grid button:hover{
  transform:translateY(-6px);

  box-shadow:0 20px 40px rgba(0,0,0,.4);

  background:linear-gradient(135deg,#5a3e00,#d4a017);

  color:#0a0800;
}

/* icon animation */

.quick-grid button:hover span{
  transform:scale(1.2);
  transition:.25s;
}
/* ================= EXPLORE COURSES ================= */
/* grid instead of slider on laptop */


.desktop-nav{
  display:flex;
  gap:68px;
}

.mobile-menu{
  display:none;
}

.right-icons{
  display:flex;
  align-items:center;
}
.carousel{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:22px;
  overflow:visible;
}

.slide{
  flex:none;
  padding:0;
}

/* ================= COURSE CARD ================= */
.card{
  width:100%;
  padding:26px;
  min-height:210px;

  border-radius:20px;

  background:#1a1200;

  box-shadow:0 8px 20px rgba(0,0,0,.3);

  transition:all .35s ease;

  display:flex;
  flex-direction:column;
}

.card:hover{
  transform:translateY(-10px);

  box-shadow:0 25px 50px rgba(0,0,0,.5);
}

.card-actions{
  margin-top:auto;
}

.card-top .icon{
  width:60px;
  height:60px;
  font-size:26px;
}

.card-top .text h3{
  font-size:20px;
}

.card-top .text p{
  font-size:14px;
}

/* ================= BUTTONS ================= */


.section-title h4{
  font-size:18px;
  font-weight:700;
}

.section-title button{
  font-size:14px;
  padding:6px 10px;

  border-radius:8px;

  background:#2a2000;
  color:#d4a017;
}
.view,
.enroll{
  padding:14px;
  font-size:15px;
}

/* ================= YOUR COURSES ================= */

.horizontal-scroll{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:22px;
  overflow:visible;
}

.course-card{
  
  min-height:190px;
  padding:22px;
  border-radius:20px;

  display:flex;
  flex-direction:column;
  justify-content:space-between;

  transition:.3s;
}

.course-card:hover{
  transform:translateY(-6px);
  box-shadow:0 18px 35px rgba(0,0,0,.4);
}

.course-card h5{
  font-size:18px;
}

.course-card p{
  font-size:14px;
  color:#9a8040;
}

.progress{
  height:8px;
  border-radius:8px;
}

.course-card button{
  padding:12px;
  font-size:15px;
}

/* ================= CTA ================= */

.cta{
  max-width:520px;
  margin:40px auto 0;
}

.cta button{
  font-size:16px;
  padding:18px;
}
.carousel{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:22px;
  overflow:visible;
}

.slide{
  flex:none;
  padding:0;
  width:100%;
}

.card{
  width:100%;
  box-sizing:border-box;
}
.page{
  animation:pageFade .6s ease;
}

@keyframes pageFade{
  from{
    opacity:0;
    transform:translateY(10px);
  }
  to{
    opacity:1;
    transform:translateY(0);
  }
}
.icon-btn{
  transition:all .25s ease;
}

.icon-btn:hover{
  transform:translateY(-3px) scale(1.05);
  box-shadow:0 8px 20px rgba(0,0,0,.3);
}

}
.quick-grid button{
  transition:all .35s ease;
}

.quick-grid button:hover{
  transform:translateY(-8px) scale(1.03);

  box-shadow:0 20px 40px rgba(0,0,0,.4);

  background:linear-gradient(135deg,#5a3e00,#d4a017);
  color:#0a0800;
}

.quick-grid button span{
  transition:.3s;
}

.quick-grid button:hover span{
  transform:scale(1.25) rotate(6deg);
}
/* ================= EXPLORE COURSE CARD ================= */

.card{
  background:#1a1200;
  transition:all .25s ease;
}

.card:hover{
  background:linear-gradient(135deg,#5a3e00,#d4a017);
  color:#0a0800;
  transform:translateY(-8px);
}

/* change text color inside card */

.card:hover h3,
.card:hover p{
  color:#0a0800;
}


/* ================= YOUR COURSE CARD ================= */

.course-card{
  background:#1a1200;
  transition:all .25s ease;
}

.course-card:hover{
 
  background:linear-gradient(135deg,#5a3e00,#d4a017);
  color:#0a0800;

  transform:translateY(-6px);
}

.course-card:hover p{
  color:#0a0800;
}
.view,
.enroll,
.course-card button{
  transition:all .25s ease;
}

.view:hover{
  transform:translateY(-2px);
}

.enroll:hover{
  transform:translateY(-2px) scale(1.03);
}

.course-card button:hover{
  transform:translateY(-2px) scale(1.04);
}
.section{
  opacity:0;
  transform:translateY(20px);
  animation:sectionFade .7s ease forwards;
}

.section:nth-child(2){ animation-delay:.1s }
.section:nth-child(3){ animation-delay:.2s }
.section:nth-child(4){ animation-delay:.3s }
.section:nth-child(5){ animation-delay:.4s }

@keyframes sectionFade{
  to{
    opacity:1;
    transform:translateY(0);
  }
}
.cta button{
  transition:all .3s ease;
}

.cta button:hover{
  transform:translateY(-4px) scale(1.03);
  box-shadow:0 20px 40px rgba(180,130,0,.45);
}
</style>