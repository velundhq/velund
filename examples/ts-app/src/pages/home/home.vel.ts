import { defineComponent } from '@velund/vite/common';
import template from './template.j2';
import { Type } from '@sinclair/typebox';
import { ProductType } from '../../shared/types';

export default defineComponent({
  name: 'HomePage',
  template,
  contextSchema: Type.Object({
    products: Type.Array(ProductType),
  }),
  async prepare() {
    const products = await (
      await fetch('https://fakestoreapi.com/products')
    ).json();
    return {
      products,
    };
  },
});
