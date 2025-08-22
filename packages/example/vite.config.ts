import { defineConfig } from 'vite';
import velundPlugin from '@velund/vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import phpGenerator from '@velund/php';
import twigRenderer from '@velund/twig';

export default defineConfig({
  plugins: [
    velundPlugin({
      generator: 'php',
      renderer: 'twig',
      generators: [phpGenerator()],
      renderers: [twigRenderer()],
    }),
    vue(),
    tailwindcss(),
  ],
});
