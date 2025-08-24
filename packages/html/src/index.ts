import { defineVelundRenderer, VelundComponentDescriptor } from '@velund/core';

const htmlRenderer = defineVelundRenderer(() => {
  const components = new Map<string, VelundComponentDescriptor>();
  return {
    id: 'html',
    templateExtensions: ['.html', '.htm'],
    setComponents(items) {
      components.clear();
      items.forEach((comp) => {
        components.set(comp.name, comp);
      });
    },
    async render(name, context, meta): Promise<any> {
      const component = components.get(name);
      if (!component) throw new Error(`Component not found: ${name}`);
      let extra = {};
      if (component.prepare) {
        extra = await component.prepare(context);
      }
      const finalContext = { ...context, ...extra };
      const html = component.template;
      return meta ? { html, context: finalContext } : html;
    },
  };
});

export default htmlRenderer;
