import { ref, onMounted } from 'vue';

// shared data across instances so we load only once.
const data = ref();

export function useSponsor() {
  onMounted(() => {
    if (data.value) {
      return;
    }

    data.value = mapSponsors();
  });

  return {
    data,
  };
}

function mapSponsors() {
  return [
    {
      tier: 'Платиновый Спонсор',
      size: 'big',
      items: [
        {
          name: 'ZeBrains',
          url: 'https://zebrains.ru/',
          img: '/sponsors/zebrains.svg',
        },
      ],
    },
  ];
}
