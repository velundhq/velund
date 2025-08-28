# Конфигурация плагина

Ниже описаны все доступные опции плагина **velund** для `vite.config.ts`.

| Опция                      | Тип                           | По умолчанию  | Описание                                                                                              |
| -------------------------- | ----------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| `renderer`                 | `string`                      | `'html'`      | Основной рендерер (`twig`, `jinja`, `html`). ⚠️ `html` встроен в Velund и доступен "из коробки".      |
| `generator`                | `string`                      | `'node'`      | Основной генератор (`node`, `php`, `python`). ⚠️ `node` встроен в Velund и используется по умолчанию. |
| `assetsUrl`                | `string`                      | `'/assets'`   | URL-путь для статических ассетов (JS/CSS).                                                            |
| `renderUrl`                | `string`                      | `'/__render'` | API-роут для runtime-рендеринга компонентов.                                                          |
| `strictTemplateExtensions` | `boolean`                     | `false`       | Если `true` — разрешает только расширения, подходящие для выбранного рендерера.                       |
| `generators`               | `VelundGeneratorDescriptor[]` | `[]`          | Список сторонних генераторов (например, `@zebrains/velund-php`). Для `node` указывать не нужно.       |
| `renderers`                | `VelundRendererDescriptor[]`  | `[]`          | Список сторонних рендереров (например, `@zebrains/velund-twig`). Для `html` указывать не нужно.       |
| `nodeConfig`               | `VelundNodeGeneratorOptions`  | `{}`          | Дополнительные опции для встроенного генератора `node`.                                               |

---

## Замечания

- Если вы используете **HTML + Node.js** (конфигурация по умолчанию), то можно обойтись минимальным `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import velund from 'velund';

export default defineConfig({
  plugins: [velund()],
});
```

- При подключении сторонних движков (например, Twig + PHP) необходимо явно указывать их в `renderers` и `generators`.
