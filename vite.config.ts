import twigPlugin from './plugins/twig-bitrix/index.js';
import twigPagesPlugin from './plugins/vite-plugin-twig-auto.js';
// import tailwindcss from '@vituum/vite-plugin-tailwindcss';

export default {
  plugins: [
    twigPlugin({
      templatesDir: './src/templates',
      assetsDir: './src/assets',
    }),
  ],
};
