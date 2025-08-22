export type DefineTemplateOpts = {
  components: string;
};

export default function defineVelundApp() {
  const rawTemplates = import.meta.glob('/**/*.vel.{ts,js}', {
    eager: true,
  });
  const app = {
    components: Object.values(rawTemplates).map((tmpl: any) => {
      if (tmpl.__template) tmpl.default.template = tmpl.__template;
      return tmpl.default;
    }),
  };
  Object.assign(globalThis, { __APP__: app });
  return app;
}
