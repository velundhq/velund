import chokidar from 'chokidar';
import url from 'url';
import type { Plugin, ViteDevServer } from 'vite';
import { iTwigPluginConfig } from './types';
import {
  VelundComponentDescriptor,
  VelundRendererDescriptor,
} from '@velund/core';
import { TypeCompiler, ValueError } from '@sinclair/typebox/compiler';

export default function devServer(
  options: iTwigPluginConfig,
  renderer: VelundRendererDescriptor
): Partial<Plugin> {
  let entry: string;

  let registeredComponents = new Map<string, VelundComponentDescriptor>();

  // обновление списка шаблонов и регистрация в Twing
  const updateTemplates = async (server: ViteDevServer) => {
    const input = entry || 'src/main.ts';
    const entryModule = await server.ssrLoadModule(input);
    const newComponentNames: string[] = [];
    const newComponents: VelundComponentDescriptor[] = [];
    registeredComponents = new Map();
    entryModule.default?.components?.forEach((comp: any) => {
      if (!comp) return;
      newComponents.push(comp);
      newComponentNames.push(comp.name);
      registeredComponents.set(comp.name, comp);
    });

    renderer.setComponents(newComponents);
  };

  function formatValidationErrors(errors: ValueError[]): string {
    // Группируем ошибки по пути
    const errorsByPath: { [path: string]: ValueError[] } = {};

    for (const error of errors) {
      // Преобразуем путь в dot notation (убираем первый слеш, заменяем остальные на точки)
      const dotPath = error.path
        .replace(/^\//, '') // Убираем первый слеш
        .replace(/\//g, '.'); // Заменяем остальные слеши на точки

      if (!errorsByPath[dotPath]) {
        errorsByPath[dotPath] = [];
      }
      errorsByPath[dotPath].push(error);
    }

    // Форматируем ошибки для каждого пути
    const formattedErrors: string[] = [];

    for (const [path, pathErrors] of Object.entries(errorsByPath)) {
      // Берем оригинальные сообщения без изменений
      const messages = pathErrors.map((error) => error.message);

      // Убираем дубликаты и объединяем сообщения
      const uniqueMessages = [...new Set(messages)];
      const fieldName = path || 'root';

      formattedErrors.push(`• ${fieldName}: ${uniqueMessages.join('; ')}`);
    }

    return formattedErrors.join('\n');
  }

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
          const parsedUrl = url.parse(req.url);
          const isMetaRender = parsedUrl.pathname
            ?.toString()
            .replace(/\/+$/, '')
            .startsWith(options.renderUrl);
          let query = Object.fromEntries(
            new URLSearchParams(parsedUrl.query || '')
          );
          const componentName = isMetaRender
            ? query.component
            : parsedUrl.pathname?.slice(1).replace(/\/+$/, '');
          let context = {};
          if (isMetaRender) {
            context = JSON.parse(query?.context) || {};
          } else {
            context = query?.props || query;
          }

          await updateTemplates(server);
          if (!componentName || !registeredComponents.has(componentName)) {
            next();
            return;
          }
          const component = registeredComponents.get(componentName);
          const validateSchema = component?.prepare
            ? component?.propsSchema || null
            : component?.contextSchema || null;
          if (validateSchema) {
            const cSchema = TypeCompiler.Compile(validateSchema);
            if (!cSchema.Check(context || {})) {
              console.warn(
                `[WARN]: Invalid context data for "${componentName}":`
              );
              console.warn(
                formatValidationErrors([...cSchema.Errors(context || {})])
              );
            }
          }

          const renderResult = await renderer.render(
            componentName,
            context,
            true
          );

          renderResult.html = renderResult.html.replace(/@\//g, '/src/');

          res.setHeader(
            'Content-Type',
            `${isMetaRender ? 'application/json' : 'text/html'}; charset=utf-8`
          );

          res.end(
            isMetaRender
              ? JSON.stringify(renderResult, null, '\t')
              : renderResult.html +
                  '\n<script type="module" src="/@vite/client"></script>'
          );
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
