<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { auth } from "$lib/firebase";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  import AppBar from "$lib/AppBar1.svelte";
  let player: any = null;
  let courseId: string | undefined;

  let subjects: any[] = [];
  let course: any = null;

  let loading = true;
  let user: any = null;
  let currentVideoUrl: string | null = null;
  let activeVideo = "";

  $: courseId = $page.params.id;

  //////////////////////////////////////////////////////
  // LOAD YOUTUBE API
  //////////////////////////////////////////////////////
  function loadYouTubeAPI(): Promise<void> {
    return new Promise((resolve) => {
      const w = window as any;
      if (w.YT && w.YT.Player) return resolve();

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      w.onYouTubeIframeAPIReady = () => resolve();
    });
  }

  //////////////////////////////////////////////////////
  // INIT
  //////////////////////////////////////////////////////
  onMount(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      user = u;
      if (!user) return goto("/auth/login");

      await loadYouTubeAPI();
      await loadCourse();
    });

    return () => unsub();
  });

  //////////////////////////////////////////////////////
  // LOAD COURSE + AUTOPLAY FIRST VIDEO
  //////////////////////////////////////////////////////
  async function loadCourse() {
    if (!courseId) return;

    const { data: courseData } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    course = courseData;

    const { data } = await supabase
      .from("subjects")
      .select("*, videos(*)")
      .eq("course_id", courseId)
      .order("created_at");

    subjects = data || [];
    loading = false;

    if (subjects.length && subjects[0].videos.length) {
      playVideo(subjects[0].videos[0].video_url);
    }
  }

  //////////////////////////////////////////////////////
  // PLAY VIDEO
  //////////////////////////////////////////////////////
  function playVideo(url: string) {
    currentVideoUrl = url;
    activeVideo = url;

    const videoId = getYoutubeId(url);
    const w = window as any;

    if (!videoId) return;

    if (player) player.destroy();

    setTimeout(() => {
      player = new w.YT.Player("youtube-player", {
        videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          controls: 1,
          fs: 1
        },
        events: {
          onReady: (e: any) => e.target.playVideo(),
          onStateChange: (event: any) => {
            if (event.data === 0) playNextVideo();
          }
        }
      });
    }, 300);
  }

  //////////////////////////////////////////////////////
  // AUTO PLAY NEXT VIDEO
  //////////////////////////////////////////////////////
  function playNextVideo() {
    for (let s of subjects) {
      for (let i = 0; i < s.videos.length; i++) {
        if (s.videos[i].video_url === activeVideo) {
          const next = s.videos[i + 1];
          if (next) {
            playVideo(next.video_url);
            return;
          }
        }
      }
    }
  }

  //////////////////////////////////////////////////////
  // YOUTUBE ID EXTRACTOR
  //////////////////////////////////////////////////////
  function getYoutubeId(url: string | null) {
    if (!url) return "";

    const regExp =
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([^?&]+)/;

    const match = url.match(regExp);
    return match ? match[1] : "";
  }
</script>
  <AppBar   title="Course Details" showBack={true} />
{#if loading}
  <div class="center">Loading course...</div>
{:else}

<!-- VIDEO -->
{#if currentVideoUrl}
<div class="player">
  <div id="youtube-player"></div>
  <div class="yt-block-top"></div>
<div class="yt-block-bottom"></div>
</div>
{/if}

<!-- COURSE DETAILS -->
<div class="course-card">
  <h1>{course?.title}</h1>
  <p class="description">{course?.description}</p>

  <div class="meta">
    <span>📂 {course?.category}</span>
    <span>⏱ {course?.duration}</span>
    <span>🎯 {course?.level}</span>
    <span class="price">₹{course?.price}</span>
  </div>
</div>

<!-- SUBJECTS + VIDEOS -->
<div class="subjects">
  {#each subjects as subject}
    <div class="subject">
      <h3>{subject.title}</h3>

      <div class="videos">
        {#each subject.videos as video}
          <button
            type="button"
            class="lecture {video.video_url === activeVideo ? 'active' : ''}"
            on:click={() => playVideo(video.video_url)}
          >
            ▶ {video.title}
          </button>
        {/each}
      </div>
    </div>
  {/each}
</div>

{/if}

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

/* PLAYER */
.player {
  aspect-ratio: 16/9;
  background: black;
  border-radius: 18px;
  margin-top: 16px;
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: var(--clr-accent-shadow2);
}

#youtube-player {
  width: 100%;
  height: 100%;
}

/* COURSE */
.course-card {
  background:var(--clr-card-bg); /* no root equivalent */
  padding: 20px;
  border-radius: 18px;
  margin-bottom: 24px;
  box-shadow: var(--clr-accent-shadow); /* closest match */
}

.course-card h1 {
  margin-bottom: 8px;
  color: var(--clr-heading);
}

.description {
  opacity: 0.8;
  margin-bottom: 12px;
  color: var(--clr-subtext);
}

/* META */
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta span {
  background: var(--clr-tab-idle-bg); /* closest match */
  color: var(--clr-subtext);
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
}

/* PRICE */
.price {
  background: #dcfce7;
  color: #16a34a;
  font-weight: bold;
}

/* SUBJECT */
.subject {
  background: var(--clr-card-bg);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: var(--clr-accent-shadow);
}

.subject h3 {
  margin-bottom: 10px;
  color: var(--clr-heading);
}

/* LECTURES */
.lecture {
  display: block;
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: var(--clr-tab-idle-bg); /* closest match */
  color: var(--clr-subtext);
  border: none;
  text-align: left;
  cursor: pointer;
  transition: .2s;
}

.lecture:hover {
  background: var(--clr-view-btn-hover);
}

.lecture.active {
  background: var(--grad);
  color: #fff;
  font-weight: 600;
}

/* LOADING */
.center {
  text-align: center;
  padding: 60px;
  font-size: 18px;
  color: var(--clr-subtext);
}

.yt-block-top {
  position:absolute;
  top:0;
  width:100%;
  height:80px;
}
.yt-block-bottom {
 
  position: absolute;
  bottom: 0;
  right: 4px;   /* shift left from fullscreen */
  width: 158px;
  height: 59px;
  z-index: 19;
  background: transparent;

}
</style>