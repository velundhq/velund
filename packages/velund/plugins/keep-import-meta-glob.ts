export default function keepImportMetaGlob(): import('vite').Plugin {
  return {
    name: 'keep-import-meta-glob',
    transform(code, id) {
      if (id.includes('src/common/defineVelundApp.ts')) {
        // Хитрый трюк: подменяем `import.meta.glob` на что-то,
        // чтобы Vite его не схавал, а потом возвращаем обратно

        return code.replace(/import\.meta\.glob/g, '__IMPORT_META_GLOB__');
      }
      return code;
    },
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk') {
          file.code = file.code.replace(
            /__IMPORT_META_GLOB__/g,
            'import.meta.glob'
          );
        }
      }
    },
  };
}
