import twigPlugin from './plugins/twig-bitrix';

export default {
  plugins: [
    twigPlugin({
      templatesDir: './src/templates',
      assetsDir: './src/assets',
    }),
  ],
};
