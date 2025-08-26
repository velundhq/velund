import devServer from './serve.js';
import buildPlugin from './build.js';
import { iTwigPluginConfig } from './types.js';
import nodeGenerator from '@velund/node';
import htmlRenderer from '@velund/html';
import { Plugin } from 'vite';
import FastGlob from 'fast-glob';

export default function velund(config?: Partial<iTwigPluginConfig>): Plugin {
  const defaultConfig: iTwigPluginConfig = {
    assetsUrl: '/assets',
    generator: 'node',
    renderer: 'html',
    strictTemplateExtensions: true,
    renderUrl: '/__render',
    generators: [],
    renderers: [],
  };

  const options: iTwigPluginConfig = Object.assign(defaultConfig, config || {});

  options.generators.push(nodeGenerator(options.nodeConfig));
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
  const templateExtensions: string[] = [];

  options.renderers.forEach((r) => {
    if (
      options.strictTemplateExtensions &&
      ![options.renderer, 'html'].includes(r.id)
    )
      return;
    r.templateExtensions?.forEach((ext) => {
      templateExtensions.push(ext.startsWith('.') ? ext : `.${ext}`);
    });
  });
  console.log(`Used generator: ${options.generator}`);
  console.log(`Used renderer: ${options.renderer}`);
  console.log(`Used template extensions: ${templateExtensions.join(', ')}`);

  return {
    name: 'vite-twig-bitrix-plugin',
    ...devServer(
      options,
      options.renderers.find((i) => i.id === options.renderer)!
    ),
    ...buildPlugin(
      options,
      options.generators.find((g) => g.id === options.generator)!,
      templateExtensions
    ),

    config(config, { command }) {
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

      templateExtensions.forEach((ext) => {
        if (!config.resolve!.extensions!.includes(ext)) {
          config.resolve!.extensions!.push(ext);
        }
      });
      if (!config.define) {
        config.define = {};
      }
      config.define['window.__RENDER_URL__'] = JSON.stringify(
        command == 'serve' ? defaultConfig.renderUrl : options.renderUrl
      );

      // Устанавливаем стандартный input
      if (!config.build) config.build = {};
      if (!config.build.rollupOptions) config.build.rollupOptions = {};
      if (!config.build.rollupOptions.input)
        config.build.rollupOptions.input = 'src/main.ts';
    },

    resolveId(id) {
      if (id === 'virtual:velund/components') return id;
      return null;
    },
    async load(id) {
      if (id !== 'virtual:velund/components') return null;

      // Находим все шаблоны в проекте
      const files = await FastGlob('**/*.vel.{ts,js}', { cwd: process.cwd() });

      // Генерируем импорты
      const imports = files
        .map(
          (file: string, index: any) => `import comp${index} from '/${file}';`
        )
        .join('\n');

      const exportObject = files
        .map((_: any, index: any) => `comp${index}`)
        .join(', ');

      return `
        ${imports}
        export default [${exportObject}];
      `;
    },

    async transform(code: string, id: string) {
      for (const ext of templateExtensions) {
        if (id.endsWith(ext)) {
          return {
            code: `export default ${JSON.stringify(code)};`,
            map: null,
          };
        }
      }

      return null;
    },
  };
}
