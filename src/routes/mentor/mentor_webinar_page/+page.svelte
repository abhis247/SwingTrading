<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { auth } from "$lib/firebase";
  import { supabase } from "$lib/supabase";
  import AppBar from "$lib/AppBar1.svelte";

  let webinars: any[] = [];
  let loading = true;
  let user: any = null;
  let search = "";
  let openMenuId: string | null = null;

let showDeleteDialog = false;
let deleteId: string | null = null;

  $: filteredWebinars =
    search.trim() === ""
      ? webinars
      : webinars.filter((webinar) => {
          const q = search.toLowerCase();
          return (
            webinar.title?.toLowerCase().includes(q) ||
            webinar.description?.toLowerCase().includes(q)
          );
        });

  onMount(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        goto("/auth/login");
        return;
      }
      user = u;
      await fetchWebinars(u.uid);
    });

    const closeMenu = () => (openMenuId = null);
    document.addEventListener("click", closeMenu);

    return () => {
      unsub();
      document.removeEventListener("click", closeMenu);
    };
  });

  async function fetchWebinars(mentorId: string) {
    const { data } = await supabase
      .from("webinars")
      .select("*")
      .eq("mentor_id", mentorId)
      .order("schedule_at", { ascending: false });

    webinars = data ?? [];
    loading = false;
  }

  async function deleteWebinar(id: string) {
    await supabase.from("webinars").delete().eq("id", id);
    webinars = webinars.filter((w) => w.id !== id);
  }

  function toggleMenu(id: string) {
    openMenuId = openMenuId === id ? null : id;
  }

  function getStatus(webinar: any) {
    const duration = Number(webinar.duration ?? 0);
    const scheduleDate = new Date(webinar.schedule_at);
    const now = new Date();
    const endTime = new Date(scheduleDate.getTime() + duration * 60000);

    if (now < scheduleDate) return "UPCOMING";
    if (now >= scheduleDate && now <= endTime) return "LIVE";
    return "COMPLETED";
  }

  function getCountdown(webinar: any) {
    const scheduleDate = new Date(webinar.schedule_at);
    const now = new Date();
    const diff = scheduleDate.getTime() - now.getTime();

    if (diff <= 0) return "";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return `${hours}h ${minutes}m left`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function startWebinar(url: string) {
    if (!url) return;
    window.open(url, "_blank");
  }
</script>

<AppBar title="My Webinars" showBack={true} />

<div class="page">

  <button class="create-btn" on:click={() => goto("/admin/add_webinar")}>
    + Create Webinar
  </button>

  <div class="search-box">
    <input
      type="text"
      placeholder="Search webinars..."
      bind:value={search}
    />
  </div>

  {#if loading}
    <div class="center">Loading webinars...</div>

  {:else if filteredWebinars.length === 0}
    <div class="center">No webinars found</div>

  {:else}
    <div class="list">
      {#each filteredWebinars as webinar}
        <div class="card">

          <!-- MENU -->
          <div class="menu-wrapper" on:click|stopPropagation>
            <button
              type="button"
              class="menu-btn"
              on:click={() => toggleMenu(webinar.id)}
            >
              ⋮
            </button>

            {#if openMenuId === webinar.id}
              <div class="popup-menu" on:click|stopPropagation>
                <button
                  type="button"
                  disabled={getStatus(webinar) !== "LIVE"}
                  on:click={() => {
                    startWebinar(webinar.meeting_link);
                    openMenuId = null;
                  }}
                >
                  ▶ Start Webinar
                </button>

                <button
                  type="button"
                  on:click={() => {
                    goto(`/admin/edit_webinar/${webinar.id}`);
                    openMenuId = null;
                  }}
                >
                  ✏ Edit
                </button>

               <button
  type="button"
  class="delete-item"
  on:click={() => {
    deleteId = webinar.id;
    showDeleteDialog = true;
    openMenuId = null;
  }}
>
  🗑 Delete
</button>
              </div>
            {/if}
          </div>

          <!-- IMAGE LEFT -->
          <div class="image">
            {#if webinar.banner}
              <img src={webinar.banner} alt="banner" />
            {:else}
              🎥
            {/if}
          </div>

          <!-- CONTENT RIGHT -->
          <div class="content">
            <div class="title">{webinar.title}</div>

            <div class="desc">{webinar.description}</div>

            <div class="schedule">
              {formatDate(webinar.schedule_at)}
            </div>

            {#if getStatus(webinar) === "UPCOMING"}
              <div class="countdown">
                {getCountdown(webinar)}
              </div>
            {/if}

            <div class="badges">
              <span>{webinar.duration} min</span>
              <span>{webinar.attendees_count ?? 0} students</span>
              <span class={getStatus(webinar).toLowerCase()}>
                {getStatus(webinar)}
              </span>
            </div>
          </div>

        </div>
      {/each}
    </div>
  {/if}

</div>
{#if showDeleteDialog}
  <div class="dialog-overlay">
    <div class="dialog-box">

      <div class="dialog-title">Delete Webinar?</div>
      <div class="dialog-text">
        This action cannot be undone.
      </div>

      <div class="dialog-actions">
        <button
          class="cancel-btn"
          on:click={() => {
            showDeleteDialog = false;
            deleteId = null;
          }}
        >
          Cancel
        </button>

        <button
          class="confirm-btn"
          on:click={async () => {
            if (deleteId) {
              await deleteWebinar(deleteId);
            }
            showDeleteDialog = false;
            deleteId = null;
          }}
        >
          Yes, Delete
        </button>
      </div>

    </div>
  </div>
{/if}

<style>
.page {
  max-width: 1000px;
  margin: auto;
  padding: 30px 20px;
  background: #f5f7fb;
  min-height: 100vh;
}

/* BUTTON */
.create-btn {
  margin-bottom: 18px;
  padding: 12px 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1fae4b, #28c76f);
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(31,174,75,.25);
}

/* SEARCH */
.search-box {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.search-box input {
  width: 100%;
  max-width: 460px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid #e0e0e0;
}

/* LIST */
.list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* CARD */
.card {
  background: white;
  border-radius: 18px;
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
  position: relative;
  box-shadow: 0 6px 18px rgba(0,0,0,.05);
  transition: .2s ease;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(0,0,0,.08);
}

/* IMAGE */
.image {
  width: 95px;
  height: 95px;
  border-radius: 14px;
  overflow: hidden;
  background: #e8f5ee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* CONTENT */
.content {
  flex: 1;
  padding-right: 55px;
}

.title {
  font-weight: 600;
  font-size: 16px;
}

.desc {
  font-size: 13px;
  margin-top: 4px;
  color: #666;
}

.schedule {
  margin-top: 4px;
  font-size: 12px;
  color: #888;
}

.countdown {
  margin-top: 4px;
  font-size: 12px;
  color: #ff9800;
}

.badges {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badges span {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  background: rgba(31,174,75,.1);
  color: #1fae4b;
}

/* STATUS */
.upcoming { background: #fff3e0; color: #fb8c00; }
.live { background: #e8f5e9; color: #2e7d32; }
.completed { background: #eeeeee; color: #777; }

/* MENU */
.menu-wrapper {
  position: absolute;
  top: 12px;
  right: 12px;
}

.menu-btn {
  border: none;
  background: rgba(31,174,75,.15);
  color: #1fae4b;
  font-size: 18px;
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
}

.popup-menu {
  position: absolute;
  right: 0;
  top: 36px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(0,0,0,.12);
  min-width: 160px;
  padding: 6px 0;
}

.popup-menu button {
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
}

.popup-menu button:hover {
  background: #f5f5f5;
}

.delete-item {
  color: #e53935;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .card {
    flex-direction: row;
  }

  .image {
    width: 80px;
    height: 80px;
  }

  .content {
    padding-right: 50px;
  }
}
/* ================= DELETE DIALOG ================= */

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  animation: fadeIn .2s ease;
}

.dialog-box {
  background: white;
  padding: 28px;
  border-radius: 20px;
  width: 90%;
  max-width: 380px;
  box-shadow: 0 20px 50px rgba(0,0,0,.2);
  text-align: center;
  animation: slideUp .2s ease;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
}

.dialog-text {
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  margin-top: 22px;
  justify-content: center;
}

.cancel-btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
}

.confirm-btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: #e53935;
  color: white;
  cursor: pointer;
}

.confirm-btn:hover {
  background: #c62828;
}

/* Animations */

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>