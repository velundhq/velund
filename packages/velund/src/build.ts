import path from 'path';
import { pathToFileURL } from 'url';
import { Plugin } from 'vite';
import * as fs from 'fs';
import fg from 'fast-glob';
import { iTwigPluginConfig } from './types';
import { VelundGeneratorDescriptor } from '@velund/core';

const buildPlugin = (
  opts: iTwigPluginConfig,
  generator: VelundGeneratorDescriptor
): Partial<Plugin> => {
  const assetSet = new Set<string>();
  let rollupInput: string;
  let outDir: string;
  let assetsDir: string;
  return {
    configResolved(config) {
      // тут уже есть итоговый конфиг
      rollupInput = path
        .resolve(
          config?.build?.rollupOptions?.input === 'index.html'
            ? './src/main.ts'
            : config?.build?.rollupOptions?.input?.toString() || './src/main.ts'
        )
        .toString()
        .replace(/\\/g, '/');
      outDir = path.resolve(config.build?.outDir);
      assetsDir = path.resolve(config.build?.assetsDir);
    },

    // Сбор ассетов
    async buildStart() {
      if (this.meta?.watchMode) return;
      const templatesGlob = [
        './src/**/*.vel.ts',
        './src/**/*.vel.js',
        './src/**/*.twig', //TODO: вынести
      ];

      const files = await fg(templatesGlob, { absolute: true });

      const assetsToEmit = new Set<string>();

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const regex = /@\/([^\s"'<>]+)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          assetsToEmit.add(match[1]);
        }
      }

      // Проверяем существование файлов
      assetsToEmit.forEach((_, relPath) => {
        const absPath = path.join('./src', relPath);
        if (!fs.existsSync(absPath)) {
          console.warn(`[vite-plugin-twig] Asset not found: ${relPath}`);
          return;
        }

        // Эмитим файл в Vite
        const ext = path.extname(relPath);
        this.emitFile({
          type: 'chunk',
          id: path.resolve(absPath),
          name: path.basename(relPath, ext),
        });

        assetSet.add('src/' + relPath);
      });
    },

    // Генерация PHP библиотеки
    async writeBundle(options, bundle) {
      // путь к сгенерированному main.js
      const mainFile = Object.values(bundle).find(
        (f: any) =>
          f.type === 'chunk' && f.isEntry && f.facadeModuleId == rollupInput
      );

      if (!mainFile) {
        console.warn('Main entry not found in bundle');
        return;
      }

      const mainPath = path.resolve(
        options.dir || process.cwd(),
        mainFile.fileName
      );

      // импортируем собранный файл через dynamic import
      await import(pathToFileURL(mainPath).href);
      const components = (globalThis as any).__APP__.components || [];

      // Собираем пути к файлам ассетов
      const finalAssetMap: Record<string, string> = {};
      for (const fileName in bundle) {
        const b = bundle[fileName];
        if (
          (b.type === 'asset' || b.type === 'chunk') &&
          ((b as any).originalFileName || (b as any).facadeModuleId)
        ) {
          const originalFileName: string =
            (b as any).originalFileName ||
            (b as any).facadeModuleId.replace(
              path.resolve('./').replace(/\\/g, '/') + '/',
              ''
            );
          if (assetSet.has(originalFileName)) {
            finalAssetMap[originalFileName.replace('src/', '@/')] = b.fileName;
          }
        }
      }
      // Заменяем пути на актуальные ассеты
      components.forEach((tpl: any) => {
        let updated = tpl.template;
        Object.entries(finalAssetMap).forEach(([origPath, finalPath]) => {
          updated = updated
            .split(origPath)
            .join(
              path
                .join(opts.assetsUrl, finalPath.replace('assets/', './'))
                .replace(/\\/g, '/')
            );
        });
        tpl.template = updated;
      });
      await generator.generate(
        opts.renderer,
        components,
        path.join(outDir, '/lib')
      );
    },
  };
};
export default buildPlugin;
