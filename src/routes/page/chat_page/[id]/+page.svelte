<script lang="ts">
  import { onMount, tick } from "svelte";
  import { supabase } from "$lib/supabase";
  import { auth } from "$lib/firebase";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import AppBar from "$lib/AppBar1.svelte";

  let roomId: string | undefined;
  let mentorName = "Chat";

  let user: any = null;
  let messages: any[] = [];
  let messageText = "";
  let loading = true;

  let chatContainer: HTMLDivElement;

  $: roomId = $page.params.id;

  //////////////////////////////////////////////////////
  // INIT
  //////////////////////////////////////////////////////
  onMount(() => {
    auth.onAuthStateChanged(async (u) => {
      if (!u) {
        goto("/auth/login");
        return;
      }

      user = u;
      await loadMessages();
      listenRealtime();
    });
  });

  //////////////////////////////////////////////////////
  // LOAD OLD MESSAGES
  //////////////////////////////////////////////////////
  async function loadMessages() {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    messages = data || [];
    loading = false;
    autoScroll();
  }

  //////////////////////////////////////////////////////
  // REALTIME LISTENER
  //////////////////////////////////////////////////////
  function listenRealtime() {
    supabase
      .channel("room_" + roomId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          const msg = payload.new;
          const exists = messages.find((m) => m.id === msg.id);

          if (!exists) {
            messages = [...messages, msg];
            await autoScroll();
          }
        }
      )
      .subscribe();
  }

  //////////////////////////////////////////////////////
  // SEND MESSAGE
  //////////////////////////////////////////////////////
  async function sendMessage() {
    if (!messageText.trim() || !user) return;

    const tempMessage = {
      id: "temp_" + Date.now(),
      room_id: roomId,
      sender_id: user.uid,
      message: messageText.trim(),
      created_at: new Date().toISOString()
    };

    messages = [...messages, tempMessage];
    messageText = "";
    await autoScroll();

    await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: user.uid,
      message: tempMessage.message
    });
  }

  //////////////////////////////////////////////////////
  // AUTO SCROLL (PROPER VERSION)
  //////////////////////////////////////////////////////
  async function autoScroll() {
    await tick();
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }
</script>

<!-- PAGE -->
<div class="chat-page">

  <AppBar title={mentorName} showBack />

  {#if loading}
    <div class="center">Loading...</div>
  {:else}

    <div class="chat-wrapper">

      <!-- CHAT AREA -->
      <div class="chat-container" bind:this={chatContainer}>
        {#each messages as msg}
          <div class="message-row {msg.sender_id === user?.uid ? 'me' : 'other'}">
            <div class="bubble">{msg.message}</div>
          </div>
        {/each}
      </div>

      <!-- INPUT AREA -->
      <div class="input-area">
        <input
          type="text"
          bind:value={messageText}
          placeholder="Type message..."
          on:keydown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button class="send-btn" on:click={sendMessage}>➤</button>
      </div>

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
/* FULL PAGE LOCK */
/* ================= PAGE ================= */
.chat-page {
  height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* ================= WRAPPER ================= */
.chat-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ================= CHAT AREA ================= */
.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  background: var(--clr-card-bg);

  scroll-behavior: smooth;
}

/* ================= MESSAGE ================= */
.message-row {
  display: flex;
  margin-bottom: 10px;
}

.message-row.me {
  justify-content: flex-end;
}

.message-row.other {
  justify-content: flex-start;
}

.bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
}

/* MY MESSAGE */
.me .bubble {
  background: var(--clr-accent);
  color: var(--clr-heading);
}

/* OTHER MESSAGE */
.other .bubble {
  background: var(--clr-icon-bg);
  color: var(--clr-heading);
}

/* ================= INPUT ================= */
.input-area {
  display: flex;
  padding: 10px;

  background: var(--clr-card-bg);
  border-top: 1px solid var(--clr-card-border);

  position: sticky;
  bottom: 0;
}

/* INPUT FIELD */
.input-area input {
  flex: 1;
  padding: 10px;

  border-radius: 20px;
  border: 1px solid var(--clr-card-border);

  background: var(--clr-icon-bg);
  color: var(--clr-heading);
}

/* SEND BUTTON */
.send-btn {
  margin-left: 8px;
  background: var(--clr-accent);

  border: none;
  color: var(--clr-heading);

  padding: 0 16px;
  border-radius: 20px;

  cursor: pointer;
}

/* ================= LOADING ================= */
.center {
  text-align: center;
  padding: 60px;
  color: var(--clr-subtext);
}
</style>