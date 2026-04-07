<div class="skeleton-wrapper">
  <div class="skeleton-card"></div>
  <div class="skeleton-card"></div>
  <div class="skeleton-card"></div>
</div>

<style>
.skeleton-wrapper {
  padding: 24px;
}

.skeleton-card {
  height: 120px;
  background: linear-gradient(
    90deg,
    #093793 25%,
    #092d76 37%,
    #07399d 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 16px;
  margin-bottom: 16px;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>