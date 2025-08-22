import { Type } from '@sinclair/typebox';

export const ProductType = Type.Object({
  id: Type.Number(),
  title: Type.String(),
  price: Type.Number(),
  description: Type.String(),
  category: Type.String(),
  image: Type.String(),
  rating: Type.Object({
    rate: Type.Number(),
    count: Type.Number(),
  }),
});
