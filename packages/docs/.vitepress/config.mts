import { defineConfig } from 'vitepress';

const ogDescription =
  'Фреймворк для унифицированного серверного рендеринга, создающий единое ядро взаимодействия между фронтом и бэком';
const ogImage = 'https://velund.dntz.xyz/og-image.png?v1';
const ogTitle = 'Velund';
const ogUrl = 'https://velund.dntz.xyz';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: 'pages',

  title: `${ogTitle} | ${ogDescription}`,
  description: ogDescription,
  appearance: 'force-dark',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: ogTitle }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { property: 'og:url', content: ogUrl }],
    ['meta', { property: 'og:description', content: ogDescription }],
    ['meta', { name: 'theme-color', content: '#2d55ff' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: ogTitle,

    nav: [
      { text: 'Главная', link: '/' },
      { text: 'Начало работы', link: '/getting-started/installation' },
      { text: 'Документация', link: '/guide/components' },
    ],

    sidebar: [
      {
        text: 'Начало работы',
        collapsed: false,
        items: [
          { text: 'Установка', link: '/getting-started/installation' },
          { text: 'Базовая настройка', link: '/getting-started/configuration' },
          {
            text: 'Настройка entry-файла',
            link: '/getting-started/entry-configuration',
          },
        ],
      },
      {
        text: 'Документация',
        collapsed: false,
        items: [
          { text: 'Компоненты', link: '/guide/components' },
          { text: 'Интеграция с бэкендом', link: '/guide/backend-integration' },
          { text: 'Конфигурация плагина', link: '/guide/plugin-options' },
        ],
      },
      {
        text: 'Прочее',
        collapsed: true,
        items: [{ text: 'Лицензия', link: '/about/license' }],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/DanteZZ/velund' },
    ],
  },
});
