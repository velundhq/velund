import devServer from './serve.js';
import buildPlugin from './build.js';
import { iTwigPluginConfig } from './types.js';
import nodeGenerator from '@velund/node';
import htmlRenderer from '@velund/html';

export default function twigPlugin(config?: Partial<iTwigPluginConfig>) {
  const defaultConfig: iTwigPluginConfig = {
    assetsUrl: '/assets',
    generator: 'node',
    renderer: 'html',
    generators: [],
    renderers: [],
  };

  const options: iTwigPluginConfig = Object.assign(defaultConfig, config || {});

  options.generators.push(nodeGenerator());
  options.renderers.push(htmlRenderer());

  // Check renderers
  if (!options.generators.find((g) => g.id === options.generator))
    throw new Error(`Unknown generator: "${options.generator}"`);
  if (!options.renderers.find((r) => r.id === options.renderer))
    throw new Error(`Unknown renderer: "${options.renderer}"`);
  if (
    !options.generators
      .find((g) => g.id === options.generator)
      ?.renderers?.includes(options.renderer)
  )
    throw new Error(
      `Generator "${options.generator}" can't build "${options.renderer}" renderer`
    );

  return {
    name: 'vite-twig-bitrix-plugin',
    ...devServer(
      options,
      options.renderers.find((i) => i.id === options.renderer)!
    ),
    ...buildPlugin(
      options,
      options.generators.find((g) => g.id === options.generator)!
    ),

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
        // TODO: Вынести
        return {
          code: `export default ${JSON.stringify(code)};`,
          map: null,
        };
      }
      return null;
    },
  };
}
