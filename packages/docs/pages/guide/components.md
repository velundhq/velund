# Определение компонентов

Компоненты в Velund описываются декларативно и могут содержать схемы валидации.  
Для описания схем используется [TypeBox](https://github.com/sinclairzx81/typebox).

---

## Базовый пример

```ts
import { defineComponent } from 'velund';
import { Type } from '@sinclair/typebox';

export const Button = defineComponent({
  name: 'Button',

  // Входные свойства компонента
  propsSchema: Type.Object({
    label: Type.String(),
    disabled: Type.Optional(Type.Boolean()),
  }),
});
```

---

## Схемы компонентов

В компоненте можно описывать три типа схем:

| Схема               | Для чего нужна                                | Обязательность                                          |
| ------------------- | --------------------------------------------- | ------------------------------------------------------- |
| **`propsSchema`**   | Описывает свойства (`props`) компонента.      | Необязательна                                           |
| **`contextSchema`** | Описывает контекст, передаваемый в `prepare`. | Обязательна, если используется `prepare`                |
| **`prepareSchema`** | Описывает аргументы функции `prepare`.        | Необязательна, применяется только при наличии `prepare` |

---

### Важные правила

1. Все схемы должны быть **только `Type.Object(...)`** из TypeBox.
   Примеры:

   ```ts
   propsSchema: Type.Object({ title: Type.String() });
   contextSchema: Type.Object({ userId: Type.String() });
   prepareSchema: Type.Object({ limit: Type.Number() });
   ```

2. **`propsSchema`** и **`contextSchema`** по умолчанию необязательны.
   Их можно не указывать, если не требуется строгая валидация.

3. Если в компоненте определён `prepare`, то:
   - `contextSchema` становится **обязательной**;
   - `prepareSchema` можно указать для описания аргументов самой `prepare`-функции.

---

## Пример с `prepare`

```ts
import { defineComponent } from 'velund';
import { Type } from '@sinclair/typebox';

export const ProductList = defineComponent({
  name: 'ProductList',

  propsSchema: Type.Object({
    title: Type.String(),
  }),

  // Контекст обязателен, так как есть prepare
  contextSchema: Type.Object({
    apiUrl: Type.String(),
  }),

  // Аргументы для prepare-функции
  prepareSchema: Type.Object({
    limit: Type.Optional(Type.Number()),
  }),

  async prepare(ctx, args) {
    const res = await fetch(`${ctx.apiUrl}/products?limit=${args.limit ?? 10}`);
    return { products: await res.json() };
  },
});
```
