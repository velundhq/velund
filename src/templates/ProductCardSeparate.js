import { defineTemplate } from '../../plugins/twig-bitrix/common/defineTemplate.js';

export default defineTemplate({
  name: 'ProductCardSeparate',
  template: './ProductCardSeparate.twig',
  fetch: ({ title }) => ({
    title: title + ' Продукт из файла',
    price: '2000 ₽',
  }),
});
