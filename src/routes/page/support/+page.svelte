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
.page {
  min-height: 100vh;
  background: #f5f7fb;
  font-family: system-ui;
}

/* ================= APPBAR ================= */
.appbar {
  background: #1fae4b;
  color: white;
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
  color: white;
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
  background: #1fae4b;
  border-radius: 24px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52px;
  color: white;
  font-weight: bold;
}

.est {
  margin-top: 8px;
  color: #777;
}

/* SECTION TITLE */
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #777;
  margin: 20px 0 10px;
}

/* CONTACT TILE */
.contact-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f1f3f5;
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
  color: #888;
}

.value {
  margin: 2px 0 0;
  font-weight: 600;
  font-size: 16px;
}

/* MESSAGE BOX */
.message-box {
  width: 100%;
  height: 110px;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: #f1f3f5;
  resize: none;
  font-size: 14px;
}

/* SEND BUTTON */
.send-btn {
  width: 100%;
  margin-top: 18px;
  height: 48px;
  background: #1fae4b;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
}

/* RESPONSIVE */
@media (min-width: 768px) {
  .content {
    max-width: 500px;
    margin: auto;
  }
}
</style>