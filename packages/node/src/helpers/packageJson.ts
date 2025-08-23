import fs from 'fs';
import path from 'path';
import { deepMerge } from './deepMerge.js';

export function generatePackageJson(
  outDir: string,
  rendererName: string,
  manifest?: Record<string, any>
) {
  // Базовые зависимости для разных рендереров
  const rendererDependencies: Record<string, Record<string, string>> = {
    twig: { twing: '^7.2.1' },
    html: {},
    jinja: { nunjucks: '^3.2.4' },
  };

  const baseConfig = {
    name: 'velund-components',
    version: '1.0.0',
    description: 'Generated Velund component library',
    main: 'Renderer.js',
    types: 'Renderer.d.ts',
    exports: {
      '.': {
        require: './Renderer.js',
        types: './Renderer.d.ts',
      },
      './PrepareRegistry': {
        require: './PrepareRegistry.js',
        types: './PrepareRegistry.d.ts',
      },
      './components/*': {
        require: './components/*.js',
        types: './components/*.d.ts',
      },
    },
    files: [
      '*.js',
      '*.d.ts',
      'components',
      'PrepareRegistry.js',
      'PrepareRegistry.d.ts',
    ],
    license: 'MIT',
    dependencies: rendererDependencies[rendererName] || {},
  };

  const content = deepMerge(baseConfig, manifest || {});

  fs.writeFileSync(
    path.join(outDir, 'package.json'),
    JSON.stringify(content, null, 2),
    'utf-8'
  );
}
