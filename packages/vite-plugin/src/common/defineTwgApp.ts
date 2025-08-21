export type DefineTemplateOpts = {
  templates: string;
};

export default function defineTwgApp() {
  const rawTemplates = import.meta.glob('/**/*{.twig.{ts,js},.twg}', {
    eager: true,
  });
  const app = {
    templates: Object.values(rawTemplates).map((tmpl: any) => {
      if (tmpl.__template) tmpl.default.template = tmpl.__template;
      return tmpl.default;
    }),
  };
  Object.assign(globalThis, { __APP__: app });
  return app;
}
