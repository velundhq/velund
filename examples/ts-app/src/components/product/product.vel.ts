import { defineTemplate } from '@velund/vite/common';
import { ProductType } from '../../shared/types';
import template from './template.j2';
import { Type } from '@sinclair/typebox';

export default defineTemplate({
  name: 'Product',
  contextSchema: Type.Object({
    product: ProductType,
  }),
  template,
});
