import { Type } from '@sinclair/typebox';
import defineTemplate from '../../../plugins/twig-bitrix/common/defineTemplate';
import template from './index.twig';
export default defineTemplate({
  name: 'IndexRoute',
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
        title: 'Мой Продукт123',
        price: 1337,
      },
    ];
    return {
      product: products.find((i) => i.id === productId || 9),
    };
  },
});
