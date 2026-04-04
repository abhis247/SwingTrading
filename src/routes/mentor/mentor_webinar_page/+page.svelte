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
:global(body){
  margin:0;
  background: var(--clr-page-bg);
  font-family: system-ui;
  color: var(--clr-heading);
}

.page {
  max-width: 1000px;
  margin: auto;
  padding: 30px 20px;
  min-height: 100vh;
}

/* ================= BUTTON ================= */
.create-btn {
  margin-bottom: 18px;
  padding: 12px 18px;
  border-radius: 14px;
  background: var(--grad);
  color: var(--clr-heading);
  border: none;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 16px var(--clr-accent-shadow);
}

/* ================= SEARCH ================= */
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
  border: 1px solid var(--clr-card-border);
  background: var(--clr-card-bg);
  color: var(--clr-heading);
}

/* ================= LIST ================= */
.list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ================= CARD ================= */
.card {
  background: var(--clr-card-bg);
  border-radius: 18px;
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
  position: relative;
  border: 1px solid var(--clr-card-border);
  box-shadow: 0 6px 18px var(--clr-accent-shadow);
  transition: .2s ease;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px var(--clr-accent-shadow2);
}

/* ================= IMAGE ================= */
.image {
  width: 95px;
  height: 95px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--clr-icon-bg);
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

/* ================= CONTENT ================= */
.content {
  flex: 1;
  padding-right: 55px;
}

.title {
  font-weight: 600;
  font-size: 16px;
  color: var(--clr-heading);
}

.desc {
  font-size: 13px;
  margin-top: 4px;
  color: var(--clr-subtext);
}

.schedule {
  margin-top: 4px;
  font-size: 12px;
  color: var(--clr-subtext);
}

.countdown {
  margin-top: 4px;
  font-size: 12px;
  color: var(--clr-accent);
}

/* ================= BADGES ================= */
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
  background: var(--clr-view-btn-bg);
  color: var(--clr-accent);
}

/* STATUS COLORS */
.upcoming {
  background: rgba(255,179,0,.1);
  color: #ffb300;
}

.live {
  background: rgba(0,255,157,.1);
  color: #00ff9d;
}

.completed {
  background: #333;
  color: #aaa;
}

/* ================= MENU ================= */
.menu-wrapper {
  position: absolute;
  top: 12px;
  right: 12px;
}

.menu-btn {
  border: none;
  background: var(--clr-view-btn-bg);
  color: var(--clr-accent);
  font-size: 18px;
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
}

.popup-menu {
  position: absolute;
  right: 0;
  top: 36px;
  background: var(--clr-card-bg);
  border-radius: 12px;
  border: 1px solid var(--clr-card-border);
  box-shadow: 0 12px 28px var(--clr-accent-shadow);
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
  color: var(--clr-heading);
}

.popup-menu button:hover {
  background: var(--clr-view-btn-hover);
}

.delete-item {
  color: #ff4d4d;
}

/* ================= DIALOG ================= */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.dialog-box {
  background: var(--clr-card-bg);
  padding: 28px;
  border-radius: 20px;
  width: 90%;
  max-width: 380px;
  border: 1px solid var(--clr-card-border);
  box-shadow: 0 20px 50px var(--clr-accent-shadow2);
  text-align: center;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--clr-heading);
}

.dialog-text {
  margin-top: 8px;
  font-size: 13px;
  color: var(--clr-subtext);
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
  border: 1px solid var(--clr-card-border);
  background: var(--clr-view-btn-bg);
  color: var(--clr-heading);
  cursor: pointer;
}

.confirm-btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg,#ff3b3b,#ff6b6b);
  color: white;
  cursor: pointer;
}

/* ================= RESPONSIVE ================= */
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
</style>