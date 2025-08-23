import fs from 'fs';
import path from 'path';

export function generateTemplateComponent(outDir: string) {
  const componentDir = path.join(outDir, 'components');
  fs.mkdirSync(componentDir, { recursive: true });

  const templatePy = `from typing import Any


class TemplateComponent:
    def __init__(self, name: str, template: str, has_prepare: bool = False):
        self.name = name
        self.template = template
        self.has_prepare = has_prepare
`;

  fs.writeFileSync(
    path.join(componentDir, 'TemplateComponent.py'),
    templatePy,
    'utf-8'
  );
}
