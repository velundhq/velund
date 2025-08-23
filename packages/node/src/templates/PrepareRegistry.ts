import fs from 'fs';
import path from 'path';
import type { VelundComponentDescriptor } from '@velund/core';

export function generatePrepareRegistry(
  outDir: string,
  components: VelundComponentDescriptor<any, any>[]
) {
  // JS файл
  const registryJs = `const registry=new Map();
  function register(name,fn){registry.set(name,fn);}
  function get(name){return registry.get(name)||null;}
  module.exports={register,get};`;

  // TS declaration
  const registryDts = `export type PrepareFn<Props=any,Ctx=any>=(props:Props)=>Promise<Ctx>|Ctx;
  export declare function register<Props,Ctx>(componentName:${components.map((c) => `"${c.name}"`).join('|')},fn:PrepareFn<Props,Ctx>):void;
  export declare function get<Props,Ctx>(componentName:${components.map((c) => `"${c.name}"`).join('|')}):PrepareFn<Props,Ctx>|null;`;

  fs.writeFileSync(path.join(outDir, 'PrepareRegistry.js'), registryJs);
  fs.writeFileSync(path.join(outDir, 'PrepareRegistry.d.ts'), registryDts);
}
