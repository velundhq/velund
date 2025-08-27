import { defineComponent } from 'velund/common';
import { ProductType } from '../../shared/types';
import template from './template.twig';
import { Type } from '@sinclair/typebox';

export default defineComponent({
  name: 'Product',
  contextSchema: Type.Object({
    product: ProductType,
  }),
  template,
});
