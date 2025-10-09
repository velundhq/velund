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

## Пример компонента `ProductList.vel.ts` с `prepare`

```ts
import { defineComponent } from 'velund';
import { Type } from '@sinclair/typebox';
import template from './template.twig';

export const ProductList = defineComponent({
  name: 'ProductList',
  template,

  // Аргументы для prepare-функции
  propsSchema: Type.Object({
    limit: Type.Optional(Type.Number()),
  }),

  // Контекст обязателен, так как есть prepare
  contextSchema: Type.Object({
    products: Type.Array(
      Type.Object({
        id: Type.Number(),
        title: Type.String(),
        price: Type.Number(),
        description: Type.String(),
        category: Type.String(),
        image: Type.String(),
        rating: Type.Object({
          rate: Type.Number(),
          count: Type.Number(),
        }),
      })
    ),
  }),

  async prepare(ctx, args) {
    const res = await fetch(
      `http://example.com/api/products?limit=${args.limit ?? 10}`
    );
    return { products: await res.json() };
  },
});
```

## Пример шаблона компонента `template.twig`

```twig
{% extends "PageLayout" %}
{% for product in products %}
	<div class="w-72 bg-white shadow-md rounded-xl duration-500 hover:scale-105 hover:shadow-xl">
		<a href="/product/{{product.id}}">
			<img src="{{ product.image }}" alt="{{product.title}}" class="h-80 w-72 object-cover rounded-t-xl"/>
			<div class="px-4 py-3 w-72">
				<span class="text-gray-400 mr-3 uppercase text-xs">{{category}}</span>
				<p class="text-lg font-bold text-black truncate block capitalize">{{product.title}}</p>
				<div class="flex items-center">
					<p class="text-lg font-semibold text-black cursor-auto my-3">${{product.price}}</p>
				</div>
			</div>
		</a>
	</div>
{% endfor %}
```
