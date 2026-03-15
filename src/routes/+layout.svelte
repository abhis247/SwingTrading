<!-- <script lang="ts">
import "$lib/theme.css";
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { auth } from "$lib/firebase";
import { supabase } from "$lib/supabase";

const superAdminUid = "Zzjym4rd6jbxlDsUxCMxZbx2juu2";

let loading = true;

async function fetchRole(uid:string){
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("uid", uid)
    .maybeSingle();

  return data?.role ?? "user";
}

onMount(() => {

  const unsub = auth.onAuthStateChanged(async (user) => {

    const path = $page.url.pathname;

    //////////////////////////////////////////////////////
    // PUBLIC PAGES
    //////////////////////////////////////////////////////

    const publicPages = [
      "/page/home",
      "/page/course",
      "/page/course_detail",
      "/page/mentor",
      "/auth"
    ];

    const isPublic = publicPages.some(p => path.startsWith(p));

    //////////////////////////////////////////////////////
    // ROOT REDIRECT
    //////////////////////////////////////////////////////

    if (path === "/") {
      goto("/page/home", { replaceState:true });
      loading = false;
      return;
    }

    //////////////////////////////////////////////////////
    // NOT LOGGED
    //////////////////////////////////////////////////////

    if (!user) {

      if (!isPublic) {

        // remember page user wanted
        localStorage.setItem("redirectAfterLogin", path);

        goto("/auth/login", { replaceState:true });
        return;
      }

      loading = false;
      return;
    }

    //////////////////////////////////////////////////////
    // AFTER LOGIN REDIRECT
    //////////////////////////////////////////////////////

    if (path.startsWith("/auth")) {

      const redirect = localStorage.getItem("redirectAfterLogin");

      if (redirect) {
        localStorage.removeItem("redirectAfterLogin");
        goto(redirect, { replaceState:true });
      } else {
        goto("/page/home", { replaceState:true });
      }

      loading = false;
      return;
    }

    //////////////////////////////////////////////////////
    // ROLE REDIRECT
    //////////////////////////////////////////////////////

    const role = await fetchRole(user.uid);

    if (role === "admin" && user.uid === superAdminUid) {

      if (!path.startsWith("/admin")) {
        goto("/admin/dashboard", { replaceState:true });
      }

    } 
    else if (role === "mentor") {

      if (!path.startsWith("/mentor")) {
        goto("/mentor/dashboard", { replaceState:true });
      }

    }

    //////////////////////////////////////////////////////
    // DONE
    //////////////////////////////////////////////////////

    loading = false;

  });

  return unsub;

});
</script>

{#if loading}
<div class="splash">

  <div class="logo">
    <img src="/logo.png" alt="logo" />
  </div>


  <div class="dots">
    <span></span>
    <span></span>
    <span></span>
    <span></span>

  </div>

</div>

{:else}

<slot />

{/if}
<style>
/* SPLASH SCREEN */

.splash{
  height:100vh;

  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;

  background:linear-gradient(135deg,#20559b,#11ba66,#1e3c72);
  background-size:300% 300%;

  color:white;
  text-align:center;

  animation:bgMove 6s ease infinite;
}


/* LOGO */

.logo{
  width:120px;
  height:120px;

  margin-bottom:18px;

  animation:
    logoPop .7s ease,
    logoFloat 2.5s ease-in-out infinite alternate;
}

.logo img{
  width:100%;
  filter:drop-shadow(0 8px 20px rgba(0,0,0,.25));
}


/* TITLE */

h1{
  margin:6px 0 16px;
  font-size:30px;
  font-weight:600;
  letter-spacing:.5px;
}


/* LOADING DOTS */

.dots{
  display:flex;
  gap:6px;
}

.dots span{
  width:8px;
  height:8px;

  background:white;
  border-radius:50%;

  opacity:.3;

  animation:dotPulse 1.4s infinite;
}

.dots span:nth-child(2){
  animation-delay:.2s;
}

.dots span:nth-child(3){
  animation-delay:.4s;
}


/* DOT ANIMATION */

@keyframes dotPulse{
  0%,80%,100%{
    opacity:.3;
    transform:scale(.8);
  }
  40%{
    opacity:1;
    transform:scale(1.2);
  }
}


/* LOGO POP */

@keyframes logoPop{
  from{
    transform:scale(.5);
    opacity:0;
  }
  to{
    transform:scale(1);
    opacity:1;
  }
}


/* FLOATING LOGO */

@keyframes logoFloat{
  from{
    transform:translateY(0px);
  }
  to{
    transform:translateY(-10px);
  }
}


/* BACKGROUND GRADIENT MOVE */

@keyframes bgMove{
  0%{background-position:0% 50%;}
  50%{background-position:100% 50%;}
  100%{background-position:0% 50%;}
}

</style> -->

 <script lang="ts">
  import "$lib/theme.css";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { auth } from "$lib/firebase";
  import { supabase } from "$lib/supabase";
  import { snackbar } from "$lib/snackbar";

  const superAdminUid = "Zzjym4rd6jbxlDsUxCMxZbx2juu2";

  let loading = true;

  async function fetchRole(uid: string) {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("uid", uid)
      .maybeSingle();

    return data?.role ?? "user";
  }

  onMount(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      const currentPath = $page.url.pathname;

    


// 🔒 Logged user trying to open auth pages
if (user && currentPath.startsWith("/auth")) {
  goto("/page/home", { replaceState: true });
  loading = false;
  return;
}

      // 🔒 Not logged
      if (!user) {
        loading = false;

        if (!currentPath.startsWith("/auth/")) {
          goto("/auth/signup", { replaceState:true });
        }
        return;
      }

      // 🔥 Get role
      const role = await fetchRole(user.uid);

      if (role === "admin" && user.uid === superAdminUid) {
        if (!currentPath.startsWith("/admin")) {
          goto("/admin/dashboard",{ replaceState:true });
        }
      } 
      else if (role === "mentor") {
        if (!currentPath.startsWith("/mentor")) {
          goto("/mentor/dashboard",{ replaceState:true });
        }
      } 
      else {
        if (!currentPath.startsWith("/page")) {
          goto("/page/home",{ replaceState:true });
        }
      }

      loading = false;
    });

    return unsubscribe;
  });
</script>

{#if loading}
  <div class="splash">

  <div class="logo">
    <img src="/logo.png" alt="logo" />
  </div>


  <div class="dots">
    <span></span>
    <span></span>
    <span></span>
    <span></span>

  </div>

</div>

{:else}

<slot />

{/if}
<style>
/* SPLASH SCREEN */

.splash{
  height:100vh;

  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;

  background:linear-gradient(135deg,#20559b,#11ba66,#1e3c72);
  background-size:300% 300%;

  color:white;
  text-align:center;

  animation:bgMove 6s ease infinite;
}


/* LOGO */

.logo{
  width:120px;
  height:120px;

  margin-bottom:18px;

  animation:
    logoPop .7s ease,
    logoFloat 2.5s ease-in-out infinite alternate;
}

.logo img{
  width:100%;
  filter:drop-shadow(0 8px 20px rgba(0,0,0,.25));
}


/* TITLE */

h1{
  margin:6px 0 16px;
  font-size:30px;
  font-weight:600;
  letter-spacing:.5px;
}


/* LOADING DOTS */

.dots{
  display:flex;
  gap:6px;
}

.dots span{
  width:8px;
  height:8px;

  background:white;
  border-radius:50%;

  opacity:.3;

  animation:dotPulse 1.4s infinite;
}

.dots span:nth-child(2){
  animation-delay:.2s;
}

.dots span:nth-child(3){
  animation-delay:.4s;
}


/* DOT ANIMATION */

@keyframes dotPulse{
  0%,80%,100%{
    opacity:.3;
    transform:scale(.8);
  }
  40%{
    opacity:1;
    transform:scale(1.2);
  }
}


/* LOGO POP */

@keyframes logoPop{
  from{
    transform:scale(.5);
    opacity:0;
  }
  to{
    transform:scale(1);
    opacity:1;
  }
}


/* FLOATING LOGO */

@keyframes logoFloat{
  from{
    transform:translateY(0px);
  }
  to{
    transform:translateY(-10px);
  }
}


/* BACKGROUND GRADIENT MOVE */

@keyframes bgMove{
  0%{background-position:0% 50%;}
  50%{background-position:100% 50%;}
  100%{background-position:0% 50%;}
}

</style>
