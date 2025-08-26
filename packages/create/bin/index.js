#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prompts from 'prompts';
import { cyan, green, red, yellow } from 'kolorist';
import stripJsonComments from 'strip-json-comments';

function detectPackageManager() {
  const ua = process.env.npm_config_user_agent || '';
  if (/pnpm/.test(ua)) return 'pnpm';
  if (/yarn/.test(ua)) return 'yarn';
  if (/npm/.test(ua)) return 'npm';
  const execPath = process.env.npm_execpath || '';
  if (execPath.includes('pnpm')) return 'pnpm';
  if (execPath.includes('yarn')) return 'yarn';
  return 'npm';
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function generateViteConfig({ language, generator, renderer }) {
  const lines = [];
  lines.push("import { defineConfig } from 'vite';");
  lines.push('');
  lines.push("import velund from 'velund';");
  lines.push('');

  if (generator === 'php')
    lines.push("import phpGenerator from '@zebrains/velund-php';");
  if (generator === 'python')
    lines.push("import pythonGenerator from '@zebrains/velund-python';");

  if (renderer === 'twig')
    lines.push("import twigRenderer from '@zebrains/velund-twig';");
  if (renderer === 'jinja')
    lines.push("import jinjaRenderer from '@zebrains/velund-jinja';");

  lines.push('');

  lines.push('export default defineConfig({');
  lines.push('  plugins: [velund({');
  lines.push(`    renderer: "${renderer}",`);
  lines.push(`    generator: "${generator}",`);

  lines.push('    renderers: [');
  if (renderer === 'twig') lines.push('      twigRenderer(),');
  if (renderer === 'jinja') lines.push('      jinjaRenderer(),');
  if (renderer === 'html')
    lines.push(
      '      // html renderer is built-in, no external package required'
    );
  lines.push('    ],');

  lines.push('    generators: [');
  if (generator === 'php') lines.push('      phpGenerator(),');
  if (generator === 'python') lines.push('      pythonGenerator(),');
  if (generator === 'node') lines.push('      // node generator is built-in');
  lines.push('    ]');

  lines.push('  })],');
  lines.push('});');

  return lines.join('\n');
}

(async () => {
  console.log(cyan('\n✨ create-velund — Velund project scaffolder\n'));

  const base = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'Project directory / package name:',
      initial: 'my-velund-app',
    },
    {
      type: 'text',
      name: 'version',
      message: 'Version',
      initial: '0.0.1',
    },
    {
      type: 'select',
      name: 'language',
      message: 'Language',
      choices: [
        { title: 'TypeScript', value: 'ts' },
        { title: 'JavaScript', value: 'js' },
      ],
      initial: 0,
    },
    {
      type: 'select',
      name: 'generator',
      message: 'Generator',
      choices: [
        { title: 'node*', value: 'node' },
        { title: 'php', value: 'php' },
        { title: 'python', value: 'python' },
      ],
      initial: 0,
    },
  ]);

  if (!base.projectName) {
    console.log(red('Aborted — no project name.'));
    process.exit(1);
  }

  // динамическое формирование списка шаблонизаторов
  const availableRenderers = [{ title: 'html*', value: 'html' }];
  if (['node', 'php'].includes(base.generator))
    availableRenderers.push({ title: 'twig', value: 'twig' });
  if (['node', 'php', 'python'].includes(base.generator))
    availableRenderers.push({ title: 'jinja', value: 'jinja' });

  const rendererResp = await prompts({
    type: 'select',
    name: 'renderer',
    message: 'Template engine (renderer)',
    choices: availableRenderers,
  });

  const opts = { ...base, renderer: rendererResp.renderer };
  const pkgManager = detectPackageManager();
  const targetDir = path.resolve(process.cwd(), opts.projectName);

  console.log(yellow(`\nDetected package manager: ${pkgManager}`));
  console.log(yellow(`Creating project in: ${targetDir}`));

  const templateName = opts.language === 'ts' ? 'vanilla-ts' : 'vanilla';
  try {
    let createCmd = '';
    if (pkgManager === 'pnpm')
      createCmd = `pnpm create vite@latest ${opts.projectName} -- --template ${templateName}`;
    else if (pkgManager === 'yarn')
      createCmd = `yarn create vite ${opts.projectName} --template ${templateName}`;
    else
      createCmd = `npm create vite@latest ${opts.projectName} -- --template ${templateName}`;

    console.log(cyan('\nRunning create-vite to scaffold a vanilla project...'));
    execSync(createCmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(red('\nFailed to run create-vite: '), err.message || err);
    process.exit(1);
  }

  process.chdir(targetDir);
  try {
    const idx = path.join(targetDir, 'index.html');
    if (fs.existsSync(idx)) fs.unlinkSync(idx);

    const pub = path.join(targetDir, 'public');
    if (fs.existsSync(pub)) fs.rmSync(pub, { recursive: true, force: true });
  } catch (e) {}

  const deps = ['velund'];
  // if (opts.generator === 'php') deps.push('@zebrains/velund-php');
  // if (opts.generator === 'python') deps.push('@zebrains/velund-python');
  // if (opts.renderer === 'twig') deps.push('@zebrains/velund-twig');
  // if (opts.renderer === 'jinja') deps.push('@zebrains/velund-jinja');

  try {
    if (deps.length) {
      console.log(cyan('\nInstalling velund and selected add-ons...'));
      if (pkgManager === 'pnpm')
        execSync(`pnpm add -D ${deps.join(' ')}`, { stdio: 'inherit' });
      else if (pkgManager === 'yarn')
        execSync(`yarn add -D ${deps.join(' ')}`, { stdio: 'inherit' });
      else
        execSync(`npm install --save-dev ${deps.join(' ')}`, {
          stdio: 'inherit',
        });
    }
  } catch (err) {
    console.error(red('Failed to install dependencies:'), err.message || err);
    process.exit(1);
  }

  const viteConfig = generateViteConfig({
    language: opts.language,
    generator: opts.generator,
    renderer: opts.renderer,
  });
  const viteFileName = `vite.config.${opts.language === 'ts' ? 'ts' : 'js'}`;
  writeFile(path.join(targetDir, viteFileName), viteConfig);

  try {
    const srcDir = path.join(targetDir, 'src');
    if (fs.existsSync(srcDir)) {
      fs.rmSync(srcDir, { recursive: true, force: true });
    }
    const mainFile = path.join(targetDir, 'src', `main.${opts.language}`);
    const mainContent = `import { defineVelundApp } from 'velund/common';\nimport components from 'virtual:velund/components';\n\nexport default defineVelundApp(components);\n`;
    writeFile(mainFile, mainContent);

    const routeDir = path.join(targetDir, 'src', 'routes', 'home');
    fs.mkdirSync(routeDir, { recursive: true });

    const templateExt =
      opts.renderer === 'html'
        ? 'html'
        : opts.renderer === 'twig'
          ? 'twig'
          : 'j2';
    const templateFile = path.join(routeDir, `template.${templateExt}`);

    const assetsDir = path.join(targetDir, 'src', 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    const mainCssFile = path.join(assetsDir, 'main.css');
    const mainCssContent = `
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background-color: #121212;
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: sans-serif;
}
h1 {
  text-align: center;
}
`;
    writeFile(mainCssFile, mainCssContent);

    // добавляем ссылку на css в шаблон
    const templateContent = `<link rel="stylesheet" href="@/assets/main.css">\n<h1>Hello from Velund App</h1>\n`;
    writeFile(templateFile, templateContent);

    const homeFile = path.join(routeDir, `home.vel.${opts.language}`);
    const importTemplatePath = `./template.${templateExt}`;
    const homeContent = `import { defineComponent } from 'velund/common';\nimport template from '${importTemplatePath}';\n\nexport default defineComponent({\n  name: 'Home',\n  template,\n});\n`;
    writeFile(homeFile, homeContent);
  } catch (err) {
    console.error(red('Failed to write src files:'), err.message || err);
    process.exit(1);
  }

  if (opts.language === 'ts') {
    const tsconfigPath = path.join(targetDir, 'tsconfig.json');
    let tsconfig = null;
    if (fs.existsSync(tsconfigPath)) {
      try {
        tsconfig = JSON.parse(
          stripJsonComments(fs.readFileSync(tsconfigPath, 'utf8'))
        );
      } catch (e) {
        tsconfig = null;
      }
    }
    if (!tsconfig) {
      tsconfig = {
        compilerOptions: {
          target: 'ESNext',
          module: 'ESNext',
          moduleResolution: 'Node',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          types: ['velund/env'],
        },
      };
    } else {
      tsconfig.compilerOptions = tsconfig.compilerOptions || {};
      tsconfig.compilerOptions.types = tsconfig.compilerOptions.types || [];
      if (!tsconfig.compilerOptions.types.includes('velund/env')) {
        tsconfig.compilerOptions.types.push('velund/env');
      }
    }
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
  }

  console.log(green('\n✔ Project scaffolded successfully!'));
  console.log('\nNext steps:');
  console.log(`  cd ${opts.projectName}`);
  if (pkgManager === 'pnpm') console.log('  pnpm install');
  else if (pkgManager === 'yarn') console.log('  yarn');
  else console.log('  npm install');
  console.log('  pnpm dev   # or npm run dev / yarn dev');

  console.log('\nHappy hacking! 🧩');
})();
