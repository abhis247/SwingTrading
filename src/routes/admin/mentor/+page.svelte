<script lang="ts">
  import { supabase } from "$lib/supabase";
  import { onMount, onDestroy } from "svelte";
  import AppBar from "$lib/AppBar1.svelte";

  let loading = true;
  let activeTab = "mentors";
  let search = "";

  let mentors: any[] = [];
  let filteredMentors: any[] = [];
  let applications: any[] = [];

  let showConfirm = false;
  let showEdit = false;
  let selectedMentor: any = null;

  let editExpertise = "";
  let editExperience = "";
  let editBio = "";
  let editName = "";
  let editEmail = "";
  let editPhone = "";
  let snackbar = "";
  let showSnackbar = false;

let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(event: TouchEvent) {
  touchStartX = event.touches[0].clientX;
}

function handleTouchEnd(event: TouchEvent) {
  touchEndX = event.changedTouches[0].clientX;

  const diff = touchStartX - touchEndX;
  const threshold = 70; // swipe sensitivity

  if (diff > threshold) {
    // swipe left
    activeTab = "applications";
  } else if (diff < -threshold) {
    // swipe right
    activeTab = "mentors";
  }
}

function showSnack(message:string){
  snackbar = message;
  showSnackbar = true;

  setTimeout(()=>{
    showSnackbar = false; 
    snackbar = "";
  },3000);
}
  

  //////////////////////////////////////////////////////
  // LOAD DATA
  //////////////////////////////////////////////////////

  async function loadData() {
    loading = true;

    const { data: mentorData } = await supabase
      .from("mentors")
      .select(`
        id,
        uid,
        expertise,
        experience,
        bio,
        users (name,email,profile_image)
      `)
      .order("created_at", { ascending: false });

    const { data: appData } = await supabase
      .from("mentor_applications")
      .select(`
        id,
        user_uid,
        expertise,
        experience,
        bio,
        users (name,email,phone,profile_image)
      `)
      .eq("status", "pending");

    mentors = (mentorData || []).map(m => ({ ...m, showMenu:false }));
    filteredMentors = mentors;
    applications = appData || [];

    loading = false;
  }

  //////////////////////////////////////////////////////
  // OUTSIDE CLICK HANDLER
  //////////////////////////////////////////////////////

  function handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!target.closest(".menu")) {
      mentors = mentors.map(m => ({ ...m, showMenu: false }));
      filteredMentors = [...mentors];
    }
  }
onMount(() => {
  loadData();

  const handle = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    if (!target.closest(".menu")) {
      mentors = mentors.map(m => ({ ...m, showMenu: false }));
      filteredMentors = [...mentors];
    }
  };

  document.addEventListener("click", handle);

  return () => {
    document.removeEventListener("click", handle);
  };
});

  //////////////////////////////////////////////////////
  // SEARCH
  //////////////////////////////////////////////////////

  function searchMentor(value: string) {
    search = value;

    filteredMentors = mentors.filter((m) => {
      const name = m.users?.name?.toLowerCase() || "";
      const email = m.users?.email?.toLowerCase() || "";
      const expertise = m.expertise?.toLowerCase() || "";

      return (
        name.includes(value.toLowerCase()) ||
        email.includes(value.toLowerCase()) ||
        expertise.includes(value.toLowerCase())
      );
    });
  }

  //////////////////////////////////////////////////////
  // MENU
  //////////////////////////////////////////////////////

  function toggleMenu(index:number){
    mentors = mentors.map((m,i)=>({
      ...m,
      showMenu: i === index ? !m.showMenu : false
    }));
    filteredMentors=[...mentors];
  }

  //////////////////////////////////////////////////////
  // DELETE
  //////////////////////////////////////////////////////
function confirmDelete(mentor:any){

  // 🔹 Close all open menus
  mentors = mentors.map(m => ({ ...m, showMenu:false }));
  filteredMentors = [...mentors];

  // 🔹 Open delete dialog
  selectedMentor = mentor;
  showConfirm = true;
}
async function deleteMentor(){

  await supabase.from("mentors").delete().eq("id",selectedMentor.id);
  await supabase.from("users").update({role:"user"}).eq("uid",selectedMentor.uid);


  showConfirm = false;

// remove locally
mentors = mentors.filter(m => m.id !== selectedMentor.id);
filteredMentors = [...mentors];

showSnack("Mentor deleted successfully");
}
  //////////////////////////////////////////////////////
  // EDIT
  //////////////////////////////////////////////////////
function editMentor(mentor:any){

  // close menu
  mentors = mentors.map(m => ({ ...m, showMenu:false }));
  filteredMentors = [...mentors];

  selectedMentor = mentor;

  // user details
  editName = mentor.users?.name || "";
  editEmail = mentor.users?.email || "";
  editPhone = mentor.users?.phone || "";

  // mentor details
  editExpertise = mentor.expertise || "";
  editExperience = mentor.experience || "";
  editBio = mentor.bio || "";

  showEdit = true;
}
async function updateMentor(){

  await supabase.from("mentors")
    .update({
      expertise: editExpertise,
      experience: editExperience,
      bio: editBio
    })
    .eq("id", selectedMentor.id);

  await supabase.from("users")
    .update({
      name: editName,
      phone: editPhone
    })
    .eq("uid", selectedMentor.uid);

  showEdit = false;

// update local list instead of reload
mentors = mentors.map(m =>
  m.id === selectedMentor.id
    ? {
        ...m,
        expertise: editExpertise,
        experience: editExperience,
        bio: editBio,
        users: {
          ...m.users,
          name: editName,
          phone: editPhone
        }
      }
    : m
);

filteredMentors = [...mentors];

showSnack("Mentor updated successfully");
}
  //////////////////////////////////////////////////////
  // APPROVE / REJECT
  //////////////////////////////////////////////////////

  async function approveApplication(app:any){
    await supabase.from("mentors").insert({
      uid: app.user_uid,
      expertise: app.expertise,
      experience: app.experience,
      bio: app.bio
    });

    await supabase.from("users")
      .update({ role: "mentor" })
      .eq("uid", app.user_uid);

    await supabase.from("mentor_applications")
      .update({ status: "approved" })
      .eq("id", app.id);

    loadData();
  }

  async function rejectApplication(app:any){
    await supabase.from("mentor_applications")
      .update({ status: "rejected" })
      .eq("id", app.id);

    loadData();
  }
</script>

<AppBar title="Mentors" showBack={true} />

<div class="container">

  <div class="tabbar">
  <div class="tab-slider" class:app={activeTab==="applications"}></div>

  <button
    class:active={activeTab==="mentors"}
    on:click={()=>activeTab="mentors"}>
    Mentors
  </button>

  <button
    class:active={activeTab==="applications"}
    on:click={()=>activeTab="applications"}>
    Applications
  </button>
</div>
{#if loading}
  <div class="center">Loading...</div>
{:else}
<div 
  class="tab-content-wrapper"
  role="button"
  aria-label="Swipe between mentors and applications"
  tabindex="0"
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
  on:keydown={(e)=>{
    if(e.key === "ArrowLeft") activeTab = "mentors";
    if(e.key === "ArrowRight") activeTab = "applications";
  }}
>
  <div class="tab-content" class:app={activeTab==="applications"}>

    <!-- MENTORS TAB -->
    <div class="tab-page">

      <input
        class="search"
        placeholder="Search mentor..."
        bind:value={search}
        on:input={()=>searchMentor(search)}
      />

      {#each filteredMentors as mentor, index}
        <div class="card">

          <div class="left">
            {#if mentor.users?.profile_image}
              <img class="profile-img" src={mentor.users.profile_image} alt="mentor" />
            {:else}
              <div class="avatar">{mentor.users?.name?.[0] || "M"}</div>
            {/if}
          </div>

          <div class="info">
            <div class="name">{mentor.users?.name}</div>
            <div class="email">{mentor.users?.email}</div>
            <div class="expertise">{mentor.expertise}</div>
          </div>

          <div class="menu">
            <button
              class="menu-btn"
              on:click|stopPropagation={()=>toggleMenu(index)}
            >
              ⋮
            </button>

            {#if mentor.showMenu}
              <div class="menu-dropdown">
                <button on:click={()=>editMentor(mentor)}>✏️ Edit</button>
                <button on:click={()=>confirmDelete(mentor)}>🗑 Delete</button>
              </div>
            {/if}
          </div>

        </div>
      {/each}

    </div>

    <!-- APPLICATIONS TAB -->
    <div class="tab-page">
      {#each applications as app}
        <div class="card column">
          <div class="name">{app.users?.name}</div>
          <div>{app.users?.email}</div>
          <div>Expertise: {app.expertise}</div>
          <div>Experience: {app.experience}</div>

          <div class="actions">
            <button class="approve" on:click={()=>approveApplication(app)}>Approve</button>
            <button class="reject" on:click={()=>rejectApplication(app)}>Reject</button>
          </div>
        </div>
      {/each}
    </div>

  </div>
</div>
{/if}
</div>


{#if showConfirm}
  <div
    class="overlay"
    role="button"
    tabindex="0"
    aria-label="Close delete dialog"
    on:click={() => showConfirm = false}
    on:keydown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        showConfirm = false;
      }
    }}
  >
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deleteTitle"
      tabindex="0"
      on:click|stopPropagation
      on:keydown={(e)=>{
        if(e.key === "Escape") showConfirm = false;
      }}
    >
      <h3 id="deleteTitle">Delete Mentor</h3>
      <p>Are you sure?</p>

      <div class="dialog-actions">
        <button on:click={()=>showConfirm=false}>Cancel</button>
        <button class="delete" on:click={deleteMentor}>
          Delete
        </button>
      </div>
    </div>
  </div>
{/if}
{#if showEdit}
<div
  class="overlay"
  role="button"
  tabindex="0"
  aria-label="Close dialog"
  on:click={() => showEdit = false}
  on:keydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      showEdit = false;
    }
  }}
>
 <div
  class="dialog large"
  role="dialog"
  aria-modal="true"
  aria-labelledby="editTitle"
  tabindex="0"
  on:click|stopPropagation
  on:keydown={(e) => {
    if (e.key === "Escape") showEdit = false;
  }}
>

  <h3 id="editTitle">Edit Mentor Details</h3>

  <div class="mentor-header">
    {#if selectedMentor?.users?.profile_image}
      <img
        class="profile-img"
        alt={selectedMentor?.users?.name || "Mentor profile"}
        src={selectedMentor.users.profile_image}
      />
    {:else}
      <div class="avatar large">
        {selectedMentor?.users?.name?.[0] || "M"}
      </div>
    {/if}

    <div>
      <div class="mentor-name">{selectedMentor?.users?.name}</div>
      <div class="mentor-email">{selectedMentor?.users?.email}</div>
    </div>
  </div>

  <label for="editName">Name</label>
  <input id="editName" bind:value={editName} />

  <label for="editEmail">Email</label>
  <input id="editEmail" bind:value={editEmail} disabled />

  <label for="editPhone">Phone</label>
  <input id="editPhone" bind:value={editPhone} />

  <label for="editExpertise">Expertise</label>
  <input id="editExpertise" bind:value={editExpertise} />

  <label for="editExperience">Experience</label>
  <input id="editExperience" bind:value={editExperience} />

  <label for="editBio">Bio</label>
  <textarea id="editBio" rows="4" bind:value={editBio}></textarea>

  <div class="dialog-actions">
    <button on:click={()=>showEdit=false}>Cancel</button>
    <button class="approve" on:click={updateMentor}>
      Update Mentor
    </button>
  </div>

</div>
</div>
{/if}
{#if showSnackbar}
  <div class="snackbar">
    {snackbar}
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
  background: var(--clr-page-bg);
}

/* CONTAINER */
.container{
  max-width:1000px;
  margin:auto;
  padding:16px;
  height:100vh;
  display:flex;
  flex-direction:column;
}

/* TABBAR */
.tabbar{
  position:relative;
  display:flex;
  background: var(--clr-card-bg);
  border-radius:12px;
  padding:6px;
  gap:6px;
  margin-bottom:20px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 4px 12px var(--clr-accent-shadow);
  overflow:hidden;
  position:sticky;
  top:0;
  z-index:10;
}

.tabbar button{
  flex:1;
  padding:10px;
  border:none;
  border-radius:8px;
  cursor:pointer;
  background:transparent;
  font-weight:600;
  position:relative;
  z-index:2;
  color: var(--clr-subtext);
}

.tabbar button.active{
  color:white;
}

/* SLIDER */
.tab-slider{
  position:absolute;
  top:6px;
  left:6px;
  width:calc(50% - 6px);
  height:calc(100% - 12px);
  background: var(--clr-accent);
  border-radius:8px;
  transition:transform .28s cubic-bezier(.4,0,.2,1);
  z-index:1;
}

.tab-slider.app{
  transform:translateX(100%);
}

/* SEARCH */
.search{
  width:88%;
  padding:12px;
  border-radius:10px;
  border:1px solid var(--clr-card-border);
  margin-bottom:20px;
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
}

.search::placeholder{
  color: var(--clr-subtext);
}

/* CARD */
.card{
  display:flex;
  align-items:center;
  gap:14px;
  background: var(--clr-card-bg);
  padding:14px;
  border-radius:14px;
  margin-bottom:12px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 4px 14px var(--clr-accent-shadow);
}

.card.column{
  flex-direction:column;
  align-items:flex-start;
}

/* PROFILE */
.profile-img{
  width:50px;
  height:50px;
  border-radius:50%;
  object-fit:cover;
}

.avatar{
  width:50px;
  height:50px;
  border-radius:50%;
  background: var(--clr-accent);
  color:white;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:bold;
}

/* TEXT */
.info{
  flex:1;
}

.name{
  color: var(--clr-heading);
  font-weight:600;
}

.email{
  color: var(--clr-subtext);
  font-size:13px;
}

.expertise{
  color: var(--clr-subtext);
  font-size:13px;
}

/* MENU */
.menu{
  position:relative;
  display:flex;
  align-items:center;
}

.menu-btn{
  background: var(--clr-accent);
  border:none;
  color:white;
  font-size:18px;
  cursor:pointer;
  padding:6px 10px;
  border-radius:8px;
}

.menu-dropdown{
  position:absolute;
  right:0;
  top:36px;
  min-width:140px;
  background: var(--clr-card-bg);
  border-radius:10px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 6px 18px var(--clr-accent-shadow);
  z-index:1000;
}

.menu-dropdown button{
  width:100%;
  padding:10px 14px;
  border:none;
  background:none;
  cursor:pointer;
  text-align:left;
  color: var(--clr-heading);
}

.menu-dropdown button:hover{
  background: var(--clr-tab-idle-bg);
}

/* ACTION BUTTONS */
.actions{
  display:flex;
  gap:10px;
  margin-top:10px;
}

.approve{
  background: var(--grad);
  color:white;
  padding:8px 12px;
  border:none;
  border-radius:8px;
}

.reject{
  background:#e53935;
  color:white;
  padding:8px 12px;
  border:none;
  border-radius:8px;
}

/* DIALOG */
.overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.4);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:1000;
}

.dialog{
  background: var(--clr-card-bg);
  padding:24px;
  border-radius:14px;
  width:340px;
  display:flex;
  flex-direction:column;
  gap:10px;
  border:1px solid var(--clr-card-border);
  box-shadow:0 10px 30px var(--clr-accent-shadow);
}

.dialog h3{
  color: var(--clr-heading);
}

.dialog p{
  color: var(--clr-subtext);
}

.dialog input,
.dialog textarea{
  padding:8px;
  border-radius:8px;
  border:1px solid var(--clr-card-border);
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
}

.dialog-actions{
  display:flex;
  justify-content:flex-end;
  gap:8px;
  margin-top:10px;
}

.delete{
  background:#e53935;
  color:white;
  border:none;
  padding:8px 12px;
  border-radius:8px;
}

/* SNACKBAR */
.snackbar{
  position:fixed;
  bottom:20px;
  left:50%;
  transform:translateX(-50%);
  background: var(--clr-accent);
  color:white;
  padding:12px 18px;
  border-radius:8px;
  font-size:14px;
  box-shadow:0 6px 18px var(--clr-accent-shadow2);
  animation:snackIn .25s ease;
  z-index:2000;
}

@keyframes snackIn{
  from{opacity:0;transform:translate(-50%,20px)}
  to{opacity:1;transform:translate(-50%,0)}
}

/* TAB CONTENT */
.tab-content-wrapper{
  overflow:hidden;
  flex:1;
}

.tab-content{
  display:flex;
  width:200%;
  height:100%;
  transition:transform .35s cubic-bezier(.4,0,.2,1);
}

.tab-content.app{
  transform:translateX(-50%);
}

.tab-page{
  width:50%;
  height:100%;
  overflow-y:auto;
}
label{
  color: var(--clr-heading);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}
/* NAME */
.mentor-name{
  color: var(--clr-heading);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

/* EMAIL */
.mentor-email{
  color: var(--clr-subtext);
  font-size: 13px;
  margin-top: 2px;
  opacity: 0.9;
}
</style>