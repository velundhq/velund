import { defineTemplate } from '../../plugins/twig-bitrix/common/defineTemplate.js';

export default defineTemplate({
  name: 'ProductCardInline',
  template: `<div class="product-card">
    <h2>{{ title }}</h2>
    <p>{{ price }}</p>
    {% include "ProductCardSeparate" with {title: 'Пошёлнахуй'} %}
  </div>`,
  fetch: () => ({
    title: 'Моковый продукт 3',
    price: '1000 ₽',
  }),
});
