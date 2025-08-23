import fs from 'fs';
import path from 'path';

export function generateTemplateComponent(outDir: string) {
  const componentDir = path.join(outDir, 'components');

  // JS файл
  const templateJs = `class TemplateComponent {
    constructor(name, template, hasPrepare=false){
      this.name = name;
      this.template = template;
      this.hasPrepare = hasPrepare;
    }
  }
  module.exports={TemplateComponent};`;

  // TS declaration
  const templateDts = `export declare class TemplateComponent<Props=any, Ctx=any> {
    name: string;
    template: string;
    hasPrepare: boolean;
    constructor(name: string, template: string, hasPrepare?: boolean);
  }`;

  fs.writeFileSync(path.join(componentDir, 'TemplateComponent.js'), templateJs);
  fs.writeFileSync(
    path.join(componentDir, 'TemplateComponent.d.ts'),
    templateDts
  );
}
