import { defineConfig } from 'vite';
import velundPlugin from '@velund/vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import phpGenerator from '@velund/php';
import twigRenderer from '@velund/twig';
import jinjaRenderer from '@velund/jinja';

export default defineConfig({
  plugins: [
    velundPlugin({
      // generator: 'php',
      renderer: 'jinja',
      generators: [phpGenerator()],
      renderers: [twigRenderer(), jinjaRenderer()],
    }),
    vue(),
    tailwindcss(),
  ],
  build: {
    outDir: '../express-app/velund',
  },
});
