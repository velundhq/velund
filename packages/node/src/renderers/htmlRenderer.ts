import fs from 'fs';
import path from 'path';
import type { RendererConfig, IRenderer } from './baseRenderer.js';

export class HtmlRenderer implements IRenderer {
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
    const rendererJs = `const PrepareRegistry=require('./PrepareRegistry');
  ${imports}
  class Renderer {
    constructor(){
      this.components={};
      this.registerAllComponents();
    }
    registerAllComponents(){
      const list=[${componentList}];
      for(const c of list){this.components[c.name]=c;}
    }
    async render(name,context={}){
      const c=this.components[name];
      if(!c) throw new Error("Component not found: "+name);
      if(c.hasPrepare){
        const fn=PrepareRegistry.get(name);
        if(fn){const extra=await fn(context);Object.assign(context,extra);}
      }
      return c.template;
    }
  }
  module.exports={
    Renderer,
    PrepareRegistry,
    ${components.map((c) => `${c.name}Component`).join(',\n  ')}
  };`;

    fs.writeFileSync(path.join(outDir, 'Renderer.js'), rendererJs, 'utf-8');

    // Генерация Renderer.d.ts
    const rendererDts = `${components.map((c) => `import { ${c.name}Component } from './components/${c.name}Component';`).join('\n')}
  import * as PrepareRegistry from './PrepareRegistry';
  export declare class Renderer {
    private components:Record<string,{name:string;template:string;hasPrepare:boolean}>;
    constructor();
    private registerAllComponents():void;
    render(name:string,context?:Record<string,any>):Promise<string>;
  }`;

    fs.writeFileSync(path.join(outDir, 'Renderer.d.ts'), rendererDts, 'utf-8');
  }
}
