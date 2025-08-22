import { Static, TSchema } from '@sinclair/typebox';

// Component
export type DefineComponentOptions<
  TFinal extends TSchema = any,
  TProps extends TSchema = any,
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

export type VelundComponentDescriptor<
  TFinal extends TSchema = any,
  TProps extends TSchema = any,
> = {
  name: string;
  template: string;
  propsSchema?: TProps;
  contextSchema?: TFinal;
  prepare?: (
    props: TProps extends TSchema ? Static<TProps> : Record<string, any>
  ) =>
    | Promise<TFinal extends TSchema ? Static<TFinal> : Record<string, any>>
    | (TFinal extends TSchema ? Static<TFinal> : Record<string, any>);
  __raw: DefineComponentOptions<TFinal, TProps>;
};

// Renderer

export type VelundRendererDescriptor = {
  id: string;
  templateExtensions?: string[];
  setComponents: (components: VelundComponentDescriptor[]) => void;
  render: (
    name: string,
    context?: Record<string, any>
  ) => Promise<string> | string;
};

// Generator
export type VelundGeneratorDescriptor = {
  id: string;
  generate: (
    renderer: string,
    components: VelundComponentDescriptor[],
    path: string
  ) => Promise<void> | void;
  renderers: string[];
};
