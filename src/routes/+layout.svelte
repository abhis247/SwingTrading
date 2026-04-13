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

  const superAdminUid = "Djy9ZPmZPMQHYpwIFu39Sr5ZYF13";

  let loading = true;

  async function fetchRole(uid: string) {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("uid", uid)
      .maybeSingle();

    return data?.role ?? "user";
  }

//   onMount(() => {
//     const unsubscribe = auth.onAuthStateChanged(async (user) => {
//       const currentPath = $page.url.pathname;

    


// // 🔒 Logged user trying to open auth pages
// if (user && currentPath.startsWith("/auth")) {
//   goto("/page/home", { replaceState: true });
//   loading = false;
//   return;
// }

//       // 🔒 Not logged
//       if (!user) {
//         loading = false;

//         if (!currentPath.startsWith("/auth/")) {
//           goto("/auth/signup", { replaceState:true });
//         }
//         return;
//       }

//       // 🔥 Get role
//       const role = await fetchRole(user.uid);
//       console.log("UID:", user.uid);
// console.log("ROLE:", role);

//       if (role === "admin" && user.uid === superAdminUid) {
//         if (!currentPath.startsWith("/admin")) {
//           goto("/admin/dashboard",{ replaceState:true });
//         }
//       } 
//       else if (role === "mentor") {
//         if (!currentPath.startsWith("/mentor")) {
//           goto("/mentor/dashboard",{ replaceState:true });
//         }
//       } 
//       else {
//         if (!currentPath.startsWith("/page")) {
//           goto("/page/home",{ replaceState:true });
//         }
//       }

//       loading = false;
//     });

//     return unsubscribe;
//   });


onMount(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    const currentPath = $page.url.pathname;

    // 🔒 Not logged
    if (!user) {
      loading = false;

      if (!currentPath.startsWith("/auth/")) {
        goto("/auth/signup", { replaceState: true });
      }
      return;
    }

    // 🔥 SUPER ADMIN (instant redirect)
    if (user.uid === superAdminUid) {
      if (!currentPath.startsWith("/admin")) {
        goto("/admin/dashboard", { replaceState: true });
      }
      loading = false;
      return;
    }

    // 🔥 Get role
    const role = await fetchRole(user.uid);

    // console.log("UID:", user.uid);
    // console.log("ROLE:", role);

    // 🔒 If on auth page → redirect AFTER role check
    if (currentPath.startsWith("/auth")) {
      if (role === "mentor") {
        goto("/mentor/dashboard", { replaceState: true });
      } else {
        goto("/page/home", { replaceState: true });
      }
      loading = false;
      return;
    }

    // ✅ Mentor
    if (role === "mentor") {
      if (!currentPath.startsWith("/mentor")) {
        goto("/mentor/dashboard", { replaceState: true });
      }
    }

    // ✅ User
    else {
      if ((currentPath as string) === "/page") {
  goto("/page/home", { replaceState: true });
}
      if (!currentPath.startsWith("/page")) {
        goto("/page/home", { replaceState: true });
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
:global(:root){
  --clr-accent:#d4a017;
  --clr-heading:#fff2c2;
  --clr-accent-shadow:rgba(212,160,23,0.4);
  --clr-bg:#000000;
}


/* ================= SPLASH ================= */

.splash{
  height:100dvh;

  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;

  background: var(--clr-bg);
  overflow:hidden;
  position:relative;

  color: var(--clr-heading);
  text-align:center;
}


/* 🔥 STAR LAYER */

.splash::before{
  content:"";
  position:absolute;
  width:100%;
  height:100%;

  background-image:
    radial-gradient(2px 2px at 20% 30%, #fff, transparent),
    radial-gradient(2px 2px at 80% 70%, #fff, transparent),
    radial-gradient(1px 1px at 50% 50%, #fff, transparent),
    radial-gradient(1px 1px at 10% 80%, #fff, transparent);

  background-size: 300px 300px;

  opacity:.25;

  animation:starsMove 60s linear infinite;
}


/* ================= LOGO ================= */

.logo{
  width:150px;
  height:150px;

  display:flex;
  align-items:center;
  justify-content:center;

  margin-bottom:24px;

  z-index:2;

  animation:
    logoPop .7s ease,
    logoFloat 3s ease-in-out infinite alternate;
}

.logo img{
  width:100%;

  /* 🔥 GOLD GLOW */
  filter:
    drop-shadow(0 0 20px rgba(212,160,23,0.7))
    drop-shadow(0 0 40px rgba(212,160,23,0.5))
    brightness(1.1);
}


/* ================= DOTS ================= */

.dots{
  display:flex;
  gap:8px;

  z-index:2;
}

.dots span{
  width:8px;
  height:8px;

  background: var(--clr-accent);
  border-radius:50%;

  animation:dotPulse 1.4s infinite;
}

.dots span:nth-child(2){ animation-delay:.2s; }
.dots span:nth-child(3){ animation-delay:.4s; }
.dots span:nth-child(4){ animation-delay:.6s; }


/* ================= ANIMATIONS ================= */

@keyframes dotPulse{
  0%,80%,100%{
    opacity:.3;
    transform:scale(.8);
  }
  40%{
    opacity:1;
    transform:scale(1.3);
  }
}

@keyframes logoPop{
  from{ transform:scale(.6); opacity:0; }
  to{ transform:scale(1); opacity:1; }
}

@keyframes logoFloat{
  from{ transform:translateY(0px); }
  to{ transform:translateY(-12px); }
}

/* 🔥 STAR ANIMATION */

@keyframes starsMove{
  from{
    transform:translateY(0);
  }
  to{
    transform:translateY(-200px);
  }
}
</style>
