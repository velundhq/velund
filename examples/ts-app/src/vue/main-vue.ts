//@ts-ignore
import { createApp } from 'vue/dist/vue.esm-bundler';
//@ts-ignore
import CartButton from './components/CartButton.vue';
import { VelundRenderer } from 'velund/common';

const app = createApp({
  setup() {},
});

app.component('cart-button', CartButton);

app.mount('#app');

VelundRenderer.render('Product', {
  product: {
    id: 1488,
    title: 'Ебать меня жмыхнуло братан',
    price: 22.3,
    description:
      'Slim-fitting style, contrast raglan long sleeve, three-button henley placket, light weight & soft fabric for breathable and comfortable wearing. And Solid stitched shirts with round neck made for durability and a great fit for casual fashion wear and diehard baseball fans. The Henley style round neckline includes a three-button placket.',
    category: "men's clothing",
    image:
      'https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_t.png',
    rating: {
      rate: 4.1,
      count: 259,
    },
  },
}).then(console.info);
