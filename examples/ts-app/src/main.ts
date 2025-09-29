import { defineVelundApp } from 'velund/common';
import templates from 'virtual:velund/components';

export default defineVelundApp(templates, [
  {
    path: '/',
    component: 'HomePage',
  },
  {
    path: '/product/:id',
    component: 'ProductPage2',
  },
]);
