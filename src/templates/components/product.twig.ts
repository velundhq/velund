import template from './product.twig';
import defineTemplate from '../../../plugins/twig-bitrix/common/defineTemplate';
import { Type } from '@sinclair/typebox';

export default defineTemplate({
  name: 'Product',
  template,
  contextSchema: Type.Object({
    product: Type.Optional(
      Type.Object({
        title: Type.String(),
        price: Type.Number(),
      })
    ),
  }),
  propsSchema: Type.Object({
    productId: Type.Number(),
  }),

  async prepare({ productId }) {
    const products = [
      {
        id: 9,
        title: 'Мой Продукт9',
        price: 1337,
      },
      {
        id: 10,
        title: 'Мой Продукт10',
        price: 1338,
      },
    ];
    return {
      product: products.find((i) => i.id === productId),
    };
  },
});
