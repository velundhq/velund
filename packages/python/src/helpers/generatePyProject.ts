import fs from 'fs';
import path from 'path';
import { deepMerge } from './deepMerge.js';

export function generatePyProject(
  outDir: string,
  rendererName: string,
  manifest?: Record<string, any>
) {
  // Базовые зависимости для разных рендереров
  const rendererDependencies: Record<string, string[]> = {
    twig: [], // Python-эквивалент Twing нет, оставим пусто
    html: [],
    jinja: ['jinja2>=3.2.4'],
  };

  const baseConfig = {
    tool: {
      poetry: {
        name: 'velund_components',
        version: '0.1.0',
        description: 'Generated Velund component library',
        authors: ['Velund Generator <velund@example.com>'],
        license: 'MIT',
        packages: [{ include: 'velund' }],
        dependencies: {
          python: '^3.10',
          ...(rendererDependencies[rendererName] || []).reduce(
            (acc, dep) => {
              const [pkg, ver] = dep.split(/>=|==|<=|~=|<|>/);
              acc[pkg] = ver || '*';
              return acc;
            },
            {} as Record<string, string>
          ),
        },
      },
    },
  };

  // Слияние с пользовательским манифестом
  const content = deepMerge(baseConfig, manifest || {});

  // Генерация TOML
  const tomlLines: string[] = [];
  function writeObj(obj: any, prefix = '') {
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'object' && !Array.isArray(value)) {
        tomlLines.push(`${prefix}${key} = {}`);
        writeObj(value, `${prefix}${key}.`);
      } else if (Array.isArray(value)) {
        tomlLines.push(
          `${prefix}${key} = [${value.map((v) => `"${v}"`).join(', ')}]`
        );
      } else if (typeof value === 'string') {
        tomlLines.push(`${prefix}${key} = "${value}"`);
      } else {
        tomlLines.push(`${prefix}${key} = ${value}`);
      }
    }
  }
  writeObj(content);

  fs.writeFileSync(
    path.join(outDir, 'pyproject.toml'),
    tomlLines.join('\n'),
    'utf-8'
  );
}
