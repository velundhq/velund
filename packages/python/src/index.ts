import { defineVelundGenerator } from '@velund/core';
import { generatePyProject } from './helpers/generatePyProject.js';
import { generateTemplateComponent } from './templates/TemplateComponent.js';
import { generatePrepareRegistry } from './templates/PrepareRegistry.js';
import { generateComponent } from './templates/Component.js';
import { renderers } from './renderers/index.js';

import path from 'path';
import * as fs from 'fs';
import { generateInitPy } from './helpers/generateInitPy.js';

export type VelundPythonGeneratorOptions = {
  manifest?: Record<string, any>;
};

const pythonGenerator = defineVelundGenerator(
  (options?: VelundPythonGeneratorOptions) => {
    return {
      id: 'python',
      renderers: Object.keys(renderers),
      generate(rendererName, components, outDir) {
        // Выбираем и используем соответствующий рендерер
        const renderer = renderers[rendererName as keyof typeof renderers];
        if (!renderer) {
          throw new Error(`Unsupported renderer: ${rendererName}`);
        }

        // Создаем структуру директорий
        const componentDir = path.join(outDir, 'components');
        fs.mkdirSync(componentDir, { recursive: true });

        // Генерируем базовые файлы
        generateTemplateComponent(outDir);
        generatePrepareRegistry(outDir, components);
        components.forEach((comp) => generateComponent(comp, outDir));

        // Генерируем Renderer.js и package.json
        renderer.generate({ components, outDir });
        generateInitPy(outDir, components);
        generatePyProject(outDir, rendererName, options?.manifest);

        console.log(`✅ PYTHON library (${rendererName}) generated in`, outDir);
      },
    };
  }
);

export default pythonGenerator;
