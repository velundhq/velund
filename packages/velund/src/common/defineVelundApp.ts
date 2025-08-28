import { VelundComponentDescriptor } from '@velund/core';

export type DefineTemplateOpts = {
  components: string;
};

export interface VelundRoute {
  path: string;
  component: string | VelundComponentDescriptor;
}

export type VelundAppDescriptor = {
  components: VelundComponentDescriptor[];
  routes: VelundRoute[];
};

export default function defineVelundApp(
  components: VelundComponentDescriptor[],
  routes: VelundRoute[] = []
): VelundAppDescriptor {
  const preparedRoutes: VelundRoute[] = [];
  for (const route of routes) {
    if (typeof route.component === 'string') {
      const routeComp = components.find(
        (comp) => comp.name === route.component
      );
      if (!routeComp) {
        console.warn(
          `[WARN] Undefined component for route ${route.path} (${route.component})`
        );
        continue;
      }
      preparedRoutes.push({ ...route, component: routeComp });
      continue;
    }
    preparedRoutes.push(route);
  }

  const app = {
    components: components || [],
    routes: preparedRoutes,
  };
  Object.assign(globalThis, { __APP__: app });
  return app;
}
