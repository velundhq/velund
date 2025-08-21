import { defineConfig } from 'vite';
import twigPlugin from '@twg/vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [twigPlugin(), vue(), tailwindcss()],
});
