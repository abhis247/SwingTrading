<script lang="ts">
  import { onMount } from "svelte";

  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }

  let deferredPrompt: BeforeInstallPromptEvent | null = null;
  let showInstall = false;
  let installed = false;

  onMount(() => {
    console.log("✅ Component loaded");

    // ✅ Detect installed (Android + iOS)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      installed = true;
      return;
    }

    // ✅ Only show button when event fires
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("🔥 INSTALL EVENT TRIGGERED");

      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      showInstall = true;
    });

    // ✅ When installed
    window.addEventListener("appinstalled", () => {
      console.log("✅ App installed");

      installed = true;
      showInstall = false;
      deferredPrompt = null;
    });
  });

  async function installApp() {
    if (!deferredPrompt) return; // ❌ no alert

    deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;
    console.log("User choice:", choice.outcome);

    deferredPrompt = null;
    showInstall = false;
  }
</script>

{#if showInstall && !installed}
<div class="install-box">

  <div class="left">
    <img src="/icon-192.png" alt="app" />
    <div class="text">
      <p class="title">Install App</p>
      <p class="subtitle">Better experience 🚀</p>
    </div>
  </div>

  <div class="right">
    <button on:click={installApp}>Install</button>
  </div>

</div>
{/if}
<style>
/* ✅ GLOBAL FIX */
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  overflow-x: hidden;
}

/* ✅ MAIN BOX */
.install-box {
  width: 100%;
  max-width: 100%;

  margin: 10px 0 16px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 12px 16px;
  background: #111;
  color: white;

  border-radius: 12px;

  overflow: hidden;
}

/* LEFT */
.left {
  display: flex;
  align-items: center;
  gap: 10px;

  min-width: 0;
}

.left img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  flex-shrink: 0;
}

/* TEXT */
.text {
  min-width: 0;
}

.title,
.subtitle {
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title {
  font-size: 14px;
  font-weight: 600;
}

.subtitle {
  font-size: 12px;
  opacity: 0.7;
}

/* RIGHT */
.right button {
  padding: 6px 12px;
  background: #d4a017;
  border: none;
  border-radius: 6px;
  color: black;
  cursor: pointer;
  white-space: nowrap;
}

/* 📱 MOBILE FIX */
@media (max-width: 480px) {
  .install-box {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .right {
    width: 100%;
  }

  .right button {
    width: 100%;
  }
}
</style>






<!-- <script lang="ts">
  import { onMount } from "svelte";

  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }

  let deferredPrompt: BeforeInstallPromptEvent | null = null;
  let showInstall = false;
  let installed = false;

  onMount(() => {
    console.log("✅ Component loaded");

    // ✅ Detect installed (Android + iOS)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      installed = true;
      return;
    }

    // ✅ Only show button when event fires
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("🔥 INSTALL EVENT TRIGGERED");

      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      showInstall = true;
    });

    // ✅ When installed
    window.addEventListener("appinstalled", () => {
      console.log("✅ App installed");

      installed = true;
      showInstall = false;
      deferredPrompt = null;
    });
  });

  async function installApp() {
    if (!deferredPrompt) return; // ❌ no alert

    deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;
    console.log("User choice:", choice.outcome);

    deferredPrompt = null;
    showInstall = false;
  }
</script>

{#if showInstall && !installed}
<div class="install-box">

  <div class="left">
    <img src="/icon-192.png" alt="app" />
    <div class="text">
      <p class="title">Install App</p>
      <p class="subtitle">Better experience 🚀</p>
    </div>
  </div>

  <div class="right">
    <button on:click={installApp}>Install</button>
  </div>

</div>
{/if}
<style>
/* ✅ GLOBAL FIX */
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  overflow-x: hidden;
}

/* ✅ MAIN BOX */
.install-box {
  width: 100%;
  max-width: 100%;

  margin: 10px 0 16px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 12px 16px;
  background: #111;
  color: white;

  border-radius: 12px;

  overflow: hidden;
}

/* LEFT */
.left {
  display: flex;
  align-items: center;
  gap: 10px;

  min-width: 0;
}

.left img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  flex-shrink: 0;
}

/* TEXT */
.text {
  min-width: 0;
}

.title,
.subtitle {
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title {
  font-size: 14px;
  font-weight: 600;
}

.subtitle {
  font-size: 12px;
  opacity: 0.7;
}

/* RIGHT */
.right button {
  padding: 6px 12px;
  background: #d4a017;
  border: none;
  border-radius: 6px;
  color: black;
  cursor: pointer;
  white-space: nowrap;
}

/* 📱 MOBILE FIX */
@media (max-width: 480px) {
  .install-box {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .right {
    width: 100%;
  }

  .right button {
    width: 100%;
  }
}
</style> -->







