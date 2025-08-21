import chokidar from 'chokidar';
import url from 'url';
import type { Plugin, ViteDevServer } from 'vite';
import defineTwingRenderer from './modules/twig';

export default function devServer(opts: iTwigPluginConfig): Partial<Plugin> {
  let entry: string;
  const { render, setComponent, removeComponent } = defineTwingRenderer();

  let registeredComponentNames: string[] = [];

  // обновление списка шаблонов и регистрация в Twing
  const updateTemplates = async (server: ViteDevServer) => {
    const input = entry || 'src/main.ts';
    const entryModule = await server.ssrLoadModule(input);
    const newComponentNames: string[] = [];

    entryModule.default?.templates?.forEach((template: any) => {
      if (!template) return;
      setComponent(template);
      newComponentNames.push(template.name);
    });

    // удаляем компоненты, которые больше не существуют
    for (const oldName of registeredComponentNames) {
      if (!newComponentNames.includes(oldName)) {
        removeComponent(oldName);
      }
    }

    registeredComponentNames = newComponentNames;
  };

  return {
    configResolved(resolvedConfig) {
      const config = resolvedConfig;
      entry =
        (typeof config.build === 'object'
          ? Array.isArray(config.build.rollupOptions.input)
            ? config.build.rollupOptions.input[0]
            : typeof config.build.rollupOptions.input === 'object'
              ? config.build.rollupOptions.input[
                  Object.keys(config.build.rollupOptions.input)[0]
                ]
              : config.build.rollupOptions.input
          : '') || '';
    },
    configureServer(server) {
      // watcher для изменений
      const watcher = chokidar.watch('./src', {
        ignoreInitial: true,
      });
      watcher.on('all', async () => {
        await updateTemplates(server);
        server.ws.send({ type: 'full-reload', path: '*' });
      });

      // middleware для рендера шаблонов по URL
      server.middlewares.use(async (req, res, next) => {
        try {
          if (!req.url) return next();
          await updateTemplates(server);
          const parsed = url.parse(req.url);
          const componentName = parsed.pathname?.slice(1); // убираем ведущий "/"
          if (
            !componentName ||
            !registeredComponentNames.includes(componentName)
          ) {
            next();
            return;
          }

          // контекст из query-параметров
          let context = Object.fromEntries(
            new URLSearchParams(parsed.query || '')
          );
          if (context?.props) {
            context = context?.props as any;
          }

          // рендер по имени компонента
          let html =
            (await render(componentName, context)) +
            '<script type="module" src="/@vite/client"></script>';

          // правка путей к ассетам
          html = html.replace(/@\//g, '/src/');

          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch (err: any) {
          console.error('Twig dev render error:', err);
          res.statusCode = 500;
          res.end(
            `<pre style="color: red; padding: 1rem; border-radius:1rem; background: pink;">${err.stack}</pre><script type="module" src="/@vite/client"></script>`
          );
        }
      });
    },
  };
}
