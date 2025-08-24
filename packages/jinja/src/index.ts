import { defineVelundRenderer, VelundComponentDescriptor } from '@velund/core';
import nunjucks, { ILoader, LoaderSource } from 'nunjucks';

class MemoryLoader extends nunjucks.Loader implements ILoader {
  templates = new Map<string, string>();
  getSource(name: string): LoaderSource {
    const tpl = this.templates.get(name);
    const res: LoaderSource = { src: tpl || '', path: name, noCache: true };
    return res;
  }

  setTemplate(name: string, src: string) {
    this.templates.set(name, src);
  }
}

const jinjaRenderer = defineVelundRenderer(() => {
  const components = new Map<string, VelundComponentDescriptor>();
  const loader = new MemoryLoader();
  const env = new nunjucks.Environment(loader, { noCache: true });

  env.addGlobal('prepare_context', async function (this: any) {
    const componentName = this.ctx?.template?.name;
    if (!componentName) return;
    const comp = components.get(componentName);
    if (comp?.prepare) {
      const data = await comp.prepare(this.ctx);
      Object.assign(this.ctx, data);
    }
  });

  return {
    id: 'jinja',
    templateExtensions: ['.jinja', '.jinja2', '.j2'],
    setComponents(items) {
      components.clear();
      items.forEach((comp) => {
        components.set(comp.name, comp);
        loader.setTemplate(
          comp.name,
          `{% set _prepare_context = prepare_context() %}\n${comp.template}`
        );
      });
    },
    async render(name, context, meta) {
      const comp = components.get(name);
      if (!comp) throw new Error(`Component not found: ${name}`);

      let extra = {};
      if (comp.prepare) {
        extra = await comp.prepare(context);
      }
      const finalContext = { ...context, ...extra };

      return new Promise<any>((resolve, reject) => {
        env.render(name, finalContext, (err, res) => {
          if (err) reject(err);
          else
            resolve(
              meta
                ? {
                    context: finalContext,
                    html: res || '',
                  }
                : res || ''
            );
        });
      });
    },
  };
});

export default jinjaRenderer;
