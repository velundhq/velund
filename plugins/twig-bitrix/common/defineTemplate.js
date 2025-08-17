import fs from 'fs';
import path from 'path';

export function defineTemplate({ name, template, fetch, schema }) {
  if (!name) {
    throw new Error('defineTemplate: name is required');
  }

  // Фабрика: возвращает функцию, которую можно вызвать с basePath
  return function resolveTemplate(basePath = process.cwd()) {
    let templateContent = template;
    let absPath;

    // Проверка: если строка похожа на путь — пробуем резолвить
    if (
      (typeof template === 'string' && template?.endsWith('.twig')) ||
      template?.endsWith('.html')
    ) {
      absPath = path.resolve(basePath, template);
      if (fs.existsSync(absPath)) {
        templateContent = fs.readFileSync(absPath, 'utf-8');
      } else {
        console.warn(
          `⚠️ defineTemplate: файл не найден по пути ${absPath}, используется как строка`
        );
      }
    }

    return {
      name,
      template: templateContent || '',
      fetch,
      schema,
      __sourcePath: absPath,
    };
  };
}
