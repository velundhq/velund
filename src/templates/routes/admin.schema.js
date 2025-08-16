import { Type } from '@sinclair/typebox';

export default Type.Object({
  user: Type.Object({
    first_name: Type.String({ default: 'Дик' }),
    last_name: Type.String({ default: 'Кок' }),
  }),
  page_title: Type.String({ default: 'Дышборд' }),
});
