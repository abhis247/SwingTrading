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
* {
  box-sizing: border-box;
}

.page {
  padding: 18px;
  background: #f5f7fb;
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
  border: 1px solid #ddd;
  font-size: 14px;
  transition: .2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #1fae4b;
  box-shadow: 0 0 0 3px rgba(31,174,75,.1);
}

/* ================= CENTER ================= */

.center {
  text-align: center;
  padding: 40px;
  color: #777;
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
  border: none;
  text-align: left;
  background: white;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 14px rgba(0,0,0,.08);
  cursor: pointer;
  transition: .2s ease;
  min-width: 0;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,.12);
}

/* ================= AVATAR ================= */

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e0f2e9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #1fae4b;
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
  min-width: 0; /* 🔥 prevents overflow */
}

.name {
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.last-message {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ================= TIME ================= */

.time {
  font-size: 12px;
  color: #999;
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