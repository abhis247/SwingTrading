<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { auth } from "$lib/firebase";
  import { goto } from "$app/navigation";
  import { getOrCreateChatRoom } from "$lib/chatService";
  import AppBar from "$lib/AppBar1.svelte";

  let mentors: any[] = [];
  let loading = true;
  let user: any = null;

  //////////////////////////////////////////////////////
  // INIT
  //////////////////////////////////////////////////////
  onMount(() => {
    auth.onAuthStateChanged(async (u) => {
      

      user = u;
      await loadMentors();
    });
  });

  //////////////////////////////////////////////////////
  // LOAD MENTORS
  //////////////////////////////////////////////////////
  async function loadMentors() {
    const { data, error } = await supabase
      .from("mentors")
      .select(`
        id,
        uid,
        expertise,
        experience,
        bio,
        users (
          name,
          email,
          profile_image
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Mentor load error:", error);
      loading = false;
      return;
    }

    mentors = data || [];
    loading = false;
  }

  //////////////////////////////////////////////////////
  // CONTACT MENTOR
  //////////////////////////////////////////////////////
  async function contactMentor(mentor: any) {
  if (!user) {
    goto("/auth/login");
    return;
  }
    const roomId = await getOrCreateChatRoom(user.uid, mentor.uid);
    goto(`/page/chat_page/${roomId}`);
  }
</script>

<!-- APP BAR -->
<AppBar title="Mentors" showBack={true} />

{#if loading}
  <div class="center">Loading mentors...</div>

{:else if mentors.length === 0}
  <div class="center">No mentors found</div>

{:else}

<div class="container">
  {#each mentors as mentor}

    <div class="mentor-card">

      <!-- PROFILE IMAGE -->
      <div class="avatar">
        {#if mentor.users?.profile_image}
          <img src={mentor.users.profile_image} alt="" />
        {:else}
          👤
        {/if}
      </div>

      <!-- CONTENT -->
      <div class="content">
        <div class="name">
          {mentor.users?.name || ""}
        </div>

        <div class="email">
          {mentor.users?.email || ""}
        </div>

        <div class="expertise">
          {mentor.expertise || ""}
          {#if mentor.experience}
            • {mentor.experience} yrs
          {/if}
        </div>

        <div class="bio">
          {mentor.bio || ""}
        </div>
      </div>

      <!-- CONTACT BUTTON -->
      <button
        class="contact-btn"
        on:click={() => contactMentor(mentor)}
      >
        Contact
      </button>

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
.container {
  max-width: 720px;
  margin: auto;
  padding: 16px;
  background: var(--clr-page-bg);
  min-height: 100vh;
}

/* ================= CARD ================= */
.mentor-card {
  display: flex;
  align-items: center;
  background: var(--clr-card-bg);
  padding: 14px;
  border-radius: 16px;
  margin-bottom: 14px;
  border: 1px solid var(--clr-card-border);
  box-shadow: 0 10px 24px rgba(0,0,0,0.4);
  gap: 14px;
  transition: 0.2s ease;
}

.mentor-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(0,0,0,0.5);
}

/* ================= AVATAR ================= */
.avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(135deg,#7a5400,#d4a017);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  overflow: hidden;
  color: black;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ================= CONTENT ================= */
.content {
  flex: 1;
}

.name {
  font-size: 15px;
  font-weight: 600;
  color: var(--clr-heading);
}

.email {
  font-size: 12px;
  color: var(--clr-subtext);
  margin-top: 2px;
}

.expertise {
  font-size: 12px;
  font-weight: 500;
  margin-top: 6px;
  color: var(--clr-accent);
}

.bio {
  font-size: 12px;
  color: var(--clr-subtext);
  margin-top: 4px;
  line-height: 1.4;
}

/* ================= BUTTON ================= */
.contact-btn {
  background: var(--grad);
  color: black;
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 12px;
  cursor: pointer;
  transition: 0.25s ease;
  flex-shrink: 0;
  box-shadow: 0 4px 12px var(--clr-accent-shadow);
}

.contact-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px var(--clr-accent-shadow2);
}

/* ================= CENTER ================= */
.center {
  text-align: center;
  padding: 60px;
  color: var(--clr-subtext);
}
</style>