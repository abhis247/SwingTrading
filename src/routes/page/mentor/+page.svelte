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
      if (!u) {
        goto("/login");
        return;
      }

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
    if (!user) return;

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
.container {
  max-width: 720px;
  margin: auto;
  padding: 16px;
}

.mentor-card {
  display: flex;
  align-items: center;
  background: white;
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  gap: 14px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content {
  flex: 1;
}

.name {
  font-size: 15px;
  font-weight: 600;
}

.email {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.expertise {
  font-size: 12px;
  font-weight: 500;
  margin-top: 6px;
}

.bio {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.contact-btn {
  background: #1B8E5A;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 18px;
  font-size: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.contact-btn:hover {
  opacity: 0.9;
}

.center {
  text-align: center;
  padding: 60px;
}
</style>