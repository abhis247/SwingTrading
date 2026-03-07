<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { supabase } from "$lib/supabase";
  import { auth } from "$lib/firebase";
  import AppBar from "$lib/AppBar1.svelte";

  let webinars: any[] = [];
  let selectedFilter = "ALL";
  let searchText = "";
  let loading = true;
  let loadingMore = false;
  let hasMore = true;
  let user: any = null;

  let carouselRef: HTMLDivElement;
  let autoScrollTimer: any;
  let statusTimer: any;

  let currentIndex = 0;
  let carouselWidth = 0;

  let page = 0;
  let pageSize = 6;

  //////////////////////////////////////////////////////////////
  // INIT
  //////////////////////////////////////////////////////////////
  onMount(async () => {
    auth.onAuthStateChanged((u) => (user = u));

    await loadWebinars(true);

    statusTimer = setInterval(() => {
      webinars = [...webinars];
    }, 15000);

    autoScrollTimer = setInterval(autoScroll, 3000);

    if (browser) {
      window.addEventListener("scroll", handleScroll);
    }
  });

  onDestroy(() => {
    clearInterval(autoScrollTimer);
    clearInterval(statusTimer);

    if (browser) {
      window.removeEventListener("scroll", handleScroll);
    }
  });

  //////////////////////////////////////////////////////////////
  // LOAD WEBINARS
  //////////////////////////////////////////////////////////////
  async function loadWebinars(reset = false) {
    if (loadingMore || !hasMore) return;

    loadingMore = true;

    if (reset) {
      page = 0;
      webinars = [];
      hasMore = true;
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("webinars")
      .select("*")
      .order("schedule_at", { ascending: false })
      .range(from, to);

    if (error) console.error(error);

    if (data && data.length < pageSize) hasMore = false;

    webinars = [...webinars, ...(data || [])];
    page++;
    loadingMore = false;
    loading = false;
  }

  //////////////////////////////////////////////////////////////
  // SCROLL DETECTION (SAFE)
  //////////////////////////////////////////////////////////////
  function handleScroll() {
    if (!browser) return;

    const bottom =
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - 200;

    if (bottom) loadWebinars();
  }

  //////////////////////////////////////////////////////////////
  // AUTO SCROLL (SAFE)
  //////////////////////////////////////////////////////////////
  function autoScroll() {
    if (!browser) return;
    if (!carouselRef) return;

    const cards = carouselRef.querySelectorAll(".card");
    if (!cards.length) return;

    currentIndex++;
    if (currentIndex >= cards.length) currentIndex = 0;

    carouselWidth = cards[0].clientWidth + 14;

    carouselRef.scrollTo({
      left: carouselWidth * currentIndex,
      behavior: "smooth"
    });
  }

  //////////////////////////////////////////////////////////////
  // STATUS
  //////////////////////////////////////////////////////////////
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

  //////////////////////////////////////////////////////////////
  // SEARCH + FILTER
  //////////////////////////////////////////////////////////////
  $: searched = webinars.filter((w) =>
    w.title?.toLowerCase().includes(searchText.toLowerCase())
  );

  $: filtered =
    selectedFilter === "ALL"
      ? searched
      : searched.filter(
          (w) => getStatus(w.schedule_at, w.duration) === selectedFilter
        );

  $: live = filtered.filter(
    (w) => getStatus(w.schedule_at, w.duration) === "LIVE"
  );

  $: upcoming = filtered.filter(
    (w) => getStatus(w.schedule_at, w.duration) === "UPCOMING"
  );

  $: completed = filtered.filter(
    (w) => getStatus(w.schedule_at, w.duration) === "COMPLETED"
  );

  //////////////////////////////////////////////////////////////
  // HELPERS
  //////////////////////////////////////////////////////////////
  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  function getCountdown(date: string) {
    const diff = new Date(date).getTime() - Date.now();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `Starts in ${h}h ${m}m`;
  }

  //////////////////////////////////////////////////////////////
  // JOIN
  //////////////////////////////////////////////////////////////
  async function joinWebinar(webinar: any) {
    if (!user) {
      alert("Login required");
      return;
    }

    await supabase.from("webinar_attendance").insert({
      webinar_id: webinar.id,
      mentor_id: webinar.mentor_id,
      user_uid: user.uid
    });

    if (browser && webinar.meeting_link) {
      window.open(webinar.meeting_link, "_blank");
    }
  }
</script>

<AppBar title="Webinars" showBack={true} />

{#if loading}
  <div class="center">Loading webinars...</div>
{:else}

<div class="search-wrap">
  <input placeholder="Search webinar..." bind:value={searchText} />
</div>

<div class="filters">
  {#each ["ALL","UPCOMING","LIVE","COMPLETED"] as f}
    <button
      class:selected={selectedFilter === f}
      on:click={() => selectedFilter = f}
    >
      {f}
    </button>
  {/each}
</div>

{#if live.length || upcoming.length}
  <h3>Live & Upcoming</h3>

  <div class="carousel" bind:this={carouselRef}>
    {#each [...live, ...upcoming] as webinar}
     <div class="card">

  <!-- BANNER -->
  <div class="banner">
    <img src={webinar.banner} alt="banner" />

    <!-- LIVE BADGE -->
    <!-- {#if getStatus(webinar.schedule_at, webinar.duration) === "LIVE"}
      <div class="live-badge">LIVE</div>
    {/if} -->

    <!-- CATEGORY -->
    {#if webinar.category}
      <div class="category">{webinar.category}</div>
    {/if}
  </div>

  <!-- CONTENT -->
  <div class="content">

    <div class="scroll-area">

      <h4 class="title">{webinar.title}</h4>

      <p class="desc">{webinar.description}</p>

      <!-- MENTOR -->
      <div class="mentor">
        👨‍🏫 {webinar.mentor_name || "Expert Mentor"}
      </div>

      <!-- INFO ROW -->
      <div class="info-row">
        <span>🗓 {formatDate(webinar.schedule_at)}</span>
        <span>⏱ {webinar.duration} min</span>
      </div>

      <!-- ATTENDEE -->
      {#if webinar.attendee_count}
        <div class="attendees">
          👥 {webinar.attendee_count} joined
        </div>
      {/if}

      <!-- COUNTDOWN -->
      {#if getStatus(webinar.schedule_at, webinar.duration) === "UPCOMING"}
        <div class="count">
          {getCountdown(webinar.schedule_at)}
        </div>
      {/if}

    </div>

    <!-- BUTTON -->
    <div class="button-wrap">
      <button
        class="status {getStatus(webinar.schedule_at, webinar.duration)}"
        disabled={getStatus(webinar.schedule_at, webinar.duration) !== "LIVE"}
        on:click={() => joinWebinar(webinar)}
      >
        {#if getStatus(webinar.schedule_at, webinar.duration) === "LIVE"}
          Join Now
        {:else if getStatus(webinar.schedule_at, webinar.duration) === "UPCOMING"}
          Starts Soon
        {:else}
          Completed
        {/if}
      </button>
    </div>

  </div>
</div>
    {/each}
  </div>
{/if}

{#if completed.length}
  <h3>Completed</h3>

  <div class="carousel">
    {#each completed as webinar}
      <div class="card">
        <div class="banner">
          <img src={webinar.banner} alt="banner" />
        </div>

        <div class="content">
          <div class="scroll-area">
            <h4 class="title">{webinar.title}</h4>
            <div class="date">{formatDate(webinar.schedule_at)}</div>
          </div>

          <div class="button-wrap">
            <button class="status COMPLETED" disabled>
              Completed
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}

{#if !live.length && !upcoming.length && !completed.length}
  <div class="center">No webinars available</div>
{/if}

{#if loadingMore}
  <div class="center">Loading more webinars...</div>
{/if}

{/if}

<style>
/* ---------------- SEARCH ---------------- */
.search-wrap {
  padding:12px;
}

.search-wrap input {
  width:88%;
  padding:16px;
  border-radius:12px;
  border:1px solid #ddd;
  font-size:14px;
}

/* ---------------- FILTERS ---------------- */
.filters {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  padding:12px;
}

.filters button {
  padding:8px 14px;
  border-radius:20px;
  border:1px solid #ddd;
  background:white;
  font-size:13px;
}

.filters button.selected {
  background:#1b8e5a;
  color:white;
}

/* ---------------- CAROUSEL ---------------- */
.carousel {
  display:flex;
  align-items:stretch;
  overflow-x:auto;
  gap:12px;
  padding:12px;
  scroll-behavior:smooth;
  overscroll-behavior-x:contain;
}

.carousel::-webkit-scrollbar {
  display:none;
}

/* ---------------- CARD BASE ---------------- */
.card {
  flex:0 0 auto;
  width:85%;
  max-width:340px;
  height:415px;
  background:rgb(255, 255, 255);
  border-radius:16px;
  overflow:hidden;
  box-shadow:0 6px 16px rgba(0,0,0,.08);
  display:flex;
  flex-direction:column;
}

/* ---------------- BANNER ---------------- */
.banner img {
  width:100%;
  height:170px;
  object-fit:cover;
}

/* ---------------- CONTENT ---------------- */
.content {
  flex:1;
  display:flex;
  flex-direction:column;
}

.scroll-area {
  flex:1;
  overflow-y:auto;
  padding:12px;
}

.scroll-area::-webkit-scrollbar {
  display:none;
}

.title {
  font-size:15px;
  font-weight:600;
  margin-bottom:6px;
}

.desc {
  font-size:13px;
  margin-bottom:8px;
  color:#444;
}

.date {
  font-size:12px;
  color:#777;
}

.count {
  font-size:12px;
  color:#1e88e5;
  margin-top:6px;
}

/* ---------------- BUTTON ---------------- */
.button-wrap {
  padding:12px;
  text-align:right;
}

button.status {
  padding:10px 16px;
  border-radius:8px;
  border:none;
  color:white;
  font-weight:600;
  font-size:13px;
}

button.status.LIVE { background:#2e7d32; }
button.status.UPCOMING { background:#fb8c00; }
button.status.COMPLETED { background:#9e9e9e; }

/* ---------------- STATES ---------------- */
.center {
  text-align:center;
  padding:60px;
}

/* ===================================================== */
/* 📱 MOBILE (DEFAULT) */
/* ===================================================== */

@media (max-width:480px) {

  .card {
    width:100%;
    height:400px;
  }

  .banner img {
    height:150px;
  }

  .title {
    font-size:14px;
  }

  .desc {
    font-size:12px;
  }
}

/* ===================================================== */
/* 📱 TABLET */
/* ===================================================== */

@media (min-width:768px) {

  .carousel {
    gap:16px;
  }

  .card {
    width:300px;
    height:420px;
  }

  .banner img {
    height:180px;
  }
}

/* ===================================================== */
/* 💻 LAPTOP */
/* ===================================================== */

@media (min-width:1024px) {

  .carousel {
    padding-left:40px;
  }

  .card {
    width:320px;
    height:440px;
  }

  .banner img {
    height:190px;
  }

  .title {
    font-size:16px;
  }

  .desc {
    font-size:14px;
  }
}

/* ===================================================== */
/* 🖥 DESKTOP LARGE */
/* ===================================================== */

@media (min-width:1400px) {

  .carousel {
    justify-content:center;
  }

  .card {
    width:340px;
    height:460px;
  }

  .banner img {
    height:200px;
  }
}
/* ---------- BADGES ---------- */

.live-badge {
  position:absolute;
  top:10px;
  left:10px;
  background:#e53935;
  color:white;
  font-size:11px;
  padding:4px 8px;
  border-radius:6px;
  font-weight:600;
}

.category {
  position:absolute;
  bottom:10px;
  left:10px;
  background:rgba(0,0,0,.6);
  color:white;
  font-size:11px;
  padding:4px 8px;
  border-radius:6px;
}

/* ---------- MENTOR ---------- */

.mentor {
  font-size:13px;
  margin:6px 0;
  color:#333;
  font-weight:500;
}

/* ---------- INFO ROW ---------- */

.info-row {
  display:flex;
  justify-content:space-between;
  font-size:12px;
  color:#777;
  margin-top:6px;
}

/* ---------- ATTENDEE ---------- */

.attendees {
  font-size:12px;
  margin-top:6px;
  color:#555;
}

/* ---------- BUTTON IMPROVED ---------- */

button.status {
  width:100%;
  padding:12px;
  border-radius:10px;
  border:none;
  color:white;
  font-weight:600;
  font-size:14px;
  transition:.2s;
}

button.status:hover {
  transform:translateY(-1px);
  box-shadow:0 4px 12px rgba(0,0,0,.15);
}

button.status.LIVE {
  background:linear-gradient(45deg,#2e7d32,#43a047);
}

button.status.UPCOMING {
  background:linear-gradient(45deg,#fb8c00,#ffa726);
}

button.status.COMPLETED {
  background:#9e9e9e;
}
</style>