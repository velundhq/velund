// generateJsLibrary.ts
import fs from 'fs';
import path from 'path';
import type { TSchema } from '@sinclair/typebox';
import {
  defineVelundGenerator,
  type VelundComponentDescriptor,
} from '@velund/core';
import { deepMerge } from './merge.js';

/** ===== helpers to TS ===== */

type Seen = Set<TSchema>;
function toTsType(schema: TSchema | undefined, seen: Seen = new Set()): string {
  if (!schema) return 'any';
  if (seen.has(schema)) return 'any';
  seen.add(schema);

  const { type } = schema as any;
  if ('const' in (schema as any)) {
    const v = (schema as any).const;
    return typeof v === 'string' ? JSON.stringify(v) : String(v);
  }
  if ('enum' in (schema as any) && Array.isArray((schema as any).enum)) {
    return (
      (schema as any).enum
        .map((v: any) =>
          typeof v === 'string' ? JSON.stringify(v) : String(v)
        )
        .join(' | ') || 'never'
    );
  }
  if ('oneOf' in (schema as any))
    return (schema as any).oneOf
      .map((s: TSchema) => toTsType(s, seen))
      .join(' | ');
  if ('anyOf' in (schema as any))
    return (schema as any).anyOf
      .map((s: TSchema) => toTsType(s, seen))
      .join(' | ');
  if ('allOf' in (schema as any))
    return (schema as any).allOf
      .map((s: TSchema) => toTsType(s, seen))
      .join(' & ');
  if (type === 'array') return `${toTsType((schema as any).items, seen)}[]`;
  if (type === 'object' || (schema as any).properties) {
    const props = (schema as any).properties ?? {};
    const required: string[] = (schema as any).required ?? [];
    const entries = Object.entries(props).map(
      ([key, s]) =>
        `${key}${required.includes(key) ? '' : '?'}: ${toTsType(s as TSchema, seen)};`
    );
    const ap = (schema as any).additionalProperties;
    if (ap)
      entries.push(
        `[k: string]: ${ap === true ? 'any' : toTsType(ap as TSchema, seen)};`
      );
    return `{\n${entries.map((l) => '  ' + l).join('\n')}\n}`;
  }
  if (type === 'string') return 'string';
  if (type === 'number' || type === 'integer') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'null') return 'null';
  if ((schema as any).format === 'date-time') return 'string';
  if ((schema as any).nullable) {
    const clone = { ...(schema as any) };
    delete (clone as any).nullable;
    return `${toTsType(clone as TSchema, seen)} | null`;
  }
  return 'any';
}

function schemaToInterface(name: string, schema?: TSchema): string {
  if (!schema) return `export interface ${name} { [k: string]: any }`;
  const body = toTsType(schema);
  if (body.trim().startsWith('{')) return `export interface ${name} ${body}`;
  return `export type ${name} = ${body};`;
}

export type VelundNodeGeneratorOptions = {
  manifest?: Record<string, any>;
};

const nodeGenerator = defineVelundGenerator(
  (options?: VelundNodeGeneratorOptions) => {
    /** ===== package.json helper ===== */
    function generatePackageJson(outDir: string) {
      const content = deepMerge(
        {
          name: 'velund-components',
          version: '1.0.0',
          description: 'Generated Velund component library',
          main: 'Renderer.js',
          types: 'Renderer.d.ts',
          exports: {
            '.': {
              require: './Renderer.js',
              types: './Renderer.d.ts',
            },
            './PrepareRegistry': {
              require: './PrepareRegistry.js',
              types: './PrepareRegistry.d.ts',
            },
            './components/*': {
              require: './components/*.js',
              types: './components/*.d.ts',
            },
          },
          files: [
            '*.js',
            '*.d.ts',
            'components',
            'PrepareRegistry.js',
            'PrepareRegistry.d.ts',
          ],
          license: 'MIT',
          dependencies: {
            twing: '^7.2.1',
          },
        },
        options?.manifest || {}
      );
      fs.writeFileSync(
        path.join(outDir, 'package.json'),
        JSON.stringify(content, null, 2),
        'utf-8'
      );
    }

    /** ===== generator ===== */
    function generateLibraryJS(
      rendererName: string,
      components: VelundComponentDescriptor<any, any>[],
      outDir: string
    ) {
      if (!['twig', 'html'].includes(rendererName))
        throw new Error(`Unsupported renderer: ${rendererName}`);
      const componentDir = path.join(outDir, 'components');
      fs.mkdirSync(componentDir, { recursive: true });

      /** ---------- TemplateComponent ---------- */
      const templateJs = `class TemplateComponent {
    constructor(name, template, hasPrepare=false){
      this.name = name;
      this.template = template;
      this.hasPrepare = hasPrepare;
    }
  }
  module.exports={TemplateComponent};`;
      fs.writeFileSync(
        path.join(componentDir, 'TemplateComponent.js'),
        templateJs,
        'utf-8'
      );
      const templateDts = `export declare class TemplateComponent<Props=any, Ctx=any> {
    name: string;
    template: string;
    hasPrepare: boolean;
    constructor(name: string, template: string, hasPrepare?: boolean);
  }`;
      fs.writeFileSync(
        path.join(componentDir, 'TemplateComponent.d.ts'),
        templateDts,
        'utf-8'
      );

      /** ---------- PrepareRegistry ---------- */
      const registryJs = `const registry=new Map();
  function register(name,fn){registry.set(name,fn);}
  function get(name){return registry.get(name)||null;}
  module.exports={register,get};`;
      fs.writeFileSync(
        path.join(outDir, 'PrepareRegistry.js'),
        registryJs,
        'utf-8'
      );
      const registryDts = `export type PrepareFn<Props=any,Ctx=any>=(props:Props)=>Promise<Ctx>|Ctx;
  export declare function register<Props,Ctx>(componentName:${components.map((c) => `"${c.name}"`).join('|')},fn:PrepareFn<Props,Ctx>):void;
  export declare function get<Props,Ctx>(componentName:${components.map((c) => `"${c.name}"`).join('|')}):PrepareFn<Props,Ctx>|null;`;
      fs.writeFileSync(
        path.join(outDir, 'PrepareRegistry.d.ts'),
        registryDts,
        'utf-8'
      );

      /** ---------- Components ---------- */
      components.forEach((comp) => {
        const className = `${comp.name}Component`;
        const hasPrepare = comp.prepare ? 'true' : 'false';
        const propsName = `${comp.name}Props`;
        const ctxName = `${comp.name}Context`;
        const propsDts = schemaToInterface(propsName, comp.propsSchema);
        const ctxDts = schemaToInterface(ctxName, comp.contextSchema);
        const compDts = `${propsDts}\n\n${ctxDts}\n\nimport { TemplateComponent } from './TemplateComponent';
  export declare class ${className} extends TemplateComponent<${propsName},${ctxName}> {
    constructor();
    static registerPrepare(fn:(props:${propsName})=>${ctxName}|Promise<${ctxName}>):void;
  }`;
        fs.writeFileSync(
          path.join(componentDir, `${className}.d.ts`),
          compDts,
          'utf-8'
        );

        const compJs = `const { TemplateComponent } = require('./TemplateComponent');
  const PrepareRegistry = require('../PrepareRegistry');
  class ${className} extends TemplateComponent{
    constructor(){super(${JSON.stringify(comp.name)},${JSON.stringify(comp.template)},${hasPrepare});}
    static registerPrepare(fn){PrepareRegistry.register(${JSON.stringify(comp.name)},fn);}
  }
  module.exports={${className}};`;
        fs.writeFileSync(
          path.join(componentDir, `${className}.js`),
          compJs,
          'utf-8'
        );
      });

      /** ---------- Renderer ---------- */
      const imports = components
        .map((c) => `      new ${c.name}Component(),`)
        .join('\n');
      if (rendererName === 'twig') {
        const rendererJs = `const { createArrayLoader, createEnvironment, createFunction } = require('twing');
  const PrepareRegistry = require('./PrepareRegistry');
  ${components.map((c) => `const { ${c.name}Component } = require('./components/${c.name}Component');`).join('\n')}
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
      const list=[${imports}];
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
        fs.writeFileSync(
          path.join(outDir, 'Renderer.d.ts'),
          rendererDts,
          'utf-8'
        );
      } else {
        // html renderer
        const rendererJs = `const PrepareRegistry=require('./PrepareRegistry');
  ${components.map((c) => `const { ${c.name}Component } = require('./components/${c.name}Component');`).join('\n')}
  class Renderer {
    constructor(){
      this.components={};
      this.registerAllComponents();
    }
    registerAllComponents(){
      const list=[${imports}];
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

        const rendererDts = `${components.map((c) => `import { ${c.name}Component } from './components/${c.name}Component';`).join('\n')}
  import * as PrepareRegistry from './PrepareRegistry';
  export declare class Renderer {
    private components:Record<string,{name:string;template:string;hasPrepare:boolean}>;
    constructor();
    private registerAllComponents():void;
    render(name:string,context?:Record<string,any>):Promise<string>;
  }`;
        fs.writeFileSync(
          path.join(outDir, 'Renderer.d.ts'),
          rendererDts,
          'utf-8'
        );
      }

      /** ---------- package.json ---------- */
      generatePackageJson(outDir);

      console.log(
        `✅ JS + d.ts library (${rendererName}) generated in`,
        outDir
      );
    }
    return {
      id: 'node',
      renderers: ['html', 'twig', 'jinja'],
      generate: generateLibraryJS,
    };
  }
);

export default nodeGenerator;
