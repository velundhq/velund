import { defineConfig } from 'vite';
import { resolve } from 'path';
import keepImportMetaGlob from './plugins/keep-import-meta-glob';

export default defineConfig({
  plugins: [keepImportMetaGlob()],
  build: {
    target: 'esnext',
    ssr: true,
    emptyOutDir: true,
    outDir: 'dist',
    // lib: {
    //   entry: {

    //   },
    //   formats: ['es'], // только ES-модули
    // },
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.ts'),
        common: resolve(__dirname, 'src/common.ts'),
      },
      external: ['fs', 'path', 'url', 'vite', 'esbuild', 'fast-glob'],
      preserveEntrySignatures: 'exports-only',
      output: {
        format: 'es',
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
  },
});
