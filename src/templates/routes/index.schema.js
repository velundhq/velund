import { Type } from '@sinclair/typebox';

export default Type.Object(
  {
    title: Type.String(),
    price: Type.Number(),
    tags: Type.Array(Type.String()),
    isActive: Type.Boolean(),
    description: Type.Optional(Type.String()),
    meta: Type.Optional(
      Type.Object({
        createdBy: Type.String(),
        updatedBy: Type.Optional(Type.String()),
        options: Type.Object({
          enableFeatureX: Type.Boolean(),
          config: Type.Optional(
            Type.Object({
              maxItems: Type.Number(),
              labels: Type.Optional(Type.Array(Type.String())),
            })
          ),
        }),
      })
    ),
    items: Type.Optional(
      Type.Array(
        Type.Object({
          id: Type.Number(),
          name: Type.String(),
          attributes: Type.Optional(
            Type.Object({
              color: Type.String(),
              size: Type.Optional(Type.String()),
            })
          ),
        })
      )
    ),
  },
  { additionalProperties: false }
);
