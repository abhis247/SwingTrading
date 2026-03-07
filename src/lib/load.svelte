<script lang="ts">
  export let count = 3;
  export let height = 120;
</script>

<div class="skeleton-wrapper">
  {#each Array(count) as _, i}
    <div class="skeleton-card" style="height:{height}px"></div>
  {/each}
</div>

<style>
.skeleton-wrapper {
  padding: 24px;
}

.skeleton-card {
  background: linear-gradient(
    90deg,
    #f3f4f6 25%,
    #e5e7eb 37%,
    #f3f4f6 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.2s ease infinite;
  border-radius: 16px;
  margin-bottom: 16px;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>
















