import { defineConfig } from 'vite';
import velundPlugin from '@velund/vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import phpGenerator from '@velund/php';
import pythonGenerator from '@velund/python';
import twigRenderer from '@velund/twig';
import jinjaRenderer from '@velund/jinja';

export default defineConfig({
  plugins: [
    velundPlugin({
      generator: 'python',
      renderer: 'jinja',
      generators: [phpGenerator(), pythonGenerator()],
      renderers: [twigRenderer(), jinjaRenderer()],
      strictTemplateExtensions: false,
    }),
    vue(),
    tailwindcss(),
  ],
  build: {
    outDir: '../python-app/velund',
  },
});
