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

    transform(code: string, id: string) {
      if (!id.endsWith('.twg')) return;

      const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/);
      const scriptMatch = code.match(/<script>([\s\S]*?)<\/script>/);

      const template = templateMatch ? templateMatch[1].trim() : '';
      const script = scriptMatch ? scriptMatch[1].trim() : '';

      // оставляем script как есть
      // и дописываем экспорт шаблона
      const result = `
${script}

export const __template = ${JSON.stringify(template)};
`;

      return {
        code: result,
        map: null,
      };
    },
  };
}
