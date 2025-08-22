import express from 'express';
import path from 'path';
import {
  HomePageComponent,
  ProductPageComponent,
  Renderer,
} from 'velund-components';
const app = express();
const port = 3333;

const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

HomePageComponent.registerPrepare(async () => {
  const products = await (
    await fetch('https://fakestoreapi.com/products')
  ).json();
  return {
    products,
  };
});

ProductPageComponent.registerPrepare(async ({ id }) => {
  const product = await (
    await fetch('https://fakestoreapi.com/products/' + id)
  ).json();
  return product;
});

const renderer = new Renderer();

app.get('/', async (req, res) => {
  res
    .status(200)
    .send(await renderer.render('HomePage', {}))
    .end();
});
app.get('/ProductPage', async (req, res) => {
  res
    .status(200)
    .send(await renderer.render('ProductPage', req.query))
    .end();
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
