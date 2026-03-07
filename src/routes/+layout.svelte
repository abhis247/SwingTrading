<script lang="ts">
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
        loading = false;
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
<div class="loader">Loading...</div>
{:else}
<slot />
{/if}

<style>
.loader{
  display:flex;
  justify-content:center;
  align-items:center;
  height:100vh;
  font-size:16px;
}
</style>









<!-- <script lang="ts">
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

      // 🔒 Not logged
      if (!user) {
        loading = false;

        if (!currentPath.startsWith("/auth")) {
          goto("/auth/login");
        }
        return;
      }

      // 🔥 Get role
      const role = await fetchRole(user.uid);

      if (role === "admin" && user.uid === superAdminUid) {
        if (!currentPath.startsWith("/admin")) {
          goto("/admin/dashboard");
        }
      } 
      else if (role === "mentor") {
        if (!currentPath.startsWith("/mentor")) {
          goto("/mentor/dashboard");
        }
      } 
      else {
        if (!currentPath.startsWith("/page")) {
          goto("/page/home");
        }
      }

      loading = false;
    });

    return unsubscribe;
  });
</script>

{#if loading}
  <div class="loader">Loading...</div>
{:else}
  <slot />
{/if}

{#if $snackbar.show}
  <div class="snackbar {$snackbar.type}">
    {$snackbar.message}
  </div>
{/if}

<style>
.loader {
  display:flex;
  justify-content:center;
  align-items:center;
  height:100vh;
  font-size:16px;
}

.snackbar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  color: white;
  box-shadow: 0 8px 20px rgba(0,0,0,.25);
  z-index: 100000;
}

.snackbar.success { background: #1b8e5a; }
.snackbar.error { background: #e53935; }
.snackbar.info { background: #1976d2; }
</style> -->