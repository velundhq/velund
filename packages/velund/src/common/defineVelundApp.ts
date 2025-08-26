import { VelundComponentDescriptor } from '@velund/core';

export type DefineTemplateOpts = {
  components: string;
};

export default function defineVelundApp(
  components?: VelundComponentDescriptor[]
) {
  const app = {
    components: components || [],
  };
  Object.assign(globalThis, { __APP__: app });
  return app;
}
