# Настройка entry-файла (`main.ts` / `main.js`)

После конфигурации плагина в `vite.config.ts` необходимо создать **точку входа** приложения Velund.  
Обычно это файл `src/main.ts` или `src/main.js`.

---

## Автоимпорт

Velund собирает все `.vel`-компоненты в глобальный массив с уникальными именами.  
Благодаря этому можно подключить их одним вызовом через виртуальный модуль `virtual:velund/components`:

```ts
// main.ts
import { defineVelundApp } from 'velund/common';
import components from 'virtual:velund/components';

export default defineVelundApp(components);
```

Преимущества:

- Автоматически подключаются все компоненты.
- Исключает дублирование кода.
- Все имена компонентов уникальны (контролируется на этапе сборки).

---

## Ручной импорт (альтернативный способ) —

Если по какой-то причине автоимпорт не подходит (например, кастомная структура сборки), можно импортировать компоненты вручную:

```ts
import { defineVelundApp } from 'velund/common';

import ProductComponent from './components/product/product.vel';
import BaseLayoutComponent from './layouts/base.vel';

export default defineVelundApp([ProductComponent, BaseLayoutComponent]);
```

⚠️ Обычно этот подход **не нужен**, так как автоимпорт решает задачу лучше.
