<template>
  <button
    class="w-full bg-gray-900 dark:bg-gray-600 text-white py-2 px-4 rounded-full font-bold hover:bg-gray-800 dark:hover:bg-gray-700"
  >
    Add to Cart ({{ props.id }})
  </button>
</template>
<script lang="ts" setup>
  const props = defineProps<{
    id: number;
  }>();
</script>
