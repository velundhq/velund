//@ts-ignore
import { createApp } from 'vue/dist/vue.esm-bundler';
//@ts-ignore
import CartButton from './components/CartButton.vue';

const app = createApp({
  setup() {},
});

app.component('cart-button', CartButton);

app.mount('#app');
