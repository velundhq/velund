import { defineComponent } from 'velund/common';
import template from './template.twig';
import { ProductType } from '../../shared/types';
import { Type } from '@sinclair/typebox';

export default defineComponent({
  name: 'ProductPage2',
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
