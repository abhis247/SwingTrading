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
/* SLIDING CONTENT */
.tab-content-wrapper{
  overflow:hidden;
}

.tab-content{
  display:flex;
  width:200%;
  transition:transform .35s cubic-bezier(.4,0,.2,1);
}

.tab-content.app{
  transform:translateX(-50%);
}

.tab-page{
  width:50%;
}
.container{max-width:1000px;margin:auto;padding:16px}
.tabbar{
  position:relative;
  display:flex;
  background:#fff;
  border-radius:12px;
  padding:6px;
  gap:6px;
  margin-bottom:20px;
  box-shadow:0 4px 12px rgba(0,0,0,.08);
  overflow:hidden;
  
  position:sticky;
  top:0;
  z-index:10;

}

/* buttons */
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
  transition:.2s;
}

/* active text color */
.tabbar button.active{
  color:white;
}

/* sliding background */
.tab-slider{
  position:absolute;
  top:6px;
  left:6px;
  width:calc(50% - 6px);
  height:calc(100% - 12px);
  background:#1b8e5a;
  border-radius:8px;
  transition:transform .28s cubic-bezier(.4,0,.2,1);
  z-index:1;
}

/* move slider */
.tab-slider.app{
  transform:translateX(100%);
}
.search{width:88%;padding:12px;border-radius:10px;border:1px solid #ddd;margin-bottom:20px}
.card{display:flex;align-items:center;gap:14px;background:white;padding:14px;border-radius:14px;margin-bottom:12px;box-shadow:0 4px 14px rgba(0,0,0,.08)}
.card.column{flex-direction:column;align-items:flex-start}
.profile-img{width:50px;height:50px;border-radius:50%;object-fit:cover}
.avatar{width:50px;height:50px;border-radius:50%;background:#1b8e5a;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold}
.info{flex:1}
.menu{position:relative;display:flex;align-items:center}
.menu-btn{background:#1f9a50;border:none;font-size:18px;cursor:pointer;padding:6px 10px;border-radius:8px}
.menu-dropdown{position:absolute;right:0;top:36px;min-width:140px;background:white;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.15);z-index:1000}
.menu-dropdown button{width:100%;padding:10px 14px;border:none;background:none;cursor:pointer;text-align:left}
.menu-dropdown button:hover{background:#f5f5f5}
.overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.4);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:1000; /* ADD THIS */
}
.dialog{background:white;padding:24px;border-radius:14px;width:340px;display:flex;flex-direction:column;gap:10px}
.dialog input,.dialog textarea{padding:8px;border-radius:8px;border:1px solid #ddd}
.dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
.delete{background:#e53935;color:white;border:none;padding:8px 12px;border-radius:8px}
.actions{display:flex;gap:10px;margin-top:10px}
.approve{background:#1b8e5a;color:white;padding:8px 12px;border:none;border-radius:8px}
.reject{background:#e53935;color:white;padding:8px 12px;border:none;border-radius:8px}
.snackbar{
  position:fixed;
  bottom:20px;
  left:50%;
  transform:translateX(-50%);
  background:#323232;
  color:white;
  padding:12px 18px;
  border-radius:8px;
  font-size:14px;
  box-shadow:0 6px 18px rgba(0,0,0,.2);
  animation:snackIn .25s ease;
  z-index:2000;
}

@keyframes snackIn{
  from{opacity:0;transform:translate(-50%,20px)}
  to{opacity:1;transform:translate(-50%,0)}
}
/* container should fill screen */
.container{
  max-width:1000px;
  margin:auto;
  padding:16px;
  height:100vh;
  display:flex;
  flex-direction:column;
}

/* tab slider area should take remaining space */
.tab-content-wrapper{
  overflow:hidden;
  flex:1;
  height:100%;
}

/* sliding area full height */
.tab-content{
  display:flex;
  width:200%;
  height:100%;
  transition:transform .35s cubic-bezier(.4,0,.2,1);
}

/* each tab page full height */
.tab-page{
  width:50%;
  height:100%;
  overflow-y:auto;
}
</style>