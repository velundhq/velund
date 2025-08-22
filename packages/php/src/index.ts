// generatePhpLibrary.ts
import fs from 'fs';
import path from 'path';
import {
  defineVelundGenerator,
  type VelundComponentDescriptor,
} from '@velund/core';

/** ===== helpers ===== */

function tsTypeToPhp(type: string): string {
  switch (type) {
    case 'number':
      return 'float|int';
    case 'string':
      return 'string';
    case 'boolean':
      return 'bool';
    default:
      return 'mixed';
  }
}

/** ===== generator ===== */

export function generateLibrary(
  rendererName: string,
  components: VelundComponentDescriptor<any, any>[],
  outDir: string
) {
  if (rendererName !== 'twig' && rendererName !== 'html') {
    throw new Error(
      `Unknown renderer: ${rendererName}. Expected "twig" or "html"`
    );
  }

  const componentDir = path.join(outDir, 'Component');
  fs.mkdirSync(componentDir, { recursive: true });

  // ---------- TemplateComponent ----------
  fs.writeFileSync(
    path.join(componentDir, 'TemplateComponent.php'),
    `<?php
namespace Velund\\Component;

abstract class TemplateComponent
{
    public function __construct(
        public string $name,
        public string $template,
        public bool $hasPrepare = false
    ) {}
}
`,
    'utf-8'
  );

  // ---------- PrepareRegistry ----------
  fs.writeFileSync(
    path.join(outDir, 'PrepareRegistry.php'),
    `<?php
namespace Velund;

class PrepareRegistry
{
    private static array $registry = [];

    public static function register(string $componentName, callable $fn): void
    {
        self::$registry[$componentName] = $fn;
    }

    public static function get(string $componentName): ?callable
    {
        return self::$registry[$componentName] ?? null;
    }
}
`,
    'utf-8'
  );

  // ---------- Components ----------
  components.forEach((comp) => {
    const className = `${comp.name}Component`;
    const hasPrepare = comp.prepare ? 'true' : 'false';

    let phpdoc = '';
    if (comp.prepare && comp.propsSchema?.properties) {
      const inputProps = Object.entries(comp.propsSchema.properties).map(
        ([key, info]: [string, any]) => `${key}:${tsTypeToPhp(info.type)}`
      );
      const inputPhpArray = `array{${inputProps.join(',')}}`;

      const outputProps: string[] = [];
      if (comp.contextSchema?.properties) {
        for (const [key, info] of Object.entries(
          comp.contextSchema.properties
        )) {
          const ctxInf = info as any;
          if (ctxInf.type === 'object' && ctxInf.properties) {
            const subProps = Object.entries(ctxInf.properties)
              .map(([k, v]) => `${k}:${tsTypeToPhp((v as any).type)}`)
              .join(',');
            outputProps.push(`${key}:array{${subProps}}`);
          } else {
            outputProps.push(`${key}:${tsTypeToPhp((ctxInf as any).type)}`);
          }
        }
      }
      const outputPhpArray = `array{${outputProps.join(',')}}`;

      phpdoc = `
    /**
     * Зарегистрировать prepare-функцию для ${comp.name}.
     *
     * @param callable(${inputPhpArray}):${outputPhpArray} $fn
     */
    `;
    }

    const phpContent = `<?php
namespace Velund\\Component;

use Velund\\PrepareRegistry;

final class ${className} extends TemplateComponent
{
    public function __construct()
    {
        parent::__construct(
            name: '${comp.name}',
            template: <<<'TEMPLATE'
${comp.template}
TEMPLATE,
            hasPrepare: ${hasPrepare}
        );
    }
${phpdoc}
    public static function registerPrepare(callable $fn): void
    {
        PrepareRegistry::register('${comp.name}', $fn);
    }
}
`;

    fs.writeFileSync(
      path.join(componentDir, `${className}.php`),
      phpContent,
      'utf-8'
    );
  });

  // ---------- Enums ----------
  const allEnum = `<?php
namespace Velund;

enum ComponentName: string
{
${components.map((c) => `    case ${c.name} = '${c.name}';`).join('\n')}
}
`;
  fs.writeFileSync(path.join(outDir, 'ComponentName.php'), allEnum, 'utf-8');

  const prepEnum = `<?php
namespace Velund;

enum ComponentNameWithPrepare: string
{
${components
  .filter((c) => c.prepare)
  .map((c) => `    case ${c.name} = '${c.name}';`)
  .join('\n')}
}
`;
  fs.writeFileSync(
    path.join(outDir, 'ComponentNameWithPrepare.php'),
    prepEnum,
    'utf-8'
  );

  // ---------- Renderer ----------
  const imports = components
    .map((c) => `            new \\Velund\\Component\\${c.name}Component(),`)
    .join('\n');

  const rendererTwig = `<?php
namespace Velund;

use Twig\\Environment;
use Twig\\Loader\\ArrayLoader;

class Renderer
{
    private Environment $env;
    private ArrayLoader $loader;
    private array $components = [];

    public function __construct()
    {
        $this->loader = new ArrayLoader();
        $this->env = new Environment($this->loader);

        // Twig-функция prepare_context
        $this->env->addFunction(new \\Twig\\TwigFunction('prepare_context', function (array &$context, string $componentName) {
            $component = $this->components[$componentName] ?? null;
            if ($component && $component->hasPrepare) {
                $prepareFn = PrepareRegistry::get($componentName);
                if ($prepareFn) {
                    $extra = $prepareFn($context);
                    $context = array_merge($context, $extra);
                }
            }
            return null;
        }));

        $this->registerAllComponents();
    }

    private function registerAllComponents(): void
    {
        $list = [
${imports}
        ];

        foreach ($list as $component) {
            $this->components[$component->name] = $component;
            $this->loader->setTemplate(
                $component->name,
                "{% set _prepare_context = prepare_context(_context, '" . $component->name . "') %}\\n" . $component->template
            );
        }
    }

    public function render(string $name, array $context = []): string
    {
        $component = $this->components[$name] ?? null;
        if (!$component) {
            throw new \\RuntimeException("Component not found: {$name}");
        }

        if ($component->hasPrepare) {
            $prepareFn = PrepareRegistry::get($name);
            if ($prepareFn) {
                $extra = $prepareFn($context);
                $context = array_merge($context, $extra);
            }
        }

        return $this->env->render($name, $context);
    }
}
`;

  const rendererHtml = `<?php
namespace Velund;

class Renderer
{
    private array $components = [];

    public function __construct()
    {
        $list = [
${imports}
        ];

        foreach ($list as $component) {
            $this->components[$component->name] = $component;
        }
    }

    public function render(string $name, array $context = []): string
    {
        $component = $this->components[$name] ?? null;
        if (!$component) {
            throw new \\RuntimeException("Component not found: {$name}");
        }

        if ($component->hasPrepare) {
            $prepareFn = PrepareRegistry::get($name);
            if ($prepareFn) {
                $extra = $prepareFn($context);
                $context = array_merge($context, $extra);
            }
        }

        // Просто вернуть шаблон как есть (без Twig)
        return $component->template;
    }
}
`;

  fs.writeFileSync(
    path.join(outDir, 'Renderer.php'),
    rendererName === 'twig' ? rendererTwig : rendererHtml,
    'utf-8'
  );

  console.log('✅ PHP library generated in', outDir);
}

const phpGenerator = defineVelundGenerator(() => {
  return {
    id: 'php',
    renderers: ['html', 'twig'],
    generate: generateLibrary,
  };
});

export default phpGenerator;
