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
    <button
    type="button"
    class="overlay"
    aria-label="Close dialog"
    on:click={() => (confirmId = null)}
  ></button>

  <div
    class="dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    tabindex="-1"
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
          on:click={() => deleteWebinar(confirmId!)}
        >
          Delete
        </button>
      </div>
    </div>

  </div>
{/if}

<style>
/* GLOBAL FIX */
:global(body){
  margin:0;
  overflow-x:hidden;
}

:global(*) {
  box-sizing: border-box;
}

/* APPBAR */
.appbar{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:16px 24px;
  background:white;
  box-shadow:0 2px 8px rgba(0,0,0,.06);
}

.add-btn{
  background:#1b8e5a;
  color:white;
  border:none;
  padding:8px 14px;
  border-radius:8px;
  cursor:pointer;
}

/* LIST */
.list{
  padding:24px;
  display:flex;
  flex-direction:column;
  gap:16px;
}

.card{
  width:100%;
  display:flex;
  gap:16px;
  background:white;
  padding:14px;
  border-radius:16px;
  box-shadow:0 6px 18px rgba(0,0,0,.08);
  align-items:center;
  flex-wrap:wrap;
  position:relative;
}

.banner{
  width:100px;
  height:70px;
  object-fit:cover;
  border-radius:12px;
  flex-shrink:0;
}

.placeholder{
  width:70px;
  height:70px;
  background:#eef3ff;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:12px;
  flex-shrink:0;
}

.info{
  flex:1;
  min-width:0;
}

.info h3{
  margin:0;
  font-size:16px;
  word-break:break-word;
}

.mentor{
  margin:4px 0;
  font-size:13px;
  color:#666;
}

.meta{
  font-size:12px;
  margin:6px 0;
  display:flex;
  gap:12px;
  flex-wrap:wrap;
}

.badge{
  font-size:11px;
  padding:4px 10px;
  border-radius:20px;
}

.badge.green{ background:#e8f5e9; color:green; }
.badge.orange{ background:#fff3e0; color:orange; }
.badge.gray{ background:#eee; color:gray; }

/* MENU */
.menu-wrapper{
  position:relative;
  flex-shrink:0;
}
.menu-btn{
  margin: 16px 0px 0px 90px;
  background:#1b8e5a;
  border:none;
  font-size:18px;
  cursor:pointer;
  padding:6px 10px;
  border-radius:8px;
  color:white;
  display:flex;
  align-items:center;
  justify-content:center;
  transition:all .2s ease;
}

.menu-btn:hover{
  background:#146c43;
}

.popup-menu{
  padding: 16px;
  position:absolute;
  right:0;
  top:38px;
  background:white;
  border-radius:10px;
  box-shadow:0 6px 18px rgba(0,0,0,.2);
  min-width:130px;
  z-index:100;
}

.popup-menu button{
  width:100%;
  padding:10px;
  border:none;
  background:none;
  text-align:left;
  cursor:pointer;
}

.popup-menu button:hover{
  background:#f5f5f5;
}

.popup-menu .delete{
  color:#e53935;
}

/* DIALOG */
.overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.4);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index: 9999;
}



.dialog{
  background:white;
  padding:20px;
  border-radius:14px;
  width:90%;
  max-width:360px;
  z-index:10000;
}

.dialog-actions{
  display:flex;
  justify-content:flex-end;
  gap:10px;
  margin-top:14px;
}

/* SNACKBAR */
.snackbar{
  position:fixed;
  bottom:20px;
  left:50%;
  transform:translateX(-50%);
  background:#1b8e5a;
  color:white;
  padding:10px 18px;
  border-radius:8px;
  font-size:14px;
  box-shadow:0 6px 18px rgba(0,0,0,.2);
}

/* MOBILE */
@media (max-width: 600px){

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
/* SEARCH */
.search-box{
  padding:16px 24px;
}

.search-box input{
  width:100%;
  max-width:350px;
  padding:10px 14px;
  border-radius:8px;
  border:1px solid #ddd;
  font-size:14px;
}

/* ENHANCED DIALOG */
.dialog{
  text-align:center;
  padding:26px;
  border-radius:16px;
  box-shadow:0 20px 40px rgba(0,0,0,.2);
}

.dialog-icon{
  font-size:26px;
  margin-bottom:8px;
}

.cancel-btn{
  padding:8px 16px;
  border-radius:8px;
  border:1px solid #ccc;
  background:white;
  cursor:pointer;
}

.delete-btn{
  padding:8px 16px;
  border-radius:8px;
  border:none;
  background:#e53935;
  color:white;
  cursor:pointer;
}

.delete-btn:hover{
  background:#c62828;
}
</style>