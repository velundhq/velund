import { defineConfig } from 'vite';
import velund from 'velund';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';

import phpGenerator from '@zebrains/velund-php';
import twigRenderer from '@zebrains/velund-twig';

export default defineConfig({
  plugins: [
    velund({
      generator: 'php',
      renderer: 'twig',
      generators: [phpGenerator()],
      renderers: [twigRenderer()],
      strictTemplateExtensions: false,
    }),
    vue(),
    tailwindcss(),
  ],
});
