import devServer from './serve.js';
import buildPlugin from './build.js';

export default function twigPlugin(config: Partial<iTwigPluginConfig>) {
  const defaultConfig: iTwigPluginConfig = {
    templatesDir: './src/templates',
    assetsDir: './src/assets',
    distDir: './dist',
  };

  const options: iTwigPluginConfig = Object.assign(defaultConfig, config);

  return {
    name: 'vite-twig-bitrix-plugin',
    ...devServer(options),
    ...buildPlugin(options),

    config(config) {
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
    },

    async transform(code: string, id: string) {
      if (!id.endsWith('.twig')) return null;
      return {
        code: `export default ${JSON.stringify(code)};`,
        map: null,
      };
    },
  };
}
