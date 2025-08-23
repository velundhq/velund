import fs from 'fs';
import path from 'path';
import type { RendererConfig, IRenderer } from './baseRenderer.js';

export class JinjaRenderer implements IRenderer {
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
from jinja2 import Environment, BaseLoader, TemplateNotFound
from . import PrepareRegistry
${imports}


class MemoryLoader(BaseLoader):
    def __init__(self) -> None:
        self.templates: Dict[str, str] = {}

    def get_source(self, environment: Environment, template: str):
        src = self.templates.get(template)
        if src is None:
            raise TemplateNotFound(template)
        return src, None, lambda: True

    def set_template(self, name: str, src: str) -> None:
        self.templates[name] = src


class Renderer:
    def __init__(self) -> None:
        self.components: Dict[str, Any] = {}
        self.loader = MemoryLoader()
        self.env = Environment(loader=self.loader)

        async def prepare_context(context: Dict[str, Any]):
            component_name = context.get("template", {}).get("name")
            if not component_name:
                return
            comp = self.components.get(component_name)
            if comp and comp.has_prepare:
                fn = PrepareRegistry.get(component_name)
                if fn:
                    data = fn(context)
                    if hasattr(data, "__await__"):
                        data = await data
                    context.update(data)

        self.env.globals["prepare_context"] = prepare_context
        self.register_all_components()

    def register_all_components(self) -> None:
        list = [
${componentList}
        ]
        for c in list:
            self.components[c.name] = c
            self.loader.set_template(
                c.name,
                "{% set _prepare_context = prepare_context() %}\\n" + c.template
            )

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

        template = self.env.get_template(name)
        return template.render(context)


__all__ = [
    "Renderer",
    "PrepareRegistry",
    ${componentExports}
]
`;

    fs.writeFileSync(path.join(outDir, 'Renderer.py'), rendererPy, 'utf-8');
  }
}
