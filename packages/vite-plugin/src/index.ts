import devServer from './serve.js';
import buildPlugin from './build.js';
import { parse } from 'node-html-parser';
import { transform } from 'esbuild';

export default function twigPlugin(config?: Partial<iTwigPluginConfig>) {
  const defaultConfig: iTwigPluginConfig = {
    assetsUrl: '/assets',
  };

  const options: iTwigPluginConfig = Object.assign(defaultConfig, config || {});

  return {
    name: 'vite-twig-bitrix-plugin',
    ...devServer(options),
    ...buildPlugin(options),

    config(config: any) {
      // если в конфиге ещё нет resolve, создаём
      config.resolve ??= {};
      config.resolve.extensions ??= [
        '.mjs',
        '.js',
        '.ts',
        '.jsx',
        '.tsx',
        '.json',
      ];

      if (!config.resolve.extensions.includes('.twig')) {
        config.resolve.extensions.push('.twig');
      }

      // Устанавливаем стандартный input
      if (!config.build) config.build = {};
      if (!config.build.rollupOptions) config.build.rollupOptions = {};
      if (!config.build.rollupOptions.input)
        config.build.rollupOptions.input = 'src/main.ts';
    },

    async transform(code: string, id: string) {
      if (id.endsWith('.twig')) {
        return {
          code: `export default ${JSON.stringify(code)};`,
          map: null,
        };
      } else if (id.endsWith('.twg')) {
        const root = parse(code, {
          lowerCaseTagName: false, // сохраняем регистр тегов
          comment: false,
        });

        const templateEl = root.querySelector(':scope > template');
        const scriptEl = root.querySelector(':scope > script');

        const res = await transform(
          `${
            scriptEl?.innerHTML?.trim() || ''
          }\nexport const __template = ${JSON.stringify(
            templateEl?.innerHTML?.trim() || ''
          )};`,
          {
            loader: 'ts',
            target: 'esnext',
          }
        );
        return {
          code: res.code,
          map: null,
        };
      }
      return null;
    },
  };
}
