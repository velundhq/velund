import { createArrayLoader, createEnvironment, createFunction } from 'twing';

export interface TemplateComponent {
  name: string;
  template: string;
  schema: Record<string, any>;
  prepare?: (ctx: Record<string, any>) => any | Promise<any>;
}

export default function defineTwingRenderer() {
  const componentRegistry = new Map<string, TemplateComponent>();
  const loader = createArrayLoader({});
  const env = createEnvironment(loader);

  env.addFunction(
    createFunction(
      'prepare_context',
      async (context) => {
        const component = componentRegistry.get(context.template.name);
        if (component?.prepare) {
          const data = await component.prepare(
            Object.fromEntries(context.context.entries())
          );

          Object.entries(data).forEach(([key, val]) =>
            context.context.set(key, val)
          );
        }
      },
      []
    )
  );

  return {
    env,

    // методы работы с компонентами
    setComponent: (comp: TemplateComponent) => {
      componentRegistry.set(comp.name, comp);
      loader.setTemplate(
        comp.name,
        `{% set _prepare_context = prepare_context() %}\n` + comp.template
      );
    },
    removeComponent: (name: string) => {
      componentRegistry.delete(name);
      //@ts-ignore
      loader.setTemplate(name, undefined);
    },

    // рендер по имени
    render: async (name: string, context: any = {}) => {
      const component = componentRegistry.get(name);
      if (!component) throw new Error(`Component not found: ${name}`);

      let extra = {};
      if (component.prepare) {
        extra = await component.prepare(context);
      }
      const finalContext = { ...context, ...extra };
      return env.render(name, finalContext);
    },
  };
}
