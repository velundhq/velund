import { TypeCompiler, ValueError } from '@sinclair/typebox/compiler';
import {
  VelundComponentDescriptor,
  VelundRendererDescriptor,
} from '@velund/core';
import chokidar from 'chokidar';
import url from 'url';
import { match } from 'path-to-regexp';

import type { Plugin, ViteDevServer } from 'vite';
import genHomePage from './pages/home';
import { iTwigPluginConfig } from './types';
import { VelundAppDescriptor } from './common/defineVelundApp';
import gen404Page from './pages/404';
import genErrorPage from './pages/error';

export default function devServer(
  options: iTwigPluginConfig,
  renderer: VelundRendererDescriptor
): Partial<Plugin> {
  let entry: string;
  let app: VelundAppDescriptor;
  let registeredComponents = new Map<string, VelundComponentDescriptor>();

  // обновление списка шаблонов и регистрация в Twing
  const updateTemplates = async (server: ViteDevServer) => {
    const input = entry || 'src/main.ts';
    const entryModule = await server.ssrLoadModule(input);
    const newComponentNames: string[] = [];
    const newComponents: VelundComponentDescriptor[] = [];
    registeredComponents = new Map();
    if (entryModule?.default?.components) {
      app = entryModule.default;
    }
    app?.components?.forEach((comp: any) => {
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
          if (
            !req.url ||
            req.url.startsWith('/src') ||
            req.url.startsWith('/@') ||
            req.url.includes('node_modules') ||
            req.url.includes('vite')
          ) {
            return next();
          }
          const parsedUrl = url.parse(req.url);

          await updateTemplates(server);

          let isMetaRender: boolean = false;
          let component: VelundComponentDescriptor | undefined;
          let context: Record<string, any> = {};

          if (app) {
            for (const route of app.routes) {
              const matched = match(route.path, { decode: decodeURIComponent })(
                req.url
              );
              if (matched) {
                component = route.component as VelundComponentDescriptor;
                context = matched.params;
                break;
              }
            }
          }

          if (!component) {
            if (['', '/'].includes(parsedUrl.pathname || '')) {
              res.writeHead(302, { Location: '/__velund' });
              res.end();
              return;
            }

            if (parsedUrl.pathname?.replace(/\/+$/, '') == '/__velund') {
              res.setHeader('Content-Type', `text/html; charset=utf-8`);
              res.end(genHomePage(Array.from(registeredComponents.values())));
              return;
            }

            isMetaRender =
              parsedUrl.pathname
                ?.toString()
                .replace(/\/+$/, '')
                .startsWith(options.renderUrl) || false;

            const query = Object.fromEntries(
              new URLSearchParams(parsedUrl.query || '')
            );

            const componentName = isMetaRender
              ? query.component
              : parsedUrl.pathname?.slice(1).replace(/\/+$/, '');
            context = {
              ...context,
              ...(isMetaRender
                ? JSON.parse(query?.context || '{}')
                : query?.props || query),
            };

            component = registeredComponents.get(componentName || '');
          }

          if (component) {
            const validateSchema = component?.prepare
              ? component?.propsSchema || null
              : component?.contextSchema || null;
            if (validateSchema) {
              const cSchema = TypeCompiler.Compile(validateSchema);
              if (!cSchema.Check(context || {})) {
                console.warn(
                  `[WARN]: Invalid context data for "${component.name}":`
                );
                console.warn(
                  formatValidationErrors([...cSchema.Errors(context || {})])
                );
              }
            }

            const renderResult = await renderer.render(
              component.name,
              context || {},
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
            return;
          } else {
            res.statusCode = 404;
            res.end(gen404Page());
            return;
          }
        } catch (err: any) {
          console.error('[ERROR] Velund render error:', err);
          res.statusCode = 500;
          res.end(genErrorPage(err));
        }
      });
    },
  };
}
