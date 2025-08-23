import fs from 'fs';
import path from 'path';
import type { RendererConfig, IRenderer } from './baseRenderer.js';

export class TwigRenderer implements IRenderer {
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
    const rendererJs = `const { createArrayLoader, createEnvironment, createFunction } = require('twing');
  const PrepareRegistry = require('./PrepareRegistry');
  ${imports}
  class Renderer {
    constructor(){
      this.loader = createArrayLoader({});
      this.env = createEnvironment(this.loader);
      this.components = new Map();
      this.env.addFunction(
        createFunction(
          'prepare_context',
          async (context) => {
            const component = this.components.get(context.template.name);
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
      this.registerAllComponents();
    }
    registerAllComponents(){
      const list=[${componentList}];
      for(const c of list){
        this.components[c.name]=c;
        this.loader.setTemplate(c.name,"{% set _prepare_context = prepare_context() %}\\n"+c.template);
      }
    }
    async render(name,context={}) {
      const c=this.components[name];
      if(!c) throw new Error("Component not found: "+name);
      if(c.hasPrepare){
        const fn=PrepareRegistry.get(name);
        if(fn){
          const extra=await fn(context);
          Object.assign(context,extra);
        }
      }
      return this.env.render(name,context);
    }
  }
  module.exports={
    Renderer,
    PrepareRegistry,
    ${components.map((c) => `${c.name}Component`).join(',\n  ')}
  };`;

    fs.writeFileSync(path.join(outDir, 'Renderer.js'), rendererJs, 'utf-8');

    // Генерация Renderer.d.ts
    const rendererDts = `import { TwingEnvironment, TwingLoaderArray } from 'twing';
  import * as PrepareRegistry from './PrepareRegistry';
  ${components.map((c) => `import { ${c.name}Component } from './components/${c.name}Component';`).join('\n')}
  export declare class Renderer {
    private env:TwingEnvironment;
    private loader:TwingLoaderArray;
    private components:Record<string,{name:string;template:string;hasPrepare:boolean}>;
    constructor();
    private registerAllComponents():void;
    render(name:${components.map((c) => `"${c.name}"`).join('|')},context?:Record<string,any>):Promise<string>;
  }
  export {
    PrepareRegistry,
    ${components.map((c) => `${c.name}Component`).join(',\n  ')}
  };
  `;

    fs.writeFileSync(path.join(outDir, 'Renderer.d.ts'), rendererDts, 'utf-8');
  }
}
