# Интеграция с бэкендом

Velund генерирует **полноценные backend-библиотеки** для выбранного языка.  
Это позволяет подключать компоненты напрямую в серверный код, без необходимости писать прослойки вручную.

---

## Важно

Примеры ниже относятся к **Node.js** — эталонной реализации генератора.  
Позже будут добавлены отдельные руководства для **PHP** и **Python**.

---

## Как это работает

1. При сборке создаётся библиотека (`dist/lib/`).
2. Она экспортирует:
   - `Renderer` — движок для рендеринга компонентов;
   - скомпилированные компоненты (`HomePageComponent`, `HeaderComponent` и т.д.).
3. Backend использует их для рендеринга и интеграции с данными.

---

## Пример (Node.js + Express)

```js
import express from 'express';
import { HomePageComponent, Renderer } from '../velund/lib'; // директория с уже собранной библиотекой

const app = express();
const renderer = new Renderer();

// Пример prepare-хука для компонента
HomePageComponent.registerPrepare(async () => ({
  products: await (await fetch('https://fakestoreapi.com/products')).json(),
}));

app.get('/', async (req, res) => {
  // Рендер компонента HomePage с передачей данных
  res.send(await renderer.render('HomePage', {}));
});

app.listen(3333, () => {
  console.log('Server running on http://localhost:3333');
});
```
