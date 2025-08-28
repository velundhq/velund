<script setup lang="ts">
  import { VPHomeSponsors } from 'vitepress/theme';
  import { useSponsor } from '../composables/sponsor';

  const { data } = useSponsor();
</script>

<template>
  <VPHomeSponsors
    v-if="data"
    message="Velund — бесплатный проект с открытым исходным кодом. Если вам нравится то, что пытается сделать Velund, и вы хотите поддержать его разработку, пожалуйста, рассмотрите возможность стать спонсором."
    action-text="Стать спонсором"
    action-link="mailto:me@dantezz.ru"
    :data="data"
  />
</template>
