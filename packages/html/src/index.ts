import { defineVelundRenderer, VelundComponentDescriptor } from '@velund/core';

const htmlRenderer = defineVelundRenderer(() => {
  const components = new Map<string, VelundComponentDescriptor>();
  return {
    id: 'html',
    setComponents(items) {
      components.clear();
      items.forEach((comp) => {
        components.set(comp.name, comp);
      });
    },
    render(name) {
      return components.get(name)?.template || '';
    },
  };
});

export default htmlRenderer;
