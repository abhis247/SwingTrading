<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { auth } from "$lib/firebase";
  import { supabase } from "$lib/supabase";
  import AppBar from "$lib/AppBar1.svelte";

  let inbox: any[] = [];
  let loading = true;
  let channel: any;
  let search = "";

  /* ================= FILTER ================= */

  $: filteredInbox =
    search.trim() === ""
      ? inbox
      : inbox.filter((item) => {
          const name = item.student?.name?.toLowerCase() ?? "";
          const message = item.lastMessage?.message?.toLowerCase() ?? "";

          return (
            name.includes(search.toLowerCase()) ||
            message.includes(search.toLowerCase())
          );
        });

  /* ================= LOAD ================= */

  onMount(() => {
    const unsubscribe = auth.onAuthStateChanged(async (mentor) => {
      if (!mentor) {
        goto("/auth/login");
        return;
      }

      await fetchInbox(mentor.uid);

      // 🔥 Realtime listener
      channel = supabase
        .channel("mentor_inbox_realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages"
          },
          () => {
            fetchInbox(mentor.uid);
          }
        )
        .subscribe();
    });

    return () => {
      unsubscribe();
    };
  });

  onDestroy(() => {
    if (channel) supabase.removeChannel(channel);
  });

  async function fetchInbox(mentorId: string) {
    try {
      const { data: rooms } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("mentor_id", mentorId)
        .order("created_at", { ascending: false });

      if (!rooms) {
        inbox = [];
        loading = false;
        return;
      }

      let finalInbox: any[] = [];

      for (let room of rooms) {
        const { data: student } = await supabase
          .from("users")
          .select("name, profile_image")
          .eq("uid", room.student_id)
          .maybeSingle();

        const { data: lastMessage } = await supabase
          .from("chat_messages")
          .select("message, created_at")
          .eq("room_id", room.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        finalInbox.push({
          room,
          student,
          lastMessage
        });
      }

      inbox = finalInbox;
      loading = false;

    } catch (e) {
      console.error("Inbox error:", e);
      loading = false;
    }
  }

  /* ================= TIME FORMAT ================= */

  function formatTime(time: string) {
    const date = new Date(time);
    const now = new Date();

    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    if (diffDays === 1) return "Yesterday";

    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }

    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short"
    });
  }
</script>

<AppBar title="Student Messages" showBack={true} />

<div class="page">

  <!-- SEARCH -->
  <div class="search-box">
    <input
      type="text"
      placeholder="Search chats..."
      bind:value={search}
    />
  </div>

  {#if loading}
    <div class="center">Loading chats...</div>

  {:else if filteredInbox.length === 0}
    <div class="center">No chats found</div>

  {:else}
    <div class="list">
      {#each filteredInbox as item}
        <button
          type="button"
          class="card"
          on:click={() =>
            goto(`/page/chat_page/${item.room.id}`)
          }
        >

          <!-- Avatar -->
          <div class="avatar">
            {#if item.student?.profile_image}
              <img src={item.student.profile_image} alt="profile" />
            {:else}
              {item.student?.name?.[0]?.toUpperCase() ?? "S"}
            {/if}
          </div>

          <!-- Info -->
          <div class="info">
            <div class="name">
              {item.student?.name ?? "Student"}
            </div>

            <div class="last-message">
              {item.lastMessage?.message ?? "Start conversation"}
            </div>
          </div>

          <!-- Time -->
          {#if item.lastMessage}
            <div class="time">
              {formatTime(item.lastMessage.created_at)}
            </div>
          {/if}

        </button>
      {/each}
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
* {
  box-sizing: border-box;
}
:global(body){
  margin:0;
  background: var(--clr-page-bg);
  font-family: system-ui;
  color: var(--clr-heading);
}

* {
  box-sizing: border-box;
}

.page {
  padding: 18px;
  background: var(--clr-page-bg);
  min-height: 100vh;
}

/* ================= SEARCH ================= */

.search-box {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.search-box input {
  width: 100%;
  max-width: 420px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--clr-card-border);
  font-size: 14px;
  background: var(--clr-view-btn-bg);
  color: var(--clr-heading);
  transition: .2s ease;
}

.search-box input::placeholder {
  color: var(--clr-subtext);
}

.search-box input:focus {
  outline: none;
  border-color: var(--clr-accent);
  box-shadow: 0 0 0 3px var(--clr-accent-shadow);
}

/* ================= CENTER ================= */

.center {
  text-align: center;
  padding: 40px;
  color: var(--clr-subtext);
  font-size: 14px;
}

/* ================= LIST ================= */

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ================= CARD ================= */

.card {
  width: 100%;
  border: 1px solid var(--clr-card-border);
  text-align: left;
  background: var(--clr-card-bg);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 6px 18px var(--clr-accent-shadow);
  cursor: pointer;
  transition: .25s ease;
  min-width: 0;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px var(--clr-accent-shadow2);
}

/* ================= AVATAR ================= */

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--clr-icon-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: var(--clr-accent);
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ================= INFO ================= */

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 600;
  font-size: 15px;
  color: var(--clr-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.last-message {
  font-size: 13px;
  color: var(--clr-subtext);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ================= TIME ================= */

.time {
  font-size: 12px;
  color: var(--clr-subtext);
  flex-shrink: 0;
  margin-left: 6px;
}

/* ================= MOBILE ================= */

@media (max-width: 480px) {

  .page {
    padding: 14px;
  }

  .card {
    padding: 12px;
    gap: 12px;
  }

  .avatar {
    width: 42px;
    height: 42px;
  }

  .name {
    font-size: 14px;
  }

  .last-message {
    font-size: 12px;
  }

}

/* ================= TABLET ================= */

@media (min-width: 768px) {

  .page {
    padding: 32px;
  }

  .card {
    padding: 16px;
  }

  .name {
    font-size: 16px;
  }

}

/* ================= DESKTOP GRID ================= */

@media (min-width: 1100px) {

  .list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

}
</style>