import { defineTemplate } from '@velund/vite/common';
import template from './template.j2';
import { ProductType } from '../../shared/types';
import { Type } from '@sinclair/typebox';

export default defineTemplate({
  name: 'ProductPage',
  template,
  propsSchema: Type.Object({
    id: Type.Number(),
  }),
  contextSchema: ProductType,
  async prepare({ id }) {
    const product = await (
      await fetch(`https://fakestoreapi.com/products/${id}`)
    ).json();
    return product;
  },
});
