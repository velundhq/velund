import fs from 'fs';
import path from 'path';
import type { VelundComponentDescriptor } from '@velund/core';

export function generateInitPy(
  outDir: string,
  components: VelundComponentDescriptor<any, any>[]
) {
  const initPath = path.join(outDir, 'velund', '__init__.py');

  const imports = components
    .map(
      (c) => `from .components.${c.name}_component import ${c.name}Component`
    )
    .join('\n');

  const registryImports = `from .prepare_registry import register, get`;

  const componentList = components
    .map((c) => `${c.name} = ${c.name}Component()`)
    .join('\n');

  const content = `
# Auto-generated Velund package __init__.py

${imports}
${registryImports}

# Instantiate components
${componentList}

__all__ = [
  ${components.map((c) => `"${c.name}"`).join(', ')},
  "register",
  "get",
]
`;

  // Создаём директорию, если нет
  fs.mkdirSync(path.dirname(initPath), { recursive: true });

  fs.writeFileSync(initPath, content.trim(), 'utf-8');
}
