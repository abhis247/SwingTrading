<div class="skeleton-wrapper">
  <div class="skeleton-card"></div>
  <div class="skeleton-card"></div>
  <div class="skeleton-card"></div>
</div>

<style>
.skeleton-wrapper {
  padding: 16px;
}

/* 🔥 CARD */
.skeleton-card {
  height: 120px;
  border-radius: 16px;
  margin-bottom: 16px;

  background: linear-gradient(
    90deg,
    #1a1200 25%,
    #3a2a00 37%,
    #1a1200 63%
  );

  background-size: 400% 100%;
  animation: shimmer 1.2s linear infinite;
}

/* 🔥 SMOOTHER ANIMATION */
@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>