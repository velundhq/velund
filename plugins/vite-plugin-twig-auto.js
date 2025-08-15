import twig from 'twig';
import fs from 'fs';
import path from 'path';
import { promises as fsp } from 'fs';
import fg from 'fast-glob';
import chokidar from 'chokidar';

export default function twigPagesPlugin({
  templatesDir = './src/templates',
  routeTemplatesDir = 'routes',
  assetsDir = './src/assets',
  assetsAlias = '@assets',
  assetsBasePath = '/assets',
} = {}) {
  let twigFiles = [];
  let assetEntries = new Set();
  const assetsDirAbs = path.resolve(assetsDir);

  const getAllTwigFiles = async (dir) =>
    fg.sync(`${dir.replace(/\\/g, '/')}/**/*.twig`, { dot: false });

  const getRouteFromFile = (filePath) => {
    const relative = path.relative(
      path.join(templatesDir, routeTemplatesDir),
      filePath
    );
    const parsed = path.parse(relative);
    const segments = parsed.dir.split(path.sep).filter(Boolean);
    if (parsed.name === 'index') {
      return segments.length ? '/' + segments.join('/') : '/';
    }
    return '/' + [...segments, parsed.name].join('/');
  };

  const twigRender = (filePath, context = {}) => {
    const template = fs.readFileSync(filePath, 'utf-8');

    // Получаем все поддиректории templatesDir
    const namespaces = {};
    const templateDirEntries = fs.readdirSync(templatesDir, {
      withFileTypes: true,
    });

    for (const entry of templateDirEntries) {
      if (entry.isDirectory()) {
        // Регистрируем неймспейс для каждой поддиректории
        const namespaceName = entry.name;
        const namespacePath = path.join(templatesDir, entry.name);
        namespaces[namespaceName] = namespacePath;
      }
    }

    // Добавляем корень как неймспейс "root"
    namespaces.root = templatesDir;

    return twig
      .twig({
        data: template,
        path: filePath,
        namespaces,
        settings: {
          'twig options': {
            // Отключаем кеш в dev-режиме
            rethrow: true,
            autoescape: true,
            cache: false,
          },
          auto_reload: true,
        },
      })
      .render(context);
  };

  async function copyDirToDist(srcDir, distDir, baseDir, options = {}) {
    const {
      excludeJsonIfTwigExists = false, // Новая опция - исключать json если есть twig
      excludeAllJson = false, // Просто исключать все json файлы
    } = options;

    const entries = await fsp.readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const relativePath = path.relative(baseDir, srcPath);
      const destPath = path.join(distDir, relativePath);

      if (entry.isDirectory()) {
        await copyDirToDist(srcPath, distDir, baseDir, options);
      } else if (entry.isFile()) {
        // Проверяем нужно ли исключать этот файл
        let shouldExclude = false;

        if (excludeAllJson && entry.name.endsWith('.json')) {
          shouldExclude = true;
        }

        if (excludeJsonIfTwigExists && entry.name.endsWith('.json')) {
          const twigFilePath = srcPath.replace(/\.json$/, '');
          if (fs.existsSync(twigFilePath)) {
            shouldExclude = true;
          }
        }

        if (!shouldExclude) {
          await fsp.mkdir(path.dirname(destPath), { recursive: true });
          await fsp.copyFile(srcPath, destPath);
        }
      }
    }
  }

  return {
    name: 'vite-plugin-twig-auto-assets',
    config(config) {
      return {
        ...config,
        build: {
          ...config.build,
          assetsDir: 'assets',
          rollupOptions: {
            ...config?.build?.rollupOptions,
            input: {},
          },
        },
      };
    },
    async configureServer(server) {
      const assetsDevPath = '/' + assetsDir.replace(/^\.\/|^\//, '');

      const updateRoutes = async () => {
        twigFiles = await getAllTwigFiles(
          path.join(templatesDir, routeTemplatesDir)
        );
        console.log(
          'Routes updated:',
          twigFiles.map((f) => getRouteFromFile(f))
        );
      };

      await updateRoutes();

      // Следим за twig + json
      const watcher = chokidar.watch(
        [path.resolve(templatesDir), path.resolve(assetsDir)],
        { ignoreInitial: true }
      );

      watcher.on('all', (event, filePath) => {
        // console.log(`[vite-plugin-twig-auto-assets] ${event}: ${filePath}`);
        twig.cache(false);
        server.ws.send({ type: 'full-reload', path: '*' });
        if (['add', 'unlink'].includes(event)) {
          updateRoutes();
        }
      });

      server.middlewares.use(async (req, res, next) => {
        try {
          const route = req.url.split('?')[0];
          if (route === '/@vite/client') return next();

          const matchedFile = twigFiles.find(
            (f) => getRouteFromFile(f) === route
          );
          if (!matchedFile) return next();

          // Логируем обработку запроса
          // console.log(`[Twig] Rendering: ${matchedFile} for route ${route}`);

          // Ищем JSON рядом с twig для контекста
          const jsonFile = matchedFile + '.json';
          let context = {};

          if (fs.existsSync(jsonFile)) {
            try {
              const jsonContent = await fsp.readFile(jsonFile, 'utf-8');
              context = JSON.parse(jsonContent);
            } catch (err) {
              console.error(
                `❌ Failed to parse JSON context for ${matchedFile}:`,
                err
              );
              // Можно добавить контекст в шаблон для отладки
              context._jsonError = `JSON parsing error: ${err.message}`;
            }
          }

          let html;
          try {
            // Пробуем рендерить шаблон
            html = twigRender(matchedFile, context);

            // Заменяем пути к ассетам
            html = html.replace(
              new RegExp(`${assetsAlias}/`, 'g'),
              assetsDevPath + '/'
            );

            // Добавляем скрипт HMR Vite в dev-режиме
            if (process.env.NODE_ENV === 'development') {
              html = html.replace(
                '</head>',
                `<script type="module" src="/@vite/client"></script>\n</head>`
              );
            }
          } catch (err) {
            // Обрабатываем ошибки рендеринга
            console.error(`❌ Twig render failed for ${matchedFile}:`, err);

            html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Twig Error: ${route}</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; }
            .error { color: #d32f2f; white-space: pre-wrap; }
          </style>
          <script type="module" src="/@vite/client"></script>\n</head>
        </head>
        <body>
          <h1>Twig Render Error (${route})</h1>
          <div class="error">${err.stack || err.message}</div>
          ${
            context._jsonError
              ? `<h2>JSON Error:</h2><div class="error">${context._jsonError}</div>`
              : ''
          }
        </body>
      </html>
      `;

            res.statusCode = 500;
          }

          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch (err) {
          // Ловим неожиданные ошибки
          console.error('⚠️ Unexpected middleware error:', err);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      });
    },

    async buildStart() {
      if (this.meta?.watchMode) {
        // dev mode — ничего не emit’им, только собираем assetEntries для watcher
        return;
      }
      twigFiles = await getAllTwigFiles(templatesDir);
      assetEntries = new Set();

      // Находим все ассеты в Twig
      for (const twigFile of twigFiles) {
        const content = await fsp.readFile(twigFile, 'utf-8');
        const regex = new RegExp(`${assetsAlias}/([^"'>\\s]+)`, 'g');
        let match;
        while ((match = regex.exec(content)) !== null) {
          assetEntries.add(match[1]);
        }
      }

      // Отдаём все ассеты Vite для сборки и хеширования
      for (const assetPath of assetEntries) {
        const absAssetPath = path.resolve(assetsDir, assetPath);
        if (!fs.existsSync(absAssetPath)) continue;

        const ext = path.extname(assetPath).toLowerCase();
        this.emitFile({
          type: 'chunk',
          id: absAssetPath,
          name: path.basename(assetPath, ext),
        });
      }
    },

    async generateBundle(_, bundle) {
      const distRoot = path.resolve('dist');
      const templatesDistRoot = path.join(distRoot, 'templates');
      const namespaces = {};

      const templateDirEntries = await fsp.readdir(templatesDir, {
        withFileTypes: true,
      });
      for (const entry of templateDirEntries) {
        if (entry.isDirectory()) {
          namespaces[entry.name] = path.join(templatesDir, entry.name);
        }
      }
      namespaces.root = templatesDir; // Добавляем корневой неймспейс

      await copyDirToDist(
        path.resolve(templatesDir),
        templatesDistRoot,
        path.resolve(templatesDir),
        {
          excludeJsonIfTwigExists: true,
          excludeAllJson: false,
        }
      );

      const assetMap = {};

      // Строим карту оригинал → хешированный путь
      for (const fileName in bundle) {
        const b = bundle[fileName];
        if (b.type === 'asset') {
          // берём путь относительно папки assets
          const relPath = path.relative(
            assetsDirAbs,
            b.originalFileName || b.name || ''
          );
          if (relPath) assetMap[relPath.replace(/\\/g, '/')] = fileName;
        }
      }

      // Подмена путей в twig
      for (const file of twigFiles) {
        const distTwigFile = path.join(
          templatesDistRoot,
          path.relative(path.resolve(templatesDir), file)
        );
        let content = await fsp.readFile(distTwigFile, 'utf-8');

        for (const [nsName] of Object.entries(namespaces)) {
          content = content.replace(
            new RegExp(`@${nsName}/`, 'g'),
            `/${nsName}/`.replace(/\\/g, '/')
          );
        }

        content = content.replace(
          new RegExp(`${assetsAlias}/([^"'>\\s]+)`, 'g'),
          (_, assetName) => {
            const assetPath = assetName.replace(/\\/g, '/');
            return `${assetsBasePath}/${(assetMap?.[assetPath] || assetName)
              .replace(/^assets\//, '')
              .replace(/\\/g, '/')}`.replace(/\/+/g, '/');
          }
        );
        await fsp.writeFile(distTwigFile, content, 'utf-8');
      }
    },
  };
}
