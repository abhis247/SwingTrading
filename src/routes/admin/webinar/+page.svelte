<script lang="ts">
  import { supabase } from "$lib/supabase";
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import AppBar from "$lib/AppBar1.svelte";
  import { snackbar } from "$lib/snackbar";


  onMount(() => {
  loadWebinars();

  const handleClick = () => closeMenus();
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      confirmId = null;
    }
  };

  document.addEventListener("click", handleClick);
  window.addEventListener("keydown", handleKey);

  return () => {
    document.removeEventListener("click", handleClick);
    window.removeEventListener("keydown", handleKey);
  };
});

  let searchQuery = "";

$: displayedWebinars =
  searchQuery.trim() === ""
    ? webinars
    : webinars.filter(w =>
        w.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  type Webinar = {
    id: string;
    title: string;
    banner?: string;
    mentor_name?: string;
    duration?: string;
    schedule_at?: string;
    status?: string;
    showMenu?: boolean;
  };

  let webinars: Webinar[] = [];
  let loading = true;
  let confirmId: string | null = null;


  
  async function loadWebinars() {
    loading = true;

    const { data } = await supabase
      .from("webinars")
      .select("*")
      .order("schedule_at", { ascending: false });

    webinars  = (data || []).map((w) => {
  let formattedDate = "";

  if (w.schedule_at) {
    const utcDate = new Date(w.schedule_at);

    formattedDate = utcDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return {
    ...w,
    schedule_at: formattedDate,
    showMenu: false
  };
});
    loading = false;
  }

  /* ---------------- MENU ---------------- */

  function toggleMenu(id: string) {
    webinars = webinars.map((w) => ({
      ...w,
      showMenu: w.id === id ? !w.showMenu : false
    }));
  }

  function closeMenus() {
    webinars = webinars.map((w) => ({ ...w, showMenu: false }));
  }

  /* ---------------- DELETE ---------------- */

  async function deleteWebinar(id: string) {
    await supabase.from("webinars").delete().eq("id", id);
    confirmId = null;
    loadWebinars();
      snackbar.show("Webinar deleted successfully", "success");
  }

  function statusColor(status: string) {
    if (status === "Live") return "green";
    if (status === "Completed") return "gray";
    return "orange";
  }
</script>

<!-- ================= APPBAR ================= -->
<AppBar title="Webinars" showBack={true} />
<div class="search-box">
  <input
    type="text"
    placeholder="Search webinars..."
    bind:value={searchQuery}
  />
</div>

{#if loading}
  <p class="loading">Loading...</p>

{:else if webinars.length === 0}
  <p class="loading">No webinars found</p>

{:else}
  <div class="list">
  {#each displayedWebinars as webinar}
      <div class="card">

        <!-- Banner -->
        {#if webinar.banner}
          <img src={webinar.banner} class="banner" alt="banner" />
        {:else}
          <div class="placeholder">🎥</div>
        {/if}

        <!-- Info -->
        <div class="info">
          <h3>{webinar.title}</h3>
          <p class="mentor">By {webinar.mentor_name}</p>

          <div class="meta">
            <span>⏱ {webinar.duration} min</span>
            <span>📅 {webinar.schedule_at}</span>
          </div>

          <span class="badge {statusColor(webinar.status || '')}">
            {webinar.status || "Upcoming"}
          </span>
        </div>

        <div class="menu-wrapper">
  <button
    class="menu-btn"
    on:click|stopPropagation={() => toggleMenu(webinar.id)}
  >
    ⋮
  </button>

  {#if webinar.showMenu}
    <div class="popup-menu">
      <button on:click={() => goto(`/admin/edit_webinar/${webinar.id}`)}>
        ✏ Edit
      </button>

      <button
        class="delete"
        on:click={() => {
          confirmId = webinar.id;
          closeMenus();
        }}
      >
        🗑 Delete
      </button>
    </div>
  {/if}
</div>

      </div>
    {/each}
  </div>
{/if}
{#if confirmId}
  <div class="overlay">

    <!-- BACKDROP -->
    <button
      type="button"
      class="overlay-bg"
      aria-label="Close dialog"
      on:click={() => (confirmId = null)}
    ></button>

    <!-- MODAL -->
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      tabindex="0"
    >
      <div class="dialog-icon">⚠️</div>

      <h3 id="dialog-title">Delete Webinar?</h3>
      <p>This action cannot be undone.</p>

      <div class="dialog-actions">
        <button
          type="button"
          class="cancel-btn"
          on:click={() => (confirmId = null)}
        >
          Cancel
        </button>

        <button
          type="button"
          class="delete-btn"
          on:click={() => confirmId && deleteWebinar(confirmId)}
        >
          Delete
        </button>
      </div>
    </div>

  </div>
{/if}

<style>
:global(:root){

  /* APPBAR */
  --appbar-bg: linear-gradient(135deg,#c38e1d,#6f5a12);
  --appbar-text:#f5d060;

  /* PRIMARY */
  --clr-primary-from:#7a5400;
  --clr-primary-to:#d4a017;

  /* ACCENT */
  --clr-accent:#d4a017;
  --clr-accent-dark:#b88a10;

  /* SHADOW */
  --clr-accent-shadow:rgba(212,160,23,0.3);
  --clr-accent-shadow2:rgba(212,160,23,0.45);

  /* BACKGROUND */
  --clr-page-bg:linear-gradient(180deg,#0a0800,#120d00);

  /* CARD */
  --clr-card-bg:#2b1f06;
  --clr-card-border:rgba(212,160,23,0.3);

  /* TEXT */
  --clr-heading:#fff2c2;
  --clr-subtext:#c9a84d;

  /* BUTTON */
  --clr-view-btn-bg:#35280a;
  --clr-view-btn-hover:#4a390f;
}

/* GLOBAL */
:global(body){
  margin:0;
  background: var(--clr-page-bg);
  font-family: system-ui;
  color: var(--clr-heading);
}

:global(*) {
  box-sizing: border-box;
}

/* SEARCH */
.search-box{
  padding:16px;
}

.search-box input{
  width:100%;
  max-width:400px;
  padding:12px;
  border-radius:10px;
  border:1px solid var(--clr-card-border);
  background: var(--clr-card-bg);
  color: var(--clr-heading);
}

/* LIST */
.list{
  padding:16px;
  display:flex;
  flex-direction:column;
  gap:16px;
}

/* CARD */
.card{
  display:flex;
  gap:16px;
  background: var(--clr-card-bg);
  padding:14px;
  border-radius:16px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 6px 18px var(--clr-accent-shadow);
  align-items:center;
  position:relative;
}

/* IMAGE */
.banner{
  width:100px;
  height:70px;
  object-fit:cover;
  border-radius:12px;
}

.placeholder{
  width:100px;
  height:70px;
  background: var(--clr-view-btn-bg);
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:12px;
}

/* INFO */
.info{
  flex:1;
}

.info h3{
  margin:0;
  font-size:16px;
  color: var(--clr-heading);
}

.mentor{
  font-size:13px;
  color: var(--clr-subtext);
}

.meta{
  font-size:12px;
  display:flex;
  gap:10px;
  flex-wrap:wrap;
  margin-top:4px;
}

/* BADGE */
.badge{
  margin-top:6px;
  font-size:11px;
  padding:4px 10px;
  border-radius:20px;
}

.badge.green{ background:#0f5132; color:#00ff9d; }
.badge.orange{ background:#5a3d00; color:#ffb300; }
.badge.gray{ background:#333; color:#aaa; }

/* MENU */
.menu-wrapper{
  position:relative;
}

.menu-btn{
  background: var(--clr-accent);
  border:none;
  padding:6px 10px;
  border-radius:8px;
  cursor:pointer;
  color:black;
  font-weight:bold;
}

.popup-menu{
  position:absolute;
  right:0;
  top:40px;
  background: var(--clr-card-bg);
  border:1px solid var(--clr-card-border);
  border-radius:10px;
  box-shadow:0 10px 30px rgba(0,0,0,.4);
  min-width:140px;
  z-index:100;
  overflow:hidden;
}

.popup-menu button{
  width:100%;
  padding:12px;
  border:none;
  background:none;
  text-align:left;
  cursor:pointer;
  color: var(--clr-heading);
}

.popup-menu button:hover{
  background: var(--clr-view-btn-hover);
}

/* DELETE (MENU) */
.popup-menu .delete{
  color:#ff4d4d;
  font-weight:600;
}

/* ================= OVERLAY ================= */
.overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.65);
  backdrop-filter: blur(4px);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:9999;
}

/* ================= DIALOG ================= */
.dialog{
  background: var(--clr-card-bg);
  border:1px solid var(--clr-card-border);
  padding:26px;
  border-radius:16px;
  width:90%;
  max-width:360px;
  text-align:center;
  box-shadow:0 20px 50px var(--clr-accent-shadow2);
}

/* TITLE */
.dialog h3{
  color: var(--clr-heading);
  margin:0;
}

/* TEXT */
.dialog p{
  color: var(--clr-subtext);
  font-size:14px;
}

/* ICON */
.dialog-icon{
  font-size:28px;
}

/* ACTIONS */
.dialog-actions{
  display:flex;
  justify-content:flex-end;
  gap:10px;
  margin-top:16px;
}

/* CANCEL */
.cancel-btn{
  background: var(--clr-view-btn-bg);
  color: var(--clr-heading);
  border:1px solid var(--clr-card-border);
  padding:10px 16px;
  border-radius:10px;
  cursor:pointer;
}

.cancel-btn:hover{
  background: var(--clr-view-btn-hover);
}

/* DELETE BUTTON */
.delete-btn{
  background: linear-gradient(135deg,#ff3b3b,#ff6b6b);
  color:#fff;
  border:none;
  padding:10px 16px;
  border-radius:10px;
  font-weight:700;
  cursor:pointer;
  box-shadow:0 6px 18px rgba(255,59,59,0.3);
}

.delete-btn:hover{
  box-shadow:0 8px 22px rgba(255,59,59,0.5);
  transform:translateY(-1px);
}

/* LOADING */
.loading{
  text-align:center;
  padding:40px;
  color: var(--clr-subtext);
}

/* MOBILE */
@media (max-width:600px){

  .card{
    flex-direction:column;
    align-items:flex-start;
  }

  .banner,
  .placeholder{
    width:100%;
    height:160px;
  }

  .menu-wrapper{
    position:absolute;
    right:16px;
    top:16px;
  }
}
</style>