import fs from 'fs';
import path from 'path';
import type { RendererConfig, IRenderer } from './baseRenderer.js';

export class HtmlRenderer implements IRenderer {
  generate(config: RendererConfig): void {
    const { components, outDir } = config;

    fs.mkdirSync(outDir, { recursive: true });

    const imports = components
      .map(
        (c) => `from .components.${c.name}Component import ${c.name}Component`
      )
      .join('\n');

    const componentList = components
      .map((c) => `            ${c.name}Component(),`)
      .join('\n');

    const componentExports = components
      .map((c) => `${c.name}Component`)
      .join(',\n    ');

    const rendererPy = `from typing import Any, Dict
from . import PrepareRegistry
${imports}


class Renderer:
    def __init__(self) -> None:
        self.components: Dict[str, Any] = {}
        self.register_all_components()

    def register_all_components(self) -> None:
        list = [
${componentList}
        ]
        for c in list:
            self.components[c.name] = c

    async def render(self, name: str, context: Dict[str, Any] | None = None) -> str:
        if context is None:
            context = {}
        c = self.components.get(name)
        if not c:
            raise ValueError(f"Component not found: {name}")

        if c.has_prepare:
            fn = PrepareRegistry.get(name)
            if fn:
                extra = fn(context)
                if hasattr(extra, "__await__"):
                    extra = await extra
                context.update(extra)

        return c.template


__all__ = [
    "Renderer",
    "PrepareRegistry",
    ${componentExports}
]
`;

    fs.writeFileSync(path.join(outDir, 'Renderer.py'), rendererPy, 'utf-8');
  }
}
