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
/* FULL PAGE LOCK */
.chat-page {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* WRAPPER PREVENTS PAGE SCROLL */
.chat-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* CHAT SCROLL AREA */
.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #e8e9ea;
  -webkit-overflow-scrolling: touch;
}

/* MESSAGE ROWS */
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
  max-width: 260px;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
}

.me .bubble {
  background: #1b8e5a;
  color: white;
}

.other .bubble {
  background: white;
  color: black;
}

/* INPUT */
.input-area {
  display: flex;
  padding: 10px;
  background: white;
  border-top: 1px solid #eee;
}

.input-area input {
  flex: 1;
  padding: 10px;
  border-radius: 20px;
  border: 1px solid #ddd;
}

.send-btn {
  margin-left: 8px;
  background: #1b8e5a;
  border: none;
  color: white;
  padding: 0 16px;
  border-radius: 20px;
  cursor: pointer;
}

.center {
  text-align: center;
  padding: 60px;
}
</style>