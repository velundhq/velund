// defineTemplate.ts
import { Static, TSchema } from '@sinclair/typebox';

export type DefineTemplateOpts<
  TFinal extends TSchema = any,
  TProps extends TSchema = any
> = {
  name: string;
  template?: string;
  // propsSchema — схема входных данных для prepare
  propsSchema?: TProps;

  // contextSchema — схема результата prepare
  contextSchema?: TFinal;

  // prepare получает propsSchema и возвращает contextSchema
  prepare?: (
    props: TProps extends TSchema ? Static<TProps> : Record<string, any>
  ) =>
    | Promise<TFinal extends TSchema ? Static<TFinal> : Record<string, any>>
    | (TFinal extends TSchema ? Static<TFinal> : Record<string, any>);

  [k: string]: any;
};

export type TemplateDescriptor<
  TFinal extends TSchema = any,
  TProps extends TSchema = any
> = {
  name: string;
  template?: string;
  propsSchema?: TProps;
  contextSchema?: TFinal;
  prepare?: (
    props: TProps extends TSchema ? Static<TProps> : Record<string, any>
  ) =>
    | Promise<TFinal extends TSchema ? Static<TFinal> : Record<string, any>>
    | (TFinal extends TSchema ? Static<TFinal> : Record<string, any>);
  __raw?: DefineTemplateOpts<TFinal, TProps>;
};

export function defineTemplate<
  TFinal extends TSchema = any,
  TProps extends TSchema = any
>(
  opts: DefineTemplateOpts<TFinal, TProps>
): TemplateDescriptor<TFinal, TProps> {
  if (!opts || typeof opts !== 'object') throw new Error('Options required');
  if (!opts.name || typeof opts.name !== 'string')
    throw new Error('Option "name" is required');

  const descriptor: TemplateDescriptor<TFinal, TProps> = {
    name: opts.name,
    template: opts.template,
    propsSchema: opts.propsSchema,
    contextSchema: opts.contextSchema,
    prepare: opts.prepare,
    __raw: opts,
  };

  return descriptor;
}

export default defineTemplate;
