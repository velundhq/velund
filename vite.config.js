import twigPagesPlugin from './plugins/vite-plugin-twig-auto.js';
// import tailwindcss from '@vituum/vite-plugin-tailwindcss';

export default {
  plugins: [
    twigPagesPlugin({
      templatesDir: './src/templates',
      routeTemplatesDir: 'routes',
      assetsDir: './src/assets',
      assetsAlias: '@assets',
      assetsBasePath: '/some/assets/folder',
      dtoNamespace: 'App\\Dto',
    }),
    // tailwindcss(),
  ],
};
