import fs from 'fs';
import path from 'path';
import type { VelundComponentDescriptor } from '@velund/core';
import { schemaToInterface } from '../helpers/typeHelpers.js';

export function generateComponent(
  component: VelundComponentDescriptor<any, any>,
  outDir: string
) {
  const componentDir = path.join(outDir, 'components');
  const className = `${component.name}Component`;
  const hasPrepare = component.prepare ? 'true' : 'false';

  // JS файл
  const compJs = `const { TemplateComponent } = require('./TemplateComponent');
  const PrepareRegistry = require('../PrepareRegistry');
  class ${className} extends TemplateComponent{
    constructor(){super(${JSON.stringify(component.name)},${JSON.stringify(component.template)},${hasPrepare});}
    static registerPrepare(fn){PrepareRegistry.register(${JSON.stringify(component.name)},fn);}
  }
  module.exports={${className}};`;

  // TS declaration
  const propsName = `${component.name}Props`;
  const ctxName = `${component.name}Context`;
  const propsDts = schemaToInterface(propsName, component.propsSchema);
  const ctxDts = schemaToInterface(ctxName, component.contextSchema);
  const compDts = `${propsDts}\n\n${ctxDts}\n\nimport { TemplateComponent } from './TemplateComponent';
  export declare class ${className} extends TemplateComponent<${propsName},${ctxName}> {
    constructor();
    static registerPrepare(fn:(props:${propsName})=>${ctxName}|Promise<${ctxName}>):void;
  }`;

  fs.writeFileSync(path.join(componentDir, `${className}.js`), compJs);
  fs.writeFileSync(path.join(componentDir, `${className}.d.ts`), compDts);
}
