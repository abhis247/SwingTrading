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
  /* ================= ROOT ================= */
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

/* ================= BASE ================= */
:global(body){
  margin:0;
  background:var(--clr-page-bg);
  color:var(--clr-heading);
}

/* ================= SEARCH ================= */
.search-wrap {
  padding:12px;
}

.search-wrap input {
  width:100%;
  padding:14px;
  border-radius:12px;
  border:1px solid var(--clr-card-border);
  background:#1a1404;
  color:var(--clr-heading);
  outline:none;
}

/* ================= FILTER ================= */
.filters {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  padding:12px;
}

.filters button {
  padding:8px 14px;
  border-radius:20px;
  border:1px solid var(--clr-card-border);
  background:#1a1404;
  color:var(--clr-subtext);
  font-size:13px;
  cursor:pointer;
}

.filters button.selected {
  background:var(--grad);
  color:black;
}

/* ================= CAROUSEL ================= */
.carousel {
  display:flex;
  overflow-x:auto;
  gap:12px;
  padding:12px;
  scroll-behavior:smooth;
}

.carousel::-webkit-scrollbar {
  display:none;
}

/* ================= CARD ================= */
.card {
  flex:0 0 auto;
  width:85%;
  max-width:340px;
  height:420px;
  background:var(--clr-card-bg);
  border-radius:16px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 10px 24px rgba(0,0,0,0.5);
  display:flex;
  flex-direction:column;
  overflow:hidden;
  transition:.25s;
}

.card:hover {
  transform:translateY(-4px);
}

/* ================= BANNER ================= */
.banner img {
  width:100%;
  height:170px;
  object-fit:cover;
}

/* ================= CONTENT ================= */
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

/* ================= TEXT ================= */
.title {
  font-size:15px;
  font-weight:600;
  color:var(--clr-heading);
  margin-bottom:6px;
}

.desc {
  font-size:13px;
  color:var(--clr-subtext);
  margin-bottom:8px;
}

.mentor {
  font-size:13px;
  color:var(--clr-accent);
  margin:6px 0;
  font-weight:500;
}

.info-row {
  display:flex;
  justify-content:space-between;
  font-size:12px;
  color:var(--clr-muted);
  margin-top:6px;
}

.attendees {
  font-size:12px;
  color:var(--clr-subtext);
  margin-top:6px;
}

.date {
  font-size:12px;
  color:var(--clr-muted);
}

.count {
  font-size:12px;
  color:var(--clr-accent);
  margin-top:6px;
}

/* ================= CATEGORY ================= */
.category {
  position:absolute;
  bottom:10px;
  left:10px;
  background:rgba(0,0,0,.6);
  color:var(--clr-accent);
  border:1px solid var(--clr-accent);
  font-size:11px;
  padding:4px 8px;
  border-radius:6px;
}

/* ================= BUTTON ================= */
.button-wrap {
  padding:12px;
}

button.status {
  width:100%;
  padding:12px;
  border-radius:10px;
  border:none;
  font-weight:600;
  font-size:14px;
  transition:.2s;
}

button.status:hover {
  transform:translateY(-1px);
  box-shadow:0 4px 12px rgba(0,0,0,.2);
}

button.status.LIVE {
  background:linear-gradient(135deg,#16a34a,#22c55e);
}

button.status.UPCOMING {
  background:linear-gradient(135deg,#f59e0b,#fbbf24);
  color:black;
}

button.status.COMPLETED {
  background:#374151;
}

/* ================= CENTER ================= */
.center {
  text-align:center;
  padding:60px;
  color:var(--clr-subtext);
}

/* ================= RESPONSIVE ================= */
@media (min-width:768px){
  .card {
    width:300px;
  }
}

@media (min-width:1024px){
  .card {
    width:320px;
  }
}

@media (min-width:1400px){
  .carousel {
    justify-content:center;
  }
  .card {
    width:340px;
  }
}
</style>