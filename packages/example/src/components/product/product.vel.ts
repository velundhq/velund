import { defineTemplate } from '@velund/vite/common';
import { ProductType } from '../../shared/types';
import template from './template.twig';

export default defineTemplate({
  name: 'Product',
  contextSchema: ProductType,
  template,
});
