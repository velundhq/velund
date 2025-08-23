import fs from 'fs';
import path from 'path';
import type { RendererConfig, IRenderer } from './baseRenderer.js';

export class JinjaRenderer implements IRenderer {
  generate(config: RendererConfig): void {
    const { components, outDir } = config;

    const imports = components
      .map(
        (c) =>
          `const { ${c.name}Component } = require('./components/${c.name}Component');`
      )
      .join('\n  ');

    const componentList = components
      .map((c) => `      new ${c.name}Component(),`)
      .join('\n');

    // Генерация Renderer.js
    const rendererJs = `const nunjucks = require('nunjucks');
  const PrepareRegistry = require('./PrepareRegistry');
  ${imports}

  class MemoryLoader extends nunjucks.Loader {
    templates = new Map();
    getSource(name) {
        const tpl = this.templates.get(name);
        return { src: tpl || '', path: name };
    }
    setTemplate(name, src) {
        this.templates.set(name, src);
    }
  }

  class Renderer {
    constructor() {
      this.components = new Map();
      this.loader = new MemoryLoader();
      this.env = new nunjucks.Environment(this.loader);
      this.env.addGlobal('prepare_context', async function () {
        const componentName = this.ctx?.template?.name;
        if (!componentName) return;
        const comp = this.loader.templates.get(componentName);
        if (comp?.hasPrepare) {
            const fn = PrepareRegistry.get(componentName);
            if (fn) {
            const data = await fn(this.ctx);
            Object.assign(this.ctx, data);
            }
        }
      });
      this.registerAllComponents();
    }

    registerAllComponents() {
      const list = [${componentList}];
      for (const c of list) {
        this.components.set(c.name, c);
        this.loader.setTemplate(
          c.name,
          '{% set _prepare_context = prepare_context() %}\\n' + c.template
        );
      }
    }

    async render(name, context = {}) {
      const c = this.components.get(name);
      if (!c) throw new Error('Component not found: ' + name);

      if (c.hasPrepare) {
        const fn = PrepareRegistry.get(name);
        if (fn) {
          const extra = await fn(context);
          Object.assign(context, extra);
        }
      }

      return new Promise((resolve, reject) => {
        this.env.render(name, context, (err, res) => {
          if (err) reject(err);
          else resolve(res || '');
        });
      });
    }
  }

  module.exports = {
    Renderer,
    PrepareRegistry,
    ${components.map((c) => `${c.name}Component`).join(',\n  ')}
  };`;

    fs.writeFileSync(path.join(outDir, 'Renderer.js'), rendererJs, 'utf-8');

    // Генерация Renderer.d.ts
    const rendererDts = `import * as nunjucks from 'nunjucks';
  import * as PrepareRegistry from './PrepareRegistry';
  ${components.map((c) => `import { ${c.name}Component } from './components/${c.name}Component';`).join('\n')}

  declare class MemoryLoader extends nunjucks.Loader {
    templates: Map<string, string>;
    getSource(name: string, callback: (err: Error | null, result: nunjucks.LoaderSource) => void): void;
    setTemplate(name: string, src: string): void;
  }

  export declare class Renderer {
    private components: Map<string, any>;
    private loader: MemoryLoader;
    private env: nunjucks.Environment;
    constructor();
    private registerAllComponents(): void;
    render(name: ${components.map((c) => `"${c.name}"`).join('|')}, context?: Record<string, any>): Promise<string>;
  }

  export {
    PrepareRegistry,
    ${components.map((c) => `${c.name}Component`).join(',\n  ')}
  };`;

    fs.writeFileSync(path.join(outDir, 'Renderer.d.ts'), rendererDts, 'utf-8');
  }
}
