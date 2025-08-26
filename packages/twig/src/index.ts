import { defineVelundRenderer, VelundComponentDescriptor } from '@velund/core';
import { createArrayLoader, createEnvironment, createFunction } from 'twing';

const twigRenderer = defineVelundRenderer(() => {
  const components = new Map<string, VelundComponentDescriptor>();

  const loader = createArrayLoader({});
  const env = createEnvironment(loader);

  env.addFunction(
    createFunction(
      'prepare_context',
      async (context) => {
        const component = components.get(context.template.name);
        if (component?.prepare) {
          let data = {};
          try {
            data = await component.prepare(
              Object.fromEntries(context.context.entries())
            );
          } catch (e) {
            console.error(e);
          }

          Object.entries(data).forEach(([key, val]) =>
            context.context.set(key, val)
          );
        }
      },
      []
    )
  );

  return {
    id: 'twig',
    templateExtensions: ['.twig'],
    setComponents(items) {
      components.clear();
      items.forEach((comp) => {
        components.set(comp.name, comp);
        loader.setTemplate(
          comp.name,
          `{% set _prepare_context = prepare_context() %}\n` + comp.template
        );
      });
    },
    async render(name, context, meta): Promise<any> {
      const component = components.get(name);
      if (!component) throw new Error(`Component not found: ${name}`);
      let extra = {};
      if (component.prepare) {
        try {
          extra = await component.prepare(context);
        } catch (e) {
          console.error(e);
        }
      }
      const finalContext = { ...context, ...extra };
      const html = await env.render(name, finalContext);
      return meta ? { html, context: finalContext } : html;
    },
  };
});

export default twigRenderer;
