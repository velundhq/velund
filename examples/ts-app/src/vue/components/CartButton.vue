<template>
  <button
    class="w-full bg-gray-900 dark:bg-gray-600 text-white py-2 px-4 rounded-full font-bold hover:bg-gray-800 dark:hover:bg-gray-700 cursor-pointer"
    @click="num++"
  >
    Add to Cart ({{ num }})
  </button>
</template>
<script lang="ts" setup>
  import { ref } from 'vue';

  const props = defineProps<{
    id: number;
  }>();
  const num = ref(props.id);
</script>
