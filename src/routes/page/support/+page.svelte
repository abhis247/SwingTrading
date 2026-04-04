<script lang="ts">
  import { goto } from "$app/navigation";

  function goBack() {
    history.back();
  }

  function sendMessage() {
    alert("Message sent!");
  }
</script>

<div class="page">

  <!-- ================= APPBAR ================= -->
  <div class="appbar">
    <button class="back-btn" on:click={goBack}>←</button>
    <h2>Support</h2>
  </div>

  <div class="content">

    <!-- ================= LOGO ================= -->
    <div class="logo-section">
      <div class="logo">A</div>
      <p class="est">EST 2019</p>
    </div>

    <!-- ================= CONNECT US ================= -->
    <h3 class="section-title">Connect us</h3>

    <div class="contact-tile">
      <span class="icon">📞</span>
      <div>
        <p class="label">Call us</p>
        <p class="value">+1 987 654 3210</p>
      </div>
    </div>

    <div class="contact-tile">
      <span class="icon">✉️</span>
      <div>
        <p class="label">Mail us</p>
        <p class="value">help@academy.com</p>
      </div>
    </div>

    <!-- ================= MESSAGE ================= -->
    <h3 class="section-title">Write us directly</h3>

    <textarea class="message-box" placeholder="Your Message"></textarea>

    <button class="send-btn" on:click={sendMessage}>
      Send Message
    </button>

  </div>
</div>

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




:global(body) {
  background: var(--clr-page-bg);
  font-family: system-ui;
}

/* PAGE */
.page {
  min-height: 100vh;
  background: var(--clr-page-bg);
}

/* ================= APPBAR ================= */
.appbar {
  background: var(--grad); /* replaced green */
  color: var(--appbar-text);
  padding: 16px;
  position: relative;
  text-align: center;
}

.back-btn {
  position: absolute;
  left: 12px;
  top: 12px;
  background: none;
  border: none;
  font-size: 22px;
  color: var(--appbar-text);
  cursor: pointer;
}

.appbar h2 {
  margin: 0;
  font-size: 18px;
}

/* ================= CONTENT ================= */
.content {
  padding: 20px 16px 30px;
}

/* LOGO */
.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  height: 120px;
  width: 120px;
  background: var(--clr-accent);
  border-radius: 24px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52px;
  color: #fff;
  font-weight: bold;
}

.est {
  margin-top: 8px;
  color: var(--clr-subtext);
}

/* SECTION TITLE */
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--clr-subtext);
  margin: 20px 0 10px;
}

/* CONTACT TILE */
.contact-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--clr-tab-idle-bg);
  color: var(--clr-subtext);
  padding: 14px;
  border-radius: 14px;
  margin-bottom: 12px;
}

.icon {
  font-size: 20px;
}

.label {
  margin: 0;
  font-size: 13px;
  color: var(--clr-subtext);
}

.value {
  margin: 2px 0 0;
  font-weight: 600;
  font-size: 16px;
  color: var(--clr-heading);
}

/* MESSAGE BOX */
.message-box {
  width: 100%;
  height: 110px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--clr-card-border);
  background: var(--clr-tab-idle-bg);
  color: var(--clr-heading);
  resize: none;
  font-size: 14px;
}

/* SEND BUTTON */
.send-btn {
  width: 100%;
  margin-top: 18px;
  height: 48px;
  background: var(--grad);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 6px 18px var(--clr-accent-shadow2);
}

/* RESPONSIVE */
@media (min-width: 768px) {
  .content {
    max-width: 500px;
    margin: auto;
  }
}
</style>