<script lang="ts">
  import { onMount ,onDestroy} from "svelte";
  import { supabase } from "$lib/supabase";
  import { auth } from "$lib/firebase";
  import { onAuthStateChanged } from "firebase/auth";
  import AppBar from "$lib/AppBar1.svelte";


  let user: any = null;
  let posts: any[] = [];
  let replies: Record<string, any[]> = {};
  let newPost = "";
  let replyText: Record<string, string> = {};
  let likedPosts: Record<string, boolean> = {};
  let showReply: Record<string, boolean> = {};
  let showAllReplies: Record<string, boolean> = {};
  let openMenu: string | null = null;
  let showEditModal = false;
  let editingPostId: string | null = null;
  let editingContent = "";



  let imageError: Record<string, boolean> = {};


let uploadedPostFile: any = null;
let uploadedReplyFile: Record<string, any> = {};

let previewPost: string | null = null;
let previewReply: Record<string, string | null> = {};

let uploadingPost = false;
let uploadingReply: Record<string, boolean> = {};

async function handleFileUpload(file: File, type: "post" | "reply", postId?: string) {
  if (!file) return;

  // ✅ Validation
  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    alert("Only image or PDF allowed");
    return;
  }

  // (optional limit — you used 88MB 😅)
  if (file.size > 88 * 1024 * 1024) {
    alert("File too large");
    return;
  }

  // ✅ Preview
  if (file.type.startsWith("image/")) {
    if (type === "post") previewPost = URL.createObjectURL(file);
    else if (postId) previewReply[postId] = URL.createObjectURL(file);
  }

  // ❌ REMOVE ALL SUPABASE UPLOAD CODE FROM HERE

  // ✅ Just store file
  if (type === "post") {
    uploadedPostFile = file;
  } else if (postId) {
    uploadedReplyFile[postId] = file;
  }
}
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;

  // If clicked element is NOT inside .menu
  if (!target.closest(".menu")) {
    openMenu = null;
  }
}

onMount(() => {
  document.addEventListener("click", handleClickOutside);
});

onDestroy(() => {
  document.removeEventListener("click", handleClickOutside);
});
  //////////////////////////////////////////////////////
  // INIT
  //////////////////////////////////////////////////////
  onMount(() => {
    onAuthStateChanged(auth, async (u) => {
      user = u;
      await loadPosts();
      await loadReplies();
      await loadLikedPosts();
    });

    subscribeRealtime();
  });

  //////////////////////////////////////////////////////
  // LOAD POSTS
  //////////////////////////////////////////////////////
  async function loadPosts() {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    posts = data || [];
  }

  //////////////////////////////////////////////////////
  // LOAD REPLIES
  //////////////////////////////////////////////////////
  async function loadReplies() {
    const { data } = await supabase
      .from("replies")
      .select("*")
      .order("created_at");

    replies = {};
    data?.forEach((r) => {
      if (!replies[r.post_id]) replies[r.post_id] = [];
      replies[r.post_id].push(r);
    });
  }

  //////////////////////////////////////////////////////
  // LOAD LIKES
  //////////////////////////////////////////////////////
  async function loadLikedPosts() {
    if (!user) return;

    const { data } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_uid", user.uid);

    likedPosts = {};
    data?.forEach((l) => likedPosts[l.post_id] = true);
  }

  //////////////////////////////////////////////////////
  // ADD POST
  //////////////////////////////////////////////////////
  async function addPost() {
  if (!user || !newPost.trim()) return;

  let fileUrl = null;
  let fileType = null;

  // ✅ Upload happens HERE
  if (uploadedPostFile) {
    const file = uploadedPostFile;

    const path = `images/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage.from("uploads")
    .upload(path, file)

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("uploads")
      .getPublicUrl(path);

    fileUrl = data.publicUrl;
    fileType = file.type.startsWith("image/") ? "image" : "pdf";
  }

  await supabase.from("posts").insert({
    user_uid: user.uid,
    user_name: user.displayName ?? "User",
    user_photo: user.photoURL,
    content: newPost.trim(),
    file_url: fileUrl,
    file_type: fileType,
    created_at: new Date().toISOString(),
    likes_count: 0
  });

  // reset
  newPost = "";
  uploadedPostFile = null;
  previewPost = null;

  await loadPosts();
}
  //////////////////////////////////////////////////////
  // ADD REPLY
  //////////////////////////////////////////////////////
  async function addReply(postId: string) {
    const text = replyText[postId];
    if (!user || !text?.trim()) return;

    await supabase.from("replies").insert({
      post_id: postId,
      user_uid: user.uid,
      user_name: user.displayName ?? "User",
      user_photo: user.photoURL,
      content: text.trim(),
      created_at: new Date().toISOString()
    });

    replyText[postId] = "";
  }

  //////////////////////////////////////////////////////
  // DELETE POST
  //////////////////////////////////////////////////////
  async function deletePost(postId: string) {
    await supabase.from("posts").delete().eq("id", postId);
    openMenu = null;
  }

  //////////////////////////////////////////////////////
  // EDIT POST
  //////////////////////////////////////////////////////
  function openEdit(post: any) {
  editingPostId = post.id;
  editingContent = post.content;
  showEditModal = true;
  openMenu = null;
}

async function saveEdit() {
  if (!editingPostId || !editingContent.trim()) return;

  await supabase
    .from("posts")
    .update({ content: editingContent.trim() })
    .eq("id", editingPostId);

  showEditModal = false;
  editingPostId = null;
  editingContent = "";
}

function closeEdit() {
  showEditModal = false;
  editingPostId = null;
  editingContent = "";
}

  //////////////////////////////////////////////////////
  // TOGGLE LIKE
  //////////////////////////////////////////////////////
 async function toggleLike(post: any) {
  if (!user) return;

  const postId = post.id;

  post.likes_count = post.likes_count ?? 0;

  const alreadyLiked = likedPosts[postId];

  // 🚀 OPTIMISTIC UPDATE (instant UI change)
  likedPosts[postId] = !alreadyLiked;
  post.likes_count = alreadyLiked
    ? Math.max(0, post.likes_count - 1)
    : post.likes_count + 1;

  try {
    if (alreadyLiked) {
      // Unlike
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_uid", user.uid);

      await supabase.rpc("decrement_likes", { post_id: postId });

    } else {
      // Like
      await supabase
        .from("post_likes")
        .insert({
          post_id: postId,
          user_uid: user.uid
        });

      await supabase.rpc("increment_likes", { post_id: postId });
    }

  } catch (err) {
    console.error("Like failed:", err);

    // 🔁 Revert UI if error
    likedPosts[postId] = alreadyLiked;
    post.likes_count = alreadyLiked
      ? post.likes_count + 1
      : Math.max(0, post.likes_count - 1);
  }
}
  // REALTIME
  //////////////////////////////////////////////////////
  function subscribeRealtime() {
    supabase
      .channel("discussion")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => loadPosts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "replies" },
        () => loadReplies()
      )
      .subscribe();
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleString();
  }

  function getInitial(name: string) {
    return name?.charAt(0)?.toUpperCase() ?? "U";
  }
</script>

<AppBar title="Discussion" showBack={true} />

<div class="wrapper">
<!-- ADD POST -->
{#if user}
  <div class="card add-post">
    
    <div class="add-header">
      <input
        bind:value={newPost}
        placeholder="What's on your mind?"
        on:keydown={(e) => e.key === "Enter" && addPost()}
      />

      <!-- 📎 FILE PICK -->
      <label class="file-btn">
        📎
        <input
          type="file"
          accept="image/*,application/pdf"
          on:change={(e) => {
          const input = e.target as HTMLInputElement;
         if (input?.files?.[0]) {
        handleFileUpload(input.files[0], "post");
  }
}}
        />
      </label>

      <button class="post-btn" on:click={addPost}>
        Post
      </button>
    </div>

    <!-- 🔄 Uploading -->
    {#if uploadingPost}
      <div class="uploading">Uploading...</div>
    {/if}

    <!-- 🖼️ Image Preview -->
    {#if previewPost}
      <img src={previewPost} class="post-img" />
    {/if}

    <!-- 📄 PDF Preview -->
    {#if uploadedPostFile?.type === "pdf"}
      <div class="pdf-preview">
        📄 PDF ready to post
      </div>
    {/if}

  </div>
{/if}

  <!-- POSTS -->
  {#each posts as post}
    <div class="card">

      <div class="header">


{#if !imageError[post.id] && (post.user_uid === user?.uid
  ? user?.photoURL
  : post.user_photo)}

  <img
    class="avatar-img"
    src={
      post.user_uid === user?.uid
        ? user?.photoURL
        : post.user_photo
    }
    alt="profile"
      referrerpolicy="no-referrer"
    on:error={() => imageError[post.id] = true}
  />

{:else}

  <div class="avatar-letter">
    {(post.user_name || "U").charAt(0).toUpperCase()}
  </div>

{/if}

        <div class="user-info">
          <strong>{post.user_name}</strong>
          <small>{formatTime(post.created_at)}</small>
        </div>

        {#if user?.uid === post.user_uid}
          <div class="menu">
            <button
             class="menu-btn"
             on:click|stopPropagation={() =>
             openMenu = openMenu === post.id ? null : post.id
                                       }
                                       >
                                        ⋮
                </button>

            {#if openMenu === post.id}
              <div class="dropdown">
              <div on:click={() => openEdit(post)}>Edit</div>
                <div class="delete" on:click={() => deletePost(post.id)}>
                  Delete
                </div>
              </div>
            {/if}
          </div>
        {/if}

      </div>

      <p class="content">{post.content}</p>
      {#if post.file_url && post.file_type === "image"}
  <img alt="post" src={post.file_url} class="post-img" />
{/if}

{#if post.file_type === "pdf"}
  <a href={post.file_url} target="_blank">📄 View PDF</a>
{/if}

      <div class="actions">
        <button
          class="like-btn {likedPosts[post.id] ? 'active' : ''}"
          on:click={() => toggleLike(post)}
        >
          👍 Like
          <span class="count">{post.likes_count ?? 0}</span>
        </button>

        <button
          class="reply-toggle"
          on:click={() => showReply[post.id] = !showReply[post.id]}
        >
          💬 Reply
        </button>
      </div>

      {#if replies[post.id]?.length}
        <div class="replies">
          {#each (showAllReplies[post.id]
            ? replies[post.id]
            : replies[post.id].slice(0,2)) as r}

            <div class="reply">
              {#if r.user_photo}
                <img class="reply-img" src={r.user_photo} />
              {:else}
                <div class="reply-letter">
                  {getInitial(r.user_name)}
                </div>
              {/if}

              <div class="reply-box">
                <strong>{r.user_name}</strong>
                <p>{r.content}</p>
              </div>
            </div>
          {/each}

          {#if replies[post.id].length > 2}
            <div
              class="view-more"
              on:click={() =>
                showAllReplies[post.id] = !showAllReplies[post.id]
              }
            >
              {showAllReplies[post.id]
                ? "Hide replies"
                : `View all ${replies[post.id].length} replies`}
            </div>
          {/if}
        </div>
      {/if}

     {#if user && showReply[post.id]}
  <div class="reply-input">

    <input
      bind:value={replyText[post.id]}
      placeholder="Write a reply..."
      on:keydown={(e) => e.key === "Enter" && addReply(post.id)}
    />

    <!-- 📎 FILE PICK -->
    <label class="file-btn">
      📎
      <input
        type="file"
        accept="image/*,application/pdf"
        on:change={(e) => {
          const input = e.target as HTMLInputElement;
          if (input?.files?.[0]) {
            handleFileUpload(input.files[0], "reply", post.id);
          }
        }}
      />
    </label>

    <button class="send-btn" on:click={() => addReply(post.id)}>
      Send
    </button>
  </div>

  <!-- 🔄 Uploading -->
  {#if uploadingReply[post.id]}
    <div class="uploading">Uploading...</div>
  {/if}

  <!-- 🖼️ Image Preview -->
  {#if previewReply[post.id]}
    <img src={previewReply[post.id]} class="reply-img-preview" />
  {/if}

  <!-- 📄 PDF Preview -->
  {#if uploadedReplyFile[post.id]?.type === "pdf"}
    <div class="pdf-preview">
      📄 PDF ready to send
    </div>
  {/if}

{/if}

    </div>
  {/each}

</div>
{#if showEditModal}
  <div class="modal-overlay" on:click={closeEdit}>
    <div class="modal" on:click|stopPropagation>

      <h3>Edit Post</h3>

      <textarea
        bind:value={editingContent}
        rows="4"
        placeholder="Update your post..."
      ></textarea>

      <div class="modal-actions">
        <button class="cancel-btn" on:click={closeEdit}>
          Cancel
        </button>

        <button
          class="save-btn"
          on:click={saveEdit}
          disabled={!editingContent.trim()}
        >
          Save
        </button>
      </div>

    </div>
  </div>
{/if}
<style>
:global(body) {
  margin: 0;        /* ✅ MUST */
  padding: 0;
  background: var(--clr-page-bg);
}
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
  --clr-accent-shadow:rgba(212,160,23,0.25);
  --clr-accent-shadow2:rgba(212,160,23,0.45);

  /* ================= BACKGROUND ================= */
  --clr-page-bg:linear-gradient(180deg,#0a0800,#120d00);

  /* ================= CARD ================= */
  --clr-card-bg:#2b1f06;
  --clr-card-border:rgba(212,160,23,0.25);

  /* ================= TEXT ================= */
  --clr-heading:#fff2c2;
  --clr-subtext:#c9a84d;

  /* ================= INPUT ================= */
  --clr-input-bg:#1a1404;

  /* ================= GRADIENT ================= */
  --grad:linear-gradient(135deg,var(--clr-primary-from),var(--clr-primary-to));
}

/* ================= WRAPPER ================= */
.wrapper {
  max-width: 720px;
  margin: auto;
  padding: 24px 16px;
  background: var(--clr-page-bg);
  min-height: 100vh;
  color: var(--clr-heading);
}

/* ================= CARD ================= */
.card {
  background: var(--clr-card-bg);
  padding: 20px;
  border-radius: 20px;
  margin-bottom: 22px;
  border: 1px solid var(--clr-card-border);
  box-shadow: 0 12px 28px rgba(0,0,0,0.4);
}

/* ================= HEADER ================= */
.header {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* ================= AVATAR ================= */
.avatar-img,
.reply-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-letter,
.reply-letter {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--grad);
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.reply-letter {
  width: 32px;
  height: 32px;
  font-size: 12px;
}

/* ================= TEXT ================= */
.content {
  margin: 16px 0;
  line-height: 1.6;
  color: var(--clr-heading);
}

.user-info small {
  color: var(--clr-subtext);
}

/* ================= BUTTONS ================= */
.post-btn,
.send-btn,
.save-btn {
  background: var(--grad);
  color: black;
  border: none;
  padding: 8px 18px;
  border-radius: 999px;
  cursor: pointer;
  transition: 0.25s;
  box-shadow: 0 4px 12px var(--clr-accent-shadow);
}

.post-btn:hover,
.send-btn:hover,
.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px var(--clr-accent-shadow2);
}
.send-btn {
  flex-shrink: 0;          /* ✅ no shrinking */
  min-width: 88px;         /* ✅ touch-friendly */
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

/* ================= ACTIONS ================= */
.actions {
  display: flex;
  gap: 20px;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 12px;
}

.like-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  gap: 6px;
  color: var(--clr-subtext);
}

.like-btn.active {
  color: var(--clr-accent);
}

.count {
  background: #1a1404;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
}

/* ================= REPLY ================= */
.reply-toggle {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--clr-subtext);
}

.replies {
  margin-top: 16px;
  padding-left: 36px;
}

.reply {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.reply-box {
  background: #1a1404;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 13px;
  color: var(--clr-heading);
}

/* ================= VIEW MORE ================= */
.view-more {
  margin-top: 10px;
  font-size: 13px;
  color: var(--clr-accent);
  cursor: pointer;
}

/* ================= INPUT ================= */
.reply-input {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;        /* ✅ prevent overlap */
  padding-left: 0;        /* ✅ remove hard shift */
}
.add-header {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;   /* ✅ FIX */
}
.add-header input {
  flex: 1 1 200px;   /* ✅ flexible */
  min-width: 0;      /* ✅ prevents overflow */
}
.add-header input,
.reply-input input {
  flex: 1;
  padding: 12px 16px;
  border-radius: 999px;
  border: 1px solid var(--clr-card-border);
  background: var(--clr-input-bg);
  color: var(--clr-heading);
}


@media (max-width: 500px) {

  .post-btn {
    width: 90%;
    padding: 11px;
  }

  .file-btn {
    width: fit-content;
  }
  
  
}
/* ================= MENU ================= */
.menu {
  margin-left: auto;
  position: relative;
}

.menu-btn {
  background: #1a1404;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  color: var(--clr-heading);
}

.menu-btn:hover {
  background: #2b1f06;
}

.dropdown {
  position: absolute;
  right: 0;
  top: 35px;
  background: #1a1404;
  border-radius: 12px;
  border: 1px solid var(--clr-card-border);
  overflow: hidden;
  min-width: 120px;
}

.dropdown div {
  padding: 10px 14px;
  cursor: pointer;
}

.dropdown div:hover {
  background: #2b1f06;
}

.dropdown .delete {
  color: #ff6b6b;
}

/* ================= FILE ================= */
.file-btn {
  background: #1a1404;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
}

.file-btn input {
  display: none;
}

.uploading {
  font-size: 13px;
  color: var(--clr-accent);
  margin-top: 8px;
}

/* ================= MEDIA ================= */
.post-img {
  width: 100%;
  margin-top: 10px;
  border-radius: 12px;
}

.reply-img-preview {
  width: 120px;
  border-radius: 10px;
  margin-top: 8px;
}

.pdf-preview {
  margin-top: 10px;
  padding: 10px;
  background: #1a1404;
  border-radius: 10px;
  font-size: 14px;
}

/* ================= MODAL ================= */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal {
  background: var(--clr-card-bg);
  width: 92%;
  max-width: 420px;
  padding: 24px;
  border-radius: 20px;
  border: 1px solid var(--clr-card-border);
}

.modal textarea {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--clr-card-border);
  background: var(--clr-input-bg);
  color: var(--clr-heading);
}

.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  background: #1a1404;
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  color: var(--clr-heading);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>