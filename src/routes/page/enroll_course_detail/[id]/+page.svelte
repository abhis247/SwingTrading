<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { auth } from "$lib/firebase";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

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
:global(body) {
  background: #f8fafc;
  font-family: system-ui, sans-serif;
}

/* PLAYER */
.player {
  aspect-ratio: 16/9;
  background: black;
  border-radius: 18px;
  position: relative; 
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 12px 28px rgba(0,0,0,.15);
}

#youtube-player {
  width: 100%;
  height: 100%;
}

/* COURSE */
.course-card {
  background: white;
  padding: 20px;
  border-radius: 18px;
  margin-bottom: 24px;
  box-shadow: 0 8px 20px rgba(0,0,0,.06);
}

.course-card h1 {
  margin-bottom: 8px;
}

.description {
  opacity: .8;
  margin-bottom: 12px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta span {
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
}

.price {
  background: #dcfce7 !important;
  color: #16a34a;
  font-weight: bold;
}

/* SUBJECT */
.subject {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 6px 16px rgba(0,0,0,.05);
}

.subject h3 {
  margin-bottom: 10px;
}

/* LECTURES */
.lecture {
  display: block;
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: #f8fafc;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: .2s;
}

.lecture:hover {
  background: #e2e8f0;
}

.lecture.active {
  background: #dcfce7;
  color: #16a34a;
  font-weight: 600;
}

.center {
  text-align: center;
  padding: 60px;
  font-size: 18px;
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