<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { goto } from "$app/navigation";
  import { auth } from "$lib/firebase";
  import { signOut } from "firebase/auth";

  let users = 0;
  let mentors = 0;
  let courses = 0;
  let webinars = 0;

  let loading = true;
  let showMenu = false;
  let showLogoutDialog = false;

  /* ================= LOAD COUNTS ================= */

  async function loadCounts() {
    loading = true;
    try {
      const { data: u } = await supabase.from("users").select("id");
      const { data: m } = await supabase.from("mentors").select("id");
      const { data: c } = await supabase.from("courses").select("id");
      const { data: w } = await supabase.from("webinars").select("id");

      users = u?.length ?? 0;
      mentors = m?.length ?? 0;
      courses = c?.length ?? 0;
      webinars = w?.length ?? 0;
    } catch (e) {
      console.error("Dashboard load error:", e);
    }
    loading = false;
  }


let admin: any = null;

onMount(() => {
  auth.onAuthStateChanged((u) => {
    admin = u;
  });

  loadCounts();
});
  /* ================= LOGOUT ================= */

  async function handleLogout() {
    try {
      await signOut(auth);
      goto("/auth/login");
    } catch (e) {
      console.error("Logout error", e);
      alert("Logout failed");
    }
  }
</script>

<div class="page">

  <!-- ================= APPBAR ================= -->
  <div class="appbar">
<div class="admin-info">
  <div class="admin-name">
    {admin?.displayName || "Admin"}
  </div>
  <div class="admin-email">
    {admin?.email || ""}
  </div>
</div>
    <div class="menu-wrapper">
      <button class="menu-btn" on:click={() => showMenu = !showMenu}>⋮</button>

      {#if showMenu}
        <div class="dropdown">
          <button on:click={() => showLogoutDialog = true}>Logout</button>
        </div>
      {/if}
    </div>
  </div>

  <!-- ================= BODY ================= -->
  <div class="body">

    <!-- HEADER -->
    <div class="header">
      <div>
        <h3>Welcome Admin</h3>
        <p>Manage users, mentors & courses</p>
      </div>
      <div class="avatar">🛡</div>
    </div>

    <!-- QUICK ACTIONS -->
    <div class="quick-actions">

      <button class="action" on:click={() => goto("/admin/add_user")}>
        <div class="circle">👤</div>
        <span>Add User</span>
      </button>

      <button class="action" on:click={() => goto("/admin/add_webinar")}>
        <div class="circle">🎥</div>
        <span>Add Webinar</span>
      </button>

      <button class="action" on:click={() => goto("/admin/add_course")}>
        <div class="circle">📚</div>
        <span>Add Course</span>
      </button>

      <button class="action" on:click={() => goto("/admin/add_mentor")}>
        <div class="circle">🎓</div>
        <span>Add Mentor</span>
      </button>

    </div>

    <!-- ================= STATS GRID ================= -->
    {#if loading}
      <div class="loader">Loading...</div>
    {:else}
      <div class="grid">

        <button class="stat green" on:click={() => goto("/admin/user")}>
          <div class="icon">👥</div>
          <div class="value">{users}</div>
          <div class="label">Users</div>
        </button>

        <button class="stat purple" on:click={() => goto("/admin/mentor")}>
          <div class="icon">🎓</div>
          <div class="value">{mentors}</div>
          <div class="label">Mentors</div>
        </button>

        <button class="stat orange" on:click={() => goto("/admin/course")}>
          <div class="icon">📚</div>
          <div class="value">{courses}</div>
          <div class="label">Courses</div>
        </button>

        <button class="stat blue" on:click={() => goto("/admin/webinar")}>
          <div class="icon">🎥</div>
          <div class="value">{webinars}</div>
          <div class="label">Webinars</div>
        </button>

      </div>
    {/if}

    <!-- WEBINAR CARD -->
    <div class="webinar-card">
      <div>
        <h4>Flutter Live Webinar</h4>
        <p>Today • 5:00 PM</p>
      </div>
      <button class="manage-btn">Manage</button>
    </div>

  </div>
</div>

<!-- ================= LOGOUT DIALOG ================= -->

{#if showLogoutDialog}
  <div class="dialog-overlay">

    <div class="dialog">
      <h3>Logout</h3>
      <p>Are you sure you want to logout?</p>

      <div class="dialog-actions">
        <button class="cancel" on:click={() => showLogoutDialog = false}>
          Cancel
        </button>

        <button class="logout" on:click={handleLogout}>
          Logout
        </button>
      </div>
    </div>

  </div>
{/if}

<style>
  /* ================= GLOBAL ================= */


.page{
  background:#f4f6fb;
  min-height:100vh;
  animation:pageFade .6s ease;
}

@keyframes pageFade{
  from{opacity:0;transform:translateY(10px);}
  to{opacity:1;transform:translateY(0);}
}

/* ================= APPBAR ================= */
.appbar{
  height:88px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 18px;

  background: linear-gradient(135deg,#20559b,#11ba66);
  color:white;

  position:sticky;
  top:0;
  z-index:9999;

  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 18px;
}
.admin-info{
  display:flex;
  flex-direction:column;
}

.admin-name{
  font-size:16px;
  font-weight:600;
}

.admin-email{
  font-size:12px;
  opacity:0.8;
}

.menu-wrapper{position:relative;}

.menu-btn{
  border:none;
  background:#0c4a88;
  padding:8px 12px;
  border-radius:8px;
  cursor:pointer;
  transition:.25s;
}

.menu-btn:hover{
  transform:scale(1.05);
}

/* ================= DROPDOWN ================= */

.dropdown{
  position:absolute;
  right:0;
  top:42px;

  background:white;
  border-radius:12px;

  box-shadow:0 15px 35px rgba(0,0,0,.2);

  padding:6px;
  min-width:130px;

  animation:fadeDrop .2s ease;
}

@keyframes fadeDrop{
  from{opacity:0;transform:translateY(-8px);}
  to{opacity:1;transform:translateY(0);}
}

.dropdown button{
  border:none;
  background:none;
  padding:10px 14px;
  width:100%;
  text-align:left;
  border-radius:8px;
  cursor:pointer;
  transition:.2s;
}

.dropdown button:hover{
  background:#f1f5f9;
  transform:translateX(4px);
}

/* ================= BODY ================= */

.body{
  padding:16px;
  max-width:1200px;
  margin:auto;
}

/* ================= HEADER ================= */

.header{
  background:linear-gradient(135deg,#20559b,#11ba66);
  padding:20px;
  border-radius:20px;

  display:flex;
  justify-content:space-between;
  align-items:center;

  color:white;

  box-shadow:0 10px 30px rgba(0,0,0,.15);
}

.header h3{
  margin:0;
  font-size:20px;
}

.header p{
  margin-top:6px;
  font-size:13px;
  opacity:.9;
}

.avatar{
  background:white;
  color:#20559b;
  padding:14px;
  border-radius:50%;
}

/* ================= QUICK ACTION ================= */

.quick-actions{
  display:flex;
  gap:14px;
  margin:20px 0;
  flex-wrap:wrap;
}

.action{
  flex:1;
  border:none;
  background:white;

  padding:16px;
  border-radius:16px;

  text-align:center;
  cursor:pointer;

  box-shadow:0 6px 16px rgba(0,0,0,.08);

  transition:.3s;
}

.action:hover{
  transform:translateY(-6px) scale(1.03);
  background:linear-gradient(135deg,#20559b,#11ba66);
  color:white;

  box-shadow:0 25px 60px rgba(17,186,102,.3);
}

.circle{
  width:50px;
  height:50px;
  background:#e0f2fe;
  border-radius:50%;

  display:flex;
  align-items:center;
  justify-content:center;

  margin:auto;
  font-size:20px;
  transition:.3s;
}

.action:hover .circle{
  background:white;
  color:#20559b;
}

/* ================= GRID ================= */

.grid{
  display:grid;
  gap:14px;
}

@media(max-width:600px){
  .grid{grid-template-columns:repeat(2,1fr);}
}

@media(min-width:601px) and (max-width:1000px){
  .grid{grid-template-columns:repeat(3,1fr);}
}

@media(min-width:1001px){
  .grid{grid-template-columns:repeat(4,1fr);}
}

/* ================= STATS ================= */

.stat{
  border:none;
  padding:20px;
  border-radius:18px;
  color:white;

  text-align:center;
  cursor:pointer;

  font-weight:bold;

  box-shadow:0 8px 20px rgba(0,0,0,.1);

  transition:.35s;

  position:relative;
  overflow:hidden;
}

.stat::before{
  content:"";
  position:absolute;
  inset:0;
  background:rgba(255,255,255,.2);
  opacity:0;
  transition:.3s;
}

.stat:hover::before{
  opacity:1;
}

.stat:hover{
  transform:translateY(-8px) scale(1.05);
  box-shadow:0 25px 60px rgba(0,0,0,.25);
}

.icon{font-size:22px;}
.value{font-size:26px;margin-top:6px;}
.label{font-size:14px;opacity:.9;}

.green{background:#22c55e;}
.purple{background:#9333ea;}
.orange{background:#f97316;}
.blue{background:#2563eb;}

/* ================= WEBINAR ================= */

.webinar-card{
  margin-top:20px;
  background:white;
  border-radius:16px;

  padding:18px;

  display:flex;
  justify-content:space-between;
  align-items:center;

  box-shadow:0 8px 20px rgba(0,0,0,.08);

  transition:.3s;
}

.webinar-card:hover{
  transform:translateY(-6px);
  box-shadow:0 20px 40px rgba(0,0,0,.15);
}

.manage-btn{
  background:#2563eb;
  color:white;

  border:none;
  padding:10px 16px;

  border-radius:10px;
  cursor:pointer;
}

/* ================= LOADER ================= */

.loader{
  text-align:center;
  padding:40px;
}

/* ================= DIALOG ================= */

.dialog-overlay{
  position:fixed;
  inset:0;

  background:rgba(0,0,0,.35);

  display:flex;
  align-items:center;
  justify-content:center;

  z-index:999;
}

.dialog{
  background:white;
  padding:22px;
  border-radius:16px;
  width:320px;
}

.dialog-actions{
  display:flex;
  justify-content:flex-end;
  gap:10px;
}

.cancel{
  background:#eee;
  border:none;
  padding:8px 14px;
  border-radius:6px;
}

.logout{
  background:#ef4444;
  color:white;
  border:none;
  padding:8px 14px;
  border-radius:6px;
}

/* ================= BUTTON ================= */

button{
  transition:.25s;
}

button:active{
  transform:scale(.96);
}

/* ================= DESKTOP ================= */

@media(min-width:1024px){

  .body{
    max-width:1300px;
    padding:24px;
  }

  .header{
    padding:26px;
    border-radius:24px;
  }

  .header h3{font-size:26px;}
  .header p{font-size:15px;}

  .quick-actions{
    gap:22px;
  }

  .action{
    padding:20px;
  }

  .circle{
    width:60px;
    height:60px;
    font-size:24px;
  }

  .grid{
    gap:22px;
  }

  .stat{
    padding:26px;
  }

  .value{
    font-size:30px;
  }

  .label{
    font-size:15px;
  }

  .webinar-card{
    padding:22px;
    border-radius:18px;
  }

}
</style>