<script lang="ts">
  import { goto } from "$app/navigation";

  function goBack() {
    history.back();
  }
</script>

<div class="page">

  <!-- ================= HEADER ================= -->
  <div class="header">

    <div class="top-row">
      <button class="back-btn" on:click={goBack}>←</button>
      <h2>About School</h2>
    </div>

    <!-- STATS -->
    <div class="stats">
      <div class="stat-item">
        <h3>650</h3>
        <p>Students<br />Studying</p>
      </div>

      <div class="stat-item">
        <h3>95.5%</h3>
        <p>Last Year<br />Result</p>
      </div>

      <div class="stat-item">
        <h3>6/10</h3>
        <p>Toppers<br />from us</p>
      </div>
    </div>

  </div>

  <!-- ================= CONTENT ================= -->
  <div class="content">

    <!-- About Card -->
    <div class="card">
      <h3>About School</h3>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
        sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>
    </div>

    <!-- Images -->
    <div class="image-scroll">
      <div class="image-card"></div>
      <div class="image-card"></div>
      <div class="image-card"></div>
    </div>

    <!-- Vision -->
    <div class="vision">
      <h3>Our Vision</h3>
      <p>
        Minim veniam, quis nostrud exercitation ullamco laboris
        nisi ut aliquip ex ea commodo consequat.
      </p>
    </div>

  </div>

</div>

<style>
.page {
  min-height: 100vh;
  background: #f4f6fb;
  font-family: system-ui;
}

/* ================= HEADER ================= */
.header {
  background: linear-gradient(135deg,#1fae4b,#28c76f);
  color: white;
  padding: 40px 16px 30px;
  border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px;
}

.top-row {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.back-btn {
  position: absolute;
  left: 0;
  background: rgba(255,255,255,.15);
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

.header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

/* STATS */
.stats {
  margin-top: 28px;
  display: flex;
  justify-content: space-evenly;
  text-align: center;
}

.stat-item h3 {
  margin: 0;
  font-size: 22px;
  font-weight: bold;
}

.stat-item p {
  margin-top: 6px;
  font-size: 13px;
  color: rgba(255,255,255,.85);
}

/* ================= CONTENT ================= */
.content {
  padding: 20px 16px;
}

.card {
  background: white;
  padding: 18px;
  border-radius: 20px;
  box-shadow: 0 8px 18px rgba(0,0,0,.08);
}

.card h3 {
  margin: 0 0 8px;
  font-size: 18px;
}

.card p {
  color: #555;
}

/* IMAGE SCROLL */
.image-scroll {
  margin: 20px 0;
  display: flex;
  gap: 12px;
  overflow-x: auto;
}

.image-scroll::-webkit-scrollbar {
  display: none;
}

.image-card {
  min-width: 120px;
  height: 100px;
  border-radius: 14px;
  background-image: url("https://picsum.photos/200");
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

/* VISION */
.vision h3 {
  margin-bottom: 8px;
}

.vision p {
  color: #555;
}

/* ================= RESPONSIVE ================= */
@media (min-width: 768px) {
  .stats {
    justify-content: space-around;
  }

  .image-card {
    min-width: 160px;
    height: 120px;
  }
}
</style>