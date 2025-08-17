import chokidar from 'chokidar';
import fg from 'fast-glob';
import path from 'path';
import url from 'url';
import type { Plugin, ViteDevServer } from 'vite';
import defineTwingRenderer from './twig';

export default function devServer({
  templatesDir,
  assetsDir,
}: iTwigPluginConfig): Partial<Plugin> {
  const { render, setComponent, removeComponent } = defineTwingRenderer();
  let templateFiles: string[] = [];
  let registeredComponentNames: string[] = [];

  // собираем все JS-файлы шаблонов
  const getAllTemplateFiles = async () =>
    fg.sync(`${templatesDir.replace(/\\/g, '/')}/**/*.twg`, { dot: false });

  // обновление списка шаблонов и регистрация в Twing
  const updateTemplates = async (server: ViteDevServer) => {
    const newTemplateFiles = await getAllTemplateFiles();

    // Параллельно импортируем и регистрируем все компоненты
    const newComponentNames: string[] = [];

    await Promise.allSettled(
      newTemplateFiles.map(async (file) => {
        try {
          const mod = await server.ssrLoadModule(`${file}?t=${Date.now()}`);

          const templateComponent = mod.default(path.resolve(file));
          templateComponent.template = mod.__template;

          setComponent(templateComponent);

          newComponentNames.push(templateComponent.name);
        } catch (err) {
          console.warn(`Failed to load template ${file}:`, err);
        }
      })
    );

    // удаляем компоненты, которые больше не существуют
    for (const oldName of registeredComponentNames) {
      if (!newComponentNames.includes(oldName)) {
        removeComponent(oldName);
      }
    }

    registeredComponentNames = newComponentNames;
    templateFiles = newTemplateFiles;
  };

  return {
    configureServer(server) {
      // watcher для изменений
      const watcher = chokidar.watch([templatesDir, assetsDir], {
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
            return next();
          }

          // контекст из query-параметров
          const context = Object.fromEntries(
            new URLSearchParams(parsed.query || '')
          );

          // рендер по имени компонента
          const html =
            (await render(componentName, context)) +
            '<script type="module" src="/@vite/client"></script>';

          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch (err: any) {
          console.error('Twig dev render error:', err);
          res.statusCode = 500;
          res.end(`<pre>${err.stack}</pre>`);
        }
      });
    },
  };
}
