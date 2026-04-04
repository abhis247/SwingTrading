<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { auth } from "$lib/firebase";
  import { goto } from "$app/navigation";
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

      if (!user) {
        goto("/auth/login" ,{ replaceState:true });
        return;
      }

      await fetchMentors();
      listenRealtime();
    });
  });

  //////////////////////////////////////////////////////
  // REALTIME UPDATE (instant last message change)
  //////////////////////////////////////////////////////
  function listenRealtime() {
    supabase
      .channel("chat_messages_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const newMsg = payload.new;

          mentors = mentors
            .map((item) => {
              if (item.roomId === newMsg.room_id) {
                return {
                  ...item,
                  lastMessage: newMsg
                };
              }
              return item;
            })
            .sort((a, b) => {
              const aTime = new Date(a.lastMessage?.created_at || 0).getTime();
              const bTime = new Date(b.lastMessage?.created_at || 0).getTime();
              return bTime - aTime;
            });
        }
      )
      .subscribe();
  }

  //////////////////////////////////////////////////////
  // FETCH ONLY USER CHATTED MENTORS
  //////////////////////////////////////////////////////
 async function fetchMentors() {
  if (!user) return;

  loading = true;

  /// 1️⃣ Get chat rooms of this student
  const { data: rooms } = await supabase
    .from("chat_rooms")
    .select("id, mentor_id")
    .eq("student_id", user.uid);

  if (!rooms || rooms.length === 0) {
    mentors = [];
    loading = false;
    return;
  }

  let finalList: any[] = [];

  for (let room of rooms) {

    /// 2️⃣ Get last message (IMPORTANT)
    const { data: lastMessage } = await supabase
      .from("chat_messages")
      .select("message, created_at")
      .eq("room_id", room.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    /// 🚫 Skip room if no message
    if (!lastMessage) continue;

    /// 3️⃣ Get mentor info
    const { data: mentor } = await supabase
      .from("mentors")
      .select(`
        uid,
        expertise,
        users (
          name,
          profile_image
        )
      `)
      .eq("uid", room.mentor_id)
      .single();

    finalList.push({
      mentor,
      lastMessage,
      roomId: room.id
    });
  }

  /// 4️⃣ Sort by latest message
  finalList.sort((a, b) => {
    const aTime = new Date(a.lastMessage.created_at).getTime();
    const bTime = new Date(b.lastMessage.created_at).getTime();
    return bTime - aTime;
  });

  mentors = finalList;
  loading = false;
}

  //////////////////////////////////////////////////////
  // OPEN CHAT PAGE
  //////////////////////////////////////////////////////
  function openChat(item: any) {
    goto(`/page/chat_page/${item.roomId}`);
  }

  //////////////////////////////////////////////////////
  // TIME FORMAT
  //////////////////////////////////////////////////////
  function formatTime(time: string) {
    const date = new Date(time);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 86400000;

    if (diff < 1)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (diff < 2) return "Yesterday";

    if (diff < 7)
      return date.toLocaleDateString([], { weekday: "short" });

    return date.toLocaleDateString([], { day: "numeric", month: "short" });
  }
</script>

<!-- APP BAR -->
<AppBar title="Messages" showBack={true} />

{#if loading}
  <div class="center">Loading chats...</div>

{:else if mentors.length === 0}
  <div class="center">No conversations yet</div>

{:else}

<div class="container">
  {#each mentors as item}
    <button
      class="mentor-card"
      on:click={() => openChat(item)}
      aria-label="Open chat"
    >

      <!-- Avatar -->
      <div class="avatar">
        {#if item.mentor?.users?.profile_image}
          <img src={item.mentor.users.profile_image} alt="" />
        {:else}
          {item.mentor?.users?.name?.charAt(0).toUpperCase() || "M"}
        {/if}
      </div>

      <!-- Content -->
      <div class="content">
        <div class="name">
          {item.mentor?.users?.name || "Mentor"}
        </div>

        <div class="last">
          {item.lastMessage?.message || "Start conversation"}
        </div>
      </div>

      <!-- Right -->
      <div class="right">
        {#if item.lastMessage}
          <div class="time">
            {formatTime(item.lastMessage.created_at)}
          </div>
        {/if}
        <div class="chat-icon">💬</div>
      </div>
    </button>
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
  --clr-muted:#6b7280;   /* ✅ ADD THIS */

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
/* ================= CONTAINER ================= */
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
  background: var(--clr-card-bg);   /* ✅ DARK */
  padding: 14px;
  border-radius: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  border: 1px solid var(--clr-card-border);
  box-shadow: 0 10px 24px rgba(0,0,0,0.5);
  transition: 0.25s;
  width: 100%;
  text-align: left;
}

.mentor-card:hover {
  transform: translateY(-3px);
}

/* ================= AVATAR ================= */
.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg,#7a5400,#d4a017);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 14px;
  overflow: hidden;
  color: black;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ================= CONTENT ================= */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* 👤 NAME */
.name {
  font-weight: 600;
  font-size: 15px;
  color: var(--clr-heading);   /* white */
}

/* 💬 LAST MESSAGE */
.last {
  font-size: 13px;
  color: var(--clr-subtext);   /* gray */
}

/* ================= RIGHT ================= */
.right {
  text-align: right;
}

/* 🕒 TIME */
.time {
  font-size: 11px;
  color: var(--clr-muted);     /* dim */
  margin-bottom: 6px;
}

/* 💬 ICON */
.chat-icon {
  background: #1a1404;
  color: var(--clr-accent);
  padding: 8px;
  border-radius: 50%;
}

/* ================= EMPTY ================= */
.center {
  text-align: center;
  padding: 60px;
  color: var(--clr-subtext);
}
</style>