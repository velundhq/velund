// generateTsLibrary.ts
import fs from 'fs';
import path from 'path';
import type { TSchema } from '@sinclair/typebox';
import {
  defineVelundGenerator,
  type VelundComponentDescriptor,
} from '@velund/core';

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
    const values = (schema as any).enum;
    const union = values
      .map((v: any) => (typeof v === 'string' ? JSON.stringify(v) : String(v)))
      .join(' | ');
    return union || 'never';
  }

  if ('oneOf' in (schema as any) && Array.isArray((schema as any).oneOf)) {
    return (schema as any).oneOf
      .map((s: TSchema) => toTsType(s, seen))
      .join(' | ');
  }
  if ('anyOf' in (schema as any) && Array.isArray((schema as any).anyOf)) {
    return (schema as any).anyOf
      .map((s: TSchema) => toTsType(s, seen))
      .join(' | ');
  }
  if ('allOf' in (schema as any) && Array.isArray((schema as any).allOf)) {
    return (schema as any).allOf
      .map((s: TSchema) => toTsType(s, seen))
      .join(' & ');
  }

  if (type === 'array') {
    const items = (schema as any).items as TSchema | undefined;
    return `${toTsType(items, seen)}[]`;
  }

  if (type === 'object' || (schema as any).properties) {
    const props = (schema as any).properties ?? {};
    const required: string[] = (schema as any).required ?? [];
    const entries = Object.entries(props).map(([key, s]) => {
      const isRequired = required.includes(key);
      return `${JSON.stringify(key)}${isRequired ? '' : '?'}: ${toTsType(
        s as TSchema,
        seen
      )};`;
    });

    const ap = (schema as any).additionalProperties;
    if (ap) {
      const apType = ap === true ? 'any' : toTsType(ap as TSchema, seen);
      entries.push(`[k: string]: ${apType};`);
    }

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
  if (body.trim().startsWith('{')) {
    return `export interface ${name} ${body}`;
  }
  return `export type ${name} = ${body};`;
}

/** ===== generator ===== */

export function generateLibrary(
  rendererName: string,
  components: VelundComponentDescriptor<any, any>[],
  outDir: string
) {
  if (rendererName !== 'twig' && rendererName !== 'html') {
    throw new Error(`Unsupported renderer: ${rendererName}`);
  }

  const componentDir = path.join(outDir, 'components');
  fs.mkdirSync(componentDir, { recursive: true });

  // ---------- TemplateComponent ----------
  fs.writeFileSync(
    path.join(componentDir, 'TemplateComponent.ts'),
    `export class TemplateComponent<Props = any, Ctx = any> {
  constructor(
    public name: string,
    public template: string,
    public hasPrepare: boolean = false
  ) {}
}
`,
    'utf-8'
  );

  // ---------- PrepareRegistry ----------
  fs.writeFileSync(
    path.join(outDir, 'PrepareRegistry.ts'),
    `export type PrepareFn<Props = any, Ctx = any> = (props: Props) => Promise<Ctx> | Ctx;

const registry = new Map<string, PrepareFn<any, any>>();

export function register<Props, Ctx>(componentName: string, fn: PrepareFn<Props, Ctx>): void {
  registry.set(componentName, fn as PrepareFn<any, any>);
}

export function get<Props, Ctx>(componentName: string): PrepareFn<Props, Ctx> | null {
  return (registry.get(componentName) as PrepareFn<Props, Ctx>) || null;
}
`,
    'utf-8'
  );

  // ---------- Components ----------
  components.forEach((comp) => {
    const className = `${comp.name}Component`;
    const hasPrepare = comp.prepare ? 'true' : 'false';

    const propsInterfaceName = `${comp.name}Props`;
    const ctxInterfaceName = `${comp.name}Context`;

    const propsInterface = schemaToInterface(
      propsInterfaceName,
      comp.propsSchema
    );
    const ctxInterface = schemaToInterface(
      ctxInterfaceName,
      comp.contextSchema
    );

    const tsContent = `${propsInterface}

${ctxInterface}

import { TemplateComponent } from './TemplateComponent';
import * as PrepareRegistry from '../PrepareRegistry';

export class ${className} extends TemplateComponent<${propsInterfaceName}, ${ctxInterfaceName}> {
  constructor() {
    super(
      '${comp.name}',
      ${JSON.stringify(comp.template)},
      ${hasPrepare}
    );
  }

  static registerPrepare(fn: (props: ${propsInterfaceName}) => ${ctxInterfaceName} | Promise<${ctxInterfaceName}>) {
    PrepareRegistry.register('${comp.name}', fn as any);
  }
}
`;

    fs.writeFileSync(
      path.join(componentDir, `${className}.ts`),
      tsContent,
      'utf-8'
    );
  });

  // ---------- Enums ----------
  const allEnum = `export enum ComponentName {
${components.map((c) => `  ${c.name} = '${c.name}',`).join('\n')}
}
`;
  fs.writeFileSync(path.join(outDir, 'ComponentName.ts'), allEnum, 'utf-8');

  const prepEnum = `export enum ComponentNameWithPrepare {
${components
  .filter((c) => !!c.prepare)
  .map((c) => `  ${c.name} = '${c.name}',`)
  .join('\n')}
}
`;
  fs.writeFileSync(
    path.join(outDir, 'ComponentNameWithPrepare.ts'),
    prepEnum,
    'utf-8'
  );

  // ---------- Renderer ----------
  const imports = components
    .map((c) => `      new ${c.name}Component(),`)
    .join('\n');

  let renderer: string;

  if (rendererName === 'twig') {
    renderer = `import { TwingEnvironment, TwingLoaderArray, TwingFunction } from 'twing';
import * as PrepareRegistry from './PrepareRegistry';
${components
  .map(
    (c) =>
      `import { ${c.name}Component } from './components/${c.name}Component';`
  )
  .join('\n')}

export class Renderer {
  private env: TwingEnvironment;
  private loader: TwingLoaderArray;
  private components: Record<string, { name: string; template: string; hasPrepare: boolean }> = {};

  constructor() {
    this.loader = new TwingLoaderArray({});
    this.env = new TwingEnvironment(this.loader);
    this.components = {};

    this.env.addFunction(
      new TwingFunction('prepare_context', (context: Record<string, any>, componentName: string) => {
        const component = this.components[componentName];
        if (component && component.hasPrepare) {
          const prepareFn = PrepareRegistry.get(componentName);
          if (prepareFn) {
            const extra = prepareFn(context);
            if (extra instanceof Promise) {
              return extra.then((r) => Object.assign(context, r));
            } else {
              Object.assign(context, extra);
            }
          }
        }
        return null;
      })
    );

    this.registerAllComponents();
  }

  private registerAllComponents() {
    const list = [
${imports}
    ];

    for (const component of list) {
      this.components[component.name] = component;
      this.loader.setTemplate(
        component.name,
        "{% set _prepare_context = prepare_context(_context, '" + component.name + "') %}\\n" + component.template
      );
    }
  }

  async render(name: string, context: Record<string, any> = {}): Promise<string> {
    const component = this.components[name];
    if (!component) {
      throw new Error("Component not found: " + name);
    }

    if (component.hasPrepare) {
      const prepareFn = PrepareRegistry.get(name);
      if (prepareFn) {
        const extra = await prepareFn(context);
        Object.assign(context, extra);
      }
    }

    return this.env.render(name, context);
  }
}
`;
  } else {
    renderer = `import * as PrepareRegistry from './PrepareRegistry';
${components
  .map(
    (c) =>
      `import { ${c.name}Component } from './components/${c.name}Component';`
  )
  .join('\n')}

export class Renderer {
  private components: Record<string, { name: string; template: string; hasPrepare: boolean }> = {};

  constructor() {
    this.registerAllComponents();
  }

  private registerAllComponents() {
    const list = [
${imports}
    ];

    for (const component of list) {
      this.components[component.name] = component;
    }
  }

  async render(name: string, context: Record<string, any> = {}): Promise<string> {
    const component = this.components[name];
    if (!component) {
      throw new Error("Component not found: " + name);
    }

    if (component.hasPrepare) {
      const prepareFn = PrepareRegistry.get(name);
      if (prepareFn) {
        const extra = await prepareFn(context);
        Object.assign(context, extra);
      }
    }

    return component.template;
  }
}
`;
  }

  fs.writeFileSync(path.join(outDir, 'Renderer.ts'), renderer, 'utf-8');

  console.log(`✅ Strict TS library (${rendererName}) generated in`, outDir);
}

const nodeGenerator = defineVelundGenerator(() => {
  return {
    id: 'node',
    renderers: ['html', 'twig'],
    generate: generateLibrary,
  };
});

export default nodeGenerator;
