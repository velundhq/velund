import fs from 'fs';
import path from 'path';
import type { VelundComponentDescriptor } from '@velund/core';

export function generateComponent(
  component: VelundComponentDescriptor<any, any>,
  outDir: string
) {
  const componentDir = path.join(outDir, 'components');
  fs.mkdirSync(componentDir, { recursive: true });

  const className = `${component.name}Component`;
  const fileName = `${className}.py`;
  const hasPrepare = component.prepare ? 'True' : 'False';

  const compPy = `from typing import Any, Dict, Callable, Awaitable
from .TemplateComponent import TemplateComponent
import PrepareRegistry


class ${className}(TemplateComponent):
    def __init__(self):
        super().__init__(${JSON.stringify(component.name)}, ${JSON.stringify(
          component.template
        )}, ${hasPrepare})

    @staticmethod
    def register_prepare(fn: Callable[[Dict[str, Any]], Awaitable[Dict[str, Any]]]):
        PrepareRegistry.register(${JSON.stringify(component.name)}, fn)
`;

  fs.writeFileSync(path.join(componentDir, fileName), compPy, 'utf-8');
}
