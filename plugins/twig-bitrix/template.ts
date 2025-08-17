import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { pathToFileURL } from 'url';

export async function loadTwgTemplate(filePath: string) {
  const content = await fs.promises.readFile(filePath, 'utf8');

  // Вырезаем содержимое <script>...</script>
  const template = content.match(/<template[^>]*>([\s\S]*?)<\/template>/);
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    throw new Error(`.twg file ${filePath} has no <script> section`);
  }
  const scriptCode = scriptMatch[1];

  // Чтобы `import` внутри работал как обычно — указываем базовый путь
  const baseUrl = pathToFileURL(filePath).href;

  // Делаем временный data: URL
  const dataUrl =
    'data:text/javascript;base64,' +
    Buffer.from(scriptCode, 'utf8').toString('base64');

  // Импортируем как модуль
  const mod = await import(dataUrl + `#${baseUrl}`);

  const comp = mod.default(path.basename(filePath));
  comp.template = template;
  return comp;
}
