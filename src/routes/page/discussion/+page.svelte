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

  if (file.type.startsWith("image/") && file.size > 2 * 1024 * 1024) {
    alert("Image max 2MB");
    return;
  }

  if (file.type === "application/pdf" && file.size > 5 * 1024 * 1024) {
    alert("PDF max 5MB");
    return;
  }

  // Preview
  if (file.type.startsWith("image/")) {
    if (type === "post") previewPost = URL.createObjectURL(file);
    else if (postId) previewReply[postId] = URL.createObjectURL(file);
  }

  // Loading state
  if (type === "post") uploadingPost = true;
  else if (postId) uploadingReply[postId] = true;

  const path = file.type.startsWith("image/")
    ? `images/${Date.now()}-${file.name}`
    : `pdfs/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("uploads")
    .upload(path, file);

  if (error) {
    alert(error.message);
    if (type === "post") uploadingPost = false;
    else if (postId) uploadingReply[postId] = false;
    return;
  }

  const { data } = supabase.storage
    .from("uploads")
    .getPublicUrl(path);

  const fileData = {
    url: data.publicUrl,
    type: file.type.startsWith("image/") ? "image" : "pdf"
  };

  if (type === "post") {
    uploadedPostFile = fileData;
    uploadingPost = false;
  } else if (postId) {
    uploadedReplyFile[postId] = fileData;
    uploadingReply[postId] = false;
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

    await supabase.from("posts").insert({
      user_uid: user.uid,
      user_name: user.displayName ?? "User",
      user_photo: user.photoURL,
      content: newPost.trim(),
      created_at: new Date().toISOString(),
      likes_count: 0
    });

    newPost = "";
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

        {#if post.user_photo}
          <img class="avatar-img" src={post.user_photo} />
        {:else}
          <div class="avatar-letter">
            {getInitial(post.user_name)}
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
.wrapper {
  max-width: 720px;
  margin: auto;
  padding: 24px 16px;
  background: #f4f6f9;
  min-height: 100vh;
}

.card {
  background: #ffffff;
  padding: 20px;
  border-radius: 20px;
  margin-bottom: 22px;
  box-shadow: 0 12px 28px rgba(0,0,0,0.06);
}

.header {
  display: flex;
  align-items: center;
  gap: 14px;
}

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
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: white;
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

.content {
  margin: 16px 0;
  line-height: 1.6;
}


.send-btn {
  padding: 8px;
  border-radius: 28px;
  border: none;
  background: #2563eb;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s ease;
}

.send-btn:hover {
  background: #1e40af;
  transform: scale(1.05);
}

.send-btn:active {
  transform: scale(0.9);
}

.send-btn:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

/* Loader animation */

@keyframes spin {
  to { transform: rotate(360deg); }
}
.actions {
  display: flex;
  gap: 20px;
  border-top: 1px solid #f1f1f1;
  padding-top: 12px;
}

.like-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  gap: 6px;
}

.like-btn.active {
  color: #2563eb;
}

.count {
  background: #eef2ff;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.reply-toggle {
  background: none;
  border: none;
  cursor: pointer;
}
.menu {
  margin-left: auto;
  position: relative;
  display: flex;
  align-items: center;
}

.menu-btn {
  background: #f3f4f6;        /* light grey background */
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  color: #111827;             /* dark icon */
  transition: 0.2s ease;
}

.menu-btn:hover {
  background: #e5e7eb;
}

.dropdown {
  position: absolute;
  right: 0;
  top: 35px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 12px 25px rgba(0,0,0,0.12);
  overflow: hidden;
  min-width: 120px;
}

.dropdown div {
  padding: 10px 14px;
  cursor: pointer;
}

.dropdown div:hover {
  background: #f3f4f6;
}

.dropdown .delete {
  color: #dc2626;
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
  background: #f3f4f6;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 13px;
}

.view-more {
  margin-top: 10px;
  font-size: 13px;
  color: #2563eb;
  cursor: pointer;
}

.reply-input {
  margin-top: 16px;
  padding-left: 36px;
  display: flex;
  gap: 10px;
}

.reply-input input {
  flex: 1;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
}

.post-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 999px;
  cursor: pointer;
}

.add-header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.add-header input {
  flex: 1;
  padding: 12px 16px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
}
/* EDIT MODAL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  animation: fadeIn 0.2s ease;
}

.modal {
  background: white;
  width: 92%;
  max-width: 420px;
  padding: 24px;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.2);
  animation: scaleIn 0.2s ease;
}

.modal h3 {
  margin-bottom: 16px;
  font-weight: 600;
}

.modal textarea {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  resize: none;
  font-family: inherit;
  outline: none;
  transition: 0.2s;
}

.modal textarea:focus {
  border-color: #2563eb;
}

.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  background: #e5e7eb;
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
}

.save-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 999px;
  cursor: pointer;
}

.save-btn:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from { opacity: 0 }
  to { opacity: 1 }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0 }
  to { transform: scale(1); opacity: 1 }
}



.file-btn {
  background: #eef2ff;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
}

.file-btn input {
  display: none;
}

.uploading {
  font-size: 13px;
  color: #2563eb;
  margin-top: 8px;
}

.post-img {
  width: 100%;
  margin-top: 10px;
  border-radius: 12px;
}

.pdf-preview {
  margin-top: 10px;
  padding: 10px;
  background: #f3f4f6;
  border-radius: 10px;
  font-size: 14px;
}
.reply-img-preview {
  width: 120px;
  border-radius: 10px;
  margin-top: 8px;
}

.uploading {
  font-size: 13px;
  color: #2563eb;
  margin-top: 6px;
}
</style>